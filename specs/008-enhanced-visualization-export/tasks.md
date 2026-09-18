---

description: "Task list for Enhanced Visualization Export"
---

# Tasks: Enhanced Visualization Export

**Input**: Design documents from `specs/008-enhanced-visualization-export/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/export-ui.md](contracts/export-ui.md), [quickstart.md](quickstart.md)

**Tests**: Included because the specification requires independently testable user journeys and the constitution requires narrow Jest verification for reusable modules and dashboard behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently after the foundational export model exists.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing static-browser boundaries and asset inputs before implementation.

- [X] T001 [P] Verify the four required local export assets and their repository paths in `assets/logo.png`, `assets/Strava_Logo.svg`, `assets/Instagram_logo_2016.svg`, and `assets/QR Code webpage.png`
- [X] T002 [P] Record the single public-domain configuration point and QR/domain consistency check in `src/export-utils.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the pure export model and shared browser state used by every story.

- [X] T003 Extend `src/export-utils.js` with validated `ExportTarget`, `FilterSummary`, `LegendModel`, and `BrandAssetSet` helper factories while preserving the existing CommonJS exports and `window.exportUtils` bridge
- [X] T004 [P] Add Jest coverage for target validation, non-empty filter summaries, optional legends, local asset references, and 1080px square export metadata in `__tests__/export-utils.test.js`
- [X] T005 Add stable export target keys, PB tile slug handling, and asset preload state to the existing export state block in `index.html`
- [X] T006 Add stable IDs/data attributes for visualization wrappers and generated Personal Best tile blocks in `index.html` so each export target resolves to exactly one DOM element

**Checkpoint**: Shared export metadata, asset configuration, and capture-target identity are ready; user story implementation can now proceed.

---

## Phase 3: User Story 1 - Export a branded visualization card (Priority: P1) 🎯 MVP

**Goal**: Generate a square preview for each visualization with a separate headline, active context, applicable legend, branding, QR code, and domain.

**Independent Test**: Load data, apply a non-default visualization filter, export a visualization, and verify the preview contains the selected chart/map, a non-overlapping headline, active filter summary, applicable legend, TriAnalytica logo, QR code, domain, and platform branding.

### Tests for User Story 1

- [X] T007 [P] [US1] Add pure helper tests for tab titles, tab-specific filter summaries, Heart rate versus Pace legend selection, and omission of empty/non-applicable context in `__tests__/export-utils.test.js`
- [X] T008 [P] [US1] Add inline-script and markup assertions for separate export composition regions, local logo/QR references, and all six visualization capture targets in `__tests__/index-script-syntax.test.js`

### Implementation for User Story 1

- [X] T009 [US1] Implement tab-specific export context collection for sport, timeframe/date range, equipment metric/type, timeline mode/type, and heatmap sport in `index.html`
- [X] T010 [US1] Implement export composition in `index.html` with explicit non-overlapping header, captured-content, context/legend, and footer regions on the existing 1080px square canvas
- [X] T011 [US1] Preload and draw `assets/logo.png`, `assets/Strava_Logo.svg`, `assets/Instagram_logo_2016.svg`, and `assets/QR Code webpage.png` before final canvas serialization in `index.html`
- [X] T012 [US1] Replace the current chart-only capture path in `index.html` with validated `ExportTarget` metadata, active filters, optional legends, and readable headline placement while preserving `html2canvas` and `computeSquareFit`
- [X] T013 [US1] Add no-data, missing-asset, and capture-failure handling to `index.html` so no blank or broken export preview is produced

**Checkpoint**: Each visualization tab independently produces a branded, context-rich preview or a clear no-data/error message.

---

## Phase 4: User Story 2 - Download and share the export (Priority: P1)

**Goal**: Make the branded preview reliably downloadable and locally shareable without stale state.

**Independent Test**: Generate a preview, download it, reopen the PNG locally, then close a second preview without downloading and verify the next export starts cleanly.

### Tests for User Story 2

- [X] T014 [P] [US2] Extend filename and export-state tests for tab downloads, close/reset behavior, and local-only data URLs in `__tests__/export-utils.test.js`
- [X] T015 [P] [US2] Add markup assertions for preview download/close controls and missing-asset error messaging in `__tests__/index-script-syntax.test.js`

### Implementation for User Story 2

- [X] T016 [US2] Update `downloadExportedImage()` and export state cleanup in `index.html` to use the selected target slug, preserve the existing PNG filename convention, and clear preview state after close
- [X] T017 [US2] Ensure the preview modal in `index.html` exposes download and close actions for every successful target and cannot retain a previous image after dismissal
- [X] T018 [US2] Add local asset-cache reuse and explicit user-facing failure messaging in `index.html` so required asset load failures cannot produce downloadable broken images

**Checkpoint**: A user can move from any successful preview to a local PNG download and can cancel without affecting the next export.

---

## Phase 5: User Story 3 - Export a personal-best detail (Priority: P2)

**Goal**: Add a per-tile export action that captures only the selected data-bearing Personal Best detail.

**Independent Test**: Open Personal Bests, export two different data-bearing tiles, and verify each image contains only the selected tile, its title/metric, and a distinct tile filename; empty tiles expose no misleading export.

### Tests for User Story 3

- [X] T019 [P] [US3] Add assertions for one export action per data-bearing Personal Best tile, stable tile target IDs, and no action on empty tiles in `__tests__/index-script-syntax.test.js`
- [X] T020 [P] [US3] Add PB tile key/title/filename and target-validation cases to `__tests__/export-utils.test.js`

### Implementation for User Story 3

- [X] T021 [US3] Extend `appendPbDetailButton(header, model)` in `index.html` with an accessible `Export for Instagram` action while preserving the existing full-screen action
- [X] T022 [US3] Assign each rendered data-bearing PB block a stable export target ID and pass its tile metadata from the distance, elevation, longest, and bike-power renderers in `index.html`
- [X] T023 [US3] Route PB tile actions through the shared export pipeline in `index.html` so capture targets the selected tile rather than `pbColumnsContainer` and uses a stable PB filename slug
- [X] T024 [US3] Add PB-specific no-data and stale-target guards in `index.html` so removed or empty tiles cannot be exported

**Checkpoint**: Personal Best tile exports work independently while full Personal Best tab export and full-screen detail behavior remain intact.

---

## Phase 6: User Story 4 - Recognize export targets consistently (Priority: P2)

**Goal**: Make all visualization and PB export controls consistently labeled, branded, accessible, and usable at narrow widths.

**Independent Test**: Inspect the six visualization controls and multiple PB tile controls on desktop and narrow viewports; confirm each uses `Export for ...`, shows both local platform logos, and keeps label/icon content readable.

### Tests for User Story 4

- [X] T025 [P] [US4] Add coverage that every visualization export control uses `Export for ...`, references both platform logo assets, and exposes a target-specific accessible label in `__tests__/index-script-syntax.test.js`
- [X] T026 [P] [US4] Add helper coverage for consistent target display labels and platform asset metadata in `__tests__/export-utils.test.js`

### Implementation for User Story 4

- [X] T027 [US4] Update the six visualization export buttons in `index.html` to use `Export for ...`, include the Strava and Instagram logos, and retain stable target-specific accessible labels
- [X] T028 [US4] Style generated PB export buttons and updated visualization controls in `index.html` so logos and text remain legible without layout overflow at narrow widths
- [X] T029 [US4] Invoke the existing icon refresh after dynamically adding PB export controls and verify keyboard/focus behavior for both export and full-screen actions in `index.html`

**Checkpoint**: All supported export entry points are discoverable and visually consistent without changing unrelated dashboard controls.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature, performance, privacy boundary, and documentation-driven smoke scenarios.

- [X] T030 [P] Add final privacy and no-network assertions for export paths and local asset URLs in `__tests__/index-script-syntax.test.js`
- [X] T031 [P] Review export composition dimensions, asset caching, and under-5-second preview behavior in `index.html` against the performance goals in `specs/008-enhanced-visualization-export/plan.md`
- [X] T032 Run the focused export and inline-script Jest tests from `specs/008-enhanced-visualization-export/quickstart.md`
- [X] T033 Run the complete root Jest suite and record any unrelated pre-existing failures without changing unrelated modules in `specs/008-enhanced-visualization-export/quickstart.md`
- [X] T034 Execute the browser smoke scenarios for filters, legends, downloads, PB tiles, narrow layouts, QR/domain visibility, and asset failure from `specs/008-enhanced-visualization-export/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T001 and T002 can run in parallel.
- **Foundational (Phase 2)**: Depends on Phase 1; T004 can run in parallel with T003, while T005 and T006 depend on the shared export design.
- **User Stories (Phase 3-6)**: Depend on Phase 2. US1 is the MVP foundation for the shared composition; US2 extends its handoff; US3 and US4 depend on the shared pipeline but are independently testable after US1.
- **Polish (Phase 7)**: Depends on all desired stories and includes the final executable validation.

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only; delivers the MVP branded visualization export.
- **US2 (P1)**: Depends on US1's preview data shape but can validate download/reset behavior independently.
- **US3 (P2)**: Depends on the shared target/composition pipeline from Phase 2 and US1; does not depend on US2's download changes.
- **US4 (P2)**: Depends on shared export controls from Phase 2 and is best completed after US3 so both static and generated controls use the same contract.

### Parallel Opportunities

- T001 and T002 can run in parallel.
- T004 can run in parallel with foundational implementation planning, and T007/T008 can run in parallel because they touch different test concerns.
- Within each story, test tasks marked `[P]` can run in parallel before implementation.
- After US1 is complete, US2 and US3 can be staffed in parallel when their shared pipeline interfaces are stable; US4 follows after control markup decisions settle.
- T030 and T031 can run in parallel before final test execution.

## Parallel Example: User Story 1

```text
Task: T007 [US1] Extend pure export helper tests in __tests__/export-utils.test.js
Task: T008 [US1] Extend inline-script and markup assertions in __tests__/index-script-syntax.test.js
```

## Parallel Example: User Story 3

```text
Task: T019 [US3] Add PB tile markup assertions in __tests__/index-script-syntax.test.js
Task: T020 [US3] Add PB target and filename cases in __tests__/export-utils.test.js
```

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 and Phase 2.
2. Implement US1 and run its focused tests plus the browser smoke scenario.
3. Stop for validation: every visualization can generate the branded, filtered, legended preview with a clear failure path.

### Incremental Delivery

1. Add US2 for dependable local download and reset behavior.
2. Add US3 for individual Personal Best tile exports.
3. Add US4 for consistent labels, logos, accessibility, and responsive controls.
4. Complete Phase 7 and run the full quickstart validation.

## Notes

- Every task starts with `- [ ]`, has a sequential `T###` ID, uses `[P]` only for parallel work, and includes a concrete repository path.
- User story tasks carry exactly one `[US#]` label matching `spec.md`.
- Existing public utility exports must remain compatible unless the corresponding call sites and tests are updated together.
