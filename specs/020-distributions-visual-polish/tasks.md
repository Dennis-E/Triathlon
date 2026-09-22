---

description: "Task list template for feature implementation"
---

# Tasks: Distributions Visual Polish

**Input**: Design documents from `/specs/020-distributions-visual-polish/`

**Prerequisites**: [plan.md](../plan.md) (required), [spec.md](../spec.md) (required for user stories), [research.md](../research.md), [data-model.md](../data-model.md), [contracts/distributions-visual-polish-ui.md](../contracts/distributions-visual-polish-ui.md)

**Tests**: Included, per the repo's Narrowest-Scope Test-First Verification constitution principle (NON-NEGOTIABLE), matching how `018`/`019` were implemented.

**Organization**: Tasks are grouped by user story (from [spec.md](../spec.md)) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Include exact file paths in descriptions

## Path Conventions

Single static-browser project (existing layout, no build step):

- `src/distribution-utils.js` — extended with `getFireGradientColor`, Duration nice-step table, `formatMetricValue`'s `includeUnit` option, underflow-bucket/lower-fence logic
- `index.html` — default state initializers, `renderDistributionsChart()` (colors, axis title, axis reversal, Swim N/A)
- `__tests__/distribution-utils.test.js`, `__tests__/index-script-syntax.test.js`

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before making changes.

- [X] T001 Run `npm test` from the repo root to confirm the current suite passes before any edit (baseline for this feature).

**Checkpoint**: Baseline green; safe to start foundational work.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend `formatMetricValue` with an `includeUnit` option and wire Pace's existing bucket-label construction to omit the unit, since both User Story 4 (axis title placement) and User Story 5 (underflow bucket label) depend on Pace bucket labels already being unit-less.

- [X] T002 In `src/distribution-utils.js`, extend `formatMetricValue(metricKey, value, sport, options = {})` with an `options.includeUnit` flag (default `true`); when `metricKey === 'pace'` and `includeUnit === false`, return the formatted value without its unit suffix (e.g. `"5:30"` instead of `"5:30 min/km"`, `"32.0"` instead of `"32.0 km/h"`); all other metrics and the default `includeUnit: true` behavior are unchanged.
- [X] T003 [P] Add tests in `__tests__/distribution-utils.test.js` for `formatMetricValue('pace', 5.5, 'Run', { includeUnit: false })` → `"5:30"`, `formatMetricValue('pace', 1.75, 'Swim', { includeUnit: false })` → `"1:45"`, and `formatMetricValue('pace', 32, 'Bike', { includeUnit: false })` → `"32.0"`.
- [X] T004 In `src/distribution-utils.js`'s `computeDistributionBuckets`, update the `buildLabel`/`buildOverflowLabel` closures so that when `metricKey === 'pace'` they call `formatMetricValue(metricKey, value, sport, { includeUnit: false })` (all other metrics keep calling with the default `includeUnit: true`).
- [X] T005 Run `npm test -- distribution-utils` and fix any failures introduced by T002-T004, including updating any existing Pace bucket-label assertions in `__tests__/distribution-utils.test.js` that expected the unit suffix.

**Checkpoint**: Pace bucket labels are unit-less; ready for story-specific wiring.

---

## Phase 3: User Story 1 - Distributions opens on the combined Line view (Priority: P1) 🎯 MVP

**Goal**: The Distributions tab's first render in a session shows "All Sports" + "Line" mode; subsequent manual changes are never reset.

**Independent Test**: Open the Distributions tab fresh and verify "All Sports" + "Line" are already active with per-sport lines shown; change either control, navigate away and back, and verify the manual choice persists.

### Tests for User Story 1

- [X] T006 [P] [US1] Add an assertion to `__tests__/index-script-syntax.test.js` that `index.html` initializes `selectedDistributionsDisplayMode` to `'line'` (e.g. assert `inlineCode` contains `let selectedDistributionsDisplayMode = 'line';`).

### Implementation for User Story 1

- [X] T007 [US1] In `index.html`, change the state initializer `let selectedDistributionsDisplayMode = 'histogram';` to `let selectedDistributionsDisplayMode = 'line';` (the sport filter's existing `'All'` default is unchanged).
- [X] T008 [US1] Run `npm test -- index-script-syntax` and fix any failures introduced by T006-T007.

**Checkpoint**: User Story 1 is independently functional — the tab opens on the combined Line view every session, and manual changes are preserved thereafter (no new reset logic was added).

---

## Phase 4: User Story 2 - A consistent "fire" color scheme (Priority: P1)

**Goal**: Every bar/point across every metric and both display modes is colored on a yellow (slow/short) to red (fast/long) gradient; per-sport lines in "All Sports" + Line mode keep their existing stroke-color legend while their points also carry the gradient.

**Independent Test**: Open each metric in Histogram and Line modes and confirm a yellow-to-red gradient runs across bars/points in the slow-to-fast direction; confirm per-sport lines in "All Sports" + Line mode remain distinguishable by stroke color while their points still show the gradient.

### Tests for User Story 2

- [X] T009 [P] [US2] Add a `describe('getFireGradientColor', ...)` block in `__tests__/distribution-utils.test.js`: `getFireGradientColor(0)` returns the yellow stop color, `getFireGradientColor(1)` returns the red stop color, `getFireGradientColor(0.5)` returns a color distinct from both endpoints, and values outside `[0, 1]` are clamped (e.g. `getFireGradientColor(-0.2)` equals `getFireGradientColor(0)`, `getFireGradientColor(1.5)` equals `getFireGradientColor(1)`).
- [X] T010 [P] [US2] Add an assertion to `__tests__/index-script-syntax.test.js` that `renderDistributionsChart()` in `index.html` calls `window.distributionUtils.getFireGradientColor` when building bar `backgroundColor` and line `pointBackgroundColor` arrays, and that per-sport line datasets still set `borderColor` from `PB_SPORT_COLOR[sport]` (unchanged from `019`).

### Implementation for User Story 2

- [X] T011 [US2] In `src/distribution-utils.js`, add and export a pure `getFireGradientColor(position)` function that clamps `position` to `[0, 1]` and interpolates through a yellow (`#FDE047`) → orange (`#F97316`) → red (`#DC2626`) two-segment gradient (0-0.5 interpolates yellow→orange, 0.5-1 interpolates orange→red), returning a `"#RRGGBB"` string. Export via both `module.exports` and `window.distributionUtils`.
- [X] T012 [US2] In `index.html`'s `renderDistributionsChart()`, compute each rendered bucket's normalized `colorPosition` (`0` for the first rendered bucket, `1` for the last, evenly spaced by index in the final rendered order) and use `window.distributionUtils.getFireGradientColor(colorPosition)` to build: (a) the Histogram dataset's `backgroundColor` as a per-bar array; (b) the Line mode single/combined dataset's `pointBackgroundColor` as a per-point array (keep `borderColor` a single neutral tone, e.g. `'#94A3B8'`, instead of the current solid indigo); (c) each per-sport line dataset's `pointBackgroundColor` as a per-point array computed from that sport's own bucket order, while leaving `borderColor: PB_SPORT_COLOR[sport]` unchanged.
- [X] T013 [US2] Run `npm test -- distribution-utils index-script-syntax` and fix any failures introduced by T009-T012.

**Checkpoint**: User Story 2 is independently functional — every chart shows the yellow-to-red gradient, and per-sport lines remain distinguishable by their existing stroke color.

---

## Phase 5: User Story 3 - Duration buckets use clean, round time increments (Priority: P2)

**Goal**: The Duration metric's regular bucket boundaries are always whole minute/hour increments from a fixed step table, never an arbitrary number of minutes and seconds.

**Independent Test**: Select Duration with a wide-ranging dataset and confirm every regular bucket boundary is a round time value (e.g. a multiple of 10 minutes).

### Tests for User Story 3

- [X] T014 [P] [US3] Add a `describe('computeDurationNiceStep', ...)` block in `__tests__/distribution-utils.test.js`: for a range of `3000` seconds (50 minutes) with `targetBucketCount: 12`, the returned step is one of `DURATION_NICE_STEPS_SECONDS` and produces a bucket count `<= 12`; for a very wide range (e.g. `360000` seconds / 100 hours), the returned step is the largest table entry (`86400`, 24 hours) when no smaller entry keeps the bucket count within `targetBucketCount`.

### Implementation for User Story 3

- [X] T015 [US3] In `src/distribution-utils.js`, add a `DURATION_NICE_STEPS_SECONDS` constant (`[300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400]`, per [data-model.md](../data-model.md)'s "Duration nice-step table") and export a pure `computeDurationNiceStep(range, targetBucketCount)` function that returns the smallest table entry whose resulting bucket count (`range / step`) is at or below `targetBucketCount`, falling back to the largest entry if none qualifies. Export via both `module.exports` and `window.distributionUtils`.
- [X] T016 [US3] In `src/distribution-utils.js`'s `computeDistributionBuckets`, use `computeDurationNiceStep` instead of the generic `computeNiceStep` when `metricKey === 'duration'` (all other metrics keep using `computeNiceStep` unchanged); continue using the existing `computeNiceBoundary` for floor/ceil rounding with the resulting step.
- [X] T017 [US3] Run `npm test -- distribution-utils index-script-syntax` and fix any failures introduced by T014-T016, including updating any existing Duration bucket-boundary assertions that assumed the generic 1-2-5×10^n step.

**Checkpoint**: User Story 3 is independently functional — Duration bucket boundaries always land on round minute/hour values.

---

## Phase 6: User Story 4 - Pace's unit appears once, on the axis title (Priority: P2)

**Goal**: The Pace metric's x-axis title includes the applicable unit exactly once; bucket labels (already unit-less per the Foundational phase) never repeat it.

**Independent Test**: Select Pace for a single sport and confirm the axis title reads e.g. "Pace (min/km)" while bucket labels show only the time/number value; select "All Sports" and confirm a plain "Pace" title.

### Tests for User Story 4

- [X] T018 [P] [US4] Add an assertion to `__tests__/index-script-syntax.test.js` that `renderDistributionsChart()` in `index.html` builds the Pace axis title using a per-sport unit map (e.g. assert `inlineCode` contains a mapping such as `{ Run: 'min/km', Swim: 'min/100m', Bike: 'km/h' }` used to build the x-axis `title.text` when `selectedDistributionsMetric === 'pace'`), and that the title falls back to a plain `'Pace'` string when the sport filter is `'All'`.

### Implementation for User Story 4

- [X] T019 [US4] In `index.html`'s `renderDistributionsChart()`, when building the x-axis `title.text`, special-case `selectedDistributionsMetric === 'pace'`: if `selectedDistributionsSportFilter` is `'Run'`, `'Swim'`, or `'Bike'`, render `` `Pace (${unitForSport})` `` using a `{ Run: 'min/km', Swim: 'min/100m', Bike: 'km/h' }` map; if it is `'All'`, render the plain metric label (`'Pace'`); all other metrics keep using `metricConfig.label` as before (per FR-006 and the `020` UI contract).
- [X] T020 [US4] Run `npm test -- distribution-utils index-script-syntax` and fix any failures introduced by T018-T019.

**Checkpoint**: User Story 4 is independently functional — the Pace unit appears exactly once, on the axis title, for every sport selection.

---

## Phase 7: User Story 5 - Extreme fast Pace values get their own "smaller than" bucket, oriented with the fire color scheme (Priority: P2)

**Goal**: The Pace metric supports a leading IQR-based "smaller than" underflow bucket (any sport filter), and single-sport Run/Swim Pace views reverse their axis order so faster values align with the fire color scheme's red/fast end; "All Sports" Pace keeps its existing shared, unreversed axis.

**Independent Test**: Import a dataset with a Swim pace outlier on the fast end, select Pace + Swim, and verify a "< X" bucket appears and the fastest values sit on the same red/fast end as every other metric; verify "All Sports" Pace keeps today's (unreversed) axis order.

### Tests for User Story 5

- [X] T021 [P] [US5] Add a test in `__tests__/distribution-utils.test.js` that `computeIqrOutlierThreshold(values)` also returns a `lowerFence` field (`q1 - 1.5 * iqr`, or a fallback of `Math.min(...values)` when `values.length < 4`, mirroring the existing `upperFence` fallback); given values `[1, 40, 41, 42, ..., 49, 100]`-style data with one clear low-end outlier (e.g. `[-50, 40, 41, 42, 43, 44, 45, 46, 47, 48]`), verify `-50` falls below the returned `lowerFence` while `40` does not.
- [X] T022 [P] [US5] Add a test in `__tests__/distribution-utils.test.js` that `computeDistributionBuckets(values, { metricKey: 'pace', sport: 'Swim', enableUnderflow: true })`, given values with one extreme low outlier, produces exactly one leading bucket with `isUnderflow: true` and a label matching `/^< /`, whose `rangeStart` is `-Infinity`; given values with no low-end outliers, no `isUnderflow` bucket is produced; given `enableUnderflow` omitted/false (or a non-`'pace'` `metricKey`), no `isUnderflow` bucket is ever produced regardless of the value distribution.
- [X] T023 [P] [US5] Add an assertion to `__tests__/index-script-syntax.test.js` that `renderDistributionsChart()` in `index.html` passes `enableUnderflow: true` to `computeDistributionBuckets` only when `selectedDistributionsMetric === 'pace'`, and that it reverses the chart's rendering order (e.g. a Chart.js `reverse: true` x-scale option, or an equivalent reversed-array rendering path) only when `selectedDistributionsMetric === 'pace'` and `selectedDistributionsSportFilter` is `'Run'` or `'Swim'` (not `'All'`, not `'Bike'`).

### Implementation for User Story 5

- [X] T024 [US5] In `src/distribution-utils.js`, extend `computeIqrOutlierThreshold(values)` to also compute and return `lowerFence` (`q1 - 1.5 * iqr`, or `Math.min(...values)` when `values.length < 4`, alongside the existing `q1`/`q3`/`iqr`/`upperFence` fields).
- [X] T025 [US5] In `src/distribution-utils.js`'s `computeDistributionBuckets`, add an `options.enableUnderflow` flag (default `false`). When `true`, compute `lowerFence` via `computeIqrOutlierThreshold`, clip the regular-bucket range's lower bound to `Math.max(min, lowerFence)`, and — if any qualifying value falls below that clipped lower bound — prepend one bucket `{ rangeStart: -Infinity, rangeEnd: <nice-floored lower bound>, label: "< " + formatMetricValue(metricKey, <lower bound>, sport, { includeUnit: false }), count: <count of values below it>, isUnderflow: true }` ahead of the regular buckets (verify `findBucketIndexForValue`'s existing `value >= bucket.rangeStart` check already handles `rangeStart: -Infinity` correctly with no changes needed there, matching how `rangeEnd: Infinity` is already handled for the overflow bucket).
- [X] T026 [US5] In `index.html`'s `renderDistributionsChart()`, pass `enableUnderflow: selectedDistributionsMetric === 'pace'` to `computeDistributionBuckets`; when `selectedDistributionsMetric === 'pace'` and `selectedDistributionsSportFilter` is `'Run'` or `'Swim'`, configure the chart to render in reversed order — set the Line mode's linear x-scale `reverse: true`, and for Histogram mode, reverse the rendered `bucketLabels`/`bucketCounts` arrays (and their corresponding color arrays from User Story 2) before building the dataset — leaving the underlying `buckets` array (used for per-sport-line boundary sharing) itself unreversed; do not apply any reversal when the sport filter is `'All'` or `'Bike'`.
- [X] T027 [US5] In `index.html`'s `renderDistributionsChart()`, ensure the fire-gradient `colorPosition` computation from User Story 2 (T012) is derived from each bucket's *final rendered position* (i.e., after the reversal from T026 is applied, when applicable) so red/fast still lines up with the visually "fast" end of the reversed axis.
- [X] T028 [US5] Run `npm test -- distribution-utils index-script-syntax` and fix any failures introduced by T021-T027.

**Checkpoint**: User Story 5 is independently functional — Pace shows a "smaller than" bucket when warranted, and single-sport Run/Swim Pace views orient faster values toward the fire scheme's red end; "All Sports" Pace is unaffected.

---

## Phase 8: User Story 6 - Elevation gain is not shown for Swim (Priority: P3)

**Goal**: Selecting Elevation gain with Swim (directly, or as a per-sport line in "All Sports" + Line mode) shows an explicit "N/A" indicator instead of an empty/zero chart or line.

**Independent Test**: Select Elevation gain + Swim and verify an "N/A" message appears instead of a chart; select Elevation gain + "All Sports" + Line mode and verify Swim is omitted from the per-sport lines while Run/Bike render normally.

### Tests for User Story 6

- [X] T029 [P] [US6] Add an assertion to `__tests__/index-script-syntax.test.js` that `renderDistributionsChart()` in `index.html` shows an explicit N/A message (distinct text from the standard empty-state message) when `selectedDistributionsMetric === 'elevation' && selectedDistributionsSportFilter === 'Swim'`, and that it excludes `'Swim'` from the per-sport line results when `selectedDistributionsMetric === 'elevation'` and the sport filter is `'All'` in Line mode (e.g. assert `inlineCode` contains a check such as `selectedDistributionsMetric === 'elevation' && sport === 'Swim'` used to skip that sport before building per-sport datasets).

### Implementation for User Story 6

- [X] T030 [US6] In `index.html`'s `renderDistributionsChart()`, add an early branch: when `selectedDistributionsMetric === 'elevation' && selectedDistributionsSportFilter === 'Swim'`, hide the canvas, show the empty-state element with N/A-specific copy (e.g. "Elevation gain is not applicable to Swim activities."), and return before any bucket computation.
- [X] T031 [US6] In `index.html`'s per-sport line branch (from User Story 2/`019`), when `selectedDistributionsMetric === 'elevation'`, exclude `'Swim'` from the per-sport datasets built from `window.distributionUtils.groupBucketCountsBySport(...)` (e.g. delete/skip the `'Swim'` entry before mapping to Chart.js datasets), leaving Run/Bike unaffected.
- [X] T032 [US6] Run `npm test -- distribution-utils index-script-syntax` and fix any failures introduced by T029-T031.

**Checkpoint**: User Story 6 is independently functional — Swim never shows a misleading Elevation gain chart or line.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories together.

- [X] T033 Run the complete root suite `npm test` and resolve any regressions across all visualization tabs (not just Distributions).
- [X] T034 Manually validate all six stories together in the browser per [quickstart.md](../quickstart.md) (`python -m http.server`, import synthetic multi-sport data with a wide Duration range and a Swim pace outlier, exercise the default view, fire color scheme, Duration buckets, Pace unit placement, the underflow bucket + axis reversal, and Swim + Elevation N/A).

## Dependencies & Execution Order

- **Setup (Phase 1)** → no dependencies; run first.
- **Foundational (Phase 2)**: blocks User Story 4 and User Story 5, both of which rely on Pace bucket labels already being unit-less via `formatMetricValue`'s `includeUnit` option; does not block User Story 1, 2, 3, or 6, which touch unrelated code paths.
- **User Story 1 (Phase 3)**: independent of all other stories; a one-line state-initializer change.
- **User Story 2 (Phase 4)**: independent of User Story 1, 3, 4, 6; User Story 5 (T027) later adjusts how User Story 2's color-position calculation accounts for axis reversal, so implement User Story 2 before User Story 5.
- **User Story 3 (Phase 5)**: independent of all other stories (Duration-only bucket-step change).
- **User Story 4 (Phase 6)**: depends on Phase 2's `formatMetricValue` `includeUnit` option; independent of User Story 1, 2, 3, 6.
- **User Story 5 (Phase 7)**: depends on Phase 2 (unit-less Pace bucket labels) and on User Story 2's color-position logic existing (T027 adjusts it); implement after User Story 2 and User Story 4.
- **User Story 6 (Phase 8)**: independent of all other stories, but touches the same per-sport-line branch as User Story 2 (T012) — apply after User Story 2 to avoid overlapping edits to that branch.
- **Polish (Phase 9)**: after all desired stories are complete.

## Parallel Execution Examples

- T006 (US1 test), T009/T010 (US2 tests), T014 (US3 test), T018 (US4 test), T021/T022/T023 (US5 tests), and T029 (US6 test) touch different files/describe blocks or distinct assertions and can be authored in parallel; however, their implementation tasks (T007, T011-T012, T015-T016, T019, T024-T027, T030-T031) all converge on the same `renderDistributionsChart()` function in `index.html` (and, for the `src/` changes, the same `computeDistributionBuckets`/`computeIqrOutlierThreshold` functions in `distribution-utils.js`), so apply them sequentially in story-priority order to avoid overlapping edits.
- T003 (Foundational test) and T009 (US2 test) can be authored in parallel since they exercise unrelated functions (`formatMetricValue` vs. `getFireGradientColor`).

## Implementation Strategy

**MVP first**: Implement Phase 2 (Foundational) and Phase 3 (User Story 1) only — User Story 1 is a one-line default-state change with no dependencies beyond the Foundational label fix, delivering the most immediately visible improvement.

**Incremental delivery**: Foundational → US1 (default view) → US2 (fire color scheme) → US3 (Duration steps) → US4 (Pace unit placement) → US5 (underflow bucket + axis reversal) → US6 (Swim Elevation N/A). Each story phase ends with its own checkpoint and can be verified/demoed independently before moving to the next, matching the spec's priority order (P1, P1, P2, P2, P2, P3).
