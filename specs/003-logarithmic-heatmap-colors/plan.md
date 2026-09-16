# Implementation Plan: Logarithmic Heatmap Colors

**Branch**: `003-logarithmic-heatmap-colors` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-logarithmic-heatmap-colors/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a logarithmic, frequency-dependent color encoding to the existing route-line heatmap:
light blue for the least-used routes, progressively darker blue for more frequent routes,
and red only above 90% of the logarithmic frequency range. Pure helpers in
`src/heatmap-utils.js` will derive one stable scale from the complete filtered segment set
and map counts to colors. `index.html` will compute/cache that scale when segments change,
apply colors in the existing single-canvas renderer and preview, and show a compact legend.
Low-zoom aggregates will retain summed `count` for the existing thickness behavior while
carrying the maximum source-segment frequency separately for color, preventing aggregation
from creating artificial red extremes.

## Technical Context

**Language/Version**: JavaScript (browser ES2017+ target; Node.js 18+ test target, matching
the existing project conventions)

**Primary Dependencies**: Leaflet 1.9.4 loaded from the existing CDN; browser Canvas 2D;
no new runtime dependency

**Storage**: N/A; route segments, color scales, and legend values remain in-memory for the
current browser session

**Testing**: Jest 30 in the existing `node` environment for pure heatmap utilities;
`__tests__/index-script-syntax.test.js` for inline-script syntax; manual browser validation
for Leaflet, Canvas, legend layout, color visibility, filters, and zoom behavior

**Target Platform**: Modern desktop and mobile browsers serving the static app without a
build step

**Project Type**: Single-project static web application

**Performance Goals**: Color-scale derivation is linear in the number of filtered segments
only when data/filter state changes; pan and zoom redraws perform constant-time style/color
lookups per visible stroke and preserve the responsiveness target for 3,000 activities from
`specs/002-heatmap-performance-scale`

**Constraints**: Keep low-frequency routes visible against standard OpenStreetMap tiles;
reserve red for normalized values above 0.9; preserve frequency-based thickness, map
navigation, sport filtering, route geometry, world-view visibility, and empty states; no
new build tooling, service, storage, or network request

**Scale/Scope**: One heatmap tab and its dashboard preview; frequencies from 1 through at
least 1,000 visits and datasets containing tens of thousands of route segments

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery - PASS.** The design uses existing plain JavaScript,
  Leaflet, Canvas 2D, and static markup. It adds no bundler, compilation step, or dependency.
- **II. Dual-Target Reusable Modules - PASS.** Scale derivation, normalization, color
  interpolation, and low-zoom color aggregation remain pure DOM-free functions in
  `src/heatmap-utils.js`, exported through both CommonJS and `window.heatmapUtils`. DOM and
  Canvas wiring remains in `index.html`.
- **III. Narrowest-Scope Test-First Verification - PASS.** Pure behavior is covered in
  `__tests__/heatmap-utils.test.js`; inline integration keeps the existing syntax test and
  receives browser validation. No dashboard tab or tab ID changes, so tab-navigation files
  remain out of scope.
- **IV. Faithful Locale-Aware Data Parsing - PASS (not applicable).** The feature consumes
  existing positive segment counts and does not modify CSV/GPX parsing or sport
  normalization.
- **V. Explicit Privacy & Network Boundaries - PASS.** All frequency and color processing
  remains local. No raw activity data, API behavior, or network boundary changes.
- **Repository boundaries - PASS.** Only root frontend utilities, tests, and `index.html`
  are affected; the CLI and `services/api` remain untouched.

No gate violations or unresolved clarifications were identified.

**Post-Design Re-check**: Phase 1 keeps the scale model pure, documents the internal browser
UI contract, and validates via the existing root test boundary. It introduces no new
dependency, parsing behavior, persistence, network request, or project surface. All gates
remain PASS.

## Project Structure

### Documentation (this feature)

```text
specs/003-logarithmic-heatmap-colors/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── heatmap-color-ui.md
└── tasks.md                       # Created later by /speckit-tasks
```

### Source Code (repository root)
```text
src/
└── heatmap-utils.js               # Add pure frequency-scale and color helpers;
                                    # extend low-zoom aggregates with colorCount

index.html                         # Apply cached colors in Canvas/preview rendering;
                                    # add and update compact heatmap legend markup

__tests__/
├── heatmap-utils.test.js          # Unit tests for scale, colors, edge cases, aggregation
└── index-script-syntax.test.js    # Existing inline JavaScript syntax regression check
```

**Structure Decision**: Extend the existing static-app files that already own heatmap data,
rendering, and tests. The internal UI contract is documented because users interact with the
legend and color states, but no external API contract or service endpoint is introduced.

## Complexity Tracking

No Constitution Check violations require justification.
