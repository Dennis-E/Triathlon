# Implementation Plan: Heatmap Navigation Performance at Scale

**Branch**: `002-heatmap-performance-scale` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-heatmap-performance-scale/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Fix janky pan/zoom on the Heatmap tab for large imports (~2,600+ activities, observed
directly against the user's real export) by replacing the current approach — one
`L.polyline` Leaflet object per route segment (potentially tens of thousands of objects) —
with a single custom canvas overlay that draws all route segments with plain Canvas 2D
calls. This removes Leaflet's per-object bookkeeping overhead (reprojection, hit-region
tracking) that scales linearly with segment count on every redraw. Redraws are triggered
only on `moveend`/`zoomend` (matching Leaflet's own renderer behavior, so dragging itself
stays visually smooth via the browser's native pane transform), viewport-based culling skips
segments outside the visible bounds, and a zoom-dependent minimum stroke length keeps
sub-pixel segments from wastefully drawing while never fully hiding a real, isolated route
(satisfying the "distant single activity stays visible" guarantee from
`specs/001-route-line-heatmap`).

## Technical Context

**Language/Version**: JavaScript (browser ES2017+ target; Node 18+ for Jest tests, matching
existing repo tooling and `specs/001-route-line-heatmap`).

**Primary Dependencies**: Leaflet 1.9.4, loaded via the existing CDN `<script>` tag; no new
dependency is introduced. The route rendering switches from Leaflet's built-in vector layers
(`L.polyline`) to a small custom `L.Layer` subclass that owns one `<canvas>` element and
draws with the standard Canvas 2D API — this uses only Leaflet's public `L.Layer` extension
point and the browser's built-in Canvas API, not a new library.

**Storage**: N/A — unchanged from `specs/001-route-line-heatmap`; route segments are still
derived in-memory from `gpsTracksByActivityId` on each render.

**Testing**: Jest (`node` environment, no jsdom) for new pure helper functions (viewport
intersection test, minimum-visible-length/simplification decision, coarser-grid
aggregation for low zoom) added to `src/heatmap-utils.js`, following the existing
`__tests__/heatmap-utils.test.js` conventions. The actual canvas-drawing glue code in
`index.html` is DOM/Canvas-dependent and, consistent with the existing `renderHeatmap()` /
`ensureLeafletLoaded()` code, is verified manually via the quickstart guide rather than Jest
(no jsdom/canvas environment exists in this repo).

**Target Platform**: Modern desktop browsers, static site, no build step (unchanged).

**Project Type**: Single project (existing static web app) — no frontend/backend split.

**Performance Goals**: Smooth pan/zoom (no perceptible multi-frame freeze) for at least
~3,000 activities / tens of thousands of route segments (spec SC-001), map interactive
within a few seconds of opening the tab (SC-002), sport-filter switch within the same bound
(SC-003), with no regression for small datasets (SC-006).

**Constraints**: No bundler/build step (Constitution I); must not regress the route-line
visual guarantees from `specs/001-route-line-heatmap` (frequency-based thickness, distant
single-activity visibility at world zoom — spec FR-003/SC-004/SC-005); must not silently
drop or undercount route/frequency data (spec FR-004); "Heatmap" naming/entry points remain
unchanged (carried over from 001's FR-010, still in force).

**Scale/Scope**: Single-user, local browser session; validated against the user's real
~2,646-activity / ~2,423-GPS-track export, with a 3,000-activity target margin per SC-001.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery** — PASS. No bundler/build step introduced; the custom
  canvas layer uses only Leaflet's existing public `L.Layer` API (already loaded via CDN)
  and the browser's built-in Canvas 2D API — no new script tag needed.
- **II. Dual-Target Reusable Modules** — PASS. The new pure logic (viewport-intersection
  test, minimum-visible-length decision, coarse-grid aggregation for low zoom) is added to
  `src/heatmap-utils.js` as DOM-free functions with the existing CommonJS +
  `window.heatmapUtils` bridge, keeping it Jest-testable. The canvas-drawing glue itself is
  necessarily DOM/Canvas-dependent and stays in `index.html`, consistent with how
  `renderHeatmap()` already isn't a pure function today.
- **III. Narrowest-Scope Test-First Verification** — PASS. New pure functions get Jest
  coverage in `__tests__/heatmap-utils.test.js`; root `npm test` is the verification command.
  No dashboard tab is added/renamed, so `src/tab-navigation.js` is out of scope.
- **IV. Faithful Locale-Aware Data Parsing** — PASS (not applicable). No changes to CSV/GPX
  parsing; this feature only changes how already-derived route segments are rendered.
- **V. Explicit Privacy & Network Boundaries** — PASS. Purely client-side rendering change;
  no new network requests; `services/api` untouched.

No violations identified; Complexity Tracking table below is not needed.

**Post-Design Re-check** (after Phase 1): The data model in [data-model.md](./data-model.md)
adds only pure, DOM-free helper functions and one new DOM-dependent rendering layer that
mirrors the existing `renderHeatmap()` wiring pattern — no new dependency, no CSV/GPX
changes, no `services/api` changes. All five gates remain PASS after design.

## Project Structure

### Documentation (this feature)

```text
specs/002-heatmap-performance-scale/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is generated, for the same reason as
`specs/001-route-line-heatmap`: this is an internal rendering-performance change with no
external API/CLI/inter-service interface. The relevant "contract" is the pure-function
signatures added to `src/heatmap-utils.js`, documented in `data-model.md`.

### Source Code (repository root)

```text
src/
└── heatmap-utils.js       # Extended: viewport-intersection test, minimum-visible-length
                            # simplification decision, and a coarser-grid aggregation
                            # helper for low-zoom levels (all pure functions)

index.html                 # Changed: renderHeatmap() switches from creating one
                            # L.polyline per segment to instantiating a custom canvas
                            # overlay layer that redraws (culled + simplified) segments on
                            # moveend/zoomend; renderHeatmapPreviewMap() may reuse the same
                            # layer for consistency, since its dataset is tiny either way

__tests__/
└── heatmap-utils.test.js  # Extended with tests for the new pure functions
```

**Structure Decision**: Stays within the existing single-project static-app structure
(Constitution I/II), same as `specs/001-route-line-heatmap`. No new top-level directories,
no changes to `services/api/` or `scripts/relevant-export-extractor.js`.

## Complexity Tracking

> No Constitution Check violations were identified for this feature; this table is
> intentionally left without entries.
