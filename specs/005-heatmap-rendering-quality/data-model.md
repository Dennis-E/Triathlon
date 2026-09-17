# Phase 1 Data Model: Heatmap Rendering Quality (Smooth Tracks & Correct Frequency Layering)

This feature does not add new persisted entities or change stored field shapes; it changes
how existing values are *derived* (point simplification) and *ordered/styled* (draw order,
fixed constants). Shapes below reflect the state after this feature, with changes called out
against the equivalent entities in `specs/001-route-line-heatmap/data-model.md` and
`specs/004-heatmap-frequency-details/data-model.md`.

## GPS Track

| Field | Type | Notes |
|---|---|---|
| `sport` | `'Run' \| 'Bike' \| 'Swim' \| null` | Unchanged. |
| `points` | `Array<[lat, lon]>` | **Changed derivation**: now produced by `simplifyTrackPoints()` (Ramer–Douglas–Peucker with a distance tolerance, falling back to bounded even-stride reduction only above the safety-maximum point count) instead of `downsampleTrack()`'s fixed-count even stride. Endpoints (first/last recorded point) are always preserved. No new points are ever interpolated — every retained point is one of the originally recorded points (FR-005). |

### `simplifyTrackPoints(points, options)` (new pure helper, `src/zip-importer.js`)

| Input/Option | Type | Notes |
|---|---|---|
| `points` | `Array<{lat, lon}>` | Same raw point shape already produced by `extractGpxTrackpoints`/`extractFitTrackpoints`. |
| `options.toleranceMeters` | `number` (default `3`) | Maximum perpendicular distance (in meters) a dropped point may have deviated from the straight chord between its retained neighbors. |
| `options.maxPoints` | `number` (default `2000`) | Safety-maximum retained point count per track; only enforced as a fallback if the tolerance-based result still exceeds it. |
| Returns | `Array<{lat, lon}>` | Simplified point sequence; always includes the first and last input point; length is data-dependent (shape-driven), not fixed. |

## Route Segment

Unchanged fields (`cellA`, `cellB`, `key`, `coords`, `count`, `activityIds`) — see
`specs/001-route-line-heatmap/data-model.md` and
`specs/004-heatmap-frequency-details/data-model.md`. No new field is added by this feature.
What changes is external to the entity itself:

- **Draw order**: full-detail segment collections (and the low-zoom aggregate collection
  produced by `buildLowZoomRouteSegments()`) are sorted ascending by `(count, key)`
  immediately after being built/supplied to the Canvas layer, so iteration order — not a new
  field — encodes "higher count draws later/on top."
- **Rendering style**: `computeRouteSegmentStyle(count)` no longer derives `weight`/`opacity`
  from `count`; it returns the same fixed `{ weight, opacity }` constants for every segment
  regardless of `count`/`colorCount` (see research.md Decision 3).

## Frequency Visual Scale

Unchanged: `computeRouteFrequencyScale()`, `normalizeRouteFrequency()`, and
`computeRouteSegmentColor()` (light-blue-to-red, logarithmic position) from
`specs/003-logarithmic-heatmap-colors`/`specs/004-heatmap-frequency-details` are reused
as-is; color remains the sole frequency-communicating channel (now also the *only* one,
since weight/opacity are fixed constants per Decision 3).

## Draw-Order Sort (new pure helper concept, `src/heatmap-utils.js`)

Not a stored entity — a derivation applied to an existing segment collection before it is
handed to the Canvas layer.

| Aspect | Behavior |
|---|---|
| Sort key | Ascending by `count` (or `colorCount` for low-zoom aggregates), then ascending lexical order of `key` for ties. |
| Applies to | The full-detail segment array passed to `RouteCanvasLayer.setSegments()`, and the low-zoom aggregate array produced from `buildLowZoomRouteSegments()`. |
| Frequency | Computed once per `setSegments()` call / once when the low-zoom aggregate is (re)built — not per redraw frame. |
| Effect | The last matching segment drawn at any shared screen position via `ctx.stroke()` is guaranteed to be the highest-count (or tie-break winner) segment, satisfying FR-001–FR-003. |
