---

description: "Tasks for consistent visualization export button width"
---

# Tasks: Consistent Export Button Width

**Input**: Design documents from `/specs/065-fix-export-button-width/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/export-button.md`, `quickstart.md`

**Tests**: Required by the plan and the project constitution's focused verification principle.

**Organization**: Tasks are grouped by the single P1 user story for an independently verifiable MVP.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Included only when a task is independent and touches separate files.
- **[Story]**: `US1` maps to the compact, consistent export button story in `spec.md`.
- Every task includes exact repository file paths to change or validate.

## Path Conventions

- Static application markup and styles: `index.html`
- Jest tests: `__tests__/`
- Feature validation record: `specs/065-fix-export-button-width/quickstart.md`

---

## Phase 1: Setup

**Purpose**: Project initialization and shared infrastructure.

No setup tasks are required. The static app, CDN styling, and Jest environment already exist; this feature adds no dependencies or build configuration.

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by user stories.

No foundational tasks are required. The feature changes only presentation of existing export actions and introduces no shared data or runtime infrastructure.

---

## Phase 3: User Story 1 - Compact and consistent export button (Priority: P1) - MVP

**Goal**: Keep all eleven standard visualization-header export buttons content-sized, aligned to the content edge in stacked headers, and usable without changing export behavior.

**Independent Test**: Verify all eleven buttons use the shared bounded-width styling, run the focused Jest suites, inspect the six specified viewport widths for compact width/no overflow/alignment, and confirm representative preview/download behavior.

### Tests for User Story 1

- [X] T001 [US1] Add a failing regression assertion in `__tests__/index-script-syntax.test.js` requiring all eleven standard `exportVisualizationTab(...)` buttons to use one explicit shared class and requiring the shared style rule to bound width without row stretching; verify the assertion fails before changing `index.html`.

### Implementation for User Story 1

- [X] T002 [US1] Apply the shared export-button class to all eleven standard visualization-header actions and add one centralized content-sized, viewport-bounded width rule in `index.html`; preserve each action target, accessible label, existing focus/hover styles, header order, and responsive breakpoints.

### Validation for User Story 1

- [X] T003 [US1] Run `npm test -- --runInBand __tests__/index-script-syntax.test.js __tests__/pie-charts-dashboard.test.js __tests__/wordcloud-dashboard.test.js __tests__/dashboard-export-download.test.js` and resolve failures while confirming all eleven mappings, capture targets, preview, and download behavior remain unchanged in those test files.
- [X] T004 [US1] Serve the app and inspect 320, 375, 640, 768, 1024, and 1440 CSS-pixel viewports per `specs/065-fix-export-button-width/quickstart.md`; verify compact width, content-edge alignment, matching dimensions, visible label/icons, no horizontal overflow, unchanged header alignment, and a representative export preview; confirm download behavior through T003's export-download tests, then record observed results in `specs/065-fix-export-button-width/quickstart.md`.

**Checkpoint**: US1 is complete when T001-T004 pass, T004 records successful browser checks at every required viewport, and the generated export preview and download behavior remain intact.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Work affecting multiple stories.

No additional polish tasks are needed; all in-scope visual and export regressions are covered by US1 validation.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; existing project setup is sufficient.
- **Foundational (Phase 2)**: No tasks; no shared prerequisite is introduced.
- **User Story 1 (Phase 3)**: Starts immediately. T001 precedes T002 (test-first); T002 precedes T003; T004 follows the implementation and automated regression checks.
- **Polish (Phase 4)**: No additional tasks; complete the US1 acceptance checks before considering the feature done.

### User Story Dependencies

- **User Story 1 (P1)**: Independent; no other user stories exist.

### Within User Story 1

- T001 establishes the failing shared-markup contract before implementation.
- T002 applies the class and centralized style rule to the existing actions.
- T003 validates markup, visualization wiring, and export behavior.
- T004 validates rendered responsive geometry and records the manual acceptance result.

### Parallel Opportunities

No tasks are marked `[P]`. The test-first implementation, regression run, and viewport acceptance form a deliberate dependency chain; none can safely be run in parallel.

## Parallel Example: User Story 1

No parallel task execution is identified for this story. Complete T001 through T004 in order.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Add the failing shared-markup assertion in `__tests__/index-script-syntax.test.js`.
2. Add the shared class and width rule in `index.html`.
3. Run the focused Jest suites in T003.
4. Complete and record the responsive/export smoke checks in T004.

US1 is the complete MVP; there are no later stories or separate cross-cutting implementation increments.

### Incremental Delivery

There is one independently valuable story. Deliver it only after the automated and manual acceptance gates both pass.

## Notes

- Total executable tasks: 4, all assigned to US1.
- `[P]` is intentionally omitted because every task depends on the preceding test-first or validation step.
- Setup and foundational phases contain no tasks because there is no project initialization, dependency, shared data model, or infrastructure work.
- The manual viewport check is required because the existing Jest environment does not calculate rendered CSS geometry.
