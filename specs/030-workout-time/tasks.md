---

description: "Executable task list for Workout Time Visualization"
---

# Tasks: Workout Time Visualization

**Input**: Design documents from `/specs/030-workout-time/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/workout-time-ui.md](contracts/workout-time-ui.md), [quickstart.md](quickstart.md)

**Organization**: Tasks are grouped by user story so each story can be implemented and tested as an independently valuable increment.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing static-browser integration points before adding the feature.

- [X] T001 [P] Document the required Workout Time script load position and existing dashboard/export integration points in `index.html`, `src/dashboard-tabs.js`, and `src/dashboard-export.js`.
- [X] T002 [P] Confirm the existing Chart.js, static-server, and Jest test commands used by the feature in `package.json` and `jest.config.js`.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Preserve start timestamps in both import paths without changing existing date filtering, sport normalization, or distance semantics.

**Checkpoint**: Normalized activities expose a valid `startTime` when the source timestamp contains a usable time, while existing consumers continue using `date` unchanged.

- [X] T003 [P] Extend timestamp parsing in `src/dashboard-utils.js` so German and English Activity Date values preserve hour/minute/second in `startTime`, retain the existing calendar `date`, and return `startTime: null` for invalid or missing timestamps.
- [X] T004 [P] Apply the same `startTime` normalization contract in `src/dashboard-core.js` and `src/dashboard-import.js`, including `startTime: null` for invalid or missing timestamps and no changes to strict Run/Bike/Swim normalization.
- [X] T005 Add parser and processing regression tests in `__tests__/parsing.test.js` and `__tests__/processing.test.js` for German timestamps with time, English timestamps with time, invalid timestamps, retained calendar dates, and unchanged sport normalization.
- [X] T006 Run `npm test -- parsing` for `__tests__/parsing.test.js` and `npm test -- processing` for `__tests__/processing.test.js`, then resolve any regression before starting user-story work.

## Phase 3: User Story 1 - See When Workouts Start During the Day (Priority: P1) 🎯 MVP

**Goal**: Show a navigable Workout Time tab with a filtered time-of-day distribution using fixed two-hour intervals.

**Independent Test**: Import activities with known local start times, open Workout Time in Day view, apply All/Run/Bike/Swim filtering, and verify each valid activity is counted in its correct `00:00-01:59` through `22:00-23:59` interval.

### Tests for User Story 1

- [X] T007 [P] [US1] Add pure utility tests in `__tests__/workout-time-utils.test.js` for valid `startTime` filtering, inclusive date bounds, All/Run/Bike/Swim filtering, twelve ordered two-hour Day groups, midnight assignment, and invalid timestamp exclusion.

### Implementation for User Story 1

- [X] T008 [US1] Create the dual-target pure utility `src/workout-time-utils.js` with `module.exports` and `window.workoutTimeUtils`, defining the `day`, `week`, `month`, and `year` granularity enum plus the nullable `startTime` validation contract from `data-model.md`.
- [X] T009 [US1] Implement the shared sport/date filtering and fixed two-hour Day grouping in `src/workout-time-utils.js`, returning ordered `TimeGroup` records with stable keys, labels, non-negative integer counts, and an `activityCount` total.
- [X] T010 [US1] Add Workout Time tab markup in `index.html` with `vizTabWorkoutTime`, `vizPanelWorkoutTime`, `workoutTimeGranularity`, `workoutTimeSportFilter`, `workoutTimeDateStart`, `workoutTimeDateEnd`, `workoutTimeChartWrapper`, `workoutTimeChart`, and `workoutTimeEmptyState` IDs from `contracts/workout-time-ui.md`.
- [X] T011 [US1] Register `workoutTime` with `TAB_ORDER`, `TAB_BUTTON_IDS`, and `TAB_PANEL_IDS` in `src/tab-navigation.js`, including keyboard next/previous behavior and the injectable-document test contract.
- [X] T012 [US1] Add the Workout Time renderer `src/dashboard-workout-time.js` to read the existing filtered activity state, call `workoutTimeUtils`, render Day counts with Chart.js, destroy stale chart instances, and keep the explicit empty state hidden for valid data.
- [X] T013 [US1] Dispatch `workoutTime` from `src/dashboard-tabs.js`, update the matching inline dispatch logic in `index.html`, and load `src/dashboard-workout-time.js` in the correct order without introducing a duplicate top-level global declaration.
- [X] T014 [US1] Extend `__tests__/tab-navigation.test.js` and `__tests__/index-script-syntax.test.js` for the new tab IDs, keyboard order, panel dispatch, and exact script loading contract.
- [X] T015 [US1] Run `npm test -- workout-time-utils` for `__tests__/workout-time-utils.test.js`, `npm test -- tab-navigation` for `__tests__/tab-navigation.test.js`, and `npm test -- index-script-syntax` for `__tests__/index-script-syntax.test.js`; fix failures before the MVP checkpoint.

**Checkpoint**: US1 is independently demonstrable with Day view, existing sport/date filters, stable labels/counts, and tab navigation.

## Phase 4: User Story 2 - Compare Workout Timing Across Calendar Periods (Priority: P2)

**Goal**: Add Week, Month, and Year grouping while preserving active sport/date filters and the selected granularity.

**Independent Test**: With one dataset spanning weekdays, multiple months, and multiple years, switch through Week, Month, and Year and verify Monday-Sunday, day 1-31, and January-December group order/counts.

### Tests for User Story 2

- [X] T016 [P] [US2] Extend `__tests__/workout-time-utils.test.js` with Monday-first Week grouping, day 1-31 Month aggregation across selected months, January-December Year aggregation across selected years, boundary dates, and zero-count group preservation.
- [X] T017 [P] [US2] Add control-state and re-render coverage to `__tests__/index-script-syntax.test.js` for exactly one active granularity and preserved sport/date filter state when switching views.

### Implementation for User Story 2

- [X] T018 [US2] Implement Monday-Sunday Week, day-number 1-31 Month, and January-December Year aggregation in `src/workout-time-utils.js`, preserving fixed order and aggregating recurring calendar positions across the filtered range.
- [X] T019 [US2] Add Day/Week/Month/Year controls and state transitions to `src/dashboard-workout-time.js`, reusing the existing inclusive date-range and All/Run/Bike/Swim conventions without creating a second date filter model.
- [X] T020 [US2] Render granularity-specific labels, counts, and axis configuration in `src/dashboard-workout-time.js`, including the selected granularity in the visible control context.
- [X] T021 [US2] Update `index.html` control markup and event wiring so changing granularity recalculates the chart without losing active sport/date selections.
- [X] T022 [US2] Run `npm test -- workout-time-utils` for `__tests__/workout-time-utils.test.js` and `npm test -- index-script-syntax` for `__tests__/index-script-syntax.test.js`; resolve all Week/Month/Year grouping and state-preservation failures.

**Checkpoint**: US1 and US2 are independently usable; all four granularities produce deterministic, correctly ordered distributions.

## Phase 5: User Story 3 - Inspect Details and Empty States (Priority: P3)

**Goal**: Make timing results trustworthy for missing data and inspectable through chart details, then provide export support.

**Independent Test**: Use valid, invalid, and filter-excluded activities; verify group labels/counts, explicit empty state, and an export containing the current granularity and filter context.

### Tests for User Story 3

- [X] T023 [P] [US3] Add empty-state and edge-case assertions to `__tests__/workout-time-utils.test.js` for one valid activity, no qualifying activities, invalid `startTime`, and date/sport combinations with zero results.
- [X] T024 [P] [US3] Add Workout Time title/slug/context assertions to `__tests__/export-utils.test.js` for `workoutTime` export metadata.

### Implementation for User Story 3

- [X] T025 [US3] Implement explicit empty-state handling in `src/dashboard-workout-time.js` so `workoutTimeEmptyState` is shown and `workoutTimeChart` is hidden whenever `activityCount` is zero, without rendering a misleading blank chart.
- [X] T026 [US3] Configure existing Chart.js interaction/tooltips in `src/dashboard-workout-time.js` so every rendered group exposes its unambiguous interval label and workout count in one inspection action.
- [X] T027 [US3] Add Workout Time display title, filename slug, and export context metadata in `src/export-utils.js`, preserving existing public exports and avoiding the known missing-title gap for other tabs.
- [X] T028 [US3] Register `workoutTime` capture target, empty-state flag, control context, active filter context, and export dispatch in `src/dashboard-export.js` using the IDs in `contracts/workout-time-ui.md`.
- [X] T029 [US3] Wire the Workout Time export control in `index.html` and verify the local image export includes the selected granularity, visible labels, counts, and active sport/date range.
- [X] T030 [US3] Run `npm test -- export-utils` for `__tests__/export-utils.test.js`, `npm test -- workout-time-utils` for `__tests__/workout-time-utils.test.js`, and `npm test -- index-script-syntax` for `__tests__/index-script-syntax.test.js`; resolve empty-state, tooltip, and export regressions.

**Checkpoint**: All three user stories are independently testable; missing data is explicit, groups are inspectable, and export works through the existing local pipeline.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature against the repository's static-browser workflow and the quickstart scenarios.

- [X] T031 [P] Add focused documentation links and Workout Time validation notes to `specs/030-workout-time/quickstart.md` if implementation IDs or behavior differ from the design contract.
- [X] T032 Run the complete root test suite with `npm test` from `package.json` and resolve feature-related regressions without changing unrelated behavior.
- [X] T033 Run the manual scenarios in `specs/030-workout-time/quickstart.md` against `python -m http.server`, including narrow viewport layout, all four granularities, empty state, and export.
- [X] T034 Run `git diff --check --` and review the final changes across `index.html`, `src/`, `__tests__/`, and `specs/030-workout-time/` for accidental API or privacy-boundary changes.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T002 can start immediately; no code dependency.
- **Foundational (Phase 2)**: T003-T006 depend on setup context and block all user stories because every grouping requires preserved `startTime` values.
- **User Story 1 (Phase 3)**: T007-T015 depend on the foundational timestamp contract; this is the MVP increment.
- **User Story 2 (Phase 4)**: T016-T022 depend on US1's utility, renderer, and tab shell, then add the remaining grouping modes.
- **User Story 3 (Phase 5)**: T023-T030 depend on the shared renderer and all granularity modes, then add reliability details and export.
- **Polish (Phase 6)**: T031-T034 depend on the desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Phase 2; delivers the Day-view MVP independently.
- **User Story 2 (P2)**: Depends on US1's shared tab/utility shell, but its grouping tests and implementation are independently verifiable once that shell exists.
- **User Story 3 (P3)**: Depends on the renderer from US1 and granularity state from US2; empty-state and export behavior can be tested independently after those contracts exist.

### Parallel Opportunities

- Phase 1: T001 and T002 can run in parallel.
- Phase 2: T003 and T004 can run in parallel; T005 starts after both parser paths are understood.
- US1: T007 can be written in parallel with T010 and T011; T012 depends on T008-T009 and T010; T013 depends on T010-T012.
- US2: T016 and T017 can run in parallel; T018 can proceed independently of the UI control work after US1 utility tests are available.
- US3: T023 and T024 can run in parallel; T025-T026 can be developed together after the renderer exists, while T027-T028 can proceed in parallel before T029.
- Polish: T031 and T034 can run in parallel; T032 follows all implementation changes and T033 requires a runnable browser build.

## Parallel Example: User Story 1

```text
After Phase 2:
Task: "T007 [US1] Add workout-time utility tests in __tests__/workout-time-utils.test.js"
Task: "T010 [US1] Add Workout Time markup in index.html"
Task: "T011 [US1] Register workoutTime in src/tab-navigation.js"

After T007-T009 and T010:
Task: "T012 [US1] Implement the Day renderer in src/dashboard-workout-time.js"
Task: "T014 [US1] Update tab and script contract tests in __tests__/"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup and Phase 2 timestamp normalization.
2. Implement US1's pure Day grouping, tab shell, renderer, and focused tests.
3. Stop at the US1 checkpoint and validate with the focused Jest suites plus a browser smoke test.
4. Demo the Day view before adding the remaining calendar perspectives.

### Incremental Delivery

1. Add US2 Week/Month/Year grouping and control state; validate all four axes independently.
2. Add US3 empty-state, tooltip, and export behavior; validate local image capture.
3. Run the complete root suite and the quickstart manual checks.

### Parallel Team Strategy

1. One contributor completes timestamp normalization and parser tests.
2. After Phase 2, one contributor handles the pure grouping utility while another handles tab markup/navigation.
3. After US1's shell exists, one contributor handles calendar grouping and another handles export/empty-state polish.

## Notes

- Every task is a checkbox with a sequential ID; story tasks carry `[US1]`, `[US2]`, or `[US3]`.
- `[P]` is used only where tasks target different files or independent test/design work.
- Existing public exports and the static-browser loading order must remain compatible.
- Raw Strava files remain local; use synthetic or explicitly supplied local test data only.
