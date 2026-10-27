# Implementation Plan: Export Layout Polish

**Branch**: `072-export-layout-polish` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/072-export-layout-polish/spec.md`

## Summary

Improve export-only spacing, fitting, chart legends, and text legibility across the requested visualization types. Place the active filter summary after deliberate spacing below the branded header and before the visualization. Preserve the existing browser-local capture, 1080px image composition, preview, and download flow. Use the shared exporter for composition and clone adjustments; for Leaflet, temporarily resize and invalidate the live map for capture, then restore its dimensions and viewport before showing the preview.

## Technical Context

**Language/Version**: Browser JavaScript; existing classic scripts and CommonJS-compatible utility modules

**Primary Dependencies**: Existing Chart.js, Leaflet, and html2canvas integrations; no new dependencies

**Storage**: None; export content is composed in browser memory

**Testing**: Root Jest suite in Node; focused tests in `__tests__/export-utils.test.js`, `dashboard-export-download.test.js`, `dashboard-scatter-years.test.js`, `pie-charts-dashboard.test.js`, and `lifetime-statistics-dashboard.test.js`, plus relevant chart/heatmap tests and browser validation

**Target Platform**: Static browser application served without a build step

**Project Type**: Static frontend application

**Performance Goals**: Keep existing capture settling and preview/download responsiveness; avoid adding extra chart renders or network work to an export

**Constraints**: Preserve the 1080 × 1080 export composition, current data/filter/aggregation semantics, preview/download parity, local image generation, and existing dashboard appearance outside export-specific regions

**Scale/Scope**: Existing export targets only: distance, pace-versus, PB detail, heatmap, distributions, workout time, pie charts, and lifetime KPI export

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery — PASS**: Retain the static app and existing browser capture flow; no build step or dependency is proposed.
- **II. Dual-Target Reusable Modules — PASS**: Keep reusable layout/legend derivation in `src/export-utils.js` with its existing CommonJS and `window.*` bridge. Keep DOM capture orchestration in the existing dashboard script.
- **III. Narrowest-Scope Test-First Verification — PASS**: Add focused tests for pure layout/legend helpers and the touched export/dashboard behavior; no new dashboard tab is introduced.
- **IV. Faithful Locale-Aware Data Parsing — PASS**: No parsing or activity classification changes are in scope.
- **V. Explicit Privacy & Network Boundaries — PASS**: Keep capture, composition, preview, and download local; do not send activity data or images to a server.

## Project Structure

### Documentation (this feature)

```text
specs/072-export-layout-polish/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── export-layout.md
└── tasks.md             # Created by /speckit-tasks, not this command
```

### Source Code (repository root)

```text
index.html
src/
├── dashboard-export.js
├── export-utils.js
├── dashboard-scatter.js
├── dashboard-heatmap.js
├── dashboard-core.js
├── dashboard-distributions.js
├── dashboard-workout-time.js
├── dashboard-pie-charts.js
└── dashboard-lifetime-statistics.js
__tests__/
├── export-utils.test.js
├── dashboard-export-download.test.js
├── dashboard-scatter-years.test.js
├── pie-charts-dashboard.test.js
└── lifetime-statistics-dashboard.test.js
```

**Structure Decision**: Extend the existing shared export pipeline and its pure helpers. Keep tab-specific capture behavior beside its current dashboard owner; use `index.html` only where export target markup or capture dimensions require adjustment. The heatmap's existing dashboard owner temporarily sizes Leaflet for capture and restores its previous dimensions, center, and zoom in a `finally` path. Reuse existing Jest files and add browser checks for rendered bounds and preview/download parity. Do not introduce a new application layer or endpoint.

## Phase 0: Research

See [research.md](research.md). Repository research found no unresolved technology or dependency choices. Existing capture and layout behavior, target ownership, limitations of static/unit tests, and decisions for each requested export are recorded there.

## Phase 1: Design

- [Data model](data-model.md): Export target context, capture snapshot, fitted content region, and legend series.
- [Export layout contract](contracts/export-layout.md): User-visible requirements for metadata, chart-specific layout, and local preview/download parity.
- [Quickstart](quickstart.md): Focused tests and browser scenarios for the updated export types.

## Constitution Check (Post-Design)

- **I. Static Browser-First Delivery — PASS**: Design uses only existing scripts and browser libraries.
- **II. Dual-Target Reusable Modules — PASS**: Pure layout and legend helpers remain dual-target; browser DOM orchestration remains in the current dashboard layer.
- **III. Narrowest-Scope Test-First Verification — PASS**: Each touched behavior has a focused existing or planned test; no new tab or API contract is added.
- **IV. Faithful Locale-Aware Data Parsing — PASS**: Design changes presentation only.
- **V. Explicit Privacy & Network Boundaries — PASS**: Export remains local and does not add network requests for activity or image content.
