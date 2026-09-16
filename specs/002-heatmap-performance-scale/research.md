# Phase 0 Research: Heatmap Navigation Performance at Scale

All Technical Context items were resolvable without new `NEEDS CLARIFICATION` markers,
using the user's real dataset as ground truth for the performance problem. This document
records the implementation-approach decisions.

## Decision 1: Root cause — per-object overhead of thousands of `L.polyline` instances

- **Decision**: Treat the root cause as Leaflet's per-vector-object management cost (each
  `L.polyline` is a JS object that Leaflet reprojects, tracks for interaction/hit-testing,
  and redraws individually on every `moveend`/`zoomend`), not the Canvas renderer choice
  itself (already fixed in `specs/001-route-line-heatmap` Task T022). With ~2,600 real
  activities producing tens of thousands of 15m route segments, this per-object bookkeeping
  is the dominant cost, observed directly as map freezes when panning/zooming the real
  dataset.
- **Rationale**: Confirmed empirically during `specs/001-route-line-heatmap` manual
  validation: switching the renderer to `L.canvas()` fixed an outright freeze/crash, but the
  user's follow-up report shows continued jankiness at this scale — consistent with
  object-count overhead rather than raster-vs-DOM rendering technique.
- **Alternatives considered**:
  - *Just reduce segment count via coarser grid cells everywhere*: would blur the 15 m GPS
    tolerance decided in `specs/001-route-line-heatmap` FR-009 for all zoom levels, not just
    low zoom, hurting the close-up route-line detail the prior feature was built for.
    Rejected as the primary fix; still used selectively (Decision 3) only at low zoom.

## Decision 2: Custom single-canvas overlay layer instead of per-segment Leaflet vectors

- **Decision**: Replace per-segment `L.polyline` creation with one custom Leaflet layer
  (extending `L.Layer`) that owns a single `<canvas>` element sized to the map pane. On
  `moveend`/`zoomend`, it clears and redraws all currently-relevant segments directly with
  Canvas 2D calls (`beginPath`/`moveTo`/`lineTo`/`stroke`), converting each segment's
  lat/lon endpoints via `map.latLngToContainerPoint()`. During an active drag, the canvas
  pans optically for free via Leaflet's existing pane CSS-transform mechanism (the same
  mechanism its built-in renderers already rely on) — no per-frame redraw work is needed
  while dragging.
- **Rationale**: Eliminates the O(segment count) per-object bookkeeping entirely; only raw
  pixel-drawing calls remain, which Canvas 2D handles efficiently even for tens of thousands
  of short strokes in a single frame. This directly targets the root cause in Decision 1
  without introducing a new dependency (uses only Leaflet's public `L.Layer` extension point
  and the browser's built-in Canvas API), keeping Constitution I intact.
- **Alternatives considered**:
  - *WebGL-based rendering (e.g., a custom shader layer)*: would be faster still at extreme
    scale, but adds substantial complexity and is unjustified for the ~3,000-activity target
    in spec SC-001; rejected as over-engineering for this scope.
  - *Third-party clustering/heatmap plugin*: would add a new CDN dependency; rejected per
    Constitution I preference for minimal, already-loaded dependencies, and because it would
    likely reintroduce blob-like rendering, undoing `specs/001-route-line-heatmap`.

## Decision 3: Viewport culling + zoom-dependent minimum visible length

- **Decision**: On each redraw, skip segments whose bounding box does not intersect the
  current viewport bounds (with a small padding margin so segments don't visibly pop in at
  the edge). Separately, for segments that would render shorter than roughly one pixel at
  the current zoom, either skip fine detail and represent them via a coarser aggregated
  representation (see Decision 4) or draw a minimum-length dash so an isolated route is
  never fully invisible.
- **Rationale**: Viewport culling keeps per-redraw cost roughly proportional to what's
  currently visible rather than the entire dataset, which matters most when zoomed in (fewer
  segments to consider). The minimum-visible-length rule directly protects the
  `specs/001-route-line-heatmap` guarantee that an isolated single-visit activity must stay
  visible at world zoom (spec FR-003/SC-004 here).
- **Alternatives considered**:
  - *No culling, always redraw everything*: simplest, but reintroduces the per-redraw cost
    problem at large scale when zoomed in on a busy area with many total segments still in
    memory; rejected.

## Decision 4: Optional coarser aggregation at low (world/country) zoom levels

- **Decision**: At low zoom levels only (where many segments would render at sub-pixel
  length anyway), pre-aggregate nearby segments into a coarser grid (larger cell size than
  the 15 m tolerance from `specs/001-route-line-heatmap`) purely for the *rendered*
  representation at that zoom — the underlying per-segment frequency counts (spec FR-004)
  are never altered, only how many distinct strokes are drawn at a given zoom. As the user
  zooms in past a threshold, rendering switches back to the full-detail segments from
  `buildRouteSegments`.
- **Rationale**: This is what the user's own description asked for ("aggregated further")
  and complements Decisions 2–3: at low zoom, many segments would draw to the same handful
  of pixels anyway, so aggregating them first both reduces draw calls and avoids
  overlapping-stroke visual noise, without touching the accurate frequency data.
- **Alternatives considered**:
  - *Always render at full 15 m detail regardless of zoom*: simplest, but does not reduce
    draw-call count at low zoom where it matters least for detail and most for performance;
    rejected as insufficient on its own (Decision 2 alone may already suffice for the
    SC-001 target, with this as a targeted enhancement if profiling still shows low-zoom
    slowness).

## Decision 5: Manual/quickstart-based performance validation (no new tooling)

- **Decision**: Validate SC-001–SC-006 via manual interaction during the quickstart guide
  (drag/zoom the map with the real or a synthetic large dataset and observe responsiveness),
  the same validation style already used in `specs/001-route-line-heatmap`. No new automated
  performance-measurement tooling (e.g., headless browser frame-timing harnesses) is
  introduced.
- **Rationale**: Consistent with the existing repo's testing conventions (Jest `node`
  environment only, no jsdom/browser test runner per Constitution III), and proportionate to
  a single-user, alpha-stage static app.
- **Alternatives considered**:
  - *Add a headless-browser performance test suite*: more rigorous, but a disproportionate
    new testing dependency/complexity for this repo's scope; rejected for now.

**Output**: All Technical Context items are resolved; no open `NEEDS CLARIFICATION` markers
remain for Phase 1.
