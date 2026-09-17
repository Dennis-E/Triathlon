# UI Contract: Heatmap Rendering Quality

This documents the corrected visual/behavioral contract for the existing route-line heatmap
Canvas layer (`RouteCanvasLayer` in `index.html`, backed by `src/heatmap-utils.js` and
`src/zip-importer.js`). There is no external API; this is the user-observable rendering
contract validated manually in the browser per `quickstart.md`.

## Draw order (frequency-on-top)

- Given any set of route segments supplied to the heatmap (regardless of the order activities
  were imported or processed), the segment with the higher `count` at any shared screen
  position MUST be the one visibly on top after rendering.
- Given two segments with equal `count` overlapping at the same screen position, the one
  whose `key` sorts later lexically MUST be the one visibly on top, consistently across
  repeated renders.
- This guarantee MUST hold identically after panning, zooming, and sport-filter changes — not
  only on the first render.
- This guarantee MUST hold identically at low zoom levels, where segments are drawn from the
  aggregated (`buildLowZoomRouteSegments()`) collection instead of full detail.

## Track line smoothness

- Given an imported GPX/FIT track, the rendered polyline MUST visually follow curves and
  turns present in the original recording — it MUST NOT connect a small, fixed number of
  widely spaced points with long straight chords that cut across a turn.
- The rendered polyline MUST NOT contain any point that was not present in (or interpolated
  from) the original recording — simplification only removes points, it never invents new
  ones.
- A track whose original recording already had very few points MUST NOT be rendered as if it
  had more detail than it actually has.

## Frequency visual encoding

- Color (light blue → red, logarithmic position within the current filtered min/max) MUST be
  the only visual channel that varies with visit-frequency count.
- Line thickness (stroke width) MUST be the same fixed value for every segment, regardless of
  `count`.
- Line opacity MUST be the same fixed value for every segment, regardless of `count`.
- A single, isolated, rarely traveled route MUST remain clearly visible (not an imperceptible
  hairline or near-transparent stroke) — guaranteed structurally by the fixed, non-zero
  stroke width/opacity rather than by a minimum-value floor on a variable range.

## Unaffected behavior (regression guardrails)

- Sport filtering (`All`/`Run`/`Bike`/`Swim`), the color legend, viewport culling, the
  low-zoom aggregation threshold, the minimum-visible-length guarantee for short/isolated
  segments, and hover/tooltip activity resolution (`specs/004-heatmap-frequency-details`)
  MUST continue to behave exactly as before this feature, aside from the draw-order and
  fixed-style changes described above.
