---

description: "Task list template for feature implementation"
---

# Tasks: Instagram-Ready Visualization Export

**Input**: Design documents from `/specs/007-instagram-export-button/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/instagram-export-ui.md, quickstart.md

**Tests**: Not explicitly requested in the feature specification beyond the narrowest-scope
verification already mandated by the project constitution. Jest tests are included only for
the new pure/DOM-free `src/export-utils.js` helpers (per Constitution Principle III); no
contract/integration test suite is added beyond that and the manual `quickstart.md` checks.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in each description

## Path Conventions

Single project (per plan.md): `src/` and `__tests__/` at repository root, `index.html` at
repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the new dependency and skeleton module shared by every user story.

- [X] T001 Add the `html2canvas` CDN `<script>` tag to `index.html`'s `<head>`, alongside the
  existing Chart.js/Leaflet/PapaParse `<script>` tags (no bundler, no package.json entry, per
  Constitution Principle I).
- [X] T002 Create `src/export-utils.js` with the CommonJS `module.exports` + `window.exportUtils`
  bridge skeleton (empty functions to be filled in Phase 2), following the
  `src/tab-navigation.js` dual-target pattern.
- [X] T003 [P] Create `__tests__/export-utils.test.js` with a `require('../src/export-utils')`
  smoke test asserting the module loads and exposes the functions added in Phase 2.

**Checkpoint**: Dependency loads in the browser; test scaffold runs (`npm test -- export-utils`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure, testable helpers and shared UI scaffolding that every user story's tasks
depend on. No user-story-specific behavior yet.

**⚠️ CRITICAL**: No user story phase can be considered complete until these are done.

- [X] T004 [P] In `src/export-utils.js`, implement `computeSquareFit(sourceWidth, sourceHeight, targetSize)`
  — pure "contain"/letterbox math per `research.md` §3: returns `{ drawWidth, drawHeight, offsetX, offsetY }`
  such that the scaled source fully fits inside a `targetSize` × `targetSize` square with no
  dimension exceeding `targetSize` (data-model.md: `width` always equals `height`, FR-009).
- [X] T005 [P] In `src/export-utils.js`, implement `getTabDisplayTitle(tabName)` returning the
  human-readable title text per `data-model.md`'s `titleText` field, using the tab labels
  already defined for `totalDistance`, `heartratePace`, `equipment`, `equipmentTimeline`,
  `personalBests`, `heatmap` (matching `TAB_ORDER` in `src/tab-navigation.js`); throw/return
  `null` for any other value (FR-001 tab set is closed).
- [X] T006 [P] In `src/export-utils.js`, implement `generateExportFilename(tabName, date)`
  producing the exact pattern from `research.md` §6 / `contracts/instagram-export-ui.md`:
  `trianalytica-<tab-slug>-<yyyyMMdd-HHmmss>.png`, where `<tab-slug>` is a kebab-case slug of
  `tabName` (e.g., `heartratePace` → `heart-rate-pace`).
- [X] T007 [P] In `src/export-utils.js`, implement `hasExportableContent(tabName, flags)` per
  `research.md` §8 / `data-model.md`'s `blocked-no-data` state: a pure function taking a
  per-tab boolean/flags object (mirroring each tab's existing empty-state signal, e.g.
  `pbEmptyState`-equivalent, `heatmapEmptyState`-equivalent) and returning `true`/`false`
  without touching the DOM.
- [X] T008 In `index.html`, add the shared preview modal markup once (hidden by default): a
  container with an `<img>` for the composed image, a **Download** button, and a **Close**
  button/overlay-dismiss affordance, per `contracts/instagram-export-ui.md` §Preview Modal.
- [X] T009 In `index.html`, add a module-level export state guard (`idle` /
  `checking` / `blocked-no-data` / `capturing` / `previewing` / `capture-failed` per
  `data-model.md`'s Export Request State) so that additional export-button clicks are ignored
  while the current request is not `idle` (research.md §7).
- [X] T010 In `index.html`, add a shared `exportVisualizationTab(tabName)` function that: reads
  the guard state (T009), calls `hasExportableContent` (T007) using that tab's existing
  empty-state condition, and either shows an inline "nothing to export" message (FR-006) or
  proceeds to capture. Before calling `html2canvas`, wait for that tab's chart/map to finish any
  in-flight render/animation (e.g., poll/await the Chart.js instance's animation-complete state
  or a short settle delay after the tab became active) so a partially drawn frame is never
  captured (spec.md Edge Case: "chart still loading or animating at the moment of capture"); if
  rendering does not settle within a bounded wait, show a "please try again" message instead of
  capturing. Once settled, call `html2canvas` on that tab's chart container, then
  `computeSquareFit` (T004), draw the result plus the title from `getTabDisplayTitle` (T005)
  onto a new square `<canvas>`, and show it in the modal from T008 (state transitions per
  `data-model.md`).
- [X] T011 In `index.html`, wire the modal's **Download** button to convert the composed square
  canvas to a PNG data URL/Blob and trigger a save via a temporary `<a download>` element using
  the filename from `generateExportFilename` (T006), and wire **Close** to hide the modal,
  discard the in-memory image, and reset the guard state (T009) to `idle`.

**Checkpoint**: Foundation ready — `npm test -- export-utils` passes for T004–T007; the shared
modal, guard, capture, and download plumbing exist in `index.html` but no tab has a button yet.

---

## Phase 3: User Story 1 - Capture the current visualization as an image (Priority: P1)

**Goal**: Every visualization tab can produce a rasterized image of its current content on
export-button click, correctly reflecting the active tab and blocking when there's no data.

**Independent Test**: Open any visualization tab, click its export button, and confirm an
image representing that tab's current content is produced (or a clear "nothing to export"
message appears when the tab has no data).

- [X] T012 [US1] In `index.html`, add one export button to the Total Distance tab panel
  (`vizPanelTotalDistance`), wired to call `exportVisualizationTab('totalDistance')` (T010),
  passing/reusing that tab's existing "no data" condition to `hasExportableContent`.
- [X] T013 [US1] In `index.html`, add one export button to the Heart Rate & Pace tab panel
  (`vizPanelHeartratePace`), wired to call `exportVisualizationTab('heartratePace')`.
- [X] T014 [US1] In `index.html`, add one export button to the Equipment tab panel
  (`vizPanelEquipment`), wired to call `exportVisualizationTab('equipment')`.
- [X] T015 [US1] In `index.html`, add one export button to the Equipment Timeline tab panel
  (`vizPanelEquipmentTimeline`), wired to call `exportVisualizationTab('equipmentTimeline')`.
- [X] T016 [US1] In `index.html`, add one export button to the Personal Bests tab panel
  (`vizPanelPersonalBests`), wired to call `exportVisualizationTab('personalBests')`, reusing
  the existing `pbEmptyState` visibility as its "no data" signal (FR-006).
- [X] T017 [US1] In `index.html`, add one export button to the Heatmap tab panel
  (`vizPanelHeatmap`), wired to call `exportVisualizationTab('heatmap')`, reusing the existing
  `heatmapEmptyState` visibility as its "no data" signal (FR-006). Scope the `html2canvas`
  capture to the `heatmapMapContainer` element only (excluding the sport-filter button row
  `heatmapSportBtnAll`/`Run`/`Bike`/`Swim` and the panel header, per FR-002's "excluding
  surrounding page chrome"), and confirm the canvas-drawn route overlay is included even though
  the OSM tile background may render blank (documented limitation, research.md §2).
- [X] T018 [US1] Manually verify (per `quickstart.md` steps 1–2, 5–6) that: each of the six tabs
  shows a button in a consistent location; exporting a tab with data produces an image
  reflecting only that tab's current content within ~5 seconds (SC-001); exporting a tab
  without data shows the inline message instead of a broken/blank image; switching tabs before
  export always captures the newly active tab (FR-007).

**Checkpoint**: User Story 1 fully functional and independently testable/demoable.

---

## Phase 4: User Story 2 - Preview and download the exported image (Priority: P1)

**Goal**: After capture, the user can see a clear preview and reliably save the image locally.

**Independent Test**: Trigger an export, confirm the modal preview shows the captured image,
click Download, and verify a matching image file is saved; confirm Close discards state
cleanly with no side effects on the next export.

- [X] T019 [US2] In `index.html`, verify/refine the preview modal (T008) so the composed image
  is clearly displayed with visible **Download** and **Close** actions per
  `contracts/instagram-export-ui.md` §Preview Modal, and remains legible/usable at small/mobile
  viewport widths.
- [X] T020 [US2] In `index.html`, verify the Download action (T011) saves a `.png` file whose
  visible content matches the modal preview, using the `trianalytica-<tab-slug>-<yyyyMMdd-HHmmss>.png`
  filename pattern (T006).
- [X] T021 [US2] In `index.html`, verify the Close action (T011) discards the in-memory image,
  resets the guard state to `idle` (T009), and leaves no residual state that affects the next
  export request (FR-005).
- [X] T022 [US2] Manually verify (per `quickstart.md` steps 3–4, 7) that: Download produces a
  file matching the preview; Close without Download saves/sends nothing; rapid double-clicking
  an export button does not stack multiple modals.

**Checkpoint**: User Stories 1 AND 2 both fully functional — this is the MVP scope.

---

## Phase 5: User Story 3 - Consistent export entry point across all visualizations (Priority: P2)

**Goal**: Confirm uniform placement, styling, and behavior of the export button across all six
tabs, since each tab's individual export already works after Phases 3–4.

**Independent Test**: Visit each of the six visualization tabs in turn and confirm each one
exposes an export button in a consistent location that produces the correct preview for that
tab, with no cross-tab content bleed.

- [X] T023 [US3] In `index.html`, review and align the export button markup/classes added in
  T012–T017 so all six buttons share identical placement (relative to each tab's existing
  header) and visual style, per `contracts/instagram-export-ui.md` §Export Button.
- [X] T024 [US3] Manually verify (per `quickstart.md` step 1 and step 8) that all six tabs show
  the button consistently, and that exporting from two different tabs in the same session never
  produces an image matching the wrong tab (FR-007), including at a resized/mobile viewport
  width.

**Checkpoint**: All user stories independently functional; export is consistent across all six
tabs.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across the whole feature.

- [X] T025 [P] Run `npm test -- export-utils` and confirm all `src/export-utils.js` tests
  (T004–T007 coverage) pass.
- [X] T026 [P] Run the full root suite `npm test` to confirm no regressions in existing tabs,
  chart rendering, or heatmap tests.
- [X] T027 Execute the remaining `quickstart.md` manual validation steps end-to-end in a served
  browser session (`python -m http.server`) to confirm SC-001 through SC-004 are met.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion. No dependency on other
  stories.
- **User Story 2 (Phase 4)**: Depends on Foundational completion; in practice best validated
  after Phase 3 since it reuses the same modal/capture plumbing, but its own tasks touch only
  the modal/download/close behavior already scaffolded in Phase 2.
- **User Story 3 (Phase 5)**: Depends on Phase 3 (buttons must exist on all tabs) to review
  consistency; introduces no new capture behavior.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- US1 (P1): Independent — foundational capture/blocking behavior.
- US2 (P1): Independent of US1's per-tab wiring but shares the Phase 2 modal/download
  plumbing; can be implemented/tested in parallel with US1's per-tab button tasks once Phase 2
  is done.
- US3 (P2): Builds on US1's buttons existing on all six tabs; purely a consistency pass, no
  new capture logic.

### Within Each User Story

- US1 tasks T012–T017 (one per tab) are parallelizable **only if** each edits a distinct tab
  panel section of `index.html` in a separate pass; in practice treat them as sequential since
  they all modify the same file.
- US2 tasks T019–T021 modify shared modal code in `index.html` and should be done sequentially.

### Parallel Opportunities

- T003 (test scaffold) can run in parallel with T001–T002.
- T004, T005, T006, T007 (all in `src/export-utils.js` but logically independent pure
  functions) can be implemented in parallel by different contributors if desired, then merged.
- T025 and T026 (test runs) can run in parallel.

---

## Parallel Example: Phase 2 Foundational Helpers

```text
Task: "Implement computeSquareFit(sourceWidth, sourceHeight, targetSize) in src/export-utils.js"
Task: "Implement getTabDisplayTitle(tabName) in src/export-utils.js"
Task: "Implement generateExportFilename(tabName, date) in src/export-utils.js"
Task: "Implement hasExportableContent(tabName, flags) in src/export-utils.js"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (blocking — must finish before any story work).
3. Complete Phase 3: User Story 1 (capture works on every tab, blocks on no data).
4. Complete Phase 4: User Story 2 (preview, download, close all work reliably).
5. **STOP and VALIDATE**: Run `quickstart.md` steps 1–7. This is a deployable MVP: every tab
   can export, preview, and download an Instagram-ready square image.

### Incremental Delivery

1. Setup + Foundational → nothing user-visible yet, but everything else is unblocked.
2. Add User Story 1 → tabs can capture; test independently → button + capture works.
3. Add User Story 2 → preview/download/close polished → MVP complete, deployable.
4. Add User Story 3 → consistency pass across all six tabs → final polish.
5. Each story adds value without breaking previously completed stories.
