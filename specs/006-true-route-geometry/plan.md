# Implementation Plan: True-Path Route Geometry Rendering

**Branch**: `006-true-route-geometry` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-true-route-geometry/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Replace each matched corridor's rendered geometry with the actual recorded (curve-preserving-
simplified, per `specs/005-heatmap-rendering-quality`) point sub-sequence of the activity that
originally created that corridor, instead of the straight two-point chord between its matching
probes. Each corridor still draws as exactly one polyline (per the Q1 clarification), colored
as one unit per the existing ~30-meter corridor/matching-window granularity (per the Q2
clarification) — only the corridor's *shape* changes, from a straight chord to the true
recorded curve. Corridor matching, frequency counting, low-zoom aggregation, draw-order
sorting, and fixed single-channel styling from `specs/001`–`005` remain unchanged.

## Technical Context

**Language/Version**: JavaScript (browser ES2017+ target; Node.js 18+ test target, matching
the existing repository)

**Primary Dependencies**: Existing Leaflet 1.9.4 CDN integration and browser Canvas 2D;
no new runtime dependency

**Storage**: In-memory route segments and GPS tracks; no persistence change

**Testing**: Jest 30 in the existing Node environment for pure true-point-range extraction,
corridor-creation, and rendering-path helpers; existing inline-script syntax test; manual
browser validation for visual curve continuity and large datasets

**Target Platform**: Modern desktop and mobile browsers via the existing Heatmap tab; no new
platform surface

**Project Type**: Single-project static web application

**Performance Goals**: Preserve navigation with at least 3,000 activities and approximately
221,000 detail corridors (baseline from `specs/002-heatmap-performance-scale`); a corridor's
true-path point count is bounded by its ~90-meter matching window and the existing
curve-preserving simplification from `specs/005-heatmap-rendering-quality` (itself bounded by
a safety-maximum point count), so drawing true sub-paths instead of chords increases total
stroke segments by a small constant factor per corridor, not by dataset size

**Constraints**: Static browser-only delivery; no new network requests; raw activity data
remains local; a corridor's true-path geometry MUST only reuse recorded/simplified points
(never fabricate new ones); corridor matching, frequency counts, and existing draw-order/
low-zoom/hit-test/minimum-visible-length guarantees from `specs/001`–`005` MUST be unaffected
in outcome; overlapping corridor windows (the existing sliding-window matching design) may
each independently draw their own true sub-path segment, since drawing the same recorded
curve redundantly is visually harmless (identical shape) even though it costs extra draw
calls — this is an accepted tradeoff, not a defect, and stays within the existing
performance baseline because window count is already bounded today

**Scale/Scope**: One existing Heatmap tab and preview; all four sport-filter states; true-path
rendering applies to every full-detail corridor at zoom levels above the existing low-zoom
aggregation threshold from `specs/002-heatmap-performance-scale`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery - PASS.** No bundler or build step is introduced; the
  new true-path extraction and rendering helpers are plain JavaScript functions loaded the
  same way as existing modules.
- **II. Dual-Target Reusable Modules - PASS.** True-point-range extraction and corridor
  true-path assembly are pure, DOM-free functions added to `src/heatmap-utils.js`, exported
  via CommonJS and the existing `window.heatmapUtils` bridge. Canvas draw-call wiring stays
  in `index.html`.
- **III. Narrowest-Scope Test-First Verification - PASS.** New Jest coverage is added for
  true-point-range extraction (probe-index-to-true-point-index mapping) and corridor
  true-path assembly (shape preservation, no invented points, one polyline per corridor); root
  `npm test` is the verification command. No dashboard tab or tab-navigation change is
  involved.
- **IV. Faithful Locale-Aware Data Parsing - PASS.** GPX/FIT extraction, CSV column handling,
  sport normalization, and the feature-005 simplification step are unchanged; only how a
  corridor's already-simplified points are sliced for rendering changes.
- **V. Explicit Privacy & Network Boundaries - PASS.** All processing remains client-side on
  already-imported local data; no network call or persistence is added.
- **Repository boundaries - PASS.** Work stays in the root static app and root Jest suite
  (`src/heatmap-utils.js`, `index.html`, `__tests__/`); `scripts/` and `services/api/` are
  untouched.

No gate violations or unresolved clarifications were identified.

**Post-Design Re-check**: Phase 1 keeps true-path extraction and assembly as pure, DOM-free
helpers; Canvas draw-call wiring in `index.html` only consumes their output (an array of
points per corridor instead of a two-point chord). No new project, dependency, or
tab-navigation boundary is introduced. All gates remain PASS.

## Project Structure

### Documentation (this feature)

```text
specs/006-true-route-geometry/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── heatmap-true-path-rendering.md
└── tasks.md                       # Created later by /speckit-tasks
```

### Source Code (repository root)
```text
src/
└── heatmap-utils.js                # Extend interpolateTrackProbes()'s output with a
                                    # true-point-index mapping; extend buildRouteSegments()
                                    # to capture each newly created corridor's true sub-path;
                                    # add a pure helper to build one polyline per corridor
                                    # for the Canvas layer to consume

index.html                         # RouteCanvasLayer._draw(): draw each corridor's
                                    # true-path point sequence as a connected polyline
                                    # instead of a single two-point chord, above the
                                    # low-zoom aggregation threshold

__tests__/
├── heatmap-utils.test.js          # Add true-point mapping and true-path assembly tests
└── index-script-syntax.test.js    # Existing inline JavaScript syntax guard
```

**Structure Decision**: Extend the existing Heatmap owner files rather than introducing a
new module, component, or map layer. The UI contract documents the corrected visual
behavior; there is no external API or service contract.

## Complexity Tracking

No Constitution Check violations require justification.

