---

description: "Task list for Hide Media Activity Filter"
---

# Tasks: Hide Media Activity Filter

**Input**: Design documents from `specs/077-hide-media-activity-filter/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/media-gallery-filters.md`, `quickstart.md`

**Tests**: Focused regression tests are required by the implementation plan and the project's dashboard behavior verification principle.

**Organization**: Tasks are grouped by user story so the behavior can be implemented and verified as an independent increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Tasks marked parallel can run together because they have disjoint file targets and no dependencies on one another.
- **[Story]**: User-story traceability label; all story-phase tasks use `[US1]`.
- Every task description includes its exact file path or test targets.

## Path Conventions

This is the existing static browser application. UI markup is in `index.html`, dashboard orchestration is in `src/`, and Jest tests are in `__tests__/` at the repository root.

## Phase 1: Setup

**Purpose**: Project initialization and shared infrastructure.

No setup tasks are needed; the static app, test runner, and existing Media dashboard are already initialized.

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites for the user story.

No foundational tasks are needed; this change adds no shared infrastructure, dependencies, or data migration.

---

## Phase 3: User Story 1 - Media ohne Aktivitätsfilter durchsuchen (Priority: P1) - MVP

**Goal**: Hide Activity and route-inclusion controls while preserving Year/Sport filtering, linked activity details, unassigned media, and Media export without route drawings or redundant success status copy.

**Independent Test**: Open the Media gallery with linked and unassigned media; confirm Activity and route-inclusion controls are absent, Year and Sport still filter results, linked activity details remain accessible, unassigned media remain visible, and a generated preview has no route drawing or redundant ready status.

### Tests for User Story 1

- [X] T001 [P] [US1] Add dashboard regression assertions for absent Activity, route, pin, and item-selection controls, retained Year/Sport filtering and preview details, filter-driven collages, route-free exports, and cleared status in `__tests__/dashboard-media.test.js`.
- [X] T002 [P] [US1] Update the Media markup contract assertion to require Year/Sport controls and reject Activity and route-inclusion selectors in `__tests__/index-script-syntax.test.js`.
- [X] T003 [P] [US1] Add export-control assertions that Media lists neither Activity nor route inclusion while retaining existing export behavior in `__tests__/dashboard-export-download.test.js`.
- [X] T004 [US1] Run the focused Jest suites in `__tests__/dashboard-media.test.js`, `__tests__/index-script-syntax.test.js`, and `__tests__/dashboard-export-download.test.js`; confirm the new assertions fail before implementation.

### Implementation for User Story 1

- [X] T005 [P] [US1] Remove the Activity and route-inclusion option controls from the Media gallery while preserving Year/Sport controls in `index.html`.
- [X] T006 [P] [US1] Remove Activity/route/pin/selection UI state and handlers, use filtered media for collages, omit route export rendering, and clear redundant ready status while retaining preview details in `src/dashboard-media.js`.
- [X] T007 [P] [US1] Remove Activity and route-inclusion controls from the Media export-control summary while preserving Year and Sport in `src/dashboard-export.js`.
- [X] T008 [US1] Run the focused Jest suites in `__tests__/dashboard-media.test.js`, `__tests__/index-script-syntax.test.js`, and `__tests__/dashboard-export-download.test.js`; resolve regressions before completing the story.

**Checkpoint**: The Media gallery has no Activity filter, but all other specified Media behavior remains independently usable.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end verification across the Media gallery and its existing export flow.

- [X] T009 Complete the populated, empty-result, linked-activity, unassigned-media, filter-driven collage, route-free export, and preview-status browser checks in `specs/077-hide-media-activity-filter/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No work required; project infrastructure already exists.
- **Foundational (Phase 2)**: No work required; no shared prerequisite blocks the story.
- **User Story 1 (Phase 3)**: Test tasks T001-T003 precede implementation; T004 verifies the expected pre-implementation failures. Implementation tasks T005-T007 can proceed in parallel after T004 because they modify separate files. T008 validates the integrated result.
- **Polish (Phase 4)**: T009 follows T008 and verifies the user-facing workflow in a browser.

### User Story Dependencies

- **User Story 1 (P1)**: Independent; no other user story or data migration is required.

### Within User Story 1

- T001, T002, and T003 may run in parallel because they update separate test files.
- T004 depends on T001-T003.
- T005, T006, and T007 may run in parallel after T004 because they update separate implementation files.
- T008 depends on T005-T007; T009 depends on T008.

### Parallel Opportunities

- **Test authoring**: T001 + T002 + T003.
- **Implementation after red tests**: T005 + T006 + T007.

## Parallel Example: User Story 1

```text
After the test cases are agreed, work on T001, T002, and T003 concurrently.
After T004 confirms the new tests fail as expected, work on T005, T006, and T007 concurrently.
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T003 and run T004 to establish the regression checks.
2. Implement T005-T007 in the existing UI, dashboard, and export owners.
3. Run T008 and complete T009; the single P1 story is the full MVP.

### Incremental Delivery

This feature has one independently testable user story. Deliver it after the focused Jest checks and browser verification pass; no later story phase is needed.

## Notes

- Task IDs are sequential; `[P]` appears only on disjoint test or implementation files whose prerequisites are complete.
- `[US1]` labels map all story-phase tasks to the sole story in `spec.md`.
- No task changes tab IDs/order, media import, activity associations, or the reusable media utility API.
