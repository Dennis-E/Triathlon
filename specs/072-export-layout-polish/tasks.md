# Tasks: Export Layout Polish

**Input**: Design documents from `specs/072-export-layout-polish/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/export-layout.md`, `quickstart.md`

**Tests**: Focused tests are included because the project constitution requires narrow verification for dashboard and reusable module changes.

**Organization**: Tasks are grouped by the three independently testable P1 user stories in `spec.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Tasks can run in parallel because they use different files and have no unfinished dependencies.
- **[Story]**: Maps a task to its user story in `spec.md`.
- Each task names the exact file path to change.

## Phase 1: Setup

**Purpose**: Project initialization and basic structure.

No setup tasks are required. The static browser application, root Jest suite, and export pipeline already exist.

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by all user stories.

No new shared infrastructure is required. Each story can begin independently; shared exporter changes should be integrated sequentially to avoid conflicts in `src/dashboard-export.js`.

## Phase 3: User Story 1 - Understand Export Context and Series (Priority: P1) - MVP

**Goal**: Give export filters clear spacing and make the pace-versus legend accurately describe visible year-colored bubbles.

**Independent Test**: Export with filter context and multiple pace-versus years; confirm adequate separation, no overlap, and exact matching of each visible year label to its bubble color.

### Tests for User Story 1

- [X] T001 [P] [US1] Add tests for visible year legend metadata, hidden years, empty series, and bubble colors in `__tests__/dashboard-scatter-years.test.js`.
- [X] T002 [P] [US1] Add export assertions that the filter summary follows whitespace below the branded header and precedes the visualization, with no overlap, plus year legend labels/colors in `__tests__/dashboard-export-download.test.js`.

### Implementation for User Story 1

- [X] T003 [US1] Expose read-only metadata for visible bubble datasets (year label and matching border color, excluding hidden or empty datasets and trend lines) from `src/dashboard-scatter.js`.
- [X] T004 [US1] Use visible pace-versus series metadata in the export target, replace the generic Measures legend, and compose the filter summary after whitespace below the branded header but before the visualization in `src/dashboard-export.js` and `src/export-utils.js`.

**Checkpoint**: The exported filter context is legible and every bubble series shown in Pace vs. has a matching year/color legend entry.

## Phase 4: User Story 2 - Use Visualization Space Efficiently (Priority: P1)

**Goal**: Use the export content area more fully for Distance, Heatmap, Distributions, and Workout Time without clipping meaningful content.

**Independent Test**: Export representative Distance, Distributions, Workout Time, and heatmap views; verify at least 85% plot-width use where the aspect ratio permits, complete labels/routes, no exported zoom controls, and unchanged live map controls.

### Tests for User Story 2

- [X] T005 [P] [US2] Add geometry tests for fitted export bounds and preserved aspect ratio, verifying at least 85% available width and height for Distance where the aspect ratio permits and at least 85% available width for Distributions and Workout Time in `__tests__/export-utils.test.js`.
- [X] T006 [P] [US2] Add capture tests proving Leaflet plus/minus controls are excluded from the export while live map controls remain unchanged in `__tests__/dashboard-export-download.test.js`.

### Implementation for User Story 2

- [X] T007 [US2] Implement and export a pure content-fit helper that keeps draw bounds inside the 1080 × 1080 image region, preserves source proportions, and supports the 85% plot-width target in `src/export-utils.js`.
- [X] T008 [US2] Apply export-only capture sizing and content fitting to Distance, Distributions, and Workout Time; use at least 85% of available plot width and height for Distance where aspect ratio permits and at least 85% of plot width for the other charts, preserving axes, ticks, proportions, and labels in `src/dashboard-export.js`.
- [X] T009 [US2] Temporarily resize and invalidate the Leaflet map for a 960×500 heatmap capture, restore its dimensions, center, and zoom in a `finally` path, and hide zoom controls only in the cloned capture in `src/dashboard-heatmap.js` and `src/dashboard-export.js`.

**Checkpoint**: These four export types use their available region more effectively and retain all meaningful chart/map content.

## Phase 5: User Story 3 - Read Detailed and Summary Exports (Priority: P1)

**Goal**: Enlarge selected PB details and pie charts, improve pie legend readability, and make exported KPI headings readable.

**Independent Test**: Export a PB detail such as Run 5 km, Pie Charts, and Lifetime Statistics; verify the PB chart uses at least 85% of its limiting content dimension without distortion, the pie summary headline is absent with larger chart/legend, and KPI labels/headings meet the export typography contract.

### Tests for User Story 3

- [X] T010 [P] [US3] Add assertions that the exported pie omits the activity-count summary, enlarges its chart, and uses at least 18px legend text while the dashboard summary remains unchanged in `__tests__/pie-charts-dashboard.test.js`.
- [X] T011 [P] [US3] Add export-mode assertions for KPI labels of at least 16px and section headings of at least 18px in `__tests__/lifetime-statistics-dashboard.test.js`.
- [X] T012 [P] [US3] Add PB detail export tests for at least 85% use of the limiting content dimension, preserved proportions, visible labels, and unchanged selected PB identity in `__tests__/dashboard-export-download.test.js`.

### Implementation for User Story 3

- [X] T013 [US3] Tighten the selected PB detail capture bounds and apply the PB content-fit profile without cropping or stretching its chart in the cloned `pbDetailCaptureTarget` in `src/dashboard-export.js`.
- [X] T014 [US3] In the cloned Pie Charts capture, omit `pieChartsSummary`, enlarge the chart into the freed space, and render the legend at 22px before fitting so it remains at least 18px in the final PNG, without changing the dashboard view in `src/dashboard-export.js`.
- [X] T015 [P] [US3] Render export-mode KPI labels at a minimum 16px and section headings at a minimum 18px while leaving non-export dashboard typography unchanged in `src/dashboard-lifetime-statistics.js`.

**Checkpoint**: PB, pie, and KPI exports are readable at normal preview size and the regular dashboard views retain their existing content.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate privacy, preview/download parity, and the combined export behavior.

- [X] T016 Update automated commands and expected browser checks to match the implemented story tests in `specs/072-export-layout-polish/quickstart.md`.
- [X] T017 Run the focused Jest command in `specs/072-export-layout-polish/quickstart.md` and resolve regressions in the touched source/test files.
- [X] T018 Complete all browser scenarios in `specs/072-export-layout-polish/quickstart.md`, including preview/download parity, unchanged dashboard state, complete labels/routes, and Network-panel confirmation that no activity data or generated image is sent in a request; distinguish independent analysis-counter traffic.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; the existing app and test infrastructure are used.
- **Foundational (Phase 2)**: No blocking tasks; all stories may begin independently.
- **User Stories (Phases 3-5)**: Each story is independently testable. For implementation, work in the listed order because the shared `src/dashboard-export.js` is touched by all three stories.
- **Polish (Phase 6)**: Depends on the desired user stories being implemented.

### User Story Dependencies

- **User Story 1 (P1)**: Independent; delivers filter/legend clarity and is the suggested MVP.
- **User Story 2 (P1)**: Independent; can be implemented without User Story 1 or 3, but shares the exporter file.
- **User Story 3 (P1)**: Independent; can be implemented without User Story 1 or 2, but shares the exporter file.

### Parallel Opportunities

- Within User Story 1, run T001 and T002 in parallel; both test files differ. Then implement T003 before T004.
- Within User Story 2, run T005 and T006 in parallel; complete both before T007-T009.
- Within User Story 3, run T010-T012 in parallel. T015 may run alongside T013/T014 after T011 passes because it changes a separate source file.
- User stories may be split across people after their tests are separated, but integrations in `src/dashboard-export.js` should be merged one story at a time.

## Parallel Example: User Story 1

```text
Task: T001 in __tests__/dashboard-scatter-years.test.js
Task: T002 in __tests__/dashboard-export-download.test.js
```

## Parallel Example: User Story 2

```text
Task: T005 in __tests__/export-utils.test.js
Task: T006 in __tests__/dashboard-export-download.test.js
```

## Parallel Example: User Story 3

```text
Task: T010 in __tests__/pie-charts-dashboard.test.js
Task: T011 in __tests__/lifetime-statistics-dashboard.test.js
Task: T012 in __tests__/dashboard-export-download.test.js
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Add and run T001-T002; confirm the new assertions fail for the current export.
2. Implement T003-T004 and rerun the focused tests.
3. Validate User Story 1 independently using its export scenario.

### Incremental Delivery

1. Deliver User Story 1 for filter spacing and correct year-series legend.
2. Add User Story 2 and validate chart/map area use and export-only zoom-control removal.
3. Add User Story 3 and validate PB, pie, and KPI readability independently.
4. Complete T016-T018 for cross-story preview/download and browser validation.

## Notes

- Every task uses the required checkbox, sequential ID, optional parallel marker, required story label for story phases, and an exact file path.
- Tests are scheduled before their corresponding implementation tasks to satisfy the project's narrowest-scope verification requirement.
- No API, dependency, persistent data, or dashboard-tab changes are planned.