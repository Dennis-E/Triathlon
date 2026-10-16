---

description: "Task list for data-source-aware visualization availability"
---

# Tasks: Data-Source-Aware Visualizations

**Input**: Design documents from `/specs/060-data-source-availability/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/visualization-availability.md`, and `quickstart.md`

**Tests**: Focused tests are included because dashboard behavior and tab navigation are governed by the project constitution. Use synthetic data only.

**Organization**: Tasks are grouped by the three prioritized user stories. Each story has an independent validation target after shared navigation foundations are complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because the task works in different files and has no incomplete dependency.
- **[Story]**: Maps a task to a user story from `spec.md`.
- Every task includes the relevant repository file path.

## Path Conventions

This is the existing static browser application: reusable helpers live under `src/`, DOM orchestration and tab markup live in `src/dashboard-*.js` and `index.html`, and Jest tests live in `__tests__/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: The existing static app, Jest setup, and import pipelines are already initialized; no package or project setup changes are required.

No setup tasks.

---

## Phase 2: Foundational Navigation Behavior

**Purpose**: Make the existing navigation primitives capable of operating on an available subset before wiring view-specific readiness.

- [X] T001 Add tests for filtering canonical tabs, wrapping through only available tabs, rejecting unavailable selections, and handling an empty available list in `__tests__/tab-navigation.test.js`.
- [X] T002 Implement available-tab filtering and keyboard traversal while preserving the canonical tab order in `src/tab-navigation.js`.

**Checkpoint**: Dynamic available-tab navigation is independently tested and ready for dashboard integration.

---

## Phase 3: User Story 1 - See Only Supported Visualizations (Priority: P1) - MVP

**Goal**: Hide a visualization and its content when its model cannot produce meaningful output; keep supported views visible. Availability changes presentation only and never alters imported activity values.

**Independent Test**: Apply synthetic activities with no equipment data and with equipment data. Verify equipment tabs and panels are hidden only in the first case, unrelated supported tabs remain available, and activity records and values are unchanged.

### Tests for User Story 1

- [X] T003 [P] [US1] Add no-data and renderable-data cases for all 12 views in `__tests__/visualization-availability.test.js` and total-distance date/sport validation in `__tests__/dashboard-core.test.js`.

### Implementation for User Story 1

- [X] T004 [US1] Implement read-only, view-specific readiness from existing model output in `src/visualization-availability.js` and validate total-distance data in `src/dashboard-core.js`.
- [X] T005 [US1] Recompute readiness after import and synchronize tab visibility, panels, selection fallback, keyboard navigation, and the no-views state in `src/dashboard-state.js`, `src/dashboard-import.js`, `src/dashboard-tabs.js`, `src/tab-navigation.js`, and `index.html`.

**Checkpoint**: No visualization without meaningful data is offered or displayed; imported activities remain untouched.

---

## Phase 4: User Story 2 - Respect Source-Specific Data Availability (Priority: P2)

**Goal**: Apply identical readiness rules to separate Strava and TrainingPeaks imports based on the actual normalized data, never on the source label alone.

**Independent Test**: Separately apply synthetic Strava-shaped and TrainingPeaks-shaped datasets with different field coverage. Verify each dataset exposes only views its own records can populate, and equivalent normalized records yield equivalent availability.

### Tests for User Story 2

- [X] T006 [US2] Add separate-source field-coverage and equivalent-data cases in `__tests__/visualization-availability.test.js` and `__tests__/dashboard-import.test.js`.

### Implementation for User Story 2

- [X] T007 [US2] Apply the same readiness resolver to each current import's normalized activities and GPS/FIT auxiliary maps without branching on `sourceLabel` in `src/dashboard-import.js` and `src/dashboard-tabs.js`.

**Checkpoint**: Each supported import format is evaluated from its own valid data, with no source-specific visibility assumption or cross-source merge workflow.

---

## Phase 5: User Story 3 - Keep Navigation Current After Importing (Priority: P3)

**Goal**: Recalculate availability after every completed import, move selection away from a newly unavailable tab, and preserve every imported activity and value.

**Independent Test**: Import synthetic dataset A that supports the selected view, snapshot its records, then import dataset B that does not. Verify the view becomes hidden, selection moves to an available view (or stable no-view state), and neither dataset's activity values were mutated by readiness evaluation.

### Tests for User Story 3

- [X] T008 [US3] Add successive-import data-integrity tests and available-tab fallback tests in `__tests__/dashboard-import.test.js` and `__tests__/tab-navigation.test.js`.

### Implementation for User Story 3

- [X] T009 [US3] Recompute tab availability after each successful `applyImportedDataset()` call and choose the first available canonical tab when the prior selection is unavailable in `src/dashboard-import.js` and `src/dashboard-tabs.js`; keep normalized activity arrays and values read-only for availability handling.

**Checkpoint**: Re-importing changes only dashboard availability and selection; it does not edit or delete imported activity data.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Keep tab markup and user-facing import documentation consistent with the visibility-only contract.

- [X] T010 [P] Add tab-markup regression coverage confirming the No-Views status and import refresh wiring in `__tests__/index-script-syntax.test.js`.
- [X] T011 Update the import behavior guide to explain that only visualization visibility changes and imported activity data remains unchanged in `docs/IMPORT_FEATURE.md`.
- [X] T012 Run the focused commands from `specs/060-data-source-availability/quickstart.md` and the full root Jest suite with `npm test` from the repository root (`package.json`); resolve regressions before completion.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No work required; repository infrastructure already exists.
- **Foundational (Phase 2)**: T001 precedes T002; both are required before user-story navigation integration.
- **User Stories (Phases 3-5)**: Each depends on Phase 2. Complete User Story 1 first because it introduces the readiness contract; then verify source parity (US2) and subsequent-import behavior/data integrity (US3).
- **Polish (Phase 6)**: Depends on all user stories; verify tab wiring and document the visibility-only behavior.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; establishes model readiness and visible-tab behavior. MVP scope.
- **US2 (P2)**: Depends on US1's source-agnostic readiness contract; verifies separate Strava and TrainingPeaks input paths.
- **US3 (P3)**: Depends on US1's visibility behavior; verifies repeated import and unchanged activity data.

### Parallel Opportunities

- T003 follows the navigation foundation; T004 implements its tested resolver and T005 wires it into the import/dashboard flow.
- US2 source-parity validation (T006-T007) follows the US1 readiness contract; US3 follow-up import coverage and wiring (T008-T009) follows the source checks.
- In the polish phase, T010 and T011 can run in parallel because they touch separate files.

## Parallel Example: User Story 1

```text
Task: T003 - Add core and per-view availability tests in the listed test files.
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 2 navigation behavior.
2. Complete User Story 1 model readiness and visibility wiring.
3. Validate the equipment-present/equipment-absent cases, all-unavailable behavior, and unchanged activity values.
4. Stop at the US1 checkpoint for a usable MVP.

### Incremental Delivery

1. Add US1 visibility and per-view readiness.
2. Add US2 separate-source parity checks for Strava and TrainingPeaks imports.
3. Add US3 repeated-import fallback and immutability coverage.
4. Verify tab wiring and update import documentation, then run focused and full tests.

## Notes

- Every task follows `- [ ]` or `[X]`, a sequential ID, optional parallel/story labels, and a description with exact file paths.
- `[P]` is used only for work in disjoint files with no incomplete dependency.
- Tests use synthetic data; no personal exports or new packages are required.
- Availability is a presentation-only decision. Do not filter, remove, or rewrite imported activity records to hide a visualization.
- No commit task is included.
