---

description: "Executable task list for the Training Calendar View"
---

# Tasks: Training Calendar View

**Input**: Design documents from `/specs/036-training-calendar/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/training-calendar-ui.md](contracts/training-calendar-ui.md), [quickstart.md](quickstart.md)

**Tests**: Included because the project constitution requires focused Jest and static-script validation for reusable modules and dashboard behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel when it touches a different file and has no dependency on incomplete work.
- **[Story]**: Maps a task to a user story from `spec.md`.
- Every task names the exact file path it changes or validates.

## Path Conventions

Single static-browser project at repository root: `src/`, `__tests__/`, and `index.html`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Load the new browser scripts and establish focused test entry points without changing existing behavior.

- [X] T001 [P] Add `src/training-calendar-utils.js` and `src/dashboard-training-calendar.js` script tags to `index.html` in the existing browser load order, with the utility loaded before the dashboard renderer.
- [X] T002 [P] Create the Jest test scaffold and activity factory for calendar records in `__tests__/training-calendar-utils.test.js`, using the repository's Node test environment and no DOM APIs.
- [X] T003 [P] Add the Training Calendar tab/panel IDs and renderer identifiers to the contract assertions in `__tests__/index-script-syntax.test.js` as initially failing checks.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Register the visualization in the shared tab system and make the static dashboard able to address it.

**CRITICAL**: No user story implementation is complete until this phase is finished.

- [X] T004 [P] Register `trainingCalendar` in `TAB_ORDER`, `TAB_BUTTON_IDS`, and `TAB_PANEL_IDS` in `src/tab-navigation.js` with `vizTabTrainingCalendar` and `vizPanelTrainingCalendar` IDs.
- [X] T005 [P] Extend `__tests__/tab-navigation.test.js` to assert activation, deactivation, keyboard cycling, and focus behavior for `trainingCalendar`.
- [X] T006 Update `index.html` with the `vizTabTrainingCalendar` button and `vizPanelTrainingCalendar` panel shell, including role, ARIA, keyboard handler, and `onclick="setVisualizationTab('trainingCalendar')"` attributes required by `contracts/training-calendar-ui.md`.
- [X] T007 Wire `trainingCalendar` dispatch and focus fallback in `src/dashboard-tabs.js` and `index.html`, calling `renderTrainingCalendar()` when the tab becomes active and preserving existing tab behavior.

**Checkpoint**: The new tab is registered, keyboard-navigable, and its empty panel can be activated without breaking existing visualizations.

## Phase 3: User Story 1 - Jahreskalender der Trainingstage (Priority: P1) MVP

**Goal**: Show a complete Monday-first calendar year with empty days, activity intensity, month labels, weekday labels, and a legend.

**Independent Test**: With synthetic activities on at least two dates in one year, opening the tab shows one day cell for every day of that year, active cells have non-zero levels, empty cells remain visible, and the legend explains levels 0 through 5.

### Tests for User Story 1

- [X] T008 [P] [US1] Add utility tests in `__tests__/training-calendar-utils.test.js` for available-year discovery, local `YYYY-MM-DD` grouping, 365/366 real days, Monday-first week alignment, and level-zero empty cells.
- [X] T009 [P] [US1] Add utility tests in `__tests__/training-calendar-utils.test.js` for the duration -> distance -> activity-count fallback and five relative intensity levels, including a single-value day and all-empty input.

### Implementation for User Story 1

- [X] T010 [US1] Implement the dual-target pure calendar model in `src/training-calendar-utils.js`, including `getAvailableYears`, local date keys, full-year day generation, Monday-first week columns, metric fallback, and intensity levels 0 through 5 without mutating activities.
- [X] T011 [US1] Add the complete calendar grid, month/weekday labels, intensity legend, empty-state element, and responsive overflow container to `index.html` using the IDs in `contracts/training-calendar-ui.md`.
- [X] T012 [US1] Implement `renderTrainingCalendar()` and grid rendering in `src/dashboard-training-calendar.js`, using `window.trainingCalendarUtils`, level-based classes, full-year empty cells, and a latest-year default.
- [X] T013 [US1] Extend `__tests__/index-script-syntax.test.js` to assert script order, calendar panel IDs, legend/empty-state IDs, and `renderTrainingCalendar()` dispatch in `index.html` and `src/dashboard-tabs.js`.

**Checkpoint**: User Story 1 is independently functional and demonstrable as the MVP.

## Phase 4: User Story 2 - Tagesdetails und Sportarten unterscheiden (Priority: P2)

**Goal**: Show selected/focused day details with activity count, sports, duration, distance, and explicit missing-value behavior.

**Independent Test**: With multiple activities on one day across two sports and one missing metric, focusing the day cell shows the correct date, counts, sports, and only available totals.

### Tests for User Story 2

- [X] T014 [P] [US2] Add aggregation tests in `__tests__/training-calendar-utils.test.js` for same-day multi-activity counts, unique `Run`/`Bike`/`Swim`/`Other` sports, per-sport totals, and null omission for unavailable duration or distance.
- [X] T015 [P] [US2] Add UI contract assertions in `__tests__/index-script-syntax.test.js` for `trainingCalendarDetails`, focus/hover detail wiring, accessible day labels, and non-fabricated missing values.

### Implementation for User Story 2

- [X] T016 [US2] Extend `src/training-calendar-utils.js` Training Day records with `activityCount`, `durationSeconds`, `distanceKm`, `sports`, `bySport`, `metricKind`, and immutable detail values required by `data-model.md`.
- [X] T017 [US2] Add `trainingCalendarDetails` markup and selected-day detail fields to `index.html`, including a keyboard-reachable details region that does not depend on hover.
- [X] T018 [US2] Implement focus, hover, and click selection plus detail formatting in `src/dashboard-training-calendar.js`, omitting unavailable duration/distance instead of displaying fabricated zero values.

**Checkpoint**: User Stories 1 and 2 both work independently; day details remain available via keyboard focus.

## Phase 5: User Story 3 - Jahre wechseln und Ansicht filtern (Priority: P3)

**Goal**: Let users switch among available years and present sport filters only for categories present in the imported dataset, including `Other`.

**Independent Test**: With two years and Run/Bike/Other activities, selecting a year or filter rebuilds only the matching cells and details; a filter with no qualifying activities shows the full grid and empty state.

### Tests for User Story 3

- [X] T019 [P] [US3] Add filter tests in `__tests__/training-calendar-utils.test.js` for year selection, `All`/Run/Bike/Swim/Other filtering, available-sport discovery, unknown-sport mapping to `Other`, and no-activity results.
- [X] T020 [P] [US3] Extend `__tests__/tab-navigation.test.js` and `__tests__/index-script-syntax.test.js` for year selector, dynamic sport filter controls, rerender handlers, and explicit empty-state behavior.

### Implementation for User Story 3

- [X] T021 [US3] Extend `src/training-calendar-utils.js` with filtered model construction for selected year/sport, available sport discovery, and `Other` mapping without changing source activity sport values.
- [X] T022 [US3] Add `trainingCalendarYearSelect` and `trainingCalendarSportFilters` controls to `index.html`, including accessible labels and stable IDs from the UI contract.
- [X] T023 [US3] Implement year/filter state, control visibility, selection handlers, and rerendering in `src/dashboard-training-calendar.js`, including the full-grid empty state when no qualifying activities remain.
- [X] T024 [US3] Initialize calendar controls after dataset import in `src/dashboard-import.js` and keep the selected latest year/`All` state consistent when a new dataset replaces the old one.

**Checkpoint**: All three user stories are independently functional and filters never silently reclassify source sports.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify performance, accessibility, responsive behavior, privacy boundaries, and complete the documented validation path.

- [X] T025 [P] Add responsive and focus-visible styling for `trainingCalendarGrid` and day controls in `index.html`, preserving alignment and horizontal reachability on narrow viewports.
- [X] T026 [P] Add performance assertions in `__tests__/training-calendar-utils.test.js` for 10,000 synthetic activities: initial calendar-model construction MUST complete within 2 seconds and a year/filter rebuild MUST complete within 1 second on the local test machine.
- [X] T027 [P] Extend `__tests__/index-script-syntax.test.js` to assert no calendar renderer sends data to external services and that the utility script precedes the dashboard renderer.
- [X] T028 Run the focused command `npm test -- training-calendar tab-navigation index-script-syntax` and resolve feature regressions in `__tests__/training-calendar-utils.test.js`, `__tests__/tab-navigation.test.js`, and `__tests__/index-script-syntax.test.js`.
- [X] T029 Run the full root suite with `npm test -- --runInBand` and resolve only regressions caused by the Training Calendar files in `src/`, `index.html`, or `__tests__/`.
- [X] T030 Execute every manual scenario in `specs/036-training-calendar/quickstart.md` with `python -m http.server`, including timing the initial calendar render and year change against SC-001 and SC-003, and record the result in the implementation review.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T001-T003 can run in parallel.
- **Foundational (Phase 2)**: Depends on Phase 1; T004-T006 can run in parallel, then T007 depends on tab IDs and panel markup.
- **User Story 1 (Phase 3)**: Depends on Phase 2; T008-T009 can run in parallel, then T010-T012 implement the MVP, with T013 validating the integration.
- **User Story 2 (Phase 4)**: Depends on the US1 model and grid; T014-T015 can run in parallel, then T016-T018 complete details.
- **User Story 3 (Phase 5)**: Depends on the US1 model and US2 details; T019-T020 can run in parallel, then T021-T024 complete filtering and import reset behavior.
- **Polish (Phase 6)**: Depends on the desired user stories; T025-T027 can run in parallel before T028-T030.

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 and is the MVP; no dependency on US2 or US3.
- **US2 (P2)**: Depends on the US1 grid/model but is independently testable once its detail fields are present.
- **US3 (P3)**: Depends on the US1 model and US2 detail state so filter changes update both cells and details.

### Parallel Opportunities

- **Setup**: T001, T002, and T003 touch separate files and can run in parallel.
- **Foundation**: T004, T005, and T006 can be developed in parallel; T007 integrates them.
- **US1**: T008 and T009 are parallel tests; T010 and T011 can then proceed in parallel before T012 integration.
- **US2**: T014 and T015 are parallel tests; T016 and T017 can proceed in parallel before T018 wiring.
- **US3**: T019 and T020 are parallel tests; T021 and T022 can proceed in parallel before T023/T024 integration.
- **Polish**: T025, T026, and T027 can proceed in parallel.

## Parallel Example: User Story 1

```text
Task: "Add calendar model tests in __tests__/training-calendar-utils.test.js"
Task: "Add calendar grid markup and legend in index.html"
```

## Parallel Example: User Story 2

```text
Task: "Add Training Day aggregation tests in __tests__/training-calendar-utils.test.js"
Task: "Add trainingCalendarDetails markup in index.html"
```

## Parallel Example: User Story 3

```text
Task: "Add year and sport filter tests in __tests__/training-calendar-utils.test.js"
Task: "Add trainingCalendarYearSelect and trainingCalendarSportFilters in index.html"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup and Phase 2 tab foundation.
2. Implement US1 utility tests and model.
3. Add the static calendar grid, legend, empty state, and renderer.
4. Run `npm test -- training-calendar tab-navigation index-script-syntax`.
5. Validate the US1 scenarios in `quickstart.md` before adding details or filters.

### Incremental Delivery

1. Deliver US1 as the usable full-year heatmap MVP.
2. Add US2 day details and keyboard/focus behavior.
3. Add US3 year and sport filtering, including `Other`.
4. Complete cross-cutting accessibility, performance, and full-suite validation.

## Notes

- `[P]` tasks touch different files and have no dependency on incomplete work.
- Utility constraints from `data-model.md` are quoted in the relevant tasks: local `YYYY-MM-DD` keys, 365/366 real days, non-negative numeric totals, nullable unavailable metrics, and `Other` as an explicit view category.
- Do not add `services/api` tasks; this feature is local-only and must not expand the API boundary.
