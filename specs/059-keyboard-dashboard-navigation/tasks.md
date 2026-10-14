# Tasks: Keyboard Navigation for Visualizations

**Input**: Design documents from `/specs/059-keyboard-dashboard-navigation/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/dashboard-keyboard-navigation.md](contracts/dashboard-keyboard-navigation.md), [quickstart.md](quickstart.md)

**Tests**: Focused tests are included because the implementation plan and repository constitution require keyboard/dashboard behavior validation. Add behavior tests before their corresponding implementation tasks.

**Organization**: Tasks are grouped by the two prioritized user stories. User Story 2 builds on the successful keyboard actions delivered by User Story 1.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm existing project infrastructure.

No project initialization is required: the static browser app, dashboard scripts, root Jest configuration, and focused test files already exist. No setup task is needed.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Resolve shared prerequisites before story implementation.

No new shared infrastructure or persisted data is required. User Story 1 introduces the common action behavior; User Story 2 uses its successful-action outcomes for visual feedback.

## Phase 3: User Story 1 - Navigate visualizations and filter values by keyboard (Priority: P1) 🎯 MVP

**Goal**: Preserve horizontal visualization cycling; let users change the focused active filter using up/down; immediately refresh the visualization and show current filter values above it.

**Independent Test**: Use Left/Right to cycle between visualization tabs, including wraparound. Focus discrete filter choices and use Up/Down to change only that filter, including wraparound; verify chart updates and active filter summaries match current settings. Verify native select/range/checkbox behavior is not intercepted or applied to unrelated filters.

### Tests for User Story 1

- [X] T001 [P] [US1] Add unit tests for custom discrete single-choice stepping, wraparound, unavailable/single-choice no-ops, multi-select checkbox no-op behavior, and existing Left/Right tab wrap in `__tests__/tab-navigation.test.js`.
- [X] T002 [P] [US1] Add static markup and inline-script integration assertions for active-filter summary placement and keyboard dispatch hooks in `__tests__/index-script-syntax.test.js`.

### Implementation for User Story 1

- [X] T003 [US1] Implement pure, browser/CommonJS-compatible stepping helpers for custom discrete single-choice filter groups and boundary handling in `src/tab-navigation.js`.
- [X] T004 [US1] Wire Up/Down input for the focused eligible filter in the active visualization through existing filter update/render callbacks in `src/dashboard-tabs.js` and `index.html`; preserve native select/range/checkbox semantics and keep focus on a newly selected custom button choice.
- [X] T005 [US1] Add a derived active-filter summary above the active visualization and synchronize its labels and current selected values after all filter changes in `index.html` and `src/dashboard-tabs.js`.

**Checkpoint**: User Story 1 works independently; left/right tab cycling and focused filter value changes update the visualization, with no unrelated filters changed and a synchronized summary.

## Phase 4: User Story 2 - Recognize available keyboard directions (Priority: P2)

**Goal**: Add small directional arrows around the active visualization and briefly emphasize the direction of each successful keyboard action without obscuring content or replacing focus indication.

**Independent Test**: With User Story 1 available, press each supported direction where an action can succeed. Confirm only the matching cue briefly emphasizes within 250 ms and clears within 1.5 seconds; no-op input shows no success cue; repeated input retriggers feedback; reduced-motion preference suppresses animated blinking while retaining brief static feedback.

### Tests for User Story 2

- [X] T006 [US2] Add integration assertions for four directional cues, non-interactive accessibility treatment, reduced-motion styling, success-only activation wiring, and cue timeout no greater than 1.5 seconds in `__tests__/index-script-syntax.test.js`.

### Implementation for User Story 2

- [X] T007 [US2] Add four small non-interactive directional cue elements around the visualization region and brief/reduced-motion feedback styling in `index.html`.
- [X] T008 [US2] Trigger the corresponding cue only after successful left/right tab changes or up/down filter value changes, including reliable retriggering on rapid repeats, in `src/dashboard-tabs.js` and `index.html`.

**Checkpoint**: User Stories 1 and 2 work together; each successful action has brief, matching feedback and unsuccessful actions do not indicate success.

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify the combined feature and its user-facing behavior.

- [X] T009 Run the focused Jest suites `__tests__/tab-navigation.test.js` and `__tests__/index-script-syntax.test.js`, then execute the browser scenarios in `specs/059-keyboard-dashboard-navigation/quickstart.md` and resolve any failures in the affected frontend files.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Existing infrastructure is ready; no task required.
- **Foundational (Phase 2)**: No new prerequisite task is required.
- **User Story 1 (Phase 3)**: Can begin immediately. T001 and T002 can run in parallel; T003 follows T001; T004 follows T003; T005 follows T004 and the markup assertions in T002.
- **User Story 2 (Phase 4)**: Depends on User Story 1 so cue feedback can represent completed tab/filter actions. T006 precedes T007; T008 follows T007 and the US1 action wiring.
- **Polish (Phase 5)**: T009 follows completion of both stories.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on another story; independently testable and is the MVP.
- **User Story 2 (P2)**: Depends on User Story 1's keyboard action success points; it can be tested independently once those actions exist.

### Parallel Opportunities

- **US1**: T001 and T002 touch separate test files and can be authored in parallel. The remaining US1 tasks share implementation ownership or depend on earlier behavior and should proceed in order.
- **US2**: No parallel implementation tasks are identified because the cue assertions and markup/wiring touch the same integration surface and are ordered test-first.
- **Across stories**: No parallel story execution; US2 consumes successful-navigation results from US1.

## Parallel Example: User Story 1

```text
Task: T001 — Add filter/tab navigation unit tests in __tests__/tab-navigation.test.js
Task: T002 — Add summary and dispatch integration assertions in __tests__/index-script-syntax.test.js
```

## Parallel Example: User Story 2

```text
No safe parallel pair: T006 adds assertions in __tests__/index-script-syntax.test.js, then T007/T008 implement and wire the cues in index.html and src/dashboard-tabs.js.
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Add the US1 unit and integration assertions (T001–T002).
2. Implement filter stepping, focused keyboard dispatch, and the derived filter summary (T003–T005).
3. Validate the US1 checkpoint independently. This delivers keyboard navigation and immediately visible active filter values without requiring directional blink cues.

### Incremental Delivery

1. Complete US1 and validate the P1 navigation/value-change journey.
2. Add accessible directional cues and successful-action feedback (US2).
3. Run focused automated suites and the browser validation guide (T009).

## Format Validation

All executable tasks use the required `- [ ] TNNN [P?] [USn] Description ...path...` format, have sequential IDs, include an exact file path, and carry story labels only in user-story phases. Setup and foundational sections contain no fictitious work items.
