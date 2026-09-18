# Implementation Plan: Instagram-Ready Visualization Export

**Branch**: `007-instagram-export-button` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-instagram-export-button/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add an "Export" button to each of the six visualization tabs (Total Distance, Heart Rate &
Pace, Equipment, Equipment Timeline, Personal Bests, Heatmap) that rasterizes that tab's
chart/graphic plus a generated title into a single 1:1 square image, shows it in an in-page
modal preview, and offers Download and Close actions. Capture must work uniformly across
Chart.js `<canvas>` charts, inline SVG (Personal Bests), and the hybrid Leaflet map + canvas
overlay (Heatmap), entirely client-side with no server upload, per FR-001–FR-009. Email/"mail
to" sharing is explicitly out of scope for this iteration (see Clarifications).

## Technical Context

**Language/Version**: JavaScript (browser ES2017+ target; Node.js 18+ test target, matching
the existing repository)

**Primary Dependencies**: html2canvas (new CDN `<script>` dependency, loaded the same way as
Chart.js/Leaflet — no npm/bundler entry) for uniform DOM-to-canvas rasterization across
canvas, SVG, and Leaflet map content; existing Chart.js and Leaflet integrations are otherwise
unchanged

**Storage**: N/A — the exported image exists only as an in-memory canvas/Blob for the preview
modal and, if the user downloads it, as a browser-initiated file save; nothing is persisted or
uploaded

**Testing**: Jest (root, `node` environment) for pure/DOM-free helpers — square crop/letterbox
math, title text composition, filename generation, and per-tab "has data to export" checks;
manual browser validation (per `quickstart.md`) for the actual rasterization, modal, and
download flow, since `html2canvas` and real canvas/SVG/Leaflet rendering require a browser

**Target Platform**: Existing desktop and mobile browsers via the six existing dashboard
visualization tabs; no new platform surface

**Project Type**: Single-project static web application

**Performance Goals**: Capture-to-preview in under 5 seconds per SC-001, on the same
already-loaded, already-rendered tab content (no additional data fetch)

**Constraints**: Static browser-only delivery (Principle I); no new build/bundler step; no
network upload of visualization data or the exported image (FR-008); output is always a 1:1
square PNG (FR-009); no email/"mail to" action (see Clarifications); OpenStreetMap raster
tiles used by the Heatmap tab do not send CORS headers, so the base map tiles will render
blank/untextured in the exported image while the app's own canvas-drawn route overlay (drawn
locally, not tainted) still renders correctly — this is an accepted, documented limitation,
not a defect to fix in this iteration

**Scale/Scope**: Six existing visualization tabs; one export button and one shared preview
modal component reused across all of them

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery - PASS.** `html2canvas` is added as a CDN `<script>` tag
  exactly like the existing Chart.js/Leaflet/PapaParse integrations; no bundler or compile step
  is introduced, and the feature keeps working under `python -m http.server`.
- **II. Dual-Target Reusable Modules - PASS.** The crop/letterbox math, title text composition,
  filename generation, and per-tab "has data" check are extracted as pure, DOM-free functions
  in a new `src/export-utils.js` module (CommonJS + `window.exportUtils` bridge), matching the
  `src/tab-navigation.js` pattern. The actual `html2canvas(...)` call, modal DOM wiring, and
  download-anchor creation stay in `index.html` because they inherently require real browser
  DOM/canvas APIs.
- **III. Narrowest-Scope Test-First Verification - PASS.** New Jest coverage is added for
  `src/export-utils.js` (square-fit math, title composition, filename pattern, empty-state
  detection); root `npm test` is the verification command. No dashboard tab is added, renamed,
  or removed, so `src/tab-navigation.js` and its tests are unaffected — only new inline export
  buttons are added inside each existing tab panel.
- **IV. Faithful Locale-Aware Data Parsing - PASS.** No CSV/GPX parsing or sport normalization
  is touched; the feature only rasterizes already-rendered visualization output.
- **V. Explicit Privacy & Network Boundaries - PASS.** Capture, composition, preview, and
  download all happen client-side on already-loaded data; FR-008 explicitly forbids uploading
  the visualization data or the exported image. The Heatmap tab's existing OSM tile requests
  are unchanged (same requests the map already made to render on screen); no new network call
  is added by the export feature itself.
- **Repository boundaries - PASS.** Work stays in the root static app and root Jest suite
  (`src/export-utils.js`, `index.html`, `__tests__/`); `scripts/` and `services/api/` are
  untouched.

No gate violations or unresolved clarifications were identified.

**Post-Design Re-check**: Phase 1 keeps the pure helpers DOM-free and confirms the shared
preview modal and per-tab export buttons are additive markup/JS in `index.html` with no new
tab, no new dependency boundary, and no server-side change. All gates remain PASS.

## Project Structure

### Documentation (this feature)

```text
specs/007-instagram-export-button/
├── plan.md               # This file (/speckit-plan command output)
├── research.md           # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── instagram-export-ui.md
└── tasks.md              # Created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/
└── export-utils.js        # New module: square-fit/letterbox math, title text composition,
                            # filename generation, per-tab "has data to export" check
                            # (CommonJS + window.exportUtils bridge)

index.html                 # Add one export button per visualization tab panel (Total
                            # Distance, Heart Rate & Pace, Equipment, Equipment Timeline,
                            # Personal Bests, Heatmap); add a shared preview modal
                            # (image, Download, Close); load html2canvas via CDN <script>;
                            # wire click handlers to call html2canvas on each tab's chart
                            # container, compose the square + title via export-utils.js,
                            # and render the result into the modal

__tests__/
└── export-utils.test.js   # New: square-fit math, title composition, filename pattern,
                            # empty-state detection
```

**Structure Decision**: Follow the existing single-project static-app layout. Reusable,
testable logic goes into a new `src/export-utils.js` module; DOM/canvas rasterization, modal
markup, and the new CDN dependency live in `index.html`, matching how Chart.js and Leaflet are
already integrated. No new top-level project or service is introduced.

## Complexity Tracking

No Constitution Check violations require justification.
