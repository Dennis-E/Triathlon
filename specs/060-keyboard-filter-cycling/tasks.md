# Tasks: Keyboard Navigation for Visualization Filters

**Input**: Design documents from `/specs/060-keyboard-filter-cycling/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/dashboard-keyboard-navigation.md](contracts/dashboard-keyboard-navigation.md), [quickstart.md](quickstart.md)

**Tests**: Focused regression tests are included because the repository constitution requires narrow validation for dashboard behavior. Existing Up/Down filtering and four-direction cue markup are already implemented by Feature 059; tasks below cover the new Tab behavior and focused-filter regression coverage.

**Organization**: Tasks are grouped by the three prioritized user stories. Setup and foundational infrastructure already exist.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm existing project infrastructure.

No setup task is required. The static browser app, dashboard scripts, Jest configuration, and focused test files already exist; no dependency or build configuration changes are planned.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Resolve prerequisites shared by all user stories.

No foundational task is required. Existing visualization tabs, active-panel filters, filter summaries, and four directional cues provide the shared foundation.

## Phase 3: User Story 1 - Navigate visualizations with Tab (Priority: P1) 🎯 MVP

**Goal**: Make Tab and Shift+Tab activate the next and previous visualization, matching Right and Left while a visualization tab is focused.

**Independent Test**: Focus a visualization tab; verify Tab/Right advance, Shift+Tab/Left reverse, wraparound remains correct, and ordinary Tab traversal is preserved outside the tab list.

### Tests for User Story 1

- [X] T001 [P] [US1] Add unit cases for Tab/Shift+Tab direction mapping, wraparound, and unrelated keys remaining unhandled in `__tests__/tab-navigation.test.js`.
- [X] T002 [P] [US1] Add integration assertions for Tab key dispatch and right/left cue selection in `__tests__/index-script-syntax.test.js`.

### Implementation for User Story 1

- [X] T003 [US1] Map Tab to the next tab and Shift+Tab to the previous tab in `handleVisualizationTabKeydown` in `src/tab-navigation.js`, preserving existing ArrowLeft/ArrowRight behavior and normal behavior for other keys.
- [X] T004 [US1] Map successful Tab to the right cue and successful Shift+Tab to the left cue in `handleVisualizationTabKeydown` in `src/dashboard-tabs.js`.

**Checkpoint**: Tab and Shift+Tab match horizontal arrow navigation in the tab list; other focus contexts retain normal focus order.

## Phase 4: User Story 2 - Cycle the focused filter with Up and Down (Priority: P1)

**Goal**: Preserve the clarified behavior that Up/Down change only the focused eligible filter, update its visualization and summary, and do not scroll the page when handled.

**Independent Test**: Focus a button-based filter in the active visualization and press Up/Down; verify only that group changes, its value wraps correctly, the chart and summary update, and successful handling prevents page scrolling. Confirm an unfocused or ineligible context does not change filters.

### Regression Tests for User Story 2

- [X] T005 [US2] Add assertions for active-panel and focused-group isolation, success-only `preventDefault`, summary refresh, and vertical cue dispatch in `__tests__/index-script-syntax.test.js`; retain the existing implementation in `src/dashboard-tabs.js` unless these assertions expose a defect.

**Checkpoint**: Existing focused-filter behavior remains aligned with the clarification; no other filter group or native control is changed.

## Phase 5: User Story 3 - Recognize keyboard directions (Priority: P2)

**Goal**: Preserve the existing four directional cues and verify that successful keyboard actions indicate their direction without misleading feedback.

**Independent Test**: Confirm the existing four cue elements, reduced-motion styling, and timeout assertions; exercise successful and no-op keyboard input and verify only the matching cue indicates success.

### Regression Tests for User Story 3

- [X] T006 [US3] Add or refine assertions for matching-cue-only activation, no success feedback on no-op input, immediate feedback within 250 ms, cue expiry within 1.5 seconds, and repeated cue retriggering in `__tests__/index-script-syntax.test.js`; document the browser timing check in `specs/060-keyboard-filter-cycling/quickstart.md`.

**Checkpoint**: All four cues remain visually available, success-only, brief, and consistent with reduced-motion behavior.

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Validate the combined keyboard behavior and resolve regressions.

- [X] T007 Run `npm test -- --runInBand __tests__/tab-navigation.test.js` and `npm test -- --runInBand __tests__/index-script-syntax.test.js`, then complete the browser scenarios in `specs/060-keyboard-filter-cycling/quickstart.md`.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Existing infrastructure; no task required.
- **Foundational (Phase 2)**: Existing shared navigation and cue infrastructure; no task required.
- **User Story 1 (Phase 3)**: Can begin immediately. T001 and T002 can run in parallel; T003 follows T001; T004 follows T002 and T003.
- **User Story 2 (Phase 4)**: Uses existing focused-filter handling and can be regression-tested independently. T005 follows the User Story 1 test work because it extends the same integration test file.
- **User Story 3 (Phase 5)**: Uses existing cue elements; T006 follows earlier integration assertions because it extends the same test file.
- **Polish (Phase 6)**: T007 follows completion of the story tasks.

### User Story Dependencies

- **User Story 1 (P1)**: Independent; delivers the new Tab/Shift+Tab navigation behavior and is the MVP.
- **User Story 2 (P1)**: Existing behavior from Feature 059; this feature adds focused regression coverage for the clarified isolation rule.
- **User Story 3 (P2)**: Existing cue structure from Feature 059; regression coverage confirms direction matching and success-only feedback.

### Parallel Opportunities

- **US1**: T001 and T002 can be authored in parallel because they touch separate test files. Implementation follows the corresponding tests.
- **US2 and US3**: Their integration assertions share `__tests__/index-script-syntax.test.js` and should be added sequentially, not in parallel.
- **Across stories**: US1 is the only production implementation change; US2/US3 regression checks can be reviewed after US1 is complete.

## Parallel Example: User Story 1

```text
Task: T001 — Add Tab/Shift+Tab navigation unit cases in __tests__/tab-navigation.test.js
Task: T002 — Add key dispatch and cue integration assertions in __tests__/index-script-syntax.test.js
```

## Implementation Strategy

### MVP First (User Story 1)

1. Add T001 and T002 tests and confirm the new Tab behavior is not yet supported.
2. Implement Tab/Shift+Tab mapping and matching horizontal cue feedback in T003–T004.
3. Run the focused navigation and script-integration suites; manually verify the US1 scenarios.

### Incremental Delivery

1. Deliver US1 as the functional increment.
2. Add US2 regression coverage for the previously implemented focused-filter behavior.
3. Add US3 cue regression coverage, then run the complete quickstart validation.

## Format Validation

All executable tasks use unchecked checkboxes, sequential IDs, exact repository paths, and the required story labels in user-story phases. Setup and foundational phases contain no fictitious task items.