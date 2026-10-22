---

description: "Task list for concise TrainingPeaks import status"
---

# Tasks: Concise TrainingPeaks Import Status

**Input**: Design documents from `/specs/064-concise-trainingpeaks-status/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/status-badge.md`, `quickstart.md`

**Tests**: Focused regression tests are required by the implementation plan and the project constitution's dashboard verification rule.

**Organization**: Tasks are grouped by the single P1 user story to preserve an independently testable MVP.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Used only when tasks touch different files and have no unmet dependencies.
- **[Story]**: `US1` maps to the import-confirmation story in `spec.md`.
- Every task includes the exact repository file path it changes or validates.

## Path Conventions

- Static web application source: `src/`
- Jest tests: `__tests__/`
- Feature design artifacts: `specs/064-concise-trainingpeaks-status/`

## Phase 1: Setup

**Purpose**: Project initialization and shared infrastructure.

No setup tasks are required. The existing static app, Jest configuration, import flow, and test dependencies are already in place; no dependency or project configuration changes are planned.

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by user stories.

No foundational tasks are required. This feature has one user story and introduces no shared infrastructure or data model.

---

## Phase 3: User Story 1 - Confirm a TrainingPeaks import (Priority: P1) - MVP

**Goal**: Show exactly `Imported TrainingPeaks history` in the top-right status after every successful TrainingPeaks import, regardless of archive count or skipped items, while preserving progress, failure, cancellation, and Strava behavior.

**Independent Test**: Run `npm test -- --runInBand __tests__/dashboard-import.test.js` and verify that successful TrainingPeaks status updates match the exact required text at both dataset application and import completion; multi-archive and skipped/unmatched outcomes do not add details; failure and cancellation do not show success; Strava wording remains unchanged.

### Tests for User Story 1

- [X] T001 [US1] Add focused assertions for the exact TrainingPeaks success status at dataset application and import completion, including multi-archive and skipped/unmatched cases, plus unchanged Strava wording in `__tests__/dashboard-import.test.js`.

### Implementation for User Story 1

- [X] T002 [US1] Update both TrainingPeaks success-status updates to display exactly `Imported TrainingPeaks history` and remove archive, activity, skipped-workout, and unmatched-route details from the top-right badge in `src/dashboard-import.js`.

### Validation for User Story 1

- [X] T003 [US1] Run `npm test -- --runInBand __tests__/dashboard-import.test.js` and resolve regressions while confirming progress, failure, cancellation, and Strava status behavior remains covered in `__tests__/dashboard-import.test.js`.

**Checkpoint**: US1 is complete when the focused Jest suite passes and every successful TrainingPeaks status update contains only the required confirmation text.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Work that affects multiple user stories.

No additional polish tasks are required beyond the US1 validation; the feature changes no shared data, API, tab, or privacy behavior.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; existing project initialization is sufficient.
- **Foundational (Phase 2)**: No tasks; no shared prerequisite is introduced.
- **User Story 1 (Phase 3)**: Can start immediately. T001 must precede T002 so the regression assertions define the behavior; T002 must precede T003 validation.
- **Polish (Phase 4)**: No additional tasks; complete the story's focused validation before considering the feature done.

### User Story Dependencies

- **User Story 1 (P1)**: Independent; no other stories exist.

### Within User Story 1

- T001 writes regression assertions first.
- T002 changes the two TrainingPeaks success-status updates in the source.
- T003 runs the focused suite after implementation.

### Parallel Opportunities

- No tasks are marked `[P]`. The test-first sequence is intentional, and implementation and validation depend on the preceding tasks.

## Implementation Strategy

### MVP First

1. Add the focused regression assertions for US1.
2. Update both TrainingPeaks success-status updates.
3. Run the focused Jest suite and confirm the independent test criteria.

US1 is the complete MVP; there are no later stories or cross-cutting implementation increments.

### Parallel Team Strategy

No parallel task execution is identified for this three-task, test-first change.

## Notes

- [P] is omitted because no task is safely parallelizable under the specified test-first ordering.
- Every task uses the required checkbox, sequential ID, `[US1]` story label, and explicit file path.
- No application code is changed by task generation.
