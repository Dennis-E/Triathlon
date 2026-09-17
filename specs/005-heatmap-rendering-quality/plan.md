# Implementation Plan: Heatmap Rendering Quality (Smooth Tracks & Correct Frequency Layering)

**Branch**: `005-heatmap-rendering-quality` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-heatmap-rendering-quality/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Fix two heatmap rendering defects on top of the existing route-line heatmap
(`specs/001`–`004`): (1) draw route segments in ascending visit-frequency order (with a
deterministic lexical-key tie-break) before every Canvas redraw, so a high-frequency segment
is never visually hidden underneath a low-frequency one regardless of import order; and (2)
replace the fixed-count, evenly-spaced-stride GPS track downsampling with curve-preserving
(Ramer–Douglas–Peucker) simplification bounded by a generous safety-maximum point count, so
recorded curves are followed accurately instead of cut across by long straight chords.
Frequency is communicated solely through color; line thickness and opacity become fixed
constants, removing the current triple-encoding (color + variable weight + variable opacity).

## Technical Context

**Language/Version**: JavaScript (browser ES2017+ target; Node.js 18+ test target, matching
the existing repository)

**Primary Dependencies**: Existing Leaflet 1.9.4 CDN integration and browser Canvas 2D;
no new runtime dependency

**Storage**: In-memory route segments and GPS tracks; no persistence change

**Testing**: Jest 30 in the existing Node environment for pure simplification, sort-order,
and style-constant helpers; existing inline-script syntax test; manual browser validation for
Canvas draw order, visual smoothness, and large datasets

**Target Platform**: Modern desktop and mobile browsers via the existing Heatmap tab; no new
platform surface

**Project Type**: Single-project static web application

**Performance Goals**: Preserve navigation with at least 3,000 activities and approximately
221,000 detail segments (baseline from `specs/002-heatmap-performance-scale`); segment
draw-order sorting MUST happen once per `setSegments()`/aggregate-build call, not per
redraw frame, so panning/zooming stays free of perceptible multi-frame freezes

**Constraints**: Static browser-only delivery; no new network requests; raw activity data
remains local; simplification MUST only remove points, never interpolate new ones; a single
track's retained point count MUST stay bounded by a generous safety maximum even for
unusually noisy/winding recordings; existing low-zoom aggregation, viewport culling,
minimum-visible-length, hover/tooltip, and color-scale behavior from `specs/001`–`004` MUST
keep working unchanged in outcome

**Scale/Scope**: One existing Heatmap tab and preview; all four sport-filter states; GPS
track simplification applies to every imported `.gpx(.gz)`/`.fit(.gz)` track

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery - PASS.** No bundler or build step is introduced; the
  new simplification and sort-order helpers are plain JavaScript functions loaded the same
  way as existing modules.
- **II. Dual-Target Reusable Modules - PASS.** The new curve-preserving simplification
  function and the segment sort-order/style-constant helpers are pure, DOM-free functions
  added to `src/zip-importer.js` and `src/heatmap-utils.js` respectively, exported via
  CommonJS and the existing `window.*` bridges.
- **III. Narrowest-Scope Test-First Verification - PASS.** New Jest coverage is added for
  simplification correctness (shape preservation, no invented points, safety-maximum
  fallback) and for draw-order sorting/tie-breaking; root `npm test` is the verification
  command. No dashboard tab or tab-navigation change is involved.
- **IV. Faithful Locale-Aware Data Parsing - PASS.** GPX/FIT extraction, CSV column
  handling, and sport normalization are unchanged; only the post-extraction point-count
  reduction step changes.
- **V. Explicit Privacy & Network Boundaries - PASS.** All processing remains client-side
  on already-imported local data; no network call or persistence is added.
- **Repository boundaries - PASS.** Work stays in the root static app and root Jest suite
  (`src/zip-importer.js`, `src/heatmap-utils.js`, `index.html`, `__tests__/`); `scripts/` and
  `services/api/` are untouched.

No gate violations or unresolved clarifications were identified.

**Post-Design Re-check**: Phase 1 keeps simplification and draw-order logic as pure,
DOM-free helpers; Canvas draw-call wiring in `index.html` only consumes their output. No new
project, dependency, or tab-navigation boundary is introduced. All gates remain PASS.

## Project Structure

### Documentation (this feature)

```text
specs/005-heatmap-rendering-quality/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── heatmap-rendering-ui.md
└── tasks.md                       # Created later by /speckit-tasks
```

### Source Code (repository root)
```text
src/
├── zip-importer.js                # Replace downsampleTrack's stride reduction with
│                                   # curve-preserving (Douglas-Peucker) simplification
└── heatmap-utils.js                # Add draw-order sorting (ascending count + lexical
                                    # key tie-break) and fixed style constants; keep
                                    # existing low-zoom/culling/hit-test helpers

index.html                         # RouteCanvasLayer: sort segments once on
                                    # setSegments()/low-zoom build, draw with fixed
                                    # weight/opacity, color-only frequency encoding

__tests__/
├── zip-importer.test.js           # Extend/replace downsampleTrack tests for simplification
├── heatmap-utils.test.js          # Add draw-order and fixed-style-constant tests
└── index-script-syntax.test.js    # Existing inline JavaScript syntax guard
```

**Structure Decision**: Extend the existing Heatmap owner files rather than introducing a
new module, component, or map layer. The UI contract documents the corrected visual/draw-order
behavior; there is no external API or service contract.

## Complexity Tracking

No Constitution Check violations require justification.

