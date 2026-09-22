# Research: Distributions Chart Refinements

## Decision: Exclude non-Bike average watts at parse time, in both `processData` implementations

**Decision**: In `index.html`'s inline `processData()` (the implementation actually used
by the running app) and in `src/dashboard-utils.js`'s `processData()` (a duplicate
implementation currently only exercised by `__tests__/processing.test.js`, not loaded
by `index.html`), set `avgWatts` to `null` whenever the resolved `sportCategory` is not
`'Bike'`, regardless of what the raw CSV column contained.

**Rationale**: FR-001 requires average-watts to be excluded "everywhere" it would
otherwise be used. The repository currently has two independent `processData`
implementations with the same column-detection and row-mapping logic; fixing only the
one `index.html` actually runs would leave `src/dashboard-utils.js` (and its test
suite) silently out of sync with the real behavior, contradicting the single
data-correctness rule FR-001 establishes. Doing the exclusion at parse time (rather
than filtering at each consumption site such as `distribution-utils.js` or
`scatter-utils.js`) fixes the root cause once, so every current and future consumer of
`activity.avgWatts` (Distributions, Personal Bests, exports, etc.) automatically only
ever sees Bike watts.

**Alternatives considered**:
- Filter `avgWatts` only inside `distribution-utils.js`'s `getMetricValue('power', ...)`
  — rejected: FR-001 explicitly requires exclusion "everywhere", and leaving the raw
  field populated for Run/Swim would let any other current or future feature
  (Personal Bests, exports, scatter charts) re-introduce the same bug.
- Only fix `index.html`'s inline `processData()` and leave `src/dashboard-utils.js`
  untouched — rejected: `src/dashboard-utils.js`'s `processData` is unit-tested and
  represents the "intended" reusable implementation per the dual-bridge convention;
  leaving it inconsistent would let its existing tests keep asserting the old (wrong)
  behavior and mislead future readers of that module.

## Decision: Per-sport lines share one set of bucket boundaries

**Decision**: When rendering "All Sports" + "Line" mode, compute the regular/overflow
bucket boundaries once from the combined qualifying values across all sports (exactly
as today), then, for each sport that has at least one qualifying activity, count that
sport's own qualifying values into those same shared bucket boundaries to produce one
line per sport.

**Rationale**: Per FR-003/FR-004, the three lines must be directly comparable on one
chart; using independently-computed per-sport boundaries would misalign the x-axis
between lines (e.g. Run's "5-8 km" bucket would not line up with Bike's own
differently-sized buckets), making the chart harder to read than the single blended
line it replaces. Sharing one boundary set (already the mechanism
`computeDistributionBuckets` produces for the combined data) keeps the x-axis
consistent and requires only counting, not re-bucketing, per sport.

**Alternatives considered**:
- Compute independent bucket boundaries per sport — rejected: produces misaligned
  x-axes between lines, defeating the purpose of comparing sports on one chart.
- Show a combined "All" line plus per-sport lines — rejected: not requested by the
  spec/user, and would visually duplicate the sum of the other three lines, adding
  clutter rather than clarity.

## Decision: "Nice number" bucket step-size algorithm

**Decision**: Replace the current `(max - min) / targetBucketCount` even-division
step with a step size snapped to the nearest "nice" number from the sequence
`{1, 2, 5} × 10^n` (the same convention used by common chart-axis tick generators,
e.g. D3's `d3.ticks`), chosen so the number of regular buckets stays close to the
existing 10-15 target range. Regular bucket boundaries become `niceMin`,
`niceMin + step`, `niceMin + 2*step`, ... up to the last boundary at or below the
IQR-based outlier threshold (see below); the final regular boundary plus one overflow
bucket cover the rest of the range.

**Rationale**: FR-009 requires "sensible, human-friendly step sizes" instead of
arbitrary fractional divisions (e.g. a Length bucket boundary of "13.727-16.408 km").
The 1-2-5 nice-number sequence is a standard, well-tested approach for exactly this
problem (round, evenly-spaced, human-readable axis ticks) and needs no new dependency.

**Alternatives considered**:
- Round each computed boundary to N decimal places after the fact — rejected: still
  produces uneven, arbitrary-looking steps (e.g. "13.73", "16.41"); only the display
  looks cleaner, not the actual bucket widths.
- Metric-specific hardcoded step tables (e.g. always 1 km, always 100 m) — rejected:
  doesn't adapt to small or very large ranges (a dataset of ultra-distance activities
  would get too few buckets at a fixed 1 km step); the nice-number algorithm adapts
  the step to the data's actual range while staying round.

## Decision: IQR-based (Tukey) outlier detection for the overflow bucket

**Decision**: Compute Q1, Q3, and IQR = Q3 - Q1 from the metric's qualifying values
(using linear-interpolation quantiles over the sorted values); any value greater than
`Q3 + 1.5 * IQR` is treated as an outlier. Regular buckets are computed (via the
nice-number algorithm above) over the non-outlier range `[min, upperFence]`; all
outlier values are grouped into one final bucket labeled "greater than
`[last regular boundary]`". If no values exceed the fence, no overflow bucket is
created (all values fall into regular buckets).

**Rationale**: This is the clarified decision from `/speckit-clarify` (chosen over a
fixed percentile cutoff or manual gap detection) because it is the standard,
dataset-adaptive statistical convention for "outlier" used in boxplots and histograms,
and needs no manually tuned threshold per metric.

**Alternatives considered**: Fixed percentile cutoff and gap-based detection — both
rejected during clarification in favor of the IQR rule (see spec.md's Clarifications
section for the full comparison).

## Decision: Centralized per-metric value formatting in `src/distribution-utils.js`

**Decision**: Add a pure `formatMetricValue(metricKey, value, sport)` function (and a
small `formatDurationLabel`/`formatPaceLabel` helper set) to `src/distribution-utils.js`
that returns the human-friendly string for a raw metric value:
- `duration`: whole minutes as `"Xm"` below 60 minutes, `"Xh Ym"` at or above 60 minutes
- `pace`: `"mm:ss"` plus the existing sport-specific unit label from `018` (e.g.
  `"5:30 min/km"`, `"1:45 min/100m"`, `"32.0 km/h"` for Bike, which stays a decimal
  speed rather than a mm:ss pace since it is not a pace value)
- `elevation`: whole meters, e.g. `"120 m"`
- `length`: whole or one-decimal kilometers, e.g. `"12 km"` / `"12.5 km"`
- `power`: whole watts, e.g. `"210 W"` (already whole; unaffected but included for
  consistency)

Both `renderDistributionsChart()`'s axis titles/bucket labels and any tooltip content
call this shared formatter, in both Histogram and Line modes, satisfying FR-012.

**Rationale**: Centralizing formatting in the already-tested, dual-bridge
`distribution-utils.js` module (rather than duplicating format logic inline in
`index.html` for each mode) keeps the Jest suite able to verify formatting rules
directly and guarantees Histogram/Line consistency by construction (single source of
formatting), per constitution Principle II.

**Alternatives considered**: Format values inline in `index.html`'s
`renderDistributionsChart()` per display mode — rejected: would duplicate formatting
logic across the bar/line branches and make it easy for the two modes to drift apart
again (the exact problem FR-012 is meant to prevent).
