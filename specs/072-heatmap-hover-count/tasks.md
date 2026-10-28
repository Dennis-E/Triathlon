---

description: "Task list for heatmap hover count threshold"
---

# Tasks: Heatmap Hover Count Threshold

**Input**: Design documents from `specs/072-heatmap-hover-count/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/heatmap-hover.md`, `quickstart.md`

**Tests**: Focused regression tests are included because the plan and quickstart require boundary, sampling, and hover-transition coverage.

**Organization**: Tasks are grouped by user story so the P1 behavior can be implemented and validated as an independent MVP.

## Phase 1: Setup

**Purpose**: Reuse the existing static app, Jest setup, and heatmap tooltip. No project initialization or dependency changes are needed.

No setup tasks required.

---

## Phase 2: Foundational

**Purpose**: Confirm shared prerequisites before story work. Existing route counts, tooltip model, and dashboard test harness already provide them.

No foundational tasks required.

---

## Phase 3: User Story 1 - Reduce clutter in heatmap hover details (Priority: P1) - MVP

**Goal**: Show `# of tracks: N` above hover details only when the current segment has more than ten distinct contributing tracks; preserve sample context and activity rows.

**Independent Test**: Hover segments with 10 and 11 tracks. The 10-track segment has no count heading; the 11-track segment shows `# of tracks: 11` above its activity details and retains the sampling explanation. Moving from 11 tracks to 10 removes the count heading without stale content.

### Tests and markup preparation

- [X] T001 [P] [US1] Add dashboard hover regression cases for counts 10 and 11, sample explanation, and 11-to-10 heading removal in `__tests__/dashboard-heatmap.test.js`.
- [X] T002 [P] [US1] Add distinct count-label and sample-explanation elements to the heatmap activity tooltip in `index.html`, with the count label hidden by default and no reserved space when hidden.

### Implementation

- [X] T003 [US1] Update `showHeatmapActivityTooltip` in `src/dashboard-heatmap.js` to display `# of tracks: N` only when `totalCount > 10`, retain the sampled-model explanation separately, and clear or hide both labels when the active segment changes.

**Checkpoint**: User Story 1 is complete when the boundary and transition regression cases pass and other tooltip details remain unchanged.

---

## Phase 4: Polish & Cross-Cutting Validation

**Purpose**: Run the documented focused suites after implementation.

- [X] T004 Run `npm test -- --runInBand __tests__/dashboard-heatmap.test.js __tests__/heatmap-utils.test.js` from the repository root and resolve failures in the relevant files.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; the existing project setup is reused.
- **Foundational (Phase 2)**: No tasks; existing shared heatmap behavior is the prerequisite.
- **User Story 1 (Phase 3)**: Starts after the existing project is available. T001 and T002 can run in parallel; T003 depends on both.
- **Polish (Phase 4)**: T004 depends on T003.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on another user story; it is independently testable and is the complete MVP.

### Parallel Opportunities

- T001 and T002 touch separate files and can be completed in parallel.
- T003 must follow T001 and T002 because it relies on their regression coverage and DOM elements.
- T004 runs after implementation; no other story exists to parallelize.

## Parallel Example: User Story 1

```text
Task: T001 - Add the hover boundary and transition tests in __tests__/dashboard-heatmap.test.js
Task: T002 - Add the separate tooltip label elements in index.html
```

## Implementation Strategy

### MVP First

1. Complete T001 and T002 in parallel.
2. Complete T003 using `totalCount` from the existing tooltip model; do not change track aggregation.
3. Run T004 and verify the 10/11 boundary, sample explanation, retained activity details, and stale-heading removal.

### Incremental Delivery

This feature contains one user story. Complete and validate that story as the MVP; no follow-up story is required.

## Format Validation

All four tasks use the required unchecked checkbox, sequential task ID, applicable parallel/story labels, and an exact repository file path or runnable test command. Setup and foundational phases intentionally contain no tasks because this feature reuses existing infrastructure.
