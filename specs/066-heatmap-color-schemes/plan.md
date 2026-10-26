# Implementation Plan: Heatmap Color Schemes

**Branch**: `066-heatmap-color-schemes` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/066-heatmap-color-schemes/spec.md`

## Summary

Add a session-scoped scheme selector to the existing heatmap. Preserve the logarithmic
route-frequency scale and current Blue to Red appearance as the default; add Yellow to Red,
Blue, and Black + Fire. Resolve colors in the existing heatmap utility, keep the current
OpenStreetMap tile source, and apply the dark presentation only to the tile layer so the
route canvas and frequency guide retain their intended colors. Keep scheme state through
sport changes, reflect it in the legend and export context, and preserve empty-state and
viewport behavior.

## Technical Context

**Language/Version**: Browser JavaScript in classic scripts; CommonJS-compatible utility
modules tested with the repository's installed Node.js runtime.

**Primary Dependencies**: Existing Leaflet 1.9.4 CDN integration and html2canvas export
flow; no new dependency or map provider.

**Storage**: In-memory dashboard state for the current page session; no persistence across
reloads.

**Testing**: Jest in the Node environment. Focused suites: `heatmap-utils.test.js`,
`dashboard-heatmap.test.js`, `dashboard-export-download.test.js`, and
`index-script-syntax.test.js`. A browser smoke check is required for tile appearance and
PNG capture because the Jest environment does not render external map tiles.

**Target Platform**: Static browser application served from a plain local web server.

**Project Type**: Static single-page web application with browser scripts and reusable
CommonJS/browser-bridge utilities.

**Performance Goals**: Scheme changes must preserve the current map center, zoom level, and
route geometry, and must not regress existing pan/zoom or viewport-preservation behavior at
the dataset scale already supported by the heatmap.

**Constraints**: No bundler or build step; preserve existing OSM tile requests and
attribution; do not alter imported activity data, route aggregation, or logarithmic
frequency calculations; do not filter the route canvas or legend when darkening tiles.

**Scale/Scope**: Four schemes on the existing heatmap only. No new visualization tab,
activity-data field, cross-reload preference, or landing-page preview selector.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. UI and behavior remain usable from the
  existing static app; no build tooling or server feature is introduced.
- **II. Dual-Target Reusable Modules**: PASS. Reusable palette mapping remains in the
  existing CommonJS module with its browser global bridge; DOM orchestration stays in the
  dashboard script.
- **III. Narrowest-Scope Test-First Verification**: PASS. Add focused utility, dashboard,
  UI-wiring, and export assertions. This is not a new tab; existing heatmap Share/Export
  remains in place and must capture the active scheme.
- **IV. Faithful Locale-Aware Data Parsing**: PASS. No CSV, GPX, FIT, sport normalization,
  or imported data semantics change.
- **V. Explicit Privacy & Network Boundaries**: PASS. Keep the existing OSM tile source and
  make no new requests to a map provider. The existing network caveat remains unchanged.

No pre-design gate violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/066-heatmap-color-schemes/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── heatmap-color-scheme-ui.md
├── quickstart.md
└── tasks.md                 # Created by /speckit-tasks, not this plan
```

### Source Code (repository root)

```text
index.html                         # Scheme control, dynamic legend, UI wiring
src/heatmap-utils.js               # Palette ramps and frequency-aware colors
src/dashboard-heatmap.js          # Selection state, keyboard adapter, map style
src/dashboard-export.js           # Export context includes active scheme
__tests__/heatmap-utils.test.js
__tests__/dashboard-heatmap.test.js
__tests__/dashboard-export-download.test.js
__tests__/index-script-syntax.test.js
```

**Structure Decision**: Extend the existing heatmap utility/dashboard boundary and update
the owning HTML and export mapping. Do not add a new application module or tab.

## Phase 0: Research Summary

See [research.md](research.md). The selected approach preserves OSM requests and styles
only the map tile layer for Black + Fire; implementation must verify tile readability and
export capture in a browser.

## Phase 1: Design Summary

- [data-model.md](data-model.md) defines the four session-scoped schemes and their relation
  to the existing frequency scale.
- [contracts/heatmap-color-scheme-ui.md](contracts/heatmap-color-scheme-ui.md) defines the
  selector, keyboard filter, legend, and export behavior.
- [quickstart.md](quickstart.md) gives focused automated tests and manual browser checks.
- No external API or service contract is added.

## Constitution Check (Post-Design)

- **I. Static Browser-First Delivery**: PASS. All changes remain static browser UI and
  existing scripts.
- **II. Dual-Target Reusable Modules**: PASS. Palette calculations remain pure and
  testable in the dual-target heatmap utility.
- **III. Narrowest-Scope Test-First Verification**: PASS. Focused Jest coverage and browser
  export verification are specified; the existing heatmap export action is retained.
- **IV. Faithful Locale-Aware Data Parsing**: PASS. No data parsing or sport semantics are
  changed.
- **V. Explicit Privacy & Network Boundaries**: PASS. The design adds no map vendor, tile
  endpoint, credential, or user-data transmission.

No constitutional violations or justifications required.

## Complexity Tracking

No constitution violations.