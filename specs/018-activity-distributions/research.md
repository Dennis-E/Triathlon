# Research: Activity Distributions Visualization

## Decision: Reuse `getSportPerformanceMetric` for the Pace metric

**Decision**: The Pace metric reuses `src/scatter-utils.js`'s existing
`getSportPerformanceMetric(activity)` function, which already returns a per-sport
performance value (`pace_run` min/km, `pace_swim` min/100m, `speed_bike` km/h) that the
"Heartrate vs Pace" tab already plots together on one axis when the sport filter is
"All". Distributions does the same: it buckets whatever value
`getSportPerformanceMetric` returns for each activity, regardless of sport, using one
combined set of buckets, labeled generically as "Pace".

**Rationale**: This is the established, already-shipped precedent in this exact
codebase for combining sports with different pace/speed units on one chart. Inventing
a new normalized/converted pace unit would contradict this precedent, add unproven
conversion logic, and risk producing numbers that don't match what users already see
on "Heartrate vs Pace" for the same activities.

**Alternatives considered**:
- Convert Bike speed to an equivalent "pace" (min/km) so all sports share literal
  minutes-per-kilometer units — rejected: introduces a made-up conversion with no
  existing precedent, and speed-to-pace inversion behaves poorly near zero speed.
- Restrict Pace to a single sport at a time (disable for "All") — rejected: conflicts
  with the clarified decision to combine pace across sports in one chart, and would be
  inconsistent with how "Heartrate vs Pace" already behaves for "All".

## Decision: Bucketing strategy

**Decision**: For each metric, compute the observed min/max of the filtered dataset,
then divide that range into a fixed target of 10-15 evenly-sized buckets (implementation
detail: 12 buckets, adjustable within that range without changing behavior contracts).
When min equals max (e.g., a single qualifying activity), use a single bucket spanning
that value.

**Rationale**: Matches the clarified answer from `/speckit-clarify`. A fixed, small
bucket count keeps the histogram legible regardless of dataset size and is trivial to
unit test deterministically (unlike data-size-scaled rules such as Sturges' formula,
which would produce different bucket counts per dataset and complicate testing/UI
consistency).

**Alternatives considered**:
- Sturges'/square-root rule (bucket count scales with activity count) — rejected per
  clarification; produces inconsistent bucket counts across different filter/time-range
  combinations, complicating both UI stability and test assertions.
- Fixed per-metric bucket widths (e.g., always 1 km steps) — rejected per
  clarification; doesn't adapt to small or large datasets and could produce too many or
  too few buckets for extreme ranges (e.g., ultra-distance activities).

## Decision: "Approximated line" display mode is a smoothed curve over the same buckets

**Decision**: The line display mode plots one point per bucket (bucket midpoint on the
x-axis, count on the y-axis) using Chart.js's built-in monotone cubic interpolation
(`tension` / `cubicInterpolationMode: 'monotone'`) rather than introducing a separate
statistical density model (e.g., true KDE).

**Rationale**: Reuses the same bucketed data model as the histogram (per FR-006/FR-007
requiring both modes to reflect the same filtered data), avoids adding a new
dependency or non-trivial statistics code, and is consistent with the "no new
dependency" constraint — Chart.js is already loaded and already used elsewhere in the
dashboard for line charts (e.g., yearly trend lines in "Heartrate vs Pace").

**Alternatives considered**:
- True kernel density estimation (KDE) over raw values — rejected: requires a new
  statistics implementation/dependency for marginal visual benefit over a smoothed
  bucket curve, and would produce a visually different shape than the histogram it's
  supposed to be an alternate view of (violates FR-007's "same underlying data"
  expectation).

## Decision: New `src/distribution-utils.js` module

**Decision**: Add one new reusable module, `src/distribution-utils.js`, exporting pure
functions: `getMetricValue(activity, metric)`, `filterActivitiesForDistribution(activities, filters)`,
and `computeDistributionBuckets(values, options)`. It follows the existing dual
CommonJS (`module.exports`) + `window.distributionUtils` bridge pattern used by
`src/scatter-utils.js` and other `src/` modules.

**Rationale**: Constitution Principle II requires reusable logic to live under `src/`
as dual-target modules; keeping bucket/filter math in a pure, Jest-testable module
(rather than inline in `index.html`) matches how every other visualization
(`scatter-utils.js`, `heatmap-utils.js`, `power-pb-utils.js`) is structured.

**Alternatives considered**:
- Implement bucket/filter logic entirely inline in `index.html` — rejected: violates
  Principle II and the project's established pattern of keeping computational logic
  unit-testable in `src/`.

## Decision: Tab wiring follows the existing `tab-navigation.js` pattern exactly

**Decision**: Add `'distributions'` to `TAB_ORDER`, `TAB_BUTTON_IDS`, and
`TAB_PANEL_IDS` in `src/tab-navigation.js`, with `vizTabDistributions` /
`vizPanelDistributions` IDs, alongside the equivalent button/panel markup and
`setVisualizationTab('distributions')` dispatch in `index.html`.

**Rationale**: Constitution Principle III explicitly requires tab constants/IDs,
markup/dispatch, and tab-navigation tests to be updated together when adding a
dashboard tab; this is a direct, mechanical extension of the existing six-tab pattern.

**Alternatives considered**: None — this is a fixed repository convention, not an
open design choice.
