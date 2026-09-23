---

description: "Task list for fixing the Bike power Personal Best enlarge control"
---

# Tasks: Fix Power PB Enlarge Button

**Input**: Design documents from `/specs/029-fix-pb-enlarge-button/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui.md](./contracts/ui.md), [quickstart.md](./quickstart.md)

**Tests**: Focused Jest assertions and browser validation are included because the specification requires preserving detail-view behavior and correcting a visual rendering defect.

**Organization**: Tasks are grouped by the single P1 user story so the complete feature remains independently implementable and testable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the existing static-app and test baseline; no new dependencies or project structure are required.

- [ ] T001 Run the focused baseline suite with `npm test -- --runInBand __tests__/index-script-syntax.test.js` and record the current PB detail-control assertions in `__tests__/index-script-syntax.test.js`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm the shared rendering path and constraints before changing the control.

- [ ] T002 Confirm the shared `appendPbDetailButton` path, Lucide initialization, accessibility label, and detail click handler in `src/dashboard-power-pb.js` without changing PB data or calculation behavior.

**Checkpoint**: The existing shared control contract and focused baseline are understood; User Story 1 implementation can begin.

---

## Phase 3: User Story 1 - Use the Power PB Enlarge Control (Priority: P1) 🎯 MVP

**Goal**: Make the enlarge icon visible and visually consistent on every Bike power duration tile while preserving the matching full-screen detail action.

**Independent Test**: Render Bike power PB tiles with at least one duration, confirm each header shows a recognizable enlarge icon with the same contrast and dimensions as other PB controls, activate one control, and verify the matching detail view opens at desktop and narrow widths.

### Tests for User Story 1

- [ ] T003 [P] [US1] Extend the focused control assertions in `__tests__/index-script-syntax.test.js` to cover the retained `maximize-2` icon, visible icon sizing, shared button contrast classes, and preserved full-screen detail wiring.

### Implementation for User Story 1

- [ ] T004 [US1] Correct the shared enlarge-control presentation in `src/dashboard-power-pb.js` so every Bike power duration tile renders a visible, high-contrast icon matching the other Personal Best tile controls while retaining the existing accessible name, title, and click handler.
- [ ] T005 [US1] Verify the corrected control is applied consistently at every Bike power duration-tile call site in `src/dashboard-power-pb.js` without modifying PB records, chart values, or detail-view models.

### Validation for User Story 1

- [ ] T006 [US1] Run the focused Jest suite with `npm test -- --runInBand __tests__/index-script-syntax.test.js` and resolve any regression in `__tests__/index-script-syntax.test.js`.
- [ ] T007 [US1] Execute the desktop and narrow-viewport browser scenarios from `specs/029-fix-pb-enlarge-button/quickstart.md` against the static app, including icon visibility, interaction states, and opening the matching full-screen detail view.

**Checkpoint**: User Story 1 is independently complete when the focused Jest suite passes and the browser scenarios confirm visible, consistent, usable controls on all rendered Bike power PB tiles.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Complete regression verification and confirm the feature remains within scope.

- [ ] T008 Run the full root regression suite with `npm test -- --runInBand` and confirm no PB values, chart behavior, or detail-view behavior regress.
- [ ] T009 [P] Review the final diff against `specs/029-fix-pb-enlarge-button/contracts/ui.md` and confirm no new dependency, storage, network, or unrelated UI change was introduced.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 has no dependencies and establishes the baseline.
- **Foundational (Phase 2)**: T002 depends on T001 and confirms the existing shared control path.
- **User Story 1 (Phase 3)**: T003, T004, and T005 depend on T002; T003 can be prepared in parallel with T004 because it changes a different file, but the assertion must describe the intended contract.
- **Polish (Phase 4)**: T008 and T009 depend on T006 and T007 completing successfully.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other user stories; it is the complete MVP.

### Parallel Opportunities

- T003 in `__tests__/index-script-syntax.test.js` and T004 in `src/dashboard-power-pb.js` can be worked on in parallel after T002 because they touch different files.
- T009 can be performed independently of the full test run after T007, while T008 runs the full suite.

## Parallel Example: User Story 1

```text
Task: "Extend the focused control assertions in __tests__/index-script-syntax.test.js for icon visibility and detail wiring"
Task: "Correct the shared enlarge-control presentation in src/dashboard-power-pb.js"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 and T002 to establish the baseline and shared-control constraints.
2. Complete T003, T004, and T005 for the focused regression and implementation.
3. Complete T006 and T007 to validate the story independently.
4. Stop at the MVP checkpoint once all Bike power tile controls are visible and usable.

### Incremental Delivery

1. Baseline and confirm the existing shared path.
2. Implement the presentation correction while preserving the detail action.
3. Run focused Jest and browser validation.
4. Run the full root suite and final scope review.

## Notes

- `[P]` tasks touch different files or can run independently without incomplete-task dependencies.
- `[US1]` maps tasks to the single P1 story in `spec.md`.
- No tasks alter PB qualification, chart calculations, supported durations, or network behavior.
