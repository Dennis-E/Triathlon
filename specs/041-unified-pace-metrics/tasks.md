---

description: "Task list for the Unified Pace versus Metrics Visualization"
---

# Tasks: Unified Pace versus Metrics Visualization

**Input**: Design documents from `/specs/041-unified-pace-metrics/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [pace-metrics-ui.md](contracts/pace-metrics-ui.md), and [quickstart.md](quickstart.md)

**Tests**: Jest tasks are included because the constitution requires focused verification for reusable modules and dashboard behavior.

**Organization**: Tasks are grouped by user story; shared migration work is completed before each independently testable delivery phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel when its dependency is complete and it changes a different file.
- **[Story]**: User story served by the task.
- Every task includes its exact target path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the exact migration surfaces before changing the two existing visualizations.

- [X] T001 Review the current scatter, cadence, export, preview, and script-load integration points in `src/dashboard-scatter.js`, `src/dashboard-cadence-scatter.js`, `src/dashboard-export.js`, `src/export-utils.js`, `index.html`, and `specs/022-modularize-inline-script/contracts/script-load-order.md`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Provide one pure, dual-target point model and shared metric definitions. All user stories depend on this phase.

- [X] T002 [P] Add generic point-model coverage in `__tests__/scatter-utils.test.js` for metric keys `heartRate`, `cadence`, `elevationGain`, and `distance`; quote the qualification rule: "both its y metric and performance value are finite and positive".
- [X] T003 [P] Extend `__tests__/scatter-utils.test.js` with selected-sport-only cases for Run, Bike, and Swim, ensuring `All` produces no shared PaceMetricPoint set and Run-only `totalSteps` remain cadence details.
- [X] T004 Implement a dual-target metric definition and `getPaceMetricPoints(activities, { sport, metric, minDate, maxDate })` in `src/scatter-utils.js`; a point must use sport exactly `Run`, `Bike`, or `Swim`, derive x through `getSportPerformanceMetric`, and expose `totalSteps` only when metric is cadence and sport is Run.
- [X] T005 Update or retire superseded `getHeartratePacePoints`, `getCadencePacePoints`, and `getAvailableCadenceSports` callers and exports in `src/scatter-utils.js` so all active dashboard code uses the generic PaceMetricPoint path.
- [X] T006 Run `npm test -- --runInBand __tests__/scatter-utils.test.js` and resolve foundational point-model failures in `src/scatter-utils.js`.

**Checkpoint**: The reusable module selects valid metric points for exactly one sport and remains usable in Node and the browser.

---

## Phase 3: User Story 1 - Eine Pace-Metrik vergleichen (Priority: P1) MVP

**Goal**: One Pace vs ... tab replaces the two prior tabs and displays Heart rate, Cadence, Elevation gain, or Distance for one selected sport.

**Independent Test**: Import qualifying Run, Bike, and Swim activities; for each sport and metric, exactly qualifying activities appear with the correct axis and tooltip labels, and no All Sports control exists.

- [X] T007 [P] [US1] Update `__tests__/tab-navigation.test.js` to replace `heartratePace` and `cadencePace` mock IDs and keyboard order with one `paceMetrics` tab, panel, focus state, and ARIA state.
- [X] T008 [P] [US1] Update `__tests__/index-script-syntax.test.js` to expect only the Pace vs ... tab/panel/renderer and to exclude `dashboard-cadence-scatter.js` from the dashboard script list.
- [X] T009 [US1] Replace the two tab keys with `paceMetrics` in `src/tab-navigation.js`; update `TAB_ORDER`, button/panel ID maps, active classes, panel visibility, and focus routing.
- [X] T010 [US1] Generalize `src/dashboard-scatter.js` into the unified Pace vs ... renderer: preserve the date range, require selected sport Run/Bike/Swim, add Heart rate/Cadence/Elevation gain/Distance metric selection, call `getPaceMetricPoints`, and label axes/tooltips per `specs/041-unified-pace-metrics/contracts/pace-metrics-ui.md`.
- [X] T011 [US1] Replace the two pace-tab buttons and panels with `vizTabPaceMetrics` / `vizPanelPaceMetrics` in `index.html`, containing ordered Sport, Metric, date-range, chart, and empty-state surfaces; omit All Sports and remove the separate Cadence panel.
- [X] T012 [US1] Update render dispatch, import initialization, landing navigation, and active-tab mapping for `paceMetrics` in `src/dashboard-tabs.js` and `src/dashboard-import.js`.
- [X] T013 [US1] Remove `src/dashboard-cadence-scatter.js` and its script tag from `index.html`; update `specs/022-modularize-inline-script/contracts/script-load-order.md` to remove it while keeping `dashboard-scatter.js` in the chart-domain rule.
- [X] T014 [US1] Run `npm test -- --runInBand __tests__/scatter-utils.test.js __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js` and resolve User Story 1 regressions in the affected files.

**Checkpoint**: The dashboard has exactly one Pace vs ... tab with four metric filters and a single-sport selector.

---

## Phase 4: User Story 2 - Jahre und Trendlinien steuern (Priority: P2)

**Goal**: Athletes can independently control visible years and trend lines for any selected Pace vs ... metric.

**Independent Test**: With qualifying points from two years, disabling one year hides only that year’s bubbles and line; disabling trend lines keeps all enabled bubbles visible.

- [X] T015 [P] [US2] Generalize year grouping and visibility assertions in `__tests__/heartrate-pace-visualization.test.js` to use `getPaceMetricPoints` and verify each metric, a one-point year without a line, and independent bubble/trend visibility.
- [X] T016 [US2] Generalize year checkbox and trend-line control state in `src/dashboard-scatter.js`: intersect prior `enabledYears` with current years, enable newly present years, list every year with points, and create line datasets only for years with at least two points.
- [X] T017 [US2] Run `npm test -- --runInBand __tests__/heartrate-pace-visualization.test.js __tests__/scatter-utils.test.js` and resolve year or trend-line regressions in `src/dashboard-scatter.js` and `src/scatter-utils.js`.

**Checkpoint**: Year checkboxes and Trend lines work for Heart rate, Cadence, Elevation gain, and Distance without altering selected point visibility unexpectedly.

---

## Phase 5: User Story 3 - Unverfuegbare Metriken klar behandeln (Priority: P3)

**Goal**: A missing measurement shows a clear empty state while other metric filters remain usable, and old tabs no longer remain reachable.

**Independent Test**: Import activities without cadence, select Cadence, verify the empty state; choose Heart rate, Elevation gain, or Distance and verify their qualifying chart remains accessible.

- [X] T018 [P] [US3] Add missing-metric, sport-specific cadence-label, and removed-tab UI assertions in `__tests__/index-script-syntax.test.js` and `__tests__/scatter-utils.test.js`.
- [X] T019 [US3] Update `src/dashboard-scatter.js` and the Pace vs ... markup in `index.html` so an empty active sport/metric/date combination hides the canvas, explains the missing valid measurement, and retains all metric controls.
- [X] T020 [US3] Update landing preview metadata and preview-card routing in `index.html` and `__tests__/preview-assets.test.js` from `heartratePace` to `paceMetrics`, reusing the existing preview image unless a dedicated asset is provided.
- [X] T021 [US3] Run `npm test -- --runInBand __tests__/scatter-utils.test.js __tests__/index-script-syntax.test.js __tests__/preview-assets.test.js` and resolve unavailable-metric and removed-tab regressions.

**Checkpoint**: Missing values explain themselves and the previous standalone tabs are absent from dashboard and landing navigation.

---

## Phase 6: Polish and Cross-Cutting Concerns

**Purpose**: Migrate existing export behavior, update related contracts, and execute full verification.

- [X] T022 [P] Update `__tests__/export-utils.test.js` so `paceMetrics` replaces `heartratePace` for tab display title, filename slug, export target, available controls, and legend metadata.
- [X] T023 [P] Update `__tests__/legal-footer.test.js` to replace the old pace-panel reference with `vizPanelPaceMetrics` in its dashboard surface inventory.
- [X] T024 Update `src/export-utils.js` and `src/dashboard-export.js` to migrate the existing heart-rate export to `paceMetrics`, using the Pace vs ... capture target and active Sport, Metric, and Date range in export context; remove obsolete heart-rate tab keys.
- [X] T025 Run `npm test -- --runInBand __tests__/processing.test.js __tests__/export-utils.test.js __tests__/legal-footer.test.js __tests__/index-script-syntax.test.js` and fix parser, export, and dashboard-surface regressions.
- [X] T026 Serve `index.html` with `python -m http.server` and execute every scenario in `specs/041-unified-pace-metrics/quickstart.md`, including all four metrics, all three sports, year/trend controls, empty state, export, keyboard navigation, local-data boundary, and under-one-second rendering for 3,000 activities.
- [ ] T027 Conduct and document a moderated usability check in `specs/041-unified-pace-metrics/quickstart.md` with participants attempting to select one of the four metrics and read a related point within 15 seconds; record whether at least 95 % succeed.
- [X] T028 Run `npm test -- --runInBand` from the repository root and record unrelated pre-existing failures separately from feature results in `specs/041-unified-pace-metrics/quickstart.md`.

---

## Dependencies and Execution Order

```text
Phase 1: Setup
    |
Phase 2: Generic PaceMetricPoint model
    |
    +--> US1 (P1, unified tab) --> US2 (P2, years/trends) --> US3 (P3, empty states/removal)
                                                                    |
                                                               Export and final validation
```

- All user stories require the generic point model from Phase 2.
- US1 introduces the unified tab shell and is the MVP.
- US2 extends the US1 renderer with existing-year control behavior.
- US3 depends on the US1 controls and completes the removal of old user-facing routes.
- Export migration and final validation start after all desired stories are complete.

## Parallel Opportunities

### Foundational Phase

- T002 and T003 modify independent test cases and can be drafted in parallel before T004.

### User Story 1

- T007 and T008 modify independent test files and can run in parallel.
- T010 and T011 must follow T004 but can be prepared independently before T012 wires import and dispatch.

### User Story 2

- T015 can be prepared while the unified renderer from US1 is being finalized; T016 follows US1 and T015.

### User Story 3

- T018 and T020 modify separate tests/surfaces and can run in parallel after the Pace vs ... panel exists.

### Polish

- T022 and T023 modify independent test files and can run in parallel before T024.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T006 to establish a generic qualified point model.
2. Complete T007-T014 to replace both tabs with Pace vs ..., require one sport, and provide all four metrics.
3. Verify all selected sport/metric combinations with focused tests before adding year refinements.

### Incremental Delivery

1. Deliver year checkboxes and independent Trend lines through T015-T017.
2. Deliver robust missing-metric behavior and remove obsolete entry points through T018-T021.
3. Migrate export and finish parser, browser, moderated-usability, and full-regression validation through T022-T028.