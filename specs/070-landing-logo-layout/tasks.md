---
description: "Task list for responsive landing-page logo layout"
---

# Tasks: Landingpage Logo Layout

**Input**: Design documents from `specs/070-landing-logo-layout/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: No new automated test tasks were requested in the specification. Verify the visual acceptance criteria in a browser using [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story so the P1 feature can be implemented and accepted independently.

## Phase 1: Setup

**Purpose**: Project initialization

No setup tasks are required; the static app and test tooling already exist.

## Phase 2: Foundational

**Purpose**: Shared prerequisites for user stories

No foundational tasks are required for this presentation-only change.

## Phase 3: User Story 1 - Landingpage auf schmalen Displays ansehen (Priority: P1)

**Goal**: Keep both landing-page logos visible and proportional while adjacent header content adapts to narrow viewports.

**Independent Test**: Follow [quickstart.md](quickstart.md) at 320, 375, 768, and 1280 CSS pixels. Confirm both logos remain fully visible and undistorted; from 320 through 767 CSS pixels, confirm no logo/content overlap or horizontal page overflow and that header navigation and status remain accessible.

### Implementation

- [X] T001 [US1] Update the responsive header and hero logo layout in `index.html` so both logos retain their proportions and remain visible from 320 CSS pixels, header content can reflow without overlap, and the page has no horizontal overflow; verify against the independent test above.

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Additional work across multiple stories

No cross-cutting tasks are identified; the single user story covers the complete feature scope.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; the existing project is ready.
- **Foundational (Phase 2)**: No tasks; no shared prerequisites are needed.
- **User Story 1 (Phase 3)**: Can begin immediately and delivers the full MVP.
- **Polish (Phase 4)**: No additional tasks identified.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on another story or feature phase.

### Parallel Opportunities

- No parallel tasks are available: the feature changes one file, `index.html`, and its single task covers both logo placements.

## Implementation Strategy

### MVP First

1. Complete T001 for User Story 1.
2. Verify each viewport and resize behavior using the independent test and [quickstart.md](quickstart.md).
3. The P1 story is the complete feature; no later story phase is needed.

## Notes

- Task IDs are sequential and the user-story task uses the required `[US1]` label.
- No `[P]` marker is used because there are no independent parallel tasks.