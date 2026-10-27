---

description: "Actionable tasks for compact visualization export context"
---

# Tasks: Compact Export Context

**Input**: Design documents from `/specs/070-compact-export-context/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/export-composition.md`, `quickstart.md`

**Tests**: Focused Jest tasks are included because the plan and project constitution require verification of export utilities and dashboard behavior.

**Organization**: Tasks are grouped by user story so the export improvement can be implemented and validated as one independently testable increment.

## Phase 1: Setup

**Purpose**: Establish the existing focused-test baseline before changing shared export behavior.

- [X] T001 Run the existing focused Jest baseline for `__tests__/export-utils.test.js` and `__tests__/dashboard-export-download.test.js` before implementation.

## Phase 2: Foundational

**Purpose**: Confirm shared export infrastructure prerequisites.

The existing static export target registry, `html2canvas` capture, canvas composition, preview/download flow, and Jest runtime already provide the required foundation. No new dependency, server, or project initialization task is needed.

## Phase 3: User Story 1 - See the visualization clearly in exports (Priority: P1) MVP

**Goal**: Export every visualization with only relevant selected context and the largest undistorted chart fit available in the existing square image.

**Independent Test**: Export representative filtered and unfiltered dashboard visualizations plus a Personal Best detail tile. Confirm that only active relevant values appear, no empty context strip or alternative controls are shown, the 1080 x 1080 PNG uses the maximum aspect-preserving chart fit, and preview/download preserve the selected view.

### Tests for User Story 1

- [X] T002 [P] [US1] Add unit tests for `computeExportContentLayout` covering empty and non-empty context, remaining chart bounds, and wide/tall aspect ratios in `__tests__/export-utils.test.js`.
- [X] T003 [P] [US1] Add export-target and canvas-composition tests that verify active context (including Distance aggregation), omit available option labels, and preserve preview/download state in `__tests__/dashboard-export-download.test.js`.

### Implementation for User Story 1

- [X] T004 [P] [US1] Implement pure `computeExportContentLayout` in `src/export-utils.js` to return optional context and visualization bounds for the fixed square canvas, preserving the existing CommonJS and `window.exportUtils` bridges.
- [X] T005 [P] [US1] Update `getExportContext` in `src/dashboard-export.js` to include Distance's selected aggregation and audit all export targets so context contains only current values that directly determine that view, including the Personal Best detail metric.
- [X] T006 [US1] Update `drawExportComposition` in `src/dashboard-export.js` to render only `target.filters`, omit `target.availableControls`, omit an empty context region, and fit the captured visualization to the largest available bounds without cropping or distortion; preserve the square PNG, existing branding, and applicable legend.

**Checkpoint**: User Story 1 is complete when the shared renderer produces the expected compact composition for dashboard tabs and Personal Best detail exports without changing dashboard filters or the existing preview/download behavior.

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Complete cross-entry-point verification and validate the documented manual scenarios.

- [X] T007 Run the focused Jest suites in `__tests__/export-utils.test.js` and `__tests__/dashboard-export-download.test.js`; run `__tests__/index-script-syntax.test.js` if export wiring or script loading changed.
- [X] T008 Execute the synthetic-data preview/download matrix in `specs/070-compact-export-context/quickstart.md` across representative tab exports and a Personal Best detail tile.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Run the existing focused-test baseline before modifications.
- **Foundational (Phase 2)**: No tasks; the current shared export infrastructure satisfies prerequisites.
- **User Story 1 (Phase 3)**: Depends on Setup. T002 and T003 can proceed in parallel. After the tests are written, T004 and T005 can proceed in parallel because they modify different files. T006 depends on both implementation tasks.
- **Polish (Phase 4)**: T007 and T008 depend on T006 and can proceed in parallel; resolve automated failures before considering the story complete.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on another user story; it is the MVP.

### Parallel Opportunities

- T002 and T003 can be authored in parallel because they touch separate test files.
- T004 and T005 can be implemented in parallel after their corresponding tests because they touch separate source files.
- T007 automated verification and T008 manual export checks can run in parallel after the shared composition is complete.

## Parallel Example: User Story 1

```text
Task: T002 - Add fit/context layout tests in __tests__/export-utils.test.js
Task: T003 - Add active-context and composition tests in __tests__/dashboard-export-download.test.js

After both test tasks:
Task: T004 - Implement pure content-layout helper in src/export-utils.js
Task: T005 - Complete selected context collection in src/dashboard-export.js
```

## Implementation Strategy

### MVP First

1. Run T001 to establish the focused baseline.
2. Add the failing unit and composition tests in T002 and T003.
3. Implement layout and context collection in T004 and T005.
4. Complete the shared drawing change in T006.
5. Validate the single P1 story with T007 and T008.

### Incremental Delivery

The feature has one user story. Complete the shared export-context and composition path as the MVP; verify both representative dashboard exports and Personal Best detail exports before marking it complete.

## Format Validation

All tasks use the required checkbox, sequential ID, optional parallel marker, required user-story label for story-phase tasks, and an explicit repository file path. Setup and polish tasks have no story label; there are no placeholder task IDs or sample tasks.
