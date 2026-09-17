# Phase 0 Research: True-Path Route Geometry Rendering

All Technical Context items are resolved via `specs/006-true-route-geometry/spec.md`
Clarifications. No `NEEDS CLARIFICATION` markers remain.

## Decision 1: Root cause — corridors are drawn as straight probe-to-probe chords

- **Finding**: `buildRouteSegments()` in `src/heatmap-utils.js` resamples each activity's
  (already curve-preserving-simplified, per `specs/005-heatmap-rendering-quality`) points into
  probes spaced `probeSpacingMeters` apart (default 30 m) via `interpolateTrackProbes()`, then
  creates or matches one corridor object per **sliding window** of `continuitySteps` probes
  (default 3, i.e. ~90 m), advancing the window by a single probe (~30 m) each iteration — not
  by a full window. A newly created corridor stores only its two window-boundary probe
  coordinates as `coords: [start, end]`; `RouteCanvasLayer._draw()` in `index.html` draws that
  corridor as one straight `ctx.lineTo()` between those two points. The true recorded shape
  between them is discarded for rendering purposes (it was only used to build the intermediate
  probes, then thrown away).
- **Rationale for treating this as the root cause**: this exactly matches the reported symptom
  — many independently drawn ~90 m straight chords, overlapping every ~30 m with the next
  window, whose slightly different endpoint angles create a faceted, kinked appearance at
  zoom levels detailed enough to show individual chords.
- **Implication for the fix**: switching a corridor's rendered geometry from `[start, end]` to
  the true recorded (simplified) point sub-sequence spanning that same window eliminates the
  facets, because the true sub-path already follows the real curve. Overlapping windows will
  then redundantly draw the *same* real curve shape on top of itself (harmless visually, see
  Decision 4), rather than redundantly drawing *different* straight approximations of it
  (which is what causes the faceting today).

## Decision 2: Capture each corridor's true point sub-sequence at creation time

- **Decision**: Extend `interpolateTrackProbes()` to also return, for each generated probe,
  the index of the original (simplified) point that began the source segment it was
  interpolated from (its "true point index"). `buildRouteSegments()` already creates a new
  corridor only when no existing corridor matches (the "creating" activity, processed in
  sorted activity-ID order, exactly as today). At that creation moment, use the window's start
  and end probes' true-point indices to slice the creating activity's own `track.points` array
  (inclusive of both boundary points), and store that slice as the corridor's new
  `truePathPoints` field, alongside (not replacing) the existing `coords` chord (kept for
  backward-compatible bounds/API use, e.g. `computeRouteSegmentBounds()`,
  `buildLowZoomRouteSegments()`).
- **Rationale**: This reuses the exact activity/window that already determines a corridor's
  identity and geometry today (no change to *which* activity is canonical, matching the
  existing "first sorted activity" convention referenced in the spec's Assumptions), and only
  adds a byproduct of computation already being done (`interpolateTrackProbes()` already knows
  which original segment each probe came from internally; it just wasn't returned before).
- **Alternatives considered**:
  - *Re-derive the true sub-path after the fact by nearest-point search*: rejected as
    redundant and slower than simply returning the mapping the interpolation already computes.
  - *Store the entire creating activity's full track on every corridor it touches*: rejected —
    wasteful (one activity can touch hundreds of corridors) when only the relevant window slice
    is needed for rendering.

## Decision 3: One polyline per corridor, colored as a single unit (per Clarifications)

- **Decision**: A corridor's `truePathPoints` are drawn as one connected polyline (a
  `moveTo`/`lineTo` chain, or successive `stroke()` calls sharing one color/width/opacity)
  using that corridor's own `count`-derived color — the same color for the whole polyline, not
  interpolated point-by-point. This directly implements the spec's Q1 (one representative line
  per corridor, not one per contributing activity) and Q2 (color changes at corridor/window
  granularity, not continuously per point) clarifications.
- **Rationale**: Matches the already-established color-scale and draw-order architecture from
  `specs/003`–`005`; a corridor remains the unit of frequency, color, and draw-order sorting —
  only its rendered shape changes from 2 points to N points.
- **Alternatives considered**:
  - *Per-true-edge color lookup across corridor boundaries*: rejected by the spec
    Clarifications as unnecessary complexity beyond the requested granularity.

## Decision 4: Accept redundant overlapping-window draws as a harmless, bounded tradeoff

- **Decision**: Keep the existing sliding-window matching (advance by one probe, not one full
  window) unchanged, per FR-005. Each corridor's true-path polyline is drawn independently,
  even though consecutive corridors' windows overlap by roughly two-thirds of their length and
  will therefore draw the same real curve segment multiple times.
- **Rationale**: Because every overlapping corridor's true-path slice comes from the *same*
  creating activity's *same* recorded points for the overlapping portion (when they share a
  creator) or a matching corridor's own already-fixed geometry (when not), the redundant draws
  are pixel-identical strokes of the real curve, not competing approximations — so they do not
  reintroduce faceting. The extra draw calls are bounded by the existing, already-validated
  corridor count from `specs/002-heatmap-performance-scale` (window count does not change,
  only what each window draws), and each corridor's point count is small (bounded by its ~90 m
  span and `specs/005-heatmap-rendering-quality`'s simplification safety maximum).
- **Alternatives considered**:
  - *De-duplicate overlapping windows before rendering (e.g., keep only every 3rd, disjoint
    window)*: rejected for v1 as an unnecessary architecture change with its own edge cases
    (color must still reflect the *sub-window's* own frequency, not an average across a larger
    merged span); can be revisited later purely as a performance optimization if manual
    validation in `quickstart.md` shows a real slowdown.
  - *Merge all corridors of a whole route into one giant polyline up front*: rejected — this
    would break the per-corridor frequency/color granularity the spec explicitly requires
    (Q2), since a single merged polyline cannot show a color change partway along its length
    without additional segmentation logic that reintroduces exactly this feature's design.

## Decision 5: No change to matching, aggregation, draw-order, or style

- **Decision**: `buildRouteSegments()`'s matching logic (probe spacing, tolerance, continuity,
  heading rules), `buildLowZoomRouteSegments()`, `sortSegmentsForDrawOrder()`, and
  `computeRouteSegmentStyle()`'s fixed constants are reused unchanged. Low-zoom aggregation
  continues to use each corridor's existing `coords` chord (sufficient at that zoom level,
  per FR-006); true-path rendering applies only to full-detail corridors above the aggregation
  threshold.
- **Rationale**: FR-005/FR-006/FR-007 explicitly require these existing guarantees to remain
  intact; reusing them unchanged is the smallest change that satisfies the new requirement
  without regressing prior features.
- **Alternatives considered**:
  - *Build true-path geometry for low-zoom aggregates too*: rejected — aggregates already
    intentionally simplify geography for performance (`specs/002` Decision 4); true-path detail
    at that zoom would be imperceptible and costly.

## Decision 6: Test pure logic automatically; validate visual continuity manually

- **Decision**: Add Jest coverage for the true-point-index mapping in `interpolateTrackProbes()`
  and for corridor true-path assembly in `buildRouteSegments()` (shape preservation, no
  invented points, exactly one polyline per corridor, unchanged matching/count behavior).
  Preserve all existing heatmap tests and the inline-script syntax test. Validate visual curve
  continuity at street-level zoom manually in the browser using a real multi-activity export,
  per the project's established Canvas/DOM test boundary (`AGENTS.md`, `jest.config.js` uses
  `node`, not `jsdom`).
- **Rationale**: Consistent with `specs/002`–`005`'s established testing pattern.
- **Alternatives considered**:
  - *Add a Canvas/jsdom test harness for pixel-level curve assertions*: rejected as
    disproportionate and inconsistent with existing project test boundaries.
