# Phase 0 Research: Heatmap Rendering Quality (Smooth Tracks & Correct Frequency Layering)

All Technical Context items are resolved via `specs/005-heatmap-rendering-quality/spec.md`
Clarifications. No `NEEDS CLARIFICATION` markers remain.

## Decision 1: Guarantee frequency-on-top via pre-sorted draw order, not blending

- **Decision**: Sort the full-detail segment array ascending by `(count, key)` exactly once,
  inside `RouteCanvasLayer.setSegments()` (and once when the low-zoom aggregate array is
  built in `buildLowZoomRouteSegments()`'s caller), before any redraw happens. `_draw()` then
  iterates the already-sorted array in order and simply draws each visible segment with
  `ctx.stroke()` as today — the last (highest-frequency) segment drawn at a shared pixel
  position is always the highest count, and lexical key order (per FR-003) makes equal-count
  ties deterministic.
- **Rationale**: This is the standard "painter's algorithm" fix for stacked 2D line
  rendering: instead of changing how overlaps are composited (which would require additive/
  "lighter" blending, an extra full-canvas pass, or per-pixel accumulation), simply guarantee
  the more important value is always drawn last. It requires touching only the array
  ordering, keeps the existing single-Canvas `ctx.stroke()` loop unchanged, and keeps the
  sort cost off the per-frame/redraw path (`_draw()` runs on every `moveend`/`zoomend`, but
  sorting only runs when segments are (re)supplied), which preserves the `specs/002`
  performance baseline (FR-002, FR-006).
- **Alternatives considered**:
  - *Additive/"lighter" canvas blending* (`ctx.globalCompositeOperation = 'lighter'`):
    rejected because it changes the resulting color of every overlapping stroke (colors add
    together), which would break the deliberately-designed color scale from
    `specs/003-logarithmic-heatmap-colors`/`specs/004-heatmap-frequency-details` — a
    high-frequency red segment could turn white/washed-out where several strokes overlap,
    the opposite of "roads much traveled should appear red."
  - *Sort inside `_draw()` on every redraw*: rejected as unnecessary repeated O(n log n) work
    on every pan/zoom frame; sorting once when the segment set changes is sufficient because
    segment identity/count is stable between filter changes.
  - *Per-pixel frequency raster (rebuild a density grid and colorize once)*: rejected as a
    disproportionate architecture change for this fix; it would replace the existing
    corridor/segment model (`specs/001`) rather than correct its draw order, and reintroduces
    exactly the kind of large redesign `specs/002-heatmap-performance-scale`'s research
    explicitly avoided for a "best effort" v1/v2 scope.

## Decision 2: Replace fixed-stride downsampling with Ramer–Douglas–Peucker simplification

- **Decision**: Add a pure `simplifyTrackPoints(points, { toleranceMeters, maxPoints })`
  helper (co-located with the existing `downsampleTrack` in `src/zip-importer.js`) that runs
  the standard recursive Ramer–Douglas–Peucker (RDP) algorithm: always keep the first and
  last point; recursively keep the point with the maximum perpendicular distance from the
  chord between the current segment's endpoints if that distance exceeds `toleranceMeters`,
  and discard all points on a sub-segment whose maximum deviation is within tolerance. Use a
  default `toleranceMeters` of 3 meters (tighter than typical consumer GPS noise floor of
  ~5–10 m, so real turns survive but sensor jitter on straight sections is smoothed away) and
  a default `maxPoints` safety maximum of 2,000 (roughly 11x today's 180-point cap). If the
  RDP output for a single track still exceeds `maxPoints`, apply the existing even-stride
  `downsampleTrack` to that RDP output only as a bounded fallback.
- **Rationale**: RDP is the standard, widely-used technique for reducing GPS/polyline point
  count while preserving shape (used by mapping tools, GIS simplification libraries, and
  route-recording services); using perpendicular distance instead of a fixed point-count
  stride is exactly why it keeps detail on curves and drops points on straight sections. Using
  meters (not raw lat/lon degrees) for the tolerance keeps behavior consistent across
  latitudes, matching the existing `distanceMeters()` haversine helper already used elsewhere
  in the heatmap code. The safety-maximum fallback bounds worst-case memory/render cost for
  unusually noisy recordings (satisfies FR-004's safety clause and FR-006's performance
  constraint) without capping typical tracks.
- **Alternatives considered**:
  - *Increase the fixed stride cap (e.g., 180 → 1000)*: rejected per the spec Clarification
    (Q1 answer D) — a larger fixed count still evenly discards points regardless of shape, so
    long straight sections keep "wasted" points while sharp turns can still lose detail.
  - *Remove downsampling entirely*: rejected — unbounded per-track point counts risk the
    `specs/002-heatmap-performance-scale` performance baseline for large datasets and provide
    no benefit on straight sections.
  - *Iterative/adaptive tolerance increase to hit a target count*: rejected as needless
    complexity for this use case; a single well-chosen tolerance plus a generous safety
    maximum is simpler, deterministic, and sufficient per the spec Clarification (Q4 answer B).

## Decision 3: Frequency communicated by color alone; fixed constant weight and opacity

- **Decision**: Replace `computeRouteSegmentStyle()`'s count-dependent `{ weight, opacity }`
  with fixed constants (e.g., `weight: 3`, `opacity: 0.85`) applied to every full-detail and
  low-zoom segment, independent of `count`/`colorCount`. Remove the function's logarithmic
  weight/opacity scaling entirely rather than narrowing its range, since Decision 1 (sorted
  draw order) already guarantees the frequency-on-top outcome without needing opacity as a
  supporting cue.
- **Rationale**: Directly implements the spec Clarification (Q2 answer A) and FR-007/FR-008:
  one primary ordered channel (color) communicates frequency; a constant, moderate line
  width can never visually merge two distinct nearby roads (removes the "line thickness
  isn't a proper way" problem the user raised) and never shrinks an isolated route below
  visibility (a constant width by construction satisfies FR-009/SC-005 without a dedicated
  minimum-weight floor).
- **Alternatives considered**:
  - *Keep a narrow variable-weight range (e.g., 2–3px)*: rejected per the spec Clarification;
    even a narrow range still lets nearby parallel roads' strokes visually touch/merge at
    typical zoom, and adds a redundant (if weak) second channel for the same value color
    already encodes.
  - *Keep variable opacity only*: rejected — with sorted draw order already guaranteeing
    correct layering, variable opacity would only make low-frequency segments fainter than
    necessary without adding ordering information, working against SC-005 (isolated route
    must stay clearly visible).

## Decision 4: Keep viewport culling, low-zoom aggregation, hit-testing, and minimum length unchanged

- **Decision**: `segmentIntersectsBounds()`, `buildLowZoomRouteSegments()`,
  `extendSegmentToMinLength()`, `buildScreenSegmentIndex()`, and `hitTestScreenSegmentIndex()`
  from `specs/002-heatmap-performance-scale`/`specs/004-heatmap-frequency-details` are reused
  as-is. Only the *order* in which segments are fed into these helpers, and the two style
  constants passed to `ctx.stroke()`, change.
- **Rationale**: FR-010/FR-011 require these existing guarantees (low-zoom relative
  prominence, hover/tooltip resolution) to keep working; reusing the exact same aggregation
  and hit-testing code paths — just sorted beforehand and styled with fixed constants — is
  the smallest change that satisfies both the new requirements and the "no regression"
  requirements simultaneously.
- **Alternatives considered**:
  - *Rebuild low-zoom aggregation to also pre-encode a fixed draw order*: unnecessary —
    `buildLowZoomRouteSegments()`'s output is a plain object whose values can be sorted the
    same way as full-detail segments right after it is built, with no change to the
    aggregation function itself.

## Decision 5: Test pure logic automatically; validate visuals manually

- **Decision**: Add Jest coverage for `simplifyTrackPoints()` (shape/endpoint preservation, no
  invented points, tolerance behavior on a known curve fixture, safety-maximum fallback
  trigger) and for the new draw-order sort helper (ascending count order, lexical tie-break,
  stability across repeated calls with shuffled input order representing different import
  orders). Preserve all existing heatmap/zip-importer tests and the inline-script syntax
  test. Validate the corrected visual layering, line smoothness, and constant line
  width/opacity manually in the browser using a real multi-activity export.
- **Rationale**: Matches the project's established pattern (`specs/002`–`004` research) of
  keeping all pure behavior in Node-testable helpers while leaving Canvas/Leaflet pixel
  rendering to manual browser validation, since the Jest environment has no DOM/Canvas
  (`jest.config.js` uses `node`, not `jsdom`).
- **Alternatives considered**:
  - *Add a Canvas/jsdom test harness for pixel-level draw-order assertions*: rejected as
    disproportionate for this feature and inconsistent with the project's existing test
    boundaries (see `AGENTS.md`).
