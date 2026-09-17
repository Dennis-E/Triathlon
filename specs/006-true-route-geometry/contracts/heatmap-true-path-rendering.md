# UI Contract: True-Path Route Geometry Rendering

This documents the corrected visual/behavioral contract for the existing route-line heatmap
Canvas layer (`RouteCanvasLayer` in `index.html`, backed by `src/heatmap-utils.js`). There is
no external API; this is the user-observable rendering contract validated manually in the
browser per `quickstart.md`.

## True-path shape

- Above the existing low-zoom aggregation threshold (`specs/002-heatmap-performance-scale`),
  every drawn corridor MUST follow its creating activity's actual recorded (simplified) point
  sequence for that corridor's matching window — not a single straight chord between the
  window's two boundary points.
- The drawn true-path polyline MUST NOT contain any point that was not present in the
  creating activity's recorded/simplified track — no interpolation or fabrication.
- A corridor whose creating activity had very few original points within its window MUST NOT
  be rendered as smoother than that activity's real recorded shape.
- At/below the low-zoom aggregation threshold, rendering is unchanged from
  `specs/002-heatmap-performance-scale` (coarser aggregated chords, not true-path detail).

## One line per corridor, colored as one unit

- Each corridor MUST still be drawn as exactly one polyline (never one polyline per
  contributing activity), regardless of how many activities share it.
- The entire true-path polyline for one corridor MUST use a single color/weight/opacity,
  derived from that corridor's own visit-frequency count — color MUST NOT change partway
  along a single corridor's polyline.
- Where two corridors meet (a route passing from one matching window into the next), each
  keeps its own color; a color change between adjacent corridors is expected and correct when
  their frequencies differ.

## Unaffected behavior (regression guardrails)

- Corridor matching (which recordings count as the same route), frequency counting, the
  low-zoom aggregation threshold and its own rendering, the frequency-on-top draw-order
  guarantee, the fixed single-channel (color-only) style from
  `specs/005-heatmap-rendering-quality`, the minimum-visible-length guarantee, and
  hover/tooltip activity resolution (`specs/004-heatmap-frequency-details`) MUST continue to
  behave exactly as before this feature, aside from the true-path shape change described
  above.
- Map panning and zooming MUST remain smooth (no perceptible multi-frame freeze) at the
  dataset scale already validated in `specs/002-heatmap-performance-scale`.
