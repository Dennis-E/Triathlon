---
description: "Task list for Simplify Import Status"
---

# Tasks: Simplify Import Status

**Input**: Design documents from `/specs/069-simplify-import-status/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/import-status.md`, `quickstart.md`

**Tests**: Focused tests are included because the specification defines independent acceptance checks and the plan requires narrow Jest verification.

**Organization**: Tasks are grouped by the single P1 user story; the regression test precedes the implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with another task after dependencies are complete
- **[Story]**: User story covered by the task, mapped to `spec.md`
- Each task description names the exact file path it changes or uses

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks are needed; the static browser app and Jest project are already configured.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared prerequisites that must block user-story work

No foundational tasks are needed; this change uses the existing import flow, status renderer, and test environment.

---

## Phase 3: User Story 1 - See a concise import confirmation (Priority: P1) - MVP

**Goal**: Show only the matching Strava or TrainingPeaks source label after a successful import while preserving progress and failure messages.

**Independent Test**: Run `npm test -- --runInBand __tests__/dashboard-import.test.js`; verify exact success labels for both sources, including a zero-activity Strava dataset, and preserve the existing skipped-item and non-success status behavior.

### Tests for User Story 1

- [X] T001 [US1] Update the success-status assertions for both sources, add the zero-activity Strava case, and confirm the new Strava expectation fails before implementation in `__tests__/dashboard-import.test.js`.

### Implementation for User Story 1

- [X] T002 [US1] Use only the source-specific label for successful Strava and TrainingPeaks status updates in `src/dashboard-import.js`; preserve progress and failure messages.

**Checkpoint**: US1 is independently functional when the focused import test passes and both success labels contain no counts.

---

## Phase 4: Polish & Cross-Cutting Validation

**Purpose**: Verify the completed story across automated and browser workflows

- [X] T003 [P] Run the focused import test and full root Jest suite using the commands in `specs/069-simplify-import-status/quickstart.md`, including `__tests__/dashboard-import.test.js`.
- [X] T004 [P] Follow the browser validation in `specs/069-simplify-import-status/quickstart.md` and verify both source-only success labels plus unchanged progress and failure messages; do not commit personal export files.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; no project initialization is required.
- **Foundational (Phase 2)**: No tasks; no shared prerequisite blocks US1.
- **User Story 1 (Phase 3)**: Starts directly because it uses existing app and test infrastructure.
- **Polish (Phase 4)**: Depends on T001 and T002 being complete.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on another story; this is the only story and the MVP.

### Within User Story 1

- T001 updates the regression test first and should fail against the current activity-count behavior.
- T002 implements the source-only success label after T001.
- T003 and T004 can run in parallel after T002; they validate separate automated and browser workflows.

## Parallel Opportunities

- After T002, T003 and T004 are independent and can run in parallel.
- No implementation tasks can run in parallel: the regression test must establish the expected behavior before the source change.

## Parallel Example: User Story 1

After T002 is complete, run these validations in parallel:

```text
Task T003: Run focused and full Jest validation from specs/069-simplify-import-status/quickstart.md
Task T004: Verify both import sources and lifecycle messages in the browser using specs/069-simplify-import-status/quickstart.md
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. No setup or foundational work is required.
2. Complete T001 and confirm the focused test exposes the current Strava count.
3. Complete T002 to show the source-only success labels.
4. Complete T003 and T004; stop if either source label or a non-success state regresses.

### Incremental Delivery

US1 is the full feature. Complete its test-first implementation, then perform automated and browser validation before delivery; no later story phases are required.

## Notes

- `[P]` marks only tasks that can run independently after their prerequisites.
- `[US1]` maps to "See a concise import confirmation" in `spec.md`.
- Tests use synthetic datasets; personal activity exports must remain local and uncommitted.