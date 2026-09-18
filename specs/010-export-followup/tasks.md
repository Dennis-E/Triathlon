---

description: "Task list for export follow-up fixes"
---

# Tasks: Export Follow-up Fixes

**Input**: Design documents from `/specs/010-export-followup/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [export-ui.md](contracts/export-ui.md), [quickstart.md](quickstart.md)

**Tests**: Included because the feature fixes reusable export behavior, UI contracts, canvas layout, and an asynchronous browser capture failure.

## Phase 1: Setup

**Purpose**: Establish the shared UI and layout contracts for the follow-up.

- [x] T001 [P] Add export-control asset/order constants or helper metadata in `src/export-utils.js` for Strava icon, exact label, and Instagram icon.
- [x] T002 [P] Add test fixtures for ordered export controls, metadata block boundaries, and PB capture-target metadata in `__tests__/export-utils.test.js`.

## Phase 2: Foundational

**Purpose**: Build deterministic helpers needed by all three stories.

- [x] T003 Implement a pure sequential metadata-layout helper in `src/export-utils.js` that returns non-overlapping y-ranges for filters, available controls, legend, and footer boundary.
- [x] T004 [P] Add Jest coverage in `__tests__/export-utils.test.js` for empty filters, wrapped filter heights, variable control heights, legend placement after controls, and footer-boundary clamping.
- [x] T005 Add a stable PB detail capture-target helper or metadata contract in `src/export-utils.js` that preserves `kind: 'pb-tile'`, the active key/title, and a browser-capturable wrapper id.
- [x] T006 [P] Add Jest coverage in `__tests__/export-utils.test.js` for PB target metadata, active-detail replacement, and rejection of missing or no-data targets.

## Phase 3: User Story 1 - Recognize both sharing destinations (Priority: P1)

**Goal**: Restore Instagram visibility and place it to the right of the exact export label in every supported control.

**Independent Test**: Inspect all visualization controls and the open PB popup at desktop and narrow widths; verify Strava icon, label, Instagram icon order and visibility.

- [x] T007 [US1] Update visualization export controls in `index.html` to render Strava icon, `Export for Insta / Strava`, and Instagram icon in that order.
- [x] T008 [US1] Update the PB detail popup export control in `index.html` to use the same icon-label-icon order and responsive sizing.
- [x] T009 [US1] Preserve both supplied logo aspect ratios and keep the complete control sequence visible at narrow widths in `index.html`.
- [x] T010 [P] [US1] Update static UI assertions in `__tests__/index-script-syntax.test.js` for Instagram asset presence, right-of-label markup order, exact label count, and PB popup control coverage.

## Phase 4: User Story 2 - Read export metadata without collisions (Priority: P1)

**Goal**: Render filters, available controls, and legends sequentially without overlap or footer collisions.

**Independent Test**: Generate exports with no legend, with a legend, and with long/multiple filters; verify each metadata block has a distinct readable region.

- [x] T011 [US2] Implement sequential metadata position calculation in `index.html` using measured/wrapped filter and available-control heights before placing the legend.
- [x] T012 [US2] Update `drawAvailableControls` and `drawExportComposition` in `index.html` to return and consume actual block bottoms, reserve footer/QR space, and clamp oversized content safely.
- [x] T013 [US2] Ensure the filter summary, available-control snapshot, legend, footer branding, domain, and QR code occupy separate bounded regions in `index.html`.
- [x] T014 [P] [US2] Add static assertions in `__tests__/index-script-syntax.test.js` for sequential layout helper usage, dynamic legend y-position, footer boundary, and absence of fixed overlapping coordinates.
- [x] T015 [P] [US2] Add pure layout assertions in `__tests__/export-utils.test.js` covering long filter text, many controls, no legend, and legend-after-controls cases.

## Phase 5: User Story 3 - Export the selected personal-best detail (Priority: P1)

**Goal**: Make the PB popup export capture reliable, detail-specific, and retryable after errors.

**Independent Test**: Open a data-bearing PB detail, activate export, verify the preview opens, switch to another detail and repeat, then verify no-data and retry behavior.

- [x] T016 [US3] Add a dedicated browser-capturable PB wrapper around `pbDetailChart` in `index.html` without changing the popup's visible chart presentation.
- [x] T017 [US3] Update `openPbDetail` and `closePbDetail` in `index.html` to mount, reset, and retain the PB capture wrapper while the selected detail export request is active.
- [x] T018 [US3] Update `exportActivePbDetail` in `index.html` to target the stable PB wrapper, snapshot the current active detail key/title, and preserve the selected model for asynchronous capture.
- [x] T019 [US3] Preserve and strengthen the `exportVisualizationTarget` failure path in `index.html` so asset/capture errors reset to idle, clear stale preview state, show a clear message, and allow retry.
- [x] T020 [P] [US3] Extend `__tests__/index-script-syntax.test.js` for wrapper target usage, active-detail snapshotting, popup lifecycle reset, no-data guard, and retry-state reset.
- [x] T021 [P] [US3] Extend `__tests__/export-utils.test.js` for PB wrapper target validation and stable filename/detail metadata.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete correction against automated and browser scenarios.

- [x] T022 [P] Run the focused export suites through `npm test -- --runInBand --runTestsByPath __tests__/export-utils.test.js __tests__/index-script-syntax.test.js` and resolve regressions in `src/export-utils.js` or `index.html`.
- [x] T023 Run the complete root regression suite defined in `package.json` with `npm test -- --runInBand` and verify no import, visualization, or tab-navigation regressions.
- [x] T024 Serve the app with `python -m http.server 8000` and execute desktop/narrow control, metadata-collision, PB-success, PB-switch, PB-no-data, and PB-retry scenarios from `specs/010-export-followup/quickstart.md`.
- [x] T025 Review `specs/010-export-followup/contracts/export-ui.md` and `index.html` for exact label, icon-only-in-controls, local-processing, and error-copy consistency.

## Dependencies

- T001-T002 may run in parallel.
- T003 must precede T004, T011, and T012; T005 must precede T006, T017, and T018.
- US1 tasks T007-T010 are independently testable and can proceed after T001-T002.
- US2 tasks T011-T015 depend on the foundational layout helper; T014-T015 can run in parallel after implementation.
- US3 tasks T016-T021 depend on the PB target contract; T020-T021 can run in parallel after T016-T019.
- T022 depends on T010, T014-T015, and T020-T021; T023-T025 follow the focused validation.

## Parallel Execution Examples

### User Story 1

```text
Parallel: T010 with documentation review of T001/T002
Sequential implementation: T007 -> T008 -> T009
```

### User Story 2

```text
Parallel after implementation: T014 and T015
```

### User Story 3

```text
Parallel after implementation: T020 and T021
```

## Implementation Strategy

1. Complete the pure contracts and layout helpers.
2. Deliver US1 first as the smallest visible correction: restore the Instagram icon order.
3. Deliver US2 as the export readability correction, using sequential measured metadata placement.
4. Deliver US3 as the reliability correction, replacing the raw SVG capture target with a stable wrapper and preserving retryable state.
5. Run focused tests, the complete root suite, and browser scenarios at both desktop and narrow widths.

## Completion Criteria

- All tasks are checked after implementation and verification.
- Every task follows the required checkbox, sequential ID, optional `[P]`, story label where required, and exact file-path format.
- The controls, metadata layout, and PB popup behavior satisfy [export-ui.md](contracts/export-ui.md).
