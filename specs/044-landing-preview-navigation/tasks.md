---

description: "Task list for landing preview and responsive visualization navigation"
---

# Tasks: Landing Preview and Navigation

**Input**: Design documents from `specs/044-landing-preview-navigation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/visualization-navigation-ui.md`, `quickstart.md`

**Organization**: Tasks are grouped by user story so each increment can be independently verified.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with another marked task because they affect different files and have no dependency on incomplete work.
- **[Story]**: User story from `spec.md`.
- All implementation tasks name their target file paths.

## Phase 1: Setup

The existing project and test infrastructure already satisfy this feature's prerequisites. No setup or dependency-installation task is needed.

## Phase 2: Foundational

No shared implementation prerequisite is needed; the preview verification and navigation increment can be validated as separate user stories.

## Phase 3: User Story 1 - Discover Workout Time Preview (Priority: P1)

**Story goal**: Visitors can identify the existing Workout Time preview, understand its purpose, and reach the current import gate without duplicate cards.

**Independent test**: Open the landing page before import; confirm there is exactly one titled Workout Time card with its preview asset and description; activate it and confirm the existing import gate appears. Run the preview asset test suite.

- [X] T001 [US1] Verify the existing Workout Time preview card, `workout-time.png` asset, dashboard destination, and import-gate behavior in `index.html` and `__tests__/preview-assets.test.js`; if the card is actually absent in the landing-page DOM, repair that existing card rather than adding a duplicate, then verify the behavior in a browser.

## Phase 4: User Story 2 - Reach Every Visualization on Any Screen (Priority: P1)

**Story goal**: The existing visualization tabs fit the available width, and when they overflow visitors can move through them in both directions without losing tab semantics or keyboard access.

**Independent test**: At a fitting viewport, confirm both controls are hidden. At an overflowing viewport, use each control repeatedly and confirm it reveals the next clipped tab fully without skipping; verify scroll-boundary controls, resize recovery, touch/trackpad scrolling, keyboard operation, unchanged tab activation, and absence of page-level horizontal overflow.

- [X] T002 [P] [US2] Add unit tests with injected tab bounds and viewport bounds for selecting the nearest clipped tab in each direction, preserving item order, making the target fully visible with minimum movement, and stopping at scroll boundaries in `__tests__/tab-navigation.test.js`.
- [X] T003 [P] [US2] Add markup-contract tests for sibling directional buttons, accessible names, hidden/available state hooks, and unchanged tablist wiring in `__tests__/index-script-syntax.test.js`.
- [X] T004 [US2] Implement and export a pure next-clipped-tab/reveal-offset helper with CommonJS and `window.dashboardTabNavigation` bridges in `src/tab-navigation.js`, satisfying the geometry cases in `__tests__/tab-navigation.test.js`.
- [X] T005 [US2] Wrap the existing visualization tablist in a width-constrained horizontal viewport and add left/right sibling buttons showing `<<` and `>>` with accessible action names in `index.html`; preserve all nine tab IDs, order, panel links, labels, and existing inline selection/keydown handlers.
- [X] T006 [US2] Wire initialization, next-tab scrolling, active/focused-tab visibility, and control-state updates on scroll and resize/content-size changes in `src/dashboard-tabs.js`; keep controls outside the tablist and use the helper from `src/tab-navigation.js`.
- [X] T007 [US2] Run the focused Jest suites for tab navigation, page markup/script syntax, and preview assets, then complete the fitting, overflow, repeated-step, boundary, resize, pointer/touch, and keyboard scenarios in `specs/044-landing-preview-navigation/quickstart.md` and fix any regressions in the relevant files.

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T008 Review `index.html`, `src/dashboard-tabs.js`, `src/tab-navigation.js`, and `__tests__/index-script-syntax.test.js` against `specs/044-landing-preview-navigation/contracts/visualization-navigation-ui.md`; confirm no new dependency, network request, page-level horizontal overflow, obscured tab labels, or change to the existing Workout Time preview/import behavior, and record the validation outcome in `specs/044-landing-preview-navigation/quickstart.md`.

## Dependencies & Execution Order

### User Story Completion Order

- **US1** can be verified independently and does not block the navigation behavior.
- **US2** can be implemented independently of US1. Both are P1; implement US1 as the smallest first deliverable, then the responsive navigation story.
- Complete T002 and T003 before their respective implementations. Complete T004 and T005 before T006 integration. Complete T006 before the end-to-end browser verification in T007. T008 is the final cross-cutting review.

### Dependency Graph

```text
T001 (US1) — independent

T002 (US2 unit tests) ──> T004 (pure navigation helper) ──┐
                                                          ├──> T006 (DOM orchestration) ──> T007 ──> T008
T003 (US2 markup tests) ──> T005 (responsive tab markup) ─┘
```

### Parallel Execution Examples

- **US1**: T001 can be completed independently of all US2 tasks.
- **US2 test preparation**: T002 and T003 can run in parallel because they edit separate test files.
- **US2 implementation after the tests are in place**: T004 (`src/tab-navigation.js`) and T005 (`index.html`) can be implemented in parallel; T006 integrates both and must wait for them.

## Implementation Strategy

1. **MVP**: Complete US1's T001 verification; the preview already exists in the inspected source, so only repair it if a real landing-page check proves it is missing.
2. **Responsive navigation increment**: Add and pass focused unit/markup tests, implement the geometry helper and responsive markup, then wire DOM scroll/resize behavior.
3. **Verify**: Run the focused Jest suites and manual browser scenarios in `quickstart.md`; finish with the privacy, compatibility, accessibility, and overflow review.
