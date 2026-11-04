---
description: "Task list for Apple Health progress percentage display"
---

# Tasks: Apple Health Progress Percentage Display

**Input**: Design documents from `specs/079-apple-health-percent-display/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-contract.md`, and `quickstart.md`

**Tests**: Included because the feature acceptance scenarios and project Constitution require focused behavior verification.

**Organization**: Tasks are grouped by the single P1 user story. Test-first order preserves the precise progress value and verifies source-specific behavior.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Indicates a task that can run in parallel without touching the same file or depending on incomplete work.
- **[Story]**: Maps a task to the user story in `spec.md`.
- Every task names its exact file path.

## Phase 1: Setup

**Purpose**: Project initialization and shared infrastructure.

No setup tasks are needed. The static browser app, dashboard import owner, and Jest infrastructure already exist.

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by user stories.

No foundational tasks are needed. This change adds no dependencies, storage, shared utilities, or cross-story prerequisites.

---

## Phase 3: User Story 1 - Read Apple Health Import Progress (Priority: P1)

**Goal**: Show Apple Health progress as a whole percentage with `%`, without changing the underlying progress value or other import sources.

**Independent Test**: Exercise fractional and boundary Apple Health progress values. Confirm whole-number labels with `%`, the unchanged precise progress indication, retained label on stage-only updates, and unchanged non-Apple Health formatting.

### Tests for User Story 1

- [X] T001 [US1] Add focused progress tests in `__tests__/dashboard-import.test.js` for Apple Health values `0`, `42.375`, `42.5`, and `100`, asserting labels `0%`, `42%`, `43%`, and `100%`; also assert the underlying progress indication remains precise, stage-only updates retain the prior label, and non-Apple Health formatting stays unchanged.
- [X] T002 [US1] Run `npm test -- --runInBand __tests__/dashboard-import.test.js` and confirm the new Apple Health display assertions fail against the current behavior while existing assertions remain interpretable.

### Implementation for User Story 1

- [X] T003 [US1] Update Apple Health progress presentation in `src/dashboard-import.js` to round only the visible label to the nearest whole percentage with `%`, preserve the existing bounded numeric value for the progress indication, retain stage-only behavior, and leave other import-source formatting unchanged.

**Checkpoint**: User Story 1 is complete when the focused tests prove whole-percent Apple Health labels and unchanged progress behavior for all import sources.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Run final focused validation and verify the feature contract.

- [X] T004 Run `npm test -- --runInBand __tests__/dashboard-import.test.js` and verify the expected outcomes in `specs/079-apple-health-percent-display/quickstart.md` and the UI contract in `specs/079-apple-health-percent-display/contracts/ui-contract.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; existing project infrastructure is reused.
- **Foundational (Phase 2)**: No tasks; no shared prerequisite is introduced.
- **User Story 1 (Phase 3)**: Starts directly after the empty setup/foundational phases.
- **Polish (Phase 4)**: Depends on completion of User Story 1.

### User Story Dependencies

- **User Story 1 (P1)**: Independent; it is the only user story in this feature.

### Within User Story 1

1. T001 adds the focused regression tests.
2. T002 runs the tests before implementation and confirms the new assertions expose the current display behavior.
3. T003 changes only the Apple Health label formatting while preserving the precise progress value and other source behavior.
4. T004 reruns the same focused suite and checks the documented UI contract.

### Parallel Opportunities

No tasks are parallelizable. Test-first ordering and the shared ownership of the same progress behavior require T001, T002, and T003 to run sequentially; final validation T004 follows implementation.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Add and run the focused regression tests (T001-T002).
2. Implement the Apple Health-only display adjustment (T003).
3. Rerun focused validation and verify the contract (T004).
4. Stop after User Story 1; no further story or infrastructure work is in scope.

### Incremental Delivery

The feature has one independently testable story, so completing User Story 1 delivers the full MVP. No additional increment is required.

## Notes

- Every task uses the required checkbox, sequential ID, correct story label where applicable, and exact file path.
- No `[P]` marker is used because there are no parallelizable tasks.
- Personal Apple Health exports must not be added as test fixtures; use synthetic or explicitly supplied local data.