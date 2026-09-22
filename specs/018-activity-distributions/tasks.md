---

description: "Task list template for feature implementation"
---

# Tasks: Activity Distributions Visualization

**Input**: Design documents from `/specs/018-activity-distributions/`

**Prerequisites**: [plan.md](../plan.md) (required), [spec.md](../spec.md) (required for user stories), [research.md](../research.md), [data-model.md](../data-model.md), [contracts/distributions-ui.md](../contracts/distributions-ui.md)

**Tests**: Included, per the repo's Narrowest-Scope Test-First Verification constitution principle (NON-NEGOTIABLE), which requires tab changes and reusable modules to be validated by focused tests in the same change.

**Organization**: Tasks are grouped by user story (from [spec.md](../spec.md)) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single static-browser project (existing layout, no build step):

- `src/distribution-utils.js` — NEW reusable module (CommonJS + `window.distributionUtils` bridge)
- `src/scatter-utils.js` — existing module, reused (not modified) for `getSportPerformanceMetric`
- `src/tab-navigation.js` — tab registration (`TAB_ORDER`/`TAB_BUTTON_IDS`/`TAB_PANEL_IDS`)
- `index.html` — new Distributions tab markup + inline rendering/control functions
- `__tests__/distribution-utils.test.js` (new), `__tests__/tab-navigation.test.js`, `__tests__/index-script-syntax.test.js`

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before making changes.

- [X] T001 Run `npm test` from the repo root to confirm the current suite passes before any edit (baseline for this feature).

**Checkpoint**: Baseline green; safe to start foundational work.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that every user story depends on — the new tab must exist and be registered, and the core bucket/filter module must exist, before any story-specific control can be wired up.

- [X] T002 [P] Register the new tab in `src/tab-navigation.js`: add `'distributions'` to `TAB_ORDER` (after `'heatmap'`), add `distributions: 'vizTabDistributions'` to `TAB_BUTTON_IDS`, add `distributions: 'vizPanelDistributions'` to `TAB_PANEL_IDS`, and extend `setVisualizationTab`'s element lookups/active-state branches (`isDistributions`, corresponding button/panel variables) following the exact pattern already used for `heatmap`.
- [X] T003 [P] Add a test in `__tests__/tab-navigation.test.js` asserting `'distributions'` is present in `TAB_ORDER`, that `setVisualizationTab('distributions', { document: fakeDoc })` activates `vizTabDistributions`/`vizPanelDistributions` and deactivates the previously active tab, and that `getNextVisualizationTab` correctly cycles into/out of `'distributions'` at the end of `TAB_ORDER`.
- [X] T004 Create `src/distribution-utils.js` implementing three pure functions per [data-model.md](../data-model.md): `getMetricValue(activity, metricKey)` — returns the finite numeric value for `metricKey` in `{ 'length', 'duration', 'pace', 'elevation', 'power' }` (`distance` for length, `duration` for duration, `elevationGain` for elevation, `avgWatts` for power, and — for `pace` — the `.value` from `getSportPerformanceMetric(activity)`, requiring `src/scatter-utils.js` to be loaded first in `index.html`/available via `require` in tests) or `null` when the activity lacks a valid value for that metric; `filterActivitiesForDistribution(activities, { metric, sport, minDate, maxDate })` — returns activities where `sport` matches (or `sport === 'All'`), `date` falls within `[minDate, maxDate]` when provided, and `getMetricValue(activity, metric)` is a finite value, silently excluding non-matching/invalid activities per FR-003; `computeDistributionBuckets(values, options = {})` — given an array of numeric values, computes `min`/`max`, and returns a `{ buckets, activityCount }` result where `buckets` is an array of `{ rangeStart, rangeEnd, label, count }` spanning `min`..`max` split into `options.targetBucketCount || 12` evenly-sized buckets (a single bucket covering the one value when `min === max`), and `[]` buckets / `activityCount: 0` when `values` is empty. Export all three via both `module.exports` and `window.distributionUtils`, following the exact dual-bridge pattern in `src/scatter-utils.js`.
- [X] T005 [P] Create `__tests__/distribution-utils.test.js` covering: `getMetricValue` returns the right field per metric and `null` for missing/invalid values (e.g. no `avgWatts` for power, sport-less activity for pace); `filterActivitiesForDistribution` excludes activities outside the sport/date range and those missing the selected metric's value, while combining multiple sports for `sport: 'All'` (verifying pace/speed values from Run/Bike/Swim activities are all included, unconverted, per FR-005a); `computeDistributionBuckets` produces 10-15 buckets whose `rangeStart`/`rangeEnd` span the input min/max and whose counts sum to `values.length`, produces exactly one bucket when all values are equal, and returns `{ buckets: [], activityCount: 0 }` for an empty input array.
- [X] T006 Add the "Distributions" tab scaffold to `index.html`: a `vizTabDistributions` button in the visualization tab bar (after the `heatmap` tab button, mirroring its `onclick`/`onkeydown`/ARIA attributes) and a `vizPanelDistributions` panel (after `vizPanelHeatmap`) containing: a header with title/export button (`onclick="exportVisualizationTab('distributions')"`, matching the pattern of other tabs' export buttons), a metric selector button group (`distributionsMetricBtn{Length,Duration,Pace,Elevation,Power}`), the reused sport-filter button group (`distributionsSportBtn{All,Run,Bike,Swim}`, styled like `scatterSportBtn*`), a date-range control (`distributionsDateStart`/`distributionsDateEnd` range inputs, `distributionsRangeLabel`, `distributionsRangeSelectedTrack`, mirroring the `scatterDateStart`/`scatterDateEnd` markup), a display-mode toggle (`distributionsModeBtnHistogram`/`distributionsModeBtnLine`), and a chart area (`distributionsChartWrapper` containing `<canvas id="distributionsChart">` and a hidden `distributionsEmptyState` message), per [contracts/distributions-ui.md](../contracts/distributions-ui.md).
- [X] T007 Wire the Distributions tab into `index.html`'s existing cross-tab bookkeeping: add `distributions: 'distributionsChartWrapper'` to `EXPORT_CAPTURE_TARGET_IDS`, add `distributions: isEmptyStateHidden('distributionsEmptyState')` to `getExportableFlags()`, add `'vizTabDistributions'` to the tab-button-ID list used for keyboard navigation (~line 5355), and add the `tabName === 'distributions' ? 'vizTabDistributions' :` branch to the button-ID lookup (~line 5176), matching the existing entries for `heatmap`.
- [X] T008 Run `npm test -- distribution-utils tab-navigation` and fix any failures introduced by T002-T007.

**Checkpoint**: The Distributions tab exists, is navigable, and the core bucket/filter module is unit-tested — ready for story-specific chart rendering.

---

## Phase 3: User Story 1 - Explore the distribution of a single metric (Priority: P1) 🎯 MVP

**Goal**: Selecting a metric (Length, Duration, Pace, Elevation gain, Power) on the Distributions tab renders a histogram of how activities are distributed across that metric's value range, with an empty-state message when no activities qualify.

**Independent Test**: Open the Distributions tab, select each metric in turn, and verify the chart renders a correctly-labeled histogram of activity counts per value bucket for that metric (or the empty-state message when no activity has a valid value for the selected metric, e.g. Power with no power-recording activities).

### Tests for User Story 1

- [X] T009 [P] [US1] Add assertions to `__tests__/index-script-syntax.test.js` that `index.html`'s inline script defines `setDistributionsMetric(metricKey)` and `renderDistributionsChart()`, that `renderDistributionsChart` calls `window.distributionUtils.filterActivitiesForDistribution` and `window.distributionUtils.computeDistributionBuckets`, and that it toggles `distributionsChart`/`distributionsEmptyState` visibility based on whether the computed `activityCount` is zero.

### Implementation for User Story 1

- [X] T010 [US1] In `index.html`, add a module-level `selectedDistributionsMetric` state variable (default `'length'`) and a `DISTRIBUTIONS_METRIC_CONFIG` map keyed by `'length' | 'duration' | 'pace' | 'elevation' | 'power'`, each entry providing `{ label, unit, formatValue }` used for axis/bucket-label formatting (km for length, min/hr for duration, the existing pace/speed unit convention for pace, m for elevation, W for power), per [data-model.md](../data-model.md)'s "Metric selection" entity.
- [X] T011 [US1] In `index.html`, implement `setDistributionsMetric(metricKey)` — sets `selectedDistributionsMetric`, updates the active/inactive classes on the `distributionsMetricBtn*` buttons (reusing the existing `TAB_ACTIVE_CLASS`/`TAB_INACTIVE_CLASS`-equivalent styling helper pattern from `setScatterSportBtnActive`), and calls `renderDistributionsChart()`; wire each `distributionsMetricBtn*` button's `onclick` to `setDistributionsMetric('...')`.
- [X] T012 [US1] In `index.html`, implement `renderDistributionsChart()`: call `window.distributionUtils.filterActivitiesForDistribution(processedActivities, { metric: selectedDistributionsMetric, sport: 'All', minDate: null, maxDate: null })` (time-horizon/sport wiring lands in User Story 2), extract the qualifying metric values, and call `window.distributionUtils.computeDistributionBuckets(values)`; if `activityCount === 0`, hide `distributionsChart` and show `distributionsEmptyState` with a message naming the selected metric; otherwise hide the empty state, show the canvas, destroy any existing `distributionsChartInstance`, and render a new Chart.js `type: 'bar'` chart with one bar per bucket (`label` = bucket `label`, data = bucket `count`), x-axis title = the selected metric's `label`/`unit`, y-axis title = "Activities".
- [X] T013 [US1] In `index.html`, call `renderDistributionsChart()` from `setVisualizationTab`'s `distributions` branch (mirroring how `renderHeartratePaceChart()` is called when switching to `heartratePace`, per the dispatch code around line 5087) so the chart renders/refreshes whenever the tab becomes active.
- [X] T014 [US1] Run `npm test -- distribution-utils index-script-syntax tab-navigation` and fix any failures introduced by T009-T013.

**Checkpoint**: User Story 1 is independently functional — switching metrics on the Distributions tab renders the correct histogram or empty state.

---

## Phase 4: User Story 2 - Restrict the analysis to a time horizon (Priority: P2)

**Goal**: Users can narrow the analyzed activities by date range (time horizon) and by sport (All/Run/Bike/Swim), with the chart recalculating accordingly; Pace combines multiple sports' values on one chart when sport = All.

**Independent Test**: Adjust the Distributions tab's date-range control and sport filter and verify the chart recalculates to reflect only in-range/matching-sport activities, and that selecting Pace with sport = All includes activities from multiple sports.

### Tests for User Story 2

- [X] T015 [P] [US2] Add assertions to `__tests__/index-script-syntax.test.js` that `index.html` defines `setDistributionsSportFilter(sport)` and `setDistributionsDateRange(boundary, value)`, and that `renderDistributionsChart()`'s call to `filterActivitiesForDistribution` passes the current `selectedDistributionsSportFilter` and the date bounds derived from the Distributions date-range state (not the hardcoded `'All'`/`null` values from User Story 1).

### Implementation for User Story 2

- [X] T016 [US2] In `index.html`, add `selectedDistributionsSportFilter` (default `'All'`) and a `distributionsDateRange = { start: 0, end: 0 }` state pair plus a `distributionsDateCandidates` array, mirroring `selectedScatterSportFilter`/`scatterDateRange`/`scatterDateCandidates`; implement `initializeDistributionsDateRangeCandidates()` (mirroring `initializeScatterDateRangeCandidates`'s logic of deriving unique sorted dates from `processedActivities`) and call it wherever `processedActivities` is (re)populated, alongside the existing scatter-range initialization call.
- [X] T017 [US2] In `index.html`, implement `updateDistributionsDateRangeLabel()` and `updateDistributionsDateRangeTrack()` (mirroring `updateScatterDateRangeLabel`/`updateScatterDateRangeTrack`) and `getDistributionsDateBounds()` (mirroring `getScatterDateBounds`, returning `{ minDate, maxDate }` from `distributionsDateRange`); implement `setDistributionsDateRange(boundary, value)` (mirroring `setScatterDateRange`) that updates `distributionsDateRange`, refreshes the range inputs/label/track, and calls `renderDistributionsChart()`. Wire the `distributionsDateStart`/`distributionsDateEnd` inputs' `oninput` to `setDistributionsDateRange('start'|'end', this.value)`.
- [X] T018 [US2] In `index.html`, implement `setDistributionsSportFilter(sport)` (mirroring `setScatterSportFilter`/`setScatterSportBtnActive`) that sets `selectedDistributionsSportFilter`, updates the `distributionsSportBtn*` active styling, and calls `renderDistributionsChart()`; wire each `distributionsSportBtn*` button's `onclick` to `setDistributionsSportFilter('...')`.
- [X] T019 [US2] In `index.html`, update `renderDistributionsChart()` (from T012) to call `getDistributionsDateBounds()` and pass `sport: selectedDistributionsSportFilter, minDate, maxDate` into `filterActivitiesForDistribution` instead of the User Story 1 placeholders, and update the point-count/summary text (if any, mirroring `scatterPointCount`) to reflect the filtered `activityCount`.
- [X] T020 [US2] Run `npm test -- distribution-utils index-script-syntax tab-navigation` and fix any failures introduced by T015-T019.

**Checkpoint**: User Story 2 is independently functional — the time-horizon and sport filters both recalculate the displayed distribution, and Pace correctly combines sports when set to All.

---

## Phase 5: User Story 3 - Switch between histogram and smoothed line views (Priority: P3)

**Goal**: Users can toggle the Distributions chart between a bar histogram and an approximated smoothed line over the same underlying buckets, for any metric/filter combination.

**Independent Test**: With any metric/filter combination selected, toggle "Histogram"/"Line" and verify the same bucket data renders as bars in one mode and as a smoothed line in the other, and that changing metric/filters while in "Line" mode keeps it in "Line" mode with updated data.

### Tests for User Story 3

- [X] T021 [P] [US3] Add an assertion to `__tests__/index-script-syntax.test.js` that `index.html` defines `setDistributionsDisplayMode(mode)` and that `renderDistributionsChart()` branches its Chart.js dataset `type`/`cubicInterpolationMode` based on the current display-mode state (bar dataset for `'histogram'`, monotone-interpolated line dataset with one point per bucket midpoint for `'line'`), per [research.md](../research.md)'s "Approximated line" decision.

### Implementation for User Story 3

- [X] T022 [US3] In `index.html`, add a `selectedDistributionsDisplayMode` state variable (default `'histogram'`) and implement `setDistributionsDisplayMode(mode)` that sets the state, updates the `distributionsModeBtnHistogram`/`distributionsModeBtnLine` active styling, and calls `renderDistributionsChart()`; wire both buttons' `onclick` handlers.
- [X] T023 [US3] In `index.html`, update `renderDistributionsChart()` (from T012/T019) so that when `selectedDistributionsDisplayMode === 'histogram'` it renders the existing `type: 'bar'` dataset (one bar per bucket), and when `'line'` it renders a `type: 'line'` dataset with one point per bucket midpoint (`(rangeStart + rangeEnd) / 2`) as `x`, `count` as `y`, `cubicInterpolationMode: 'monotone'`, and `tension` set for a smooth curve — reusing the same computed `buckets` array for both modes without recomputing them.
- [X] T024 [US3] Run `npm test -- distribution-utils index-script-syntax tab-navigation` and fix any failures introduced by T021-T023.

**Checkpoint**: User Story 3 is independently functional — toggling display mode re-renders the same bucketed data as bars or a smoothed line, and the mode persists across metric/filter changes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories together.

- [X] T025 Run the complete root suite `npm test` and resolve any regressions across all visualization tabs.
- [X] T026 Manually validate all three stories together in the browser per [quickstart.md](../quickstart.md) (`python -m http.server`, import synthetic multi-sport data including some without power, exercise metric switching, time-horizon/sport filtering, display-mode toggling, the empty state, and the "Export for Insta / Strava" button on the Distributions tab).

## Dependencies & Execution Order

- **Setup (Phase 1)** → no dependencies; run first.
- **Foundational (Phase 2)**: blocks all user stories — the tab must exist (T002/T003/T006/T007) and the bucket/filter module must exist (T004/T005) before any story-specific control can be wired up or tested.
- **User Story 1 (Phase 3)**: depends only on Phase 2; delivers the MVP (metric selection + histogram + empty state) with sport hardcoded to `'All'` and no date filtering.
- **User Story 2 (Phase 4)**: depends on Phase 3's `renderDistributionsChart()` existing (T012) so it can replace the placeholder sport/date arguments; independently testable once its own controls are wired.
- **User Story 3 (Phase 5)**: depends on Phase 3's `renderDistributionsChart()` and bucket computation existing, but is otherwise independent of Phase 4 (it only changes how the already-filtered buckets are rendered) — could be implemented before Phase 4 if desired, though the priority order (P1 → P2 → P3) is recommended.
- **Polish (Phase 6)**: after all desired stories are complete.

## Parallel Execution Examples

- T002 (tab-navigation.js registration) and T004 (distribution-utils.js module) touch different files and can be implemented in parallel; T003 and T005 (their respective tests) can likewise be authored in parallel with each other and with T006 (index.html markup).
- T009 (US1 test) can be authored in parallel with T015 (US2 test) and T021 (US3 test) since they assert different function names, but the corresponding implementation tasks (T010-T013, T016-T019, T022-T023) all edit the same `renderDistributionsChart()` function in `index.html` and should be applied sequentially, one story at a time, to avoid overlapping edits.

## Implementation Strategy

**MVP first**: Implement Phase 2 (Foundational) and Phase 3 (User Story 1) only — this delivers a working Distributions tab where users can pick any of the five metrics and see a correctly-labeled histogram, which is the smallest slice that fulfills the feature's core request.

**Incremental delivery**: Foundational → US1 (metric + histogram) → US2 (time horizon + sport filter) → US3 (histogram/line toggle). Each story phase ends with its own checkpoint and can be verified/demoed independently before moving to the next, matching the spec's priority order (P1, P2, P3).
