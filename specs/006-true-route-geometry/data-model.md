# Phase 1 Data Model: True-Path Route Geometry Rendering

This feature does not add new persisted entities; it extends how existing corridor objects
are derived (an added rendering-geometry field) and how one existing helper's return shape
is enriched. Shapes below build on `specs/001-route-line-heatmap/data-model.md` and
`specs/004-heatmap-frequency-details/data-model.md`.

## Track Probe (enriched return of `interpolateTrackProbes()`)

| Field | Type | Notes |
|---|---|---|
| (existing) probe coordinate | `[number, number]` | Unchanged: interpolated `[lat, lon]` position along the track, spaced `spacingMeters` apart. |
| **`truePointIndex`** *(new)* | `number` | Index into the source `points` array identifying the original recorded/simplified point that began the segment this probe was interpolated from. Always a valid index into the input `points` array. |

- The function's default export shape may remain an array of `[lat, lon]` pairs for existing
  callers; the true-point-index mapping is returned as a **parallel array** (same length,
  same order) so existing call sites that only need coordinates are unaffected, and new call
  sites (corridor creation) can zip the two arrays together by index.

## Route Segment / Corridor

Unchanged fields (`key`, `coords`, `heading`, `count`, `activityIds`) — see
`specs/001-route-line-heatmap/data-model.md` and
`specs/004-heatmap-frequency-details/data-model.md`. One field is added:

| Field | Type | Notes |
|---|---|---|
| **`truePathPoints`** *(new)* | `Array<[number, number]>`, length ≥ 2 | The creating activity's actual recorded (simplified) point sub-sequence spanning this corridor's matching window, inclusive of both boundary points. Always drawn as one connected polyline (spec Q1). Set once at corridor creation from the creating activity's own track; never modified when later activities match (contribute count) to this corridor, exactly like the existing `coords`/`heading` fields. |

- **Constraint**: `truePathPoints` MUST contain only points that already existed in the
  creating activity's `points` array (per `specs/005-heatmap-rendering-quality` FR-005's
  "never invent a point" rule, inherited here) — no interpolation or fabrication.
- **Constraint**: `truePathPoints.length >= 2` always (falls back to `coords` verbatim as a
  2-point polyline if, in a degenerate case, the true-point-index slice cannot be resolved to
  at least 2 points — e.g., a track shorter than the matching window).
- **Relationship to `coords`**: `coords[0]` and `coords[1]` remain the two matching-window
  boundary probes (used for matching, bounds computation, and low-zoom aggregation, per
  Decision 5). `truePathPoints[0]` and `truePathPoints[truePathPoints.length - 1]` are the true
  recorded points nearest those same two boundary probes — not necessarily bit-identical to
  `coords[0]`/`coords[1]` (which are themselves interpolated probe positions), but always
  within one matching-window's worth of distance of them.

## Rendering Consumption (`RouteCanvasLayer`, `index.html`)

Not a stored entity — describes how the enriched corridor is consumed at draw time.

| Aspect | Behavior |
|---|---|
| Above low-zoom aggregation threshold | Draw each visible corridor's `truePathPoints` as one connected polyline (`moveTo` first point, `lineTo` each subsequent point), using that corridor's single derived color/weight/opacity (spec Q1/Q2; `specs/005-heatmap-rendering-quality` Decision 3). |
| At/below low-zoom aggregation threshold | Unchanged: `buildLowZoomRouteSegments()` continues to use `coords` (Decision 5); `truePathPoints` is not consulted at this zoom range. |
| Draw order | Unchanged: `sortSegmentsForDrawOrder()` continues to sort corridors by `(count, key)`; a corridor's true-path polyline is drawn (all its segments) at the position its sort order dictates, exactly as its single chord was before. |
| Hit testing | `buildScreenSegmentIndex()`/`hitTestScreenSegmentIndex()` index each drawn true-path edge (consecutive point pair) individually, tagged with the owning corridor's `segment`/`key`, so hover/tooltip resolution (`specs/004-heatmap-frequency-details`) continues to resolve to the correct corridor regardless of which edge along its true path was hovered. |
