---

description: "Executable task list for Training Calendar Transparency and Export"
---

# Tasks: Training Calendar Transparency and Export

**Input**: Design documents from `/specs/039-calendar-export/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/training-calendar-export-ui.md](contracts/training-calendar-export-ui.md), [quickstart.md](quickstart.md)

**Tests**: Included because the repository constitution requires focused calendar, export, and static-script validation.

**Organization**: Tasks are grouped by user story while preserving the existing Training Calendar tab and branded export workflow.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable when it touches a different file and has no dependency on incomplete work.
- **[Story]**: Maps a task to a user story from `spec.md`.
- Every task includes an exact repository file path.

## Path Conventions

Single static-browser project: `src/`, `__tests__/`, and `index.html` at repository root.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish failing contracts for transparent cells and the calendar export target.

- [X] T001 [P] Add transparent empty-cell and calendar-export test scaffolding in `__tests__/training-calendar-utils.test.js` and `__tests__/export-utils.test.js` with synthetic multi-year data.
- [X] T002 [P] Add static UI contract assertions in `__tests__/index-script-syntax.test.js` for the calendar export button, `trainingCalendarYears` capture target, and approximately 50% empty-cell styling.
- [X] T003 [P] Add export contract assertions in `__tests__/index-script-syntax.test.js` for active palette/sport context, tooltip exclusion, no-data handling, and the `trainingCalendar` target registration.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define transparent-cell and export-target contracts before story implementation.

**CRITICAL**: Complete this phase before implementing user stories.

- [X] T004 [P] Define the shared `rgba(241,245,249,0.5)` empty-cell token in `src/training-calendar-utils.js` and preserve opaque active palette colors.
- [X] T005 [P] Extend `src/export-utils.js` with `trainingCalendar` display title, filename slug, export target support, and filter/context metadata helpers.
- [X] T006 [P] Add utility tests in `__tests__/training-calendar-utils.test.js` for exact `rgba(241,245,249,0.5)` palette-independent empty cells in Green, Blue, and Fire.
- [X] T007 [P] Add export utility tests in `__tests__/export-utils.test.js` for `trainingCalendar` title, slug, target metadata, and active palette/sport filter summaries.
- [X] T008 Add the Training Calendar header export button and export-safe calendar wrapper identifiers in `index.html`, preserving responsive layout and existing palette/sport controls.

**Checkpoint**: The calendar exposes transparent-cell and export-target contracts while the existing export pipeline remains unchanged for other tabs.

## Phase 3: User Story 1 - Ruhetage dezent darstellen (Priority: P1) MVP

**Goal**: Make empty days approximately 50% transparent in the normal view and export-safe across all palettes.

**Independent Test**: With active and empty days visible, Green, Blue, and Fire each show transparent empty cells while active cells remain opaque and distinguishable.

### Tests for User Story 1

- [X] T009 [P] [US1] Add renderer contract assertions in `__tests__/index-script-syntax.test.js` that empty cells use the shared transparent token and active cells use opaque palette colors.
- [X] T010 [P] [US1] Add visual-token tests in `__tests__/training-calendar-utils.test.js` for empty-cell alpha behavior and palette independence.

### Implementation for User Story 1

- [X] T011 [US1] Update `src/training-calendar-utils.js` to expose the shared transparent empty-cell token and preserve active Green/Blue/Fire palette levels.
- [X] T012 [US1] Update `src/dashboard-training-calendar.js` cell and legend rendering so empty cells use approximately 50% transparency in every palette and active cells remain opaque.
- [X] T013 [US1] Add export-safe CSS/inline styling in `index.html` so `rgba(241,245,249,0.5)` empty cells remain background-near but visible in normal and captured calendar content.

**Checkpoint**: User Story 1 is independently demonstrable as the MVP.

## Phase 4: User Story 2 - Kalenderansicht exportieren (Priority: P1)

**Goal**: Export the full multi-year calendar with current palette and sport filter, without tooltip overlays.

**Independent Test**: With at least three years of data, clicking the calendar export button produces a preview/download containing all year blocks in order and the current palette/filter context.

### Tests for User Story 2

- [X] T014 [P] [US2] Extend `__tests__/export-utils.test.js` for `trainingCalendar` target creation, full-container target ID, filename generation, and no-data target blocking.
- [X] T015 [P] [US2] Extend `__tests__/index-script-syntax.test.js` for export button wiring, `exportVisualizationTab('trainingCalendar')`, full multi-year capture target, palette/sport context, and tooltip exclusion hooks.
- [X] T016 [P] [US2] Add integration assertions in `__tests__/integration.test.js` or the narrowest existing export test surface for multi-year export metadata and preservation of selected filters.

### Implementation for User Story 2

- [X] T017 [US2] Register `trainingCalendar` in `EXPORT_CAPTURE_TARGET_IDS`, exportable flags, target title/slug, and `getExportContext` in `src/dashboard-export.js`, using `trainingCalendarYears` as the complete capture target.
- [X] T018 [US2] Add palette and sport controls to the Training Calendar export context and available-control summary in `src/dashboard-export.js`.
- [X] T019 [US2] Implement tooltip hide/restore around capture in `src/dashboard-export.js` or `src/dashboard-training-calendar.js`, ensuring no tooltip overlay enters the image and the original UI state returns afterward.
- [X] T020 [US2] Wire the header button in `index.html` to the existing branded preview-then-download workflow and ensure the full YearBlock container is not viewport-clipped during capture.
- [X] T021 [US2] Add no-data and capture-failure handling for the calendar target in `src/dashboard-export.js`, preserving the calendar, selected palette, sport filter, and year blocks on failure.

**Checkpoint**: User Stories 1 and 2 are independently validated; the full calendar export preserves context and excludes transient tooltip layers.

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validate responsive access, full-height capture, transparency, privacy, and regressions.

- [X] T022 [P] Add responsive styling in `index.html` for the calendar export button and full multi-year wrapper on narrow screens.
- [X] T023 [P] Add full-height capture contract assertions in `__tests__/index-script-syntax.test.js` for up to ten year blocks and preserved empty years.
- [X] T024 [P] Add local-only renderer assertions in `__tests__/index-script-syntax.test.js` confirming no new network calls and no raw activity export outside visible calendar content.
- [X] T025 [P] Add performance coverage in `__tests__/export-utils.test.js` or the existing export test surface for preparing a ten-year calendar export target within the existing interaction budget.
- [X] T026 Run the focused command `npm test -- training-calendar-utils export-utils index-script-syntax --runInBand` and resolve regressions in `src/export-utils.js`, `src/dashboard-export.js`, `src/dashboard-training-calendar.js`, `index.html`, and the touched tests.
- [X] T027 Run the full root suite with `npm test -- --runInBand` and resolve only regressions caused by the calendar export changes in `src/export-utils.js`, `src/dashboard-export.js`, `src/dashboard-training-calendar.js`, `src/training-calendar-utils.js`, `index.html`, and `__tests__/`.
- [X] T028 Execute all manual scenarios in `specs/039-calendar-export/quickstart.md` with `python -m http.server`, including desktop/narrow viewport export, preview-then-download, ten-year full-height capture, and tooltip exclusion checks.
- [X] T029 Add a browser smoke test in `specs/039-calendar-export/quickstart.md` or the documented browser harness for ten synthetic YearBlocks, proving the preview capture includes all blocks without clipping and a failed capture restores palette, sport filter, and year-block state.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T003 can run in parallel.
- **Foundation (Phase 2)**: Depends on Setup; T004-T007 can run in parallel, then T008 adds the UI control.
- **US1 (Phase 3)**: Depends on transparent-cell foundation; T009-T010 can run in parallel before T011-T013.
- **US2 (Phase 4)**: Depends on export metadata and calendar markup; T014-T016 can run in parallel before T017-T021.
- **Polish (Phase 5)**: Depends on both stories; T022-T025 can run in parallel before T026-T028.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundation and is the MVP.
- **US2 (P1)**: Depends on the complete multi-year calendar container from the existing implementation and Foundation export metadata.

### Parallel Opportunities

- Setup: T001, T002, T003.
- Foundation: T004, T005, T006, T007.
- US1 tests: T009, T010.
- US2 tests: T014, T015, T016.
- Polish: T022, T023, T024, T025.

## Parallel Example: User Story 1

```text
Task: "Add transparent-cell utility tests in __tests__/training-calendar-utils.test.js"
Task: "Add transparent-cell renderer contracts in __tests__/index-script-syntax.test.js"
```

## Parallel Example: User Story 2

```text
Task: "Add calendar export utility tests in __tests__/export-utils.test.js"
Task: "Add calendar export markup/dispatch contracts in __tests__/index-script-syntax.test.js"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundation.
2. Apply approximately 50% transparent empty-cell styling across all palettes.
3. Run the focused calendar tests and verify the visual hierarchy manually.
4. Stop at the US1 checkpoint before adding export integration.

### Incremental Delivery

1. Deliver transparent rest-day styling.
2. Register and wire the calendar export target.
3. Add palette/filter metadata and tooltip exclusion.
4. Validate full-height, responsive, error, and full-suite behavior.

## Notes

- `[P]` marks tasks that can touch different files without waiting on incomplete work.
- Reuse the existing `trainingCalendar` tab and branded export workflow; no tab-navigation changes are required.
- The export target must be `trainingCalendarYears`, not an individual year grid or viewport-only wrapper.
- Do not add `services/api` tasks or external dependencies.
