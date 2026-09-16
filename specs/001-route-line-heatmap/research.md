# Phase 0 Research: Route-Based Heatmap (Line Density Map)

All items from the Technical Context were already resolved during `/speckit-specify` and
`/speckit-clarify` (no `NEEDS CLARIFICATION` markers remained). This document records the
implementation-approach decisions made to satisfy the spec's functional requirements.

## Decision 1: GPS-noise matching via grid snapping (not full path-matching library)

- **Decision**: Snap each GPS point to a small geographic grid cell (~15 m, per spec
  clarification FR-009) by rounding latitude/longitude to a fixed-size cell key. Build route
  segments from consecutive snapped points within a single activity's track, and count how
  many distinct activities contribute an occurrence of the same segment key (order-independent,
  i.e. cell-A→cell-B counts the same as cell-B→cell-A).
- **Rationale**: This keeps the implementation a small set of pure, dependency-free
  functions consistent with Constitution I (no bundler/build step) and II (pure,
  DOM-free `src/heatmap-utils.js` functions testable in Jest). Grid snapping is a
  well-understood, simple way to get GPS-noise tolerance without external map-matching
  services or heavy geometry libraries.
- **Alternatives considered**:
  - *Full polyline clustering (e.g. via a geometry library like Turf.js)*: more precise
    curve-aware matching, but adds a new CDN dependency and materially more complexity for a
    hobbyist-scale, best-effort feature (spec SC-005 explicitly deprioritizes large-scale
    performance work). Rejected for v1.
  - *Point-to-line distance clustering without a grid*: more accurate but O(n²)-ish without
    spatial indexing; unnecessary complexity given the explicit "no specific performance
    target for v1" decision.
- **Known limitation (accepted for v1)**: A fixed-size grid has a boundary edge case: two
  points within 15 m of each other can straddle a cell boundary and snap to different
  adjacent cells, so they won't always merge into the same segment. Given SC-005's explicit
  "best effort, no v1 performance/precision target" framing, this is accepted as a known
  limitation rather than solved with neighbor-cell matching or a geometry library. Segments
  affected by this are expected to be rare (most repeated real-world routes land solidly
  inside the same cells, not exactly on a boundary) and would at worst render as two nearby
  thin lines instead of one merged line — it does not break FR-001/FR-002/FR-003 elsewhere.
  If real-world testing shows this is visually disruptive, revisit with a 3x3
  neighbor-cell check as a follow-up enhancement.

## Decision 2: Render route segments as Leaflet polylines instead of `leaflet.heat` blobs

- **Decision**: Remove the `leaflet.heat` plugin usage for this view; draw each aggregated
  route segment as an `L.polyline` (using Leaflet's canvas renderer for reasonable draw
  performance with many segments), with `weight` and `opacity` derived from the segment's
  visit-frequency count.
- **Rationale**: `leaflet.heat` inherently produces diffuse, blurred circular blobs (its
  whole purpose), which is exactly the visual problem the user wants fixed (FR-001). Vanilla
  Leaflet polylines are already available wherever Leaflet is loaded (no new CDN dependency),
  keeping Constitution I intact.
- **Alternatives considered**:
  - *Custom WebGL/canvas renderer built from scratch*: better raw performance at very large
    scale, but explicitly out of scope per SC-005 and adds substantial complexity/build risk
    for a static, no-bundler app.
  - *Keep `leaflet.heat` and just tune radius/blur down*: rejected — no configuration of
    `leaflet.heat` produces literal line-shaped routes; it is fundamentally a point-density
    blur renderer, not a route renderer.

## Decision 3: Perceptual (non-linear) frequency → thickness/opacity scale with a hard cap

- **Decision**: Map visit-frequency count to stroke weight using a compressive function
  (e.g. `weight = clamp(minWeight + scale * log(1 + count), minWeight, maxWeight)`), and
  similarly ramp opacity from a clearly-visible floor (single visit) to full opacity at the
  cap. Exact constants are an implementation detail tuned during development, not fixed by
  this plan.
- **Rationale**: A linear scale would either make single-visit routes nearly invisible (if
  tuned for legible "hot" routes) or make frequent routes overwhelming (if tuned for legible
  rare routes) — this directly conflicts with FR-003/FR-004/FR-005. A logarithmic-style
  curve compresses the high end and expands legibility at the low end, matching the visual
  language of well-known route-heatmap products referenced in the spec input.
- **Alternatives considered**:
  - *Linear scale*: rejected, fails FR-004/FR-005 (either extreme becomes unreadable).
  - *Discrete buckets (e.g. 3 fixed thickness tiers)*: simpler but coarser; rejected in favor
    of a continuous curve for smoother visual differentiation, at negligible extra complexity.

## Decision 4: Apply the same route-line treatment to both the full map and the dashboard preview

- **Decision**: The dashboard card's small preview map (`renderHeatmapPreviewMap`, currently
  built from synthetic demo points via `buildDemoHeatmapPoints()`) is updated to render
  synthetic demo *route lines* with the same thickness/opacity scaling, instead of demo heat
  blobs, so the preview accurately represents what the full Heatmap tab now shows.
  Sport-filter recomputation (FR-006) only applies to the real, imported-data map view; the
  preview keeps using synthetic demo data as it already does today.
- **Rationale**: Visual consistency between the dashboard card preview and the full view
  avoids a misleading preview (a user should not see blobs on the card and then lines when
  opening the tab). This does not change FR-010 (naming/entry points are unchanged) — only
  what is drawn inside the preview's map canvas.
- **Alternatives considered**:
  - *Leave the preview card as heat blobs*: rejected as inconsistent/misleading given the
    entire point of this feature is that blobs are the wrong visualization.

## Decision 5: Color/contrast approach for v1

- **Decision**: Use a single accent hue (consistent with the dashboard's existing accent
  palette, e.g. the indigo/cyan tones already used elsewhere in `index.html`) with
  opacity/weight scaling for frequency, rather than a multi-color gradient (e.g. blue→red).
- **Rationale**: Satisfies FR-004/FR-005's contrast and legibility requirements with the
  simplest implementation; a full multi-hue gradient is a reasonable future enhancement but
  isn't required by any functional requirement and adds design/tuning surface not justified
  for v1.
- **Alternatives considered**:
  - *Multi-color frequency gradient (Strava-style blue→red)*: visually richer, deferred as a
    possible follow-up enhancement (not blocking this feature's requirements).

**Output**: All Technical Context items are resolved; no open `NEEDS CLARIFICATION` markers
remain for Phase 1.
