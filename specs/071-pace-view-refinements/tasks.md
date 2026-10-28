---

description: "Task list for Pace-Ansichten verfeinern"
---

# Tasks: Pace-Ansichten verfeinern

**Input**: Design documents from `/specs/071-pace-view-refinements/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No new test cases were explicitly requested. Run the existing focused regression and syntax suites as required by the project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm this feature uses the existing static-browser project without new setup or dependencies.

- [X] T001 Confirm the feature requires no new package or build setup in `package.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish that existing year-selection behavior passes before changing the visualization layout.

- [X] T002 Run the existing year-selection baseline suite in `__tests__/dashboard-scatter-years.test.js`.

**Checkpoint**: Baseline passes; the two user stories can proceed independently.

---

## Phase 3: User Story 1 - Jahresauswahl beim Ansichtswechsel behalten (Priority: P1)

**Goal**: Preserve enabled and disabled years across Pace-vs-Metrics sport, metric, date-range, and empty-data changes, resetting only for a new import.

**Independent Test**: Uncheck years, change sport and metric, enter a view with no points, then return to the original view. Confirm known years retain their states, a newly available year starts enabled, and a new import resets the selection.

### Implementation for User Story 1

- [X] T003 [US1] Preserve disabled year selections across sport, metric, date-range, and empty-data rerenders while retaining reset-on-import behavior in `src/dashboard-scatter.js`.
- [X] T004 [US1] Verify persistence, newly available year defaults, and new-import reset using `__tests__/dashboard-scatter-years.test.js`.

**Checkpoint**: The existing Pace year-selection behavior remains intact and independently validated.

---

## Phase 4: User Story 2 - Legende neben der Visualisierung lesen (Priority: P1)

**Goal**: Show the year and trend-line controls to the right of the chart from 768 CSS pixels upward; stack them below the chart at narrower widths without clipping.

**Independent Test**: At 768 and 1024 CSS pixels, confirm the legend is beside the chart and does not reduce its height. At 390 CSS pixels, confirm the stacked legend and chart remain readable without overlap or clipping.

### Implementation for User Story 2

- [X] T005 [P] [US2] Move the chart-controls row and legend width utilities to the `md` breakpoint, and keep the chart at its fixed height below `md` with `shrink-0 md:flex-1` in `index.html`.
- [X] T006 [P] [US2] Add the exact 768 CSS-pixel threshold to the responsive viewport matrix in `specs/071-pace-view-refinements/quickstart.md`.
- [X] T007 [US2] Verify legend placement, chart height, and clipping at 768, 1024, and 390 CSS pixels using `specs/071-pace-view-refinements/quickstart.md`.

**Checkpoint**: The legend is readable beside the chart at medium and wider widths and stacks cleanly on narrow screens.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Run the final focused validation after both user stories are complete.

- [X] T008 Run the focused year-state and page-syntax suites in `__tests__/dashboard-scatter-years.test.js` and `__tests__/index-script-syntax.test.js`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; confirms the existing static-app setup is sufficient.
- **Foundational (Phase 2)**: Depends on Setup; its baseline test blocks story work until it passes.
- **User Stories (Phases 3-4)**: Both depend on the baseline and can then proceed in parallel because they primarily touch different files.
- **Polish (Phase 5)**: Depends on both stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after the baseline; no dependency on User Story 2. T004 follows T003.
- **User Story 2 (P1)**: Starts after the baseline; no dependency on User Story 1. T005 and T006 can run in parallel; T007 follows both.

### Parallel Opportunities

- After T002, User Story 1 and User Story 2 can proceed in parallel.
- Within User Story 2, T005 (`index.html`) and T006 (`quickstart.md`) can proceed in parallel; T007 validates the resulting layout.
- User Story 1 tasks T003 and T004 remain sequential because the regression check validates the preserved behavior.

### Parallel Examples

**User Story 1**: No within-story parallel tasks; complete T003, then T004.

**User Story 2**: Run T005 and T006 concurrently, then complete T007.

---

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational phases.
2. Complete User Story 1 and verify the existing year-selection behavior.
3. Complete User Story 2 for the visible responsive-layout improvement.
4. Run T008 before considering the feature complete.

### Incremental Delivery

1. Validate year-state preservation independently (US1).
2. Shift the legend beside the chart and validate responsive behavior independently (US2).
3. Run the combined focused suites.

---

## Notes

- All implementation tasks name the owning repository file; all task lines use the required checkbox and sequential task ID format.
- Existing year-state behavior and its reset-on-import path are already covered by the focused suite; do not broaden persistence to other dashboard tabs or imports.
- No new dashboard tab, export mapping, dependency, API, or persisted preference is part of this feature.
