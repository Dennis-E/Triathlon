# Implementation Plan: Enhanced Visualization Export

**Branch**: `008-enhanced-visualization-export` | **Date**: 2026-09-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

## Summary

Extend the existing local Instagram export flow so every visualization and every data-bearing Personal Best tile can produce a square, branded image. Keep the browser-only `html2canvas` capture path, add pure metadata/filter/legend helpers to `src/export-utils.js`, and let `index.html` compose a dedicated header, visualization, context summary, legend, logos, QR code, and domain before showing the existing preview/download modal.

## Technical Context

**Language/Version**: JavaScript in a static HTML page; CommonJS-compatible reusable modules

**Primary Dependencies**: Existing `html2canvas`, Chart.js/Leaflet-rendered visualization surfaces, Lucide, Jest 30

**Storage**: Browser memory and downloaded local PNG only; no new persistence

**Testing**: Jest root suite in Node; inline-script syntax and markup assertions in `__tests__/index-script-syntax.test.js`; browser smoke validation via the static server

**Target Platform**: Modern desktop and narrow-viewport browsers served by `python -m http.server`

**Project Type**: Static browser application with DOM-free CommonJS/browser-global utilities

**Performance Goals**: Preview generation remains within the existing under-5-second export target; asset loading must be cached per session and must not delay unrelated dashboard rendering

**Constraints**: Keep raw Strava data and generated images local; preserve current square 1080px output and download flow; do not introduce a bundler, build step, server endpoint, or new dependency; all required image assets must be loaded before drawing to the final canvas

**Scale/Scope**: Six visualization tabs, all data-bearing Personal Best detail tiles, four existing brand assets, one export preview flow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. Changes remain in `index.html`, `src/`, `assets/`, and tests; no build step or server feature.
- **II. Dual-Target Reusable Modules**: PASS. Pure filter/legend/metadata helpers stay CommonJS-compatible and expose the existing `window.exportUtils` bridge.
- **III. Narrowest-Scope Test-First Verification**: PASS with required updates to `__tests__/export-utils.test.js` and `__tests__/index-script-syntax.test.js`, followed by the root Jest suite.
- **IV. Faithful Locale-Aware Data Parsing**: PASS. Export reads already-rendered labels/state and does not alter CSV/GPX parsing or sport normalization.
- **V. Explicit Privacy & Network Boundaries**: PASS. Assets are local repository paths, capture is local, and no API behavior changes.

## Phase 0: Research

See [research.md](research.md). Research resolves the existing capture boundary, PB tile target strategy, local asset loading, filter/legend source mapping, and domain handling without adding unresolved technical decisions.

## Phase 1: Design

See [data-model.md](data-model.md), [contracts/export-ui.md](contracts/export-ui.md), and [quickstart.md](quickstart.md). The design keeps DOM orchestration in `index.html`, pure derivation in `src/export-utils.js`, and uses stable IDs/data attributes for generated Personal Best tile controls.

## Project Structure

### Documentation

```text
specs/008-enhanced-visualization-export/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/export-ui.md
└── tasks.md                 # created by /speckit-tasks
```

### Source Code

```text
index.html                         # buttons, PB tile controls, capture/composition, modal
src/export-utils.js                # pure metadata, filters, legends, targets, filenames
assets/logo.png                    # TriAnalytica logo
assets/Strava_Logo.svg             # Strava button/export mark
assets/Instagram_logo_2016.svg     # Instagram button/export mark
assets/QR Code webpage.png         # QR mark in final image
__tests__/export-utils.test.js     # pure helper tests
__tests__/index-script-syntax.test.js # inline JS and markup contract tests
```

**Structure Decision**: Preserve the current static-browser structure. Do not create a new service, component tree, asset pipeline, or capture library. Personal Best tile export is added at the existing `appendPbDetailButton(header, model)` boundary and receives a stable tile target or generated tile identifier.

## Phase 1 Constitution Re-check

- Static delivery, dual-target helpers, local privacy, and unchanged parsing remain satisfied.
- The only new user-facing interface is the documented export UI contract; no external API contract is needed.
- Required verification is narrow and executable: utility Jest tests, inline syntax/markup tests, then the full root suite and manual browser smoke checks.

## Complexity Tracking

No constitution violations. No complexity exception is required.
