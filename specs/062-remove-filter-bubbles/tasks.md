# Tasks: Remove Filter Summary Bubbles

**Input**: Design documents from `specs/062-remove-filter-bubbles/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

**Tests**: Update the existing structural test as specified by the plan; no new test file or dependency is needed.

**Organization**: Tasks are grouped by user story. This feature has one independently testable P1 story.

## Phase 1: Setup

**Purpose**: Project initialization and shared structure.

No setup tasks are required. The static application and Jest environment are already initialized, and this feature adds no dependencies or infrastructure.

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by user stories.

No foundational tasks are required. The feature changes one existing dashboard behavior and has no shared infrastructure prerequisite.

---

## Phase 3: User Story 1 - See selected filters directly at their controls (Priority: P1) - MVP

**Goal**: Remove the redundant selected-filter summary above every visualization while preserving visible selections and existing filter behavior.

**Independent Test**: Open visualizations with different filters; verify there are no summary bubbles above them, filter controls still show their selections, and changing a filter still updates its visualization.

### Regression Test

- [X] T001 [US1] Replace the active-filter-summary assertions in `__tests__/index-script-syntax.test.js` with checks that the summary container and update wiring are absent while dashboard navigation and filter keyboard handling remain covered.
- [X] T002 [US1] Run `npm test -- --runInBand __tests__/index-script-syntax.test.js` and confirm the updated regression test fails against the current summary markup and renderer before implementation.

### Implementation

- [X] T003 [P] [US1] Remove the `activeVisualizationFilterSummary` summary row from `index.html` without changing visualization panels or filter controls.
- [X] T004 [P] [US1] Remove the summary value/rendering helpers, summary-only update calls, and summary event listeners from `src/dashboard-tabs.js` while preserving filter and visualization navigation behavior.
- [X] T005 [US1] Re-run `npm test -- --runInBand __tests__/index-script-syntax.test.js` and verify the updated structural regression test passes.

**Checkpoint**: The summary UI and its update logic are absent; the focused regression test passes and filter controls remain unchanged.

---

## Phase 4: Polish & Cross-Cutting Validation

**Purpose**: Confirm the completed story preserves existing dashboard behavior.

- [X] T006 Run `npm test -- --runInBand` and complete the manual scenarios in `specs/062-remove-filter-bubbles/quickstart.md`, confirming no summary row appears after changing filters or switching visualizations.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; project initialization already exists.
- **Foundational (Phase 2)**: No tasks; no shared infrastructure is needed.
- **User Story 1 (Phase 3)**: Starts immediately after the empty setup/foundational phases.
- **Polish (Phase 4)**: Depends on all User Story 1 implementation and focused-test tasks completing.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other stories; this is the only story and the MVP.

### Within User Story 1

1. Update the existing regression assertions (T001).
2. Run the focused test and confirm it fails on the current behavior (T002).
3. Remove markup and renderer/update wiring in parallel (T003 and T004; separate files, no dependency between them).
4. Run the focused test and confirm it passes (T005).
5. Run the full suite and manual quickstart checks (T006).

### Parallel Opportunities

- T003 and T004 can be implemented in parallel after T002; they modify different files and have no dependency on each other.
- T001 and implementation tasks are intentionally not parallelized: the focused test should first demonstrate the current summary behavior, then implementation makes it pass.

## Parallel Example: User Story 1

```text
After T001 and T002:
Task: T003 Remove the summary row from index.html
Task: T004 Remove summary rendering and update wiring from src/dashboard-tabs.js
```

## Implementation Strategy

### MVP First (User Story 1 Only)

Complete T001-T005 to deliver and independently verify the P1 behavior. Then run T006 for full-suite and manual cross-visualization validation.

### Incremental Delivery

There is only one user story. Deliver it as the MVP after the focused test passes; no later story phases are required.

## Notes

- [P] marks only tasks that edit different files and can proceed independently.
- Every user-story task maps to US1 and names its target file or validation path.
- Filter control markup, selected-state presentation, chart filtering callbacks, imports, and exports are out of scope.
