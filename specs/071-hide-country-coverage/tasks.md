---
description: "Task list for hiding the partial country coverage note"
---

# Tasks: Hide Partial Country Coverage Note

**Input**: Design documents from `specs/071-hide-country-coverage/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: No separate test-first tasks were requested. Update the existing regression expectation as part of the implementation and run the focused Jest command in [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story so the P1 behavior can be implemented and verified independently.

## Phase 1: Setup

**Purpose**: Project initialization

No setup tasks are required; the static app and Jest suite already exist.

## Phase 2: Foundational

**Purpose**: Shared prerequisites for user stories

No foundational tasks are required for this focused presentation change.

## Phase 3: User Story 1 - Länderübersicht ohne Teilabdeckungshinweis ansehen (Priority: P1)

**Goal**: Hide the partial-coverage sentence in both Lifetime Statistics surfaces while preserving country values and other summary states.

**Independent Test**: Run `npm test -- --runInBand __tests__/lifetime-statistics-dashboard.test.js`. Confirm both dashboard and export omit “Based on X of Y activities” for partial coverage, retain the country count and names, and preserve complete, loading, and unavailable states.

### Implementation

- [X] T001 [US1] In `src/dashboard-lifetime-statistics.js`, omit the partial-coverage sentence from the Countries visited card in dashboard and export while preserving country count, names, complete-coverage, loading, and unavailable output; update the existing partial-coverage expectation in `__tests__/lifetime-statistics-dashboard.test.js` and run the focused validation in `specs/071-hide-country-coverage/quickstart.md`.

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Additional work across multiple stories

No additional cross-cutting work is identified.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; the existing project is ready.
- **Foundational (Phase 2)**: No tasks; no shared prerequisites are needed.
- **User Story 1 (Phase 3)**: Can begin immediately and delivers the full MVP.
- **Polish (Phase 4)**: No additional work is required.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories.

### Parallel Opportunities

- No parallel tasks are identified. The renderer and its existing regression expectation must change together to keep behavior and validation aligned.

## Implementation Strategy

### MVP First

1. Complete T001 for User Story 1.
2. Run the independent Jest test and verify partial, complete, loading, and unavailable output in both dashboard and export.
3. User Story 1 is the full feature; no later story phase is needed.

## Notes

- Task IDs are sequential; the story task uses the required `[US1]` label.
- No `[P]` marker is used because the renderer and its existing test expectation are one coordinated change.