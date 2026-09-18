---

description: "Task list for export refinements"
---

# Tasks: Export Refinements

**Input**: Design documents from `/specs/009-export-refinements/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [export-ui.md](contracts/export-ui.md), [quickstart.md](quickstart.md)

**Tests**: Included because the feature changes reusable export helpers and dashboard behavior; browser-only pixel and responsive checks remain in the quickstart.

## Phase 1: Setup

**Purpose**: Establish the shared export contracts before story-specific changes.

- [x] T001 [P] Add canonical export domain and export-control constants to `src/export-utils.js`, preserving CommonJS and `window.exportUtils` exports.
- [x] T002 [P] Add focused utility test fixtures for logo source dimensions, available-control snapshots, and export target metadata in `__tests__/export-utils.test.js`.

## Phase 2: Foundational

**Purpose**: Build the pure layout and control metadata used by all export stories.

- [x] T003 Implement a pure contain-fit helper in `src/export-utils.js` that uses source width/height and a bounding box, preserves aspect ratio, and returns zero dimensions for invalid input.
- [x] T004 [P] Add Jest coverage in `__tests__/export-utils.test.js` for wide TriAnalytica/Strava source ratios, bounded output dimensions, centered offsets, and invalid dimensions.
- [x] T005 Implement available filter/view control metadata helpers in `src/export-utils.js` that preserve each control label, order, selected state, and availability without using DOM-only APIs.
- [x] T006 [P] Add Jest coverage in `__tests__/export-utils.test.js` for available-control filtering, selected-state preservation, and empty groups.

## Phase 3: User Story 1 - Share an undistorted export (Priority: P1)

**Goal**: Generate an accurate export composition with the canonical domain, proportional branding, and current available filter/view controls.

**Independent Test**: Generate an export from a populated visualization and verify logo geometry, domain text, active filter summary, available-control picture, QR code, and readable composition at desktop and narrow sizes.

- [x] T007 [US1] Update `getExportBrandConfig` in `src/export-utils.js` to return `https://dennis-e.github.io/Triathlon/` and keep all local asset paths stable.
- [x] T008 [US1] Update export context collection in `index.html` so available filter/view control labels and selected states are derived from the current dashboard controls for each supported visualization.
- [x] T009 [US1] Update `drawExportComposition` in `index.html` to render the available-control picture in a bounded non-interactive region and keep the active filter summary and applicable legend readable without overlap.
- [x] T010 [US1] Replace fixed logo draw rectangles in `index.html` with natural-dimension contain fitting from the shared helper, preserving TriAnalytica and Strava source aspect ratios wherever an export logo is drawn.
- [x] T011 [US1] Remove Strava and Instagram logo draw calls from the generated composition in `index.html` while retaining the TriAnalytica logo, QR code, domain, headline, filters, and legends.
- [x] T012 [P] [US1] Extend `__tests__/export-utils.test.js` with the exact canonical-domain assertion and asset/layout metadata assertions.
- [x] T013 [P] [US1] Update `__tests__/index-script-syntax.test.js` to assert available-control composition, canonical domain usage, proportional-fit wiring, and absence of platform-logo draw calls from the export composition.

## Phase 4: User Story 2 - Understand the export action (Priority: P1)

**Goal**: Make every supported export action recognizable and keep platform branding confined to the control.

**Independent Test**: Inspect all visualization controls at desktop and narrow widths, activate one, and verify the exact label/icon presentation and logo-free preview/download.

- [x] T014 [US2] Update all supported visualization export buttons in `index.html` to display exactly `Export for Insta / Strava`, with matching accessible labels and a visibly larger responsive Strava icon.
- [x] T015 [US2] Update `__tests__/index-script-syntax.test.js` static assertions for the exact export label, supported control count, Strava control icon presence, and removal of Instagram icons from visualization controls where required by the UI contract.
- [x] T016 [US2] Validate preview close/reset and download paths in `index.html` so repeated exports cannot retain platform-logo content or stale preview state.

## Phase 5: User Story 3 - Export a personal-best detail in context (Priority: P2)

**Goal**: Remove overview/tile export clutter and provide one export action for the currently expanded PB detail.

**Independent Test**: Confirm no export action on the PB overview or collapsed tiles, expand two different data-bearing tiles in sequence, and verify the popup action exports only the current detail; verify no-data behavior.

- [x] T017 [US3] Remove the Personal Bests overview export button and the per-tile export button creation from `index.html`, leaving the existing detail/full-screen action intact.
- [x] T018 [US3] Add one export control to the `pbDetailOverlay` markup in `index.html` with the standard label and accessible title, keeping it inside the popup header.
- [x] T019 [US3] Wire the popup export control in `openPbDetail`/`closePbDetail` in `index.html` to the current `activePbDetailModel`, create a `pb-tile` target, and remove/reset the control when the popup closes or another detail opens.
- [x] T020 [US3] Preserve the existing no-data guard in `index.html` within `exportVisualizationTarget` and ensure a detail without records cannot produce a blank PB export.
- [x] T021 [P] [US3] Extend `__tests__/index-script-syntax.test.js` assertions for absent overview/tile export buttons, popup export control wiring, current-detail targeting, and close/reset behavior.
- [x] T022 [P] [US3] Extend `__tests__/export-utils.test.js` for PB detail target metadata, stable PB slugs, metric context, and no-data target handling.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify the integrated export behavior and document the final validation path.

- [x] T023 [P] Run the root Jest suite defined by `package.json` with `npm test -- --runInBand` and resolve regressions in `__tests__/export-utils.test.js` or `__tests__/index-script-syntax.test.js`.
- [x] T024 Serve the static app with `python -m http.server 8000` and execute all desktop/narrow viewport scenarios from `specs/009-export-refinements/quickstart.md`, including preview/download pixel inspection.
- [x] T025 Review changed export copy and privacy wording in `index.html` and `specs/009-export-refinements/contracts/export-ui.md` for consistency with local browser processing and the canonical domain.

## Dependencies

- T001-T002 can run in parallel.
- T003 must precede T004 and T010.
- T005 must precede T006 and T008-T009.
- T007-T013 form the independently testable US1 increment; T012-T013 can run in parallel after implementation changes.
- T014-T016 form the independently testable US2 increment and depend on T011 for logo-free image output.
- T017-T022 form the independently testable US3 increment; T021-T022 can run in parallel after the PB wiring is complete.
- T023 depends on T004, T006, T012-T013, T015, T021-T022; T024 depends on all implementation phases.

## Parallel Execution Examples

### User Story 1

```text
Parallel: T012, T013
Sequential prerequisite: T003 -> T004 and T005 -> T006
```

### User Story 2

```text
Parallel with US1 tests after shared composition work: T015
Sequential: T014 -> T016
```

### User Story 3

```text
Parallel: T021, T022 after T017-T020
```

## Implementation Strategy

1. Complete the pure helper and metadata foundation, then deliver US1 as the MVP because it fixes the exported artifact itself.
2. Apply the control wording/icon refinement and verify the platform-logo boundary as US2.
3. Move PB export ownership into the detail popup as US3.
4. Run automated tests, then perform the browser-only canvas and responsive checks from the quickstart.

## Completion Criteria

- All tasks above are checked after implementation and verification.
- Every task uses the required checkbox, sequential ID, optional `[P]` marker, story label where applicable, and an exact file path.
- The generated preview and downloaded export satisfy [export-ui.md](contracts/export-ui.md).
