# Implementation Plan: Countries Visited in Lifetime Statistics

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/068-total-country-count/spec.md`

**Note**: This plan ends at Phase 1 design; task generation and implementation are separate phases.

## Summary

Add an all-time Countries visited tile, including country names, to Lifetime Statistics. Derive it from current imported tracks and locally bundled Natural Earth boundaries. Use line/polygon intersection for border crossings, recalculate per imported dataset, and retain the tile in the existing Lifetime Statistics export. Rename the existing Total distance visualization label to Distance and remove the country tile from that view. See [research.md](research.md) for decisions and tradeoffs.

## Technical Context

**Language/Version**: JavaScript, browser classic scripts plus CommonJS modules for reusable utilities; Node.js/Jest for tests

**Primary Dependencies**: Existing static browser stack; focused Turf `booleanIntersects` module loaded using the existing browser ESM CDN pattern; local Natural Earth 50m Admin 0 country geometries

**Storage**: In-memory summary for the active imported dataset; bundled read-only country geometry asset; no persistence

**Testing**: Root Jest suite in Node; focused pure-utility, Lifetime Statistics dashboard, import lifecycle, and export tests

**Target Platform**: Static browser app served from a plain local HTTP server; Node test environment

**Project Type**: Static browser application

**Performance Goals**: Calculate at most once per imported dataset; do not repeat geographic matching when sport, timeframe, or aggregation controls change

**Constraints**: No bundler or build step; activity tracks remain local; use the simplified tracks already produced by import; gracefully represent unavailable data or failed boundary loading

**Scale/Scope**: One country-count/name tile in Lifetime Statistics and its existing export; rename the Distance view; all imported sports and dates; no new tab, map, or server feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery — PASS**: Keep the app build-free; load the reduced boundary asset locally and use the project's established browser dependency-loading approach.
- **II. Dual-Target Reusable Modules — PASS**: Put pure country aggregation in a `src/` utility with CommonJS exports and a `window.*` bridge; inject geometry operations in Node tests.
- **III. Narrowest-Scope Test-First Verification — PASS**: No visualization tab is introduced or changed. Add focused utility, dashboard state/rendering, and export assertions, and run them before completion.
- **IV. Faithful Locale-Aware Data Parsing — PASS**: Do not change CSV, GPX, FIT, or sport normalization. Consume the existing GPS track map and count all imported sports without reclassifying activities.
- **V. Explicit Privacy & Network Boundaries — PASS**: Keep track points and country matching in-browser. The optional library download retrieves code only; no activity or location data is sent to it or another service.
- **Repository boundaries — PASS**: Changes stay in the root static app and Jest suite; no API or CLI changes.

**Pre-design gate**: PASS. No constitutional deviation is required.

## Project Structure

### Documentation (this feature)

```text
specs/068-total-country-count/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── total-distance-country-metric.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)
```text
index.html
assets/
└── country-boundaries/
    └── ne_50m_admin_0_countries.geojson
src/
├── country-count-utils.js
├── dashboard-core.js
├── dashboard-import.js
├── dashboard-lifetime-statistics.js
└── dashboard-export.js
__tests__/
├── country-count-utils.test.js
├── dashboard-country-count.test.js
└── dashboard-export-download.test.js
```

**Structure Decision**: Keep the pure calculation in a dual-target utility under `src/`; update Lifetime Statistics when the current dataset's country summary changes; render names in the Lifetime Statistics capture and export areas. Rename only the visible Distance title and export title; existing tab IDs and navigation remain unchanged. Keep reduced country geometry under `assets/` and focused tests in `__tests__/`.

## Phase 1 Design

- **Data model**: See [data-model.md](data-model.md) for route inputs, boundary identity, and summary coverage states.
- **UI contract**: See [contracts/total-distance-country-metric.md](contracts/total-distance-country-metric.md) for Lifetime Statistics placement, country names, failure states, and export behavior.
- **Validation**: See [quickstart.md](quickstart.md) for focused Jest and browser smoke scenarios.

**Post-design constitution check**: PASS. The selected geometry is local, the computation is testable in Node, the feature adds no tab, and the export remains within the established local image flow. No external service receives activity data.

## Complexity Tracking

None. No constitution violations or additional project surfaces are introduced.
