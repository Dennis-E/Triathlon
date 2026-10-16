# Tasks: Viewport-Visible Navigation Cues and Arrow Handling

**Input**: Design documents from `/specs/061-viewport-navigation-cues/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/dashboard-navigation-cues.md](contracts/dashboard-navigation-cues.md), [quickstart.md](quickstart.md)

**Tests**: Focused integration assertions are included because the implementation plan and repository constitution require narrow validation for dashboard behavior.

**Organization**: Tasks are grouped by the two prioritized user stories. Existing app, dashboard scripts, and Jest suites provide all shared setup.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm existing project infrastructure.

No setup task is required. The static browser app, existing dashboard scripts, and focused Jest suite are already present; no new package or build configuration is needed.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Resolve prerequisites shared by both user stories.

No foundational task is required. The four cue elements, dashboard key handler, active visualization state, and filter update path already exist.

## Phase 3: User Story 1 - Keep navigation cues in view (Priority: P1) 🎯 MVP

**Goal**: Keep all four directional cues visible during long visualization scrolling and viewport resize, with left/right vertically centered.

**Independent Test**: With a tall visualization open, scroll to its top, middle, and bottom and resize between desktop and narrow viewports; verify every cue remains visible and the left/right cues stay within 24 px of the viewport midpoint without obscuring essential content.

### Tests for User Story 1

> Write the assertion first and verify it fails against the current stage-relative cue placement.

- [X] T001 [US1] Add integration assertions for viewport-fixed cue markup, left/right vertical centering, safe viewport visibility, and preserved reduced-motion support in `__tests__/index-script-syntax.test.js`.

### Implementation for User Story 1

- [X] T002 [P] [US1] Move the four cue wrappers from the scrolling visualization stage to a viewport-fixed non-interactive layer, center left/right vertically, keep up/down inside viewport margins, and preserve responsive and reduced-motion styling in `index.html`.

**Checkpoint**: All four cues remain in the current viewport at the top, middle, and bottom of a long view without obscuring essential content.

## Phase 4: User Story 2 - Use Up and Down without page scrolling (Priority: P1)

**Goal**: Preserve the focused-filter behavior and use the first eligible filter in the active visualization as the fallback when no filter choice has focus, while preserving modal/native-control behavior.

**Independent Test**: With an active visualization, test Up/Down first with a focused eligible filter and then with focus elsewhere; verify only the focused or fallback first filter changes, focus follows the new choice, chart and summary update, and the active dashboard does not scroll. Confirm native controls, modals, and no-eligible-filter cases remain no-ops for dashboard handling.

### Tests for User Story 2

> Write the assertions first and verify they fail before changing the dashboard handler.

- [X] T003 [US2] Add integration assertions for focused-filter precedence, first-eligible-filter fallback when another non-native control has focus, modal/native-control exclusions, no-eligible-group no-op, focus-safe scroll prevention, summary refresh, and success-only cue activation in `__tests__/index-script-syntax.test.js`.

### Implementation for User Story 2

- [X] T004 [P] [US2] Extend Up/Down handling to select the focused eligible filter or otherwise the first eligible group in the active panel's displayed order, preserve modal/native-control exclusions, move focus to the selected choice, update the summary, and prevent page scroll only when handling dashboard navigation in `src/dashboard-tabs.js`.
- [X] T005 [US2] Update vertical cue availability so it reflects the fallback filter when a visualization is active without a focused filter, while retaining native-control, modal, unavailable-choice, and no-active-visualization behavior in `src/dashboard-tabs.js`.

**Checkpoint**: Focused and fallback navigation change exactly one eligible filter; native/modal behavior is preserved; only successful changes cue and do not scroll.

## Phase 5: Polish & Cross-Cutting Validation

**Purpose**: Validate the combined user journeys across automated and browser checks.

- [X] T006 Run `npm test -- --runInBand __tests__/index-script-syntax.test.js` and complete the scroll, resize, keyboard-context, native-control, modal, no-filter, no-active-view, and reduced-motion scenarios in `specs/061-viewport-navigation-cues/quickstart.md`.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Existing infrastructure; no task required.
- **Foundational (Phase 2)**: Existing cues and dashboard state; no task required.
- **User Story 1 (Phase 3)**: T001 precedes T002; the test and implementation can be checked independently at the US1 checkpoint.
- **User Story 2 (Phase 4)**: T003 precedes T004 and T005. T004 and T005 both modify `src/dashboard-tabs.js` and must run sequentially.
- **Polish (Phase 5)**: T006 follows both stories.

### User Story Dependencies

- **User Story 1 (P1)**: Independent and suitable as the MVP; it changes only cue positioning and visibility.
- **User Story 2 (P1)**: Independent of the cue positioning implementation; it reuses existing cue elements and active visualization state.

### Parallel Opportunities

- T001 and T003 both edit `__tests__/index-script-syntax.test.js` and must run sequentially.
- After T001 and T003 are complete, T002 and T004 can run in parallel because they edit separate files; T005 follows T004 because it also edits `src/dashboard-tabs.js`.

## Parallel Example: User Stories 1 and 2

```text
Task: T002 — Move cue wrappers to the viewport-fixed layer in index.html
Task: T004 — Add active-visualization filter fallback in src/dashboard-tabs.js
```

## Implementation Strategy

### MVP First (User Story 1)

1. Add T001 assertions and confirm the current cue positioning fails the viewport behavior.
2. Implement viewport-fixed cue positioning in T002.
3. Validate the scroll and resize scenarios independently at the US1 checkpoint.

### Incremental Delivery

1. Deliver the always-visible cues as the first independent increment.
2. Add and validate the focused/fallback Up/Down behavior and cue availability.
3. Complete T006 to validate interactions at desktop and narrow viewports, including native controls and reduced motion.

## Format Validation

All executable tasks use unchecked checkboxes, sequential IDs, exact repository paths, and story labels only in user-story phases. Setup and foundational sections contain no fictitious work items.