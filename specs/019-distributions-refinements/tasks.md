---

description: "Task list template for feature implementation"
---

# Tasks: Distributions Chart Refinements

**Input**: Design documents from `/specs/019-distributions-refinements/`

**Prerequisites**: [plan.md](../plan.md) (required), [spec.md](../spec.md) (required for user stories), [research.md](../research.md), [data-model.md](../data-model.md), [contracts/distributions-refinements-ui.md](../contracts/distributions-refinements-ui.md)

**Tests**: Included, per the repo's Narrowest-Scope Test-First Verification constitution principle (NON-NEGOTIABLE), matching how `018-activity-distributions` was implemented.

**Organization**: Tasks are grouped by user story (from [spec.md](../spec.md)) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single static-browser project (existing layout, no build step):

- `src/distribution-utils.js` — extended with `formatMetricValue`, nice-number/IQR bucket logic, per-sport bucket grouping
- `index.html` — `processData()` (avgWatts exclusion) and `renderDistributionsChart()` (per-sport lines, formatted labels)
- `src/dashboard-utils.js` — duplicate `processData()`, only exercised by `__tests__/processing.test.js` (not loaded by `index.html`), fixed in parallel per research.md
- `__tests__/distribution-utils.test.js`, `__tests__/index-script-syntax.test.js`, `__tests__/processing.test.js`

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before making changes.

- [X] T001 Run `npm test` from the repo root to confirm the current suite passes before any edit (baseline for this feature).

**Checkpoint**: Baseline green; safe to start foundational work.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the shared value-formatting helper that both User Story 3 (axis/tooltip formatting) and User Story 4 (bucket-label formatting) depend on, so it exists once and is reused everywhere per FR-012.

- [X] T002 In `src/distribution-utils.js`, add and export a pure `formatMetricValue(metricKey, value, sport)` function implementing the rules from [research.md](../research.md)'s "Centralized per-metric value formatting" decision: `duration` → whole minutes as `"Xm"` below 3600 seconds, else `"Xh Ym"`; `pace` → for `sport === 'Bike'` a decimal `"X.X km/h"` (unchanged, it's a speed not a pace), for `'Run'`/`'Swim'` a `"m:ss min/km"` / `"m:ss min/100m"` string (convert the decimal minutes value to whole minutes + rounded seconds); `elevation` → whole meters as `"X m"`; `length` → one-decimal kilometers as `"X.X km"` (or whole km when the decimal is `.0`); `power` → whole watts as `"X W"`. Add to both `module.exports` and `window.distributionUtils`.
- [X] T003 [P] Add a new `describe('formatMetricValue', ...)` block in `__tests__/distribution-utils.test.js` covering: duration below/at/above 60 minutes (e.g. `125` → `"2m"`, `3600` → `"1h 0m"`, `5400` → `"1h 30m"`); pace for Run (e.g. `5.5` → `"5:30 min/km"`), Swim (e.g. `1.75` → `"1:45 min/100m"`), and Bike (e.g. `32` → `"32.0 km/h"`); elevation (e.g. `120.6` → `"121 m"`); length (e.g. `12.0` → `"12 km"`, `12.549` → `"12.5 km"`); power (e.g. `209.6` → `"210 W"`).
- [X] T004 Run `npm test -- distribution-utils` and fix any failures introduced by T002-T003.

**Checkpoint**: Shared formatting helper exists and is unit-tested — ready for story-specific wiring.

---

## Phase 3: User Story 1 - Power/Watt data only ever reflects Bike activities (Priority: P1) 🎯 MVP

**Goal**: Average-watts values are excluded (treated as absent) for any activity whose sport is not Bike, everywhere `avgWatts` is used, fixing the Distributions "Power (Watt)" metric at the data source.

**Independent Test**: Import a dataset where a Run row has a non-empty average-watts CSV value, open Distributions → "Power (Watt)" → "All Sports", and verify only Bike activities are ever counted/displayed; verify the Run/Swim sport filter shows the empty state instead.

### Tests for User Story 1

- [X] T005 [P] [US1] In `__tests__/processing.test.js`, add a test asserting that `processData()` (from `src/dashboard-utils.js`) sets `avgWatts` to `null` for a Run (and a Swim) row even when its raw CSV average-power/watts column has a non-empty numeric value, while a Bike row's `avgWatts` is preserved.
- [X] T006 [P] [US1] Add an assertion to `__tests__/index-script-syntax.test.js` that `index.html`'s inline `processData()` nulls `avgWatts` for non-Bike activities (e.g. assert `inlineCode` contains a conditional such as `sportCategory === 'Bike' ? avgWatts : null` — or an equivalent guard — applied to the `avgWatts` field before it is pushed into `nextProcessedActivities`).

### Implementation for User Story 1

- [X] T007 [US1] In `index.html`'s inline `processData()` (around the `nextProcessedActivities.push({...})` call), change the `avgWatts` field to only keep the parsed value when `sportCategory === 'Bike'`, and `null` otherwise, per FR-001/FR-002.
- [X] T008 [US1] In `src/dashboard-utils.js`'s `processData()` (around its `processedActivities.push({...})` call), apply the identical `sportCategory === 'Bike'` guard to `avgWatts`, keeping both implementations consistent per research.md's decision to fix both.
- [X] T009 [US1] Run `npm test -- processing index-script-syntax distribution-utils` and fix any failures introduced by T005-T008.

**Checkpoint**: User Story 1 is independently functional — no Run/Swim activity ever contributes average-watts anywhere in the app, including the Distributions "Power (Watt)" metric.

---

## Phase 4: User Story 2 - See per-sport lines instead of one merged line (Priority: P1)

**Goal**: With "All Sports" and "Line" display mode, the Distributions chart renders one distinguishable line per sport with qualifying data (up to three), all sharing the same bucket boundaries/x-axis, instead of one blended line.

**Independent Test**: Import a multi-sport dataset, select "All Sports" + "Line" mode for any metric, and verify up to three separately colored/labeled lines are drawn on one shared x-axis; verify single-sport and "Histogram" behavior are unchanged.

### Tests for User Story 2

- [X] T010 [P] [US2] Add a test in `__tests__/distribution-utils.test.js` for a new exported `groupBucketCountsBySport(activities, metric, buckets)`: given activities from Run, Bike, and Swim and a pre-computed `buckets` array (`{ rangeStart, rangeEnd }` per bucket, ignoring `count`), it returns `{ Run: { buckets, activityCount }, Bike: { buckets, activityCount }, Swim: { buckets, activityCount } }` where each sport's `buckets` array has the *same* `rangeStart`/`rangeEnd` as the input but sport-specific `count` values that sum to that sport's `activityCount`; a sport with zero qualifying activities is omitted from the result object entirely.
- [X] T011 [P] [US2] Add an assertion to `__tests__/index-script-syntax.test.js` that `renderDistributionsChart()` in `index.html`, when `selectedDistributionsSportFilter === 'All'` and `selectedDistributionsDisplayMode === 'line'`, builds one Chart.js `type: 'line'` dataset per sport returned by `window.distributionUtils.groupBucketCountsBySport(...)` (e.g. assert `inlineCode` contains `groupBucketCountsBySport` called within a branch keyed on `'All'` and `'line'`, and that each per-sport dataset sets a distinct `borderColor` from the existing `PB_SPORT_COLOR` map and a `label` equal to the sport name).

### Implementation for User Story 2

- [X] T012 [US2] In `src/distribution-utils.js`, add and export `groupBucketCountsBySport(activities, metricKey, buckets)` — a pure function that, for each of `'Run'`, `'Bike'`, `'Swim'`, filters `activities` to that sport with a finite `getMetricValue(activity, metricKey)`, counts each qualifying value into the matching bucket from the input `buckets` array (by `rangeStart`/`rangeEnd`, using the same last-bucket-inclusive rule as `computeDistributionBuckets`), and returns an object keyed by sport name to `{ buckets: [...], activityCount }` — omitting any sport with `activityCount === 0`. Export via both `module.exports` and `window.distributionUtils`.
- [X] T013 [US2] In `index.html`, update `renderDistributionsChart()` so that when `selectedDistributionsSportFilter === 'All'` and `selectedDistributionsDisplayMode === 'line'`, it calls `window.distributionUtils.groupBucketCountsBySport(qualifyingAllSportsActivities, selectedDistributionsMetric, buckets)` and renders one `type: 'line'` dataset per returned sport (bucket midpoints as `x`, that sport's `count` as `y`, `cubicInterpolationMode: 'monotone'`), using `PB_SPORT_COLOR[sport]` for `borderColor` and the sport name as `label`; for any other sport/mode combination, keep the existing single-dataset rendering from `018-activity-distributions` unchanged.
- [X] T014 [US2] Run `npm test -- distribution-utils index-script-syntax` and fix any failures introduced by T010-T013.

**Checkpoint**: User Story 2 is independently functional — "All Sports" + "Line" mode shows up to three aligned, distinctly colored per-sport lines; all other filter/mode combinations are unchanged.

---

## Phase 5: User Story 3 - Read clean, correctly-labeled axis values (Priority: P1)

**Goal**: Every metric's axis titles and bucket/tooltip labels use `formatMetricValue` (from Phase 2) instead of raw/decimal values, consistently in both Histogram and Line modes.

**Independent Test**: Open Distributions and check each metric's axis title and bucket labels — Duration in whole minutes/hours, Pace in `mm:ss` with its unit, Elevation and Length in whole/one-decimal numbers — in both display modes.

### Tests for User Story 3

- [X] T015 [P] [US3] Add an assertion to `__tests__/index-script-syntax.test.js` that `renderDistributionsChart()` in `index.html` calls `window.distributionUtils.formatMetricValue(...)` when building axis titles and/or bucket/tooltip labels (e.g. assert `inlineCode` no longer contains the old ad-hoc `DISTRIBUTIONS_METRIC_CONFIG[...].formatValue` per-metric arrow functions for duration/pace/elevation/length, and instead calls `formatMetricValue`).

### Implementation for User Story 3

- [X] T016 [US3] In `index.html`, remove the per-metric `formatValue` arrow functions from `DISTRIBUTIONS_METRIC_CONFIG` (duration/pace/elevation/length/power) and replace their call sites in `renderDistributionsChart()` (axis title text, and anywhere a bucket/tooltip value is displayed) with calls to `window.distributionUtils.formatMetricValue(selectedDistributionsMetric, value, activity && activity.sport)`, passing the relevant sport for the `pace` metric (per-sport line series pass that line's own sport; the combined/histogram series can omit sport or pass `null` since combined pace buckets already mix sport-specific raw values per `018`'s FR-005a).
- [X] T017 [US3] In `src/distribution-utils.js`, update `formatRangeLabel` (or replace its call sites in `computeDistributionBuckets`) so bucket `label` strings are built via `formatMetricValue(metricKey, rangeStart)` / `formatMetricValue(metricKey, rangeEnd)` instead of the old generic 2-decimal rounding, requiring `computeDistributionBuckets` to accept a `metricKey` option (default `null` falls back to the old generic rounding for callers that don't pass one, preserving backward compatibility for any other caller).
- [X] T018 [US3] Run `npm test -- distribution-utils index-script-syntax` and fix any failures introduced by T015-T017, including updating any existing bucket-label assertions in `__tests__/distribution-utils.test.js` that relied on the old generic label format.

**Checkpoint**: User Story 3 is independently functional — every metric's axis/bucket/tooltip text uses the correct unit and rounding, identically in Histogram and Line modes.

---

## Phase 6: User Story 4 - See sensible bucket boundaries with an overflow bucket for outliers (Priority: P2)

**Goal**: `computeDistributionBuckets` produces "nice number" regular bucket boundaries plus, when IQR-detected outliers exist, one trailing "greater than" overflow bucket.

**Independent Test**: Import a dataset with one clear outlier for a metric, open its distribution, and verify round bucket boundaries plus exactly one final "> X" bucket containing the outlier(s); verify a dataset with no outliers produces no overflow bucket.

### Tests for User Story 4

- [X] T019 [P] [US4] Add a new `describe('outlier detection', ...)` block in `__tests__/distribution-utils.test.js` for a new exported `computeIqrOutlierThreshold(values)`: given values `[1,2,3,4,5,6,7,8,9,100]` it returns a `upperFence` below `100` and above the bulk of the data (verify `100` is above the returned `upperFence` while `9` is not, using the standard Q1/Q3 linear-interpolation quantile method); given a values array with no statistical outliers (e.g. `[1,2,3,4,5]`) it returns an `upperFence` greater than or equal to `Math.max(...values)`.
- [X] T020 [P] [US4] Update the existing `computeDistributionBuckets` tests in `__tests__/distribution-utils.test.js` (replacing the "produces 10-15 evenly-sized buckets ... rangeStart is 1 ... rangeEnd is 50" assertions, which assumed even fractional division) to instead assert: regular bucket boundaries are "nice" numbers (e.g. multiples of a round step like 1, 2, 5, 10, ... scaled to the data range — assert each `rangeStart`/`rangeEnd` modulo the detected step is ~0 within floating-point tolerance), bucket counts still sum to `activityCount`, and a dataset with one extreme outlier (e.g. `[...Array.from({length:49},(_,i)=>i+1), 500]`) produces regular buckets covering roughly `1`-`~50` plus exactly one trailing bucket with `isOverflow: true` whose `count` includes the outlier; a dataset with no outliers produces no bucket with `isOverflow: true`.
- [X] T021 [P] [US4] Add an assertion to `__tests__/index-script-syntax.test.js` that `renderDistributionsChart()` renders an overflow bucket's label using a "greater than" phrasing (e.g. assert `inlineCode` contains a template literal or helper call producing a `"> "`-prefixed label when a bucket's `isOverflow` flag is set).

### Implementation for User Story 4

- [X] T022 [US4] In `src/distribution-utils.js`, add and export `computeIqrOutlierThreshold(values)` — a pure function that sorts `values`, computes Q1 and Q3 via linear interpolation, and returns `{ q1, q3, iqr: q3 - q1, upperFence: q3 + 1.5 * (q3 - q1) }` (or `{ q1: null, q3: null, iqr: null, upperFence: Math.max(...values) }` when `values.length < 4`, too few points for meaningful quartiles). Export via both `module.exports` and `window.distributionUtils`.
- [X] T023 [US4] In `src/distribution-utils.js`, add a pure `computeNiceStep(range, targetBucketCount)` helper that returns a step size from the `{1, 2, 5} × 10^n` sequence closest to `range / targetBucketCount`, and a `computeNiceBoundary(value, step, direction)` helper that rounds `value` down (`direction: 'floor'`) or up (`'ceil'`) to the nearest multiple of `step`.
- [X] T024 [US4] In `src/distribution-utils.js`, rewrite `computeDistributionBuckets(values, options)` to: call `computeIqrOutlierThreshold(values)`; set `regularMax = Math.min(max, upperFence)`; compute regular buckets over `[niceMin, niceRegularMax]` using `computeNiceStep`/`computeNiceBoundary` (targeting `options.targetBucketCount || 12` buckets) with `label`s built via `formatMetricValue(options.metricKey, ...)` (per T017) and `isOverflow: false`; when any value exceeds `regularMax`, append exactly one final bucket `{ rangeStart: regularMax, rangeEnd: Infinity, label: "> " + formatMetricValue(options.metricKey, regularMax), count: <outlier count>, isOverflow: true }`; keep the existing `min === max` single-bucket special case and empty-input special case unchanged.
- [X] T025 [US4] In `index.html`, update `renderDistributionsChart()`'s call to `computeDistributionBuckets` to pass `{ metricKey: selectedDistributionsMetric }`, and update **both** the combined/single-sport bucket-to-chart-data mapping (bar labels, line-point x-values) **and** the per-sport line datasets built in T013 (US2) to handle the trailing overflow bucket's `rangeEnd: Infinity` (e.g. use `rangeStart` as the line-mode x-value for that bucket instead of a midpoint, in every place a bucket midpoint is computed).
- [X] T026 [US4] Run `npm test -- distribution-utils index-script-syntax` and fix any failures introduced by T019-T025.

**Checkpoint**: User Story 4 is independently functional — bucket boundaries are round and human-readable, and outliers (when present) are isolated into one clearly-labeled overflow bucket.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories together.

- [X] T027 Run the complete root suite `npm test` and resolve any regressions across all visualization tabs (not just Distributions).
- [X] T028 Manually validate all four stories together in the browser per [quickstart.md](../quickstart.md) (`python -m http.server`, import synthetic multi-sport data with a Run activity carrying stray watts data and one metric outlier, exercise Power exclusion, per-sport lines, axis formatting, and the overflow bucket).

## Dependencies & Execution Order

- **Setup (Phase 1)** → no dependencies; run first.
- **Foundational (Phase 2)**: blocks User Story 3 and User Story 4, both of which call `formatMetricValue`; does not block User Story 1 or User Story 2, which touch unrelated code paths.
- **User Story 1 (Phase 3)**: independent of all other stories in this feature (touches `processData()`, not `renderDistributionsChart()`'s bucket/formatting logic); can be implemented first or in parallel with User Story 2.
- **User Story 2 (Phase 4)**: independent of User Story 1; only needs the existing (or updated) `buckets` array shape from `computeDistributionBuckets`, not the specific formatting/boundary changes from User Story 3/4.
- **User Story 3 (Phase 5)**: depends on Phase 2's `formatMetricValue`; independent of User Story 1 and User Story 2.
- **User Story 4 (Phase 6)**: depends on Phase 2's `formatMetricValue` (via T017's bucket-label wiring from User Story 3) and changes `computeDistributionBuckets`'s boundary math; implement after User Story 3 so bucket labels already call the shared formatter before the boundary algorithm changes underneath them.
- **Polish (Phase 7)**: after all desired stories are complete.

## Parallel Execution Examples

- T005 (US1 processing test) and T010 (US2 distribution-utils test) and T015 (US3 index-script-syntax test) touch different files/describe blocks and can be authored in parallel; their implementation tasks (T007-T008, T012-T013, T016-T017) touch different functions (`processData` vs. `renderDistributionsChart`'s per-sport branch vs. label formatting) and can also proceed largely in parallel, but all funnel through the same `src/distribution-utils.js` file, so apply edits to that file sequentially (US1 doesn't touch it; US2, US3, US4 do) to avoid overlapping diffs.
- T019 and T020 (US4 tests) can be authored in parallel with each other since they test different new/changed functions, but should land after T017 (US3's bucket-label wiring) since T020's updated assertions depend on `computeDistributionBuckets` already accepting a `metricKey` option.

## Implementation Strategy

**MVP first**: Implement Phase 2 (Foundational) and Phase 3 (User Story 1) — User Story 1 is the most critical data-correctness fix (power data leaking into Run activities) and needs no UI/formatting changes, making it the smallest, highest-value slice.

**Incremental delivery**: Foundational → US1 (Power/Bike exclusion) → US2 (per-sport lines) → US3 (axis/label formatting) → US4 (nice buckets + overflow). Each story phase ends with its own checkpoint and can be verified/demoed independently before moving to the next, matching the spec's priority order (P1, P1, P1, P2).
