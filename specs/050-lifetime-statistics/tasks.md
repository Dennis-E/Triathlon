---

description: "Actionable implementation tasks for Lifetime Statistics"
---

# Tasks: Lifetime Statistics

**Input**: Design documents from `specs/050-lifetime-statistics/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Test tasks are included because the feature changes imported data and dashboard behavior, and the project constitution requires focused tests for reusable modules, tabs, and Share/Export integration.

**Organization**: Tasks are grouped by the four prioritized user stories in the specification. All tasks use the prescribed checklist format and include implementation or test file paths.

## Phase 1: Setup

**Purpose**: Provide deterministic, private-data-free input for independent feature tests.

- [X] T001 Create shared synthetic activity factories and baseline cases in `__tests__/fixtures/lifetime-statistics.js`.

## Phase 2: Foundational

**Purpose**: Make source-value completeness testable while preserving the numeric fields consumed by existing visualizations. These prerequisites block all story aggregates.

- [X] T002 [P] Add runtime-import tests in `__tests__/dashboard-import.test.js` that execute `src/dashboard-import.js` with minimal browser-global stubs and verify missing, invalid, zero, and positive distance/time source values.
- [X] T003 [P] Extend `__tests__/processing.test.js` to verify matching availability behavior in `src/dashboard-utils.js` for missing, invalid, zero, and positive distance/time values.
- [X] T004 [P] Add `distanceAvailable` and `durationAvailable` to activities created by `src/dashboard-import.js`; each flag MUST be true only for a present, finite, non-negative source value (including `0`) while the existing numeric fields and defaults remain unchanged.
- [X] T005 [P] Mirror the additive `distanceAvailable` and `durationAvailable` fields in `src/dashboard-utils.js`, preserving its existing numeric values and matching the runtime flag rules.

**Checkpoint**: Both import paths expose additive, consistent availability metadata without changing existing numeric values.

## Phase 3: User Story 1 - Lifetime totals at a glance (Priority: P1) 🎯 MVP

**Goal**: Show total distance, moving time, workout count, and supported-sport totals, with an empty state and accurate metric completeness.

**Independent Test**: With synthetic processed activities, open the Lifetime Statistics tab and verify overall totals/count, Run/Bike/Swim rows, unknown-sport handling, missing-versus-zero status, and the no-import empty state.

- [X] T006 [P] [US1] Add unit cases to `__tests__/lifetime-statistics-utils.test.js` for overall distance/time/workout totals, per-sport rows, unknown sports, incomplete metrics, valid zeroes, empty input, and input immutability.
- [X] T007 [P] [US1] Add tab keyboard/selection cases to `__tests__/tab-navigation.test.js` and mocked-document summary/empty-state cases to `__tests__/lifetime-statistics-dashboard.test.js` before implementing the new tab.
- [X] T008 [P] [US1] Implement `aggregateLifetimeStatistics()` in `src/lifetime-statistics-utils.js` with CommonJS and `window.lifetimeStatisticsUtils` exports; return metric statuses exactly as `'complete'`, `'partial'`, or `'unavailable'`, count every processed record, and include unknown sports only in overall totals.
- [X] T009 [P] [US1] Register `lifetimeStatistics` order, button/panel IDs, active state, focus mapping, and keyboard cycling in `src/tab-navigation.js` and `src/dashboard-tabs.js`.
- [X] T010 [P] [US1] Add the accessible Lifetime Statistics button, panel shell, utility/renderer script tags, and dashboard script-order assertions in `index.html`, `__tests__/index-script-syntax.test.js`, and `specs/022-modularize-inline-script/contracts/script-load-order.md`.
- [X] T011 [P] [US1] Implement the core summary and no-import empty-state rendering in `src/dashboard-lifetime-statistics.js`, using the output from `src/lifetime-statistics-utils.js` and the IDs defined in `index.html`.

**Checkpoint**: US1 works independently; run the focused utility, dashboard, navigation, and script-order tests in `__tests__/lifetime-statistics-utils.test.js`, `__tests__/lifetime-statistics-dashboard.test.js`, `__tests__/tab-navigation.test.js`, and `__tests__/index-script-syntax.test.js`.

## Phase 4: User Story 2 - Explore lifetime milestones (Priority: P2)

**Goal**: Add recorded elevation, active-day count, and longest activity by distance and moving time.

**Independent Test**: Use a dataset with known elevations and dates (including repeated dates and missing values) and verify totals, completeness labels, longest-activity details, and unavailable states.

- [X] T012 [P] [US2] Extend `__tests__/lifetime-statistics-utils.test.js` with elevation coverage, unique local calendar days, longest-distance/time selection, deterministic ties, and no-valid-value cases.
- [X] T013 [P] [US2] Extend `__tests__/lifetime-statistics-dashboard.test.js` with milestone rendering assertions for complete, partial, and unavailable source values.
- [X] T014 [P] [US2] Extend `aggregateLifetimeStatistics()` in `src/lifetime-statistics-utils.js` to compute elevation `MetricResult`, distinct local date count, and longest-distance/time activities; ignore values that are non-finite, negative, null, or explicitly unavailable.
- [X] T015 [P] [US2] Render elevation, active-day, longest-distance, and longest-moving-time milestone cards in `src/dashboard-lifetime-statistics.js`, showing recorded/incomplete or unavailable states without presenting missing data as zero.

**Checkpoint**: US2 remains testable on the US1 tab and does not change core totals.

## Phase 5: User Story 3 - Understand equipment history (Priority: P2)

**Goal**: Show counts of distinct Run gear labels as shoes used and Bike gear labels as bikes used; do not display equipment names.

**Independent Test**: Provide repeated, distinct, blank and placeholder Run/Bike gear values; verify separate counts and confirm equipment names are not displayed.

- [X] T016 [US3] Add unit and rendered-view cases in `__tests__/lifetime-statistics-utils.test.js` and `__tests__/lifetime-statistics-dashboard.test.js` for distinct Run/Bike gear counts, trimmed exact-name deduplication, placeholder exclusion and hiding names.
- [X] T017 [P] [US3] Count distinct trimmed Run gear labels as shoes used and Bike gear labels as bikes used in `src/lifetime-statistics-utils.js`; ignore blank labels and case-insensitive `-`, `none`, `unknown`, and `n/a`, and return counts only.
- [X] T018 [P] [US3] Render total shoes-used and bikes-used counts in `src/dashboard-lifetime-statistics.js` without displaying equipment labels.

**Checkpoint**: US3 is independently verifiable with synthetic Bike and non-Bike records and leaves other metrics unchanged.

## Phase 6: User Story 4 - Share the lifetime overview (Priority: P2)

**Goal**: Export the currently displayed lifetime summary through the established local preview/download flow, with standard no-data behavior.

**Independent Test**: With imported synthetic data, export and verify the capture includes totals, sport breakdown, milestones, and equipment; with no data, verify export is blocked by the existing no-data behavior.

- [X] T019 [US4] Add export title, filename-slug, capture-target, exportability, and no-data assertions in `__tests__/export-utils.test.js`, `__tests__/index-script-syntax.test.js`, and `__tests__/lifetime-statistics-dashboard.test.js` before wiring export.
- [X] T020 [P] [US4] Register the `lifetimeStatistics` display title and filename slug in `src/export-utils.js`, and capture target, data flag, view ID, and export context in `src/dashboard-export.js`.
- [X] T021 [P] [US4] Add the “Export for Insta / Strava” action to the Lifetime Statistics panel in `index.html` and connect it to `exportVisualizationTab('lifetimeStatistics')`.

**Checkpoint**: US4 uses the shared local preview/download flow and exports the visible lifetime data without adding a new network request.

## Phase 7: Polish & Cross-Cutting Validation

**Purpose**: Validate the completed feature across stories and viewports.

- [X] T022 Create `scripts/benchmark-lifetime-statistics.js` using 5,000 synthetic normalized activities; warm up the aggregation, measure repeated runs, report the median, and report whether it is under the 1-second target without adding timing assertions to Jest.
- [X] T023 Run the focused Jest commands and complete `npm test` from the repository root as documented in `specs/050-lifetime-statistics/quickstart.md`; validate static-server rendering, responsive layout, keyboard navigation, data/no-data export behavior, and the benchmark.
- [ ] T024 Conduct the five-person 30-second first-time usability review in `specs/050-lifetime-statistics/quickstart.md` and record whether at least four reviewers find total distance, moving time, and workout count without assistance.

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: T001 creates the shared synthetic fixture and blocks all feature test tasks.
- **Foundational (Phase 2)**: T002 and T003 can run in parallel after T001; T004 and T005 can run in parallel after their respective tests. Both parser paths must expose availability flags before story aggregation work.
- **US1 (Phase 3)**: Depends on Setup and Foundational. It creates the shared tab and base summary required by later stories.
- **US2 (Phase 4)**: Depends on US1 because it extends the same summary model and renderer.
- **US3 (Phase 5)**: Depends on US1 and US2 because it extends the same summary utility and view.
- **US4 (Phase 6)**: Depends on the completed visible summary (US1–US3) so the capture includes every lifetime section.
- **Polish (Phase 7)**: Depends on all desired stories being complete.

### User story dependencies

```text
Setup → Foundational → US1 (P1) → US2 (P2) → US3 (P2) → US4 (P2) → Polish
```

The story implementations extend shared utility and dashboard files, so this sequence avoids concurrent edits to the same files. Each story checkpoint remains independently testable once its prerequisites are complete.

### Parallel opportunities

- **Foundational**: T002 and T003 target separate parser test files; T004 and T005 target separate parser implementation files after tests pass.
- **US1**: T006 and T007 can be authored together; after those tests are in place, T008 and T009 can proceed in parallel. T010 (HTML shell/script order) and T011 (renderer implementation) can proceed in parallel once utility and tab contracts are known.
- **US2**: T012 and T013 are separate test files and can be prepared together. T014 (utility) and T015 (renderer) can proceed in parallel after the tests are ready.
- **US3**: T017 (aggregation) and T018 (rendering) touch separate files and can proceed in parallel after T016.
- **US4**: T019 is the test-first prerequisite; T020 (export registration) and T021 (HTML action) can proceed in parallel after it.

### Parallel example: User Story 1

```text
After T001–T005:
- T006: add aggregation tests in __tests__/lifetime-statistics-utils.test.js
- T007: add navigation and dashboard tests in __tests__/tab-navigation.test.js and __tests__/lifetime-statistics-dashboard.test.js

After both tests are ready:
- T008: implement src/lifetime-statistics-utils.js
- T009: register tab state and dispatch in src/tab-navigation.js and src/dashboard-tabs.js

After T008 and T009:
- T010: add the panel and script wiring in index.html
- T011: implement src/dashboard-lifetime-statistics.js
```

### Parallel example: User Story 2

```text
Prepare milestone tests together:
- T012: add calculation tests in __tests__/lifetime-statistics-utils.test.js
- T013: add render tests in __tests__/lifetime-statistics-dashboard.test.js

After both test tasks:
- T014: add milestone aggregation in src/lifetime-statistics-utils.js
- T015: add milestone cards in src/dashboard-lifetime-statistics.js
```

### Parallel example: User Story 3

```text
After T016's equipment tests:
- T017: compute unique shoes/bikes counts in src/lifetime-statistics-utils.js
- T018: render shoes/bikes totals only in src/dashboard-lifetime-statistics.js
```

### Parallel example: User Story 4

```text
After T019's export tests:
- T020: register export metadata/target in src/export-utils.js and src/dashboard-export.js
- T021: add the export action in index.html
```

## Implementation Strategy

### MVP first (User Story 1)

1. Create deterministic synthetic fixtures and add the source-availability metadata without changing existing numeric values.
2. Implement and test the base aggregation for total distance, moving time, workout count, and sport breakdown.
3. Add the accessible tab, core summary, and empty state.
4. Stop and validate US1 independently using its checkpoint before adding later cards.

### Incremental delivery

1. Deliver US1 as the base lifetime summary.
2. Add US2 milestones and their incomplete/unavailable states.
3. Add US3 shoes-used and bikes-used totals without equipment names.
4. Add US4 Share/Export integration for the complete summary.
5. Complete all documented automated and manual quickstart checks before considering the feature done.

The final feature release includes all four stories; MVP-only US1 is a development checkpoint, not a justification to ship a new visualization without its required Share/Export action.
