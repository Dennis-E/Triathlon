# Implementation Plan: Distribution Labels and Color Schemes

**Branch**: `026-distributions-labels-colors` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/026-distributions-labels-colors/spec.md`

## Summary

Improve the Distributions tab's visual language and unsupported-state handling: use filled-point legends, add explicit metric units and human-readable time/speed labels, show `50+` for the All Sports Length overflow category, show `N/A` for All Sports histograms, and add a session-scoped `Monochrome blue` palette alongside the default `On fire` palette. The implementation reuses the existing static-browser renderer and utility functions, preserving numeric bucket calculations and imported activity data.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Existing Chart.js CDN runtime, `src/distribution-utils.js`, `src/dashboard-distributions.js`; no new dependency

**Storage**: In-memory imported dataset and in-memory Distributions view state; no persistence changes

**Testing**: Jest in the Node environment; focused utility tests plus inline-script contract tests; manual browser validation with the static server

**Target Platform**: Static browser app served by a plain file server, desktop and narrow browser viewports

**Project Type**: Static browser web application with reusable data/visualization utilities

**Performance Goals**: Color selection, label formatting, and N/A guards must remain within the existing Distributions render path without additional network requests or avoidable repeated data scans

**Constraints**: Preserve the static-browser architecture, CommonJS/`window.*` bridge, current bucket counts and numeric values, existing `018`/`019` distribution behavior unless explicitly changed by the spec, and local-only activity processing

**Scale/Scope**: One existing dashboard tab; changes limited to `index.html`, `src/dashboard-distributions.js`, `src/distribution-utils.js`, focused root tests, and this feature's design artifacts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Constitution principle | Status | Evidence / plan alignment |
|---|---|---|
| I. Static Browser-First Delivery | PASS | Controls remain in `index.html`, rendering remains in the existing dashboard script, and no bundler or CDN dependency is added. |
| II. Dual-Target Reusable Modules | PASS | Pure palette and display-format helpers remain in `src/distribution-utils.js` with both existing CommonJS and `window.distributionUtils` bridges. DOM/chart orchestration stays in `src/dashboard-distributions.js`. |
| III. Narrowest-Scope Test-First Verification | PASS | Extend `__tests__/distribution-utils.test.js` and `__tests__/index-script-syntax.test.js`; run the focused command before the full root suite. No dashboard tab is added or removed, so tab-navigation files do not change. |
| IV. Faithful Locale-Aware Data Parsing | PASS | No CSV, GPX, sport normalization, or imported activity parsing changes. |
| V. Explicit Privacy & Network Boundaries | PASS | The feature reads only the already imported in-memory dataset and makes no network/API changes. |
| Repository & Dependency Boundaries | PASS | Changes stay in the root static app and root tests; `services/api` and the standalone CLI remain untouched. |
| Development Workflow | PASS | Scope is limited to distribution presentation, control state, and explicit unsupported-state behavior. |

## Phase 0: Research Summary

Research is complete in [research.md](research.md). The controlling decisions are:

- Reuse the existing renderer and utility boundaries; do not add a dependency.
- Use Chart.js's established `labels.usePointStyle` + circular point legend configuration.
- Guard All Sports + Histogram before data rendering and use the existing destroy/hide/empty-state path to prevent stale charts.
- Keep bucket calculations numeric; change only display labels, axis titles, and palette selection.
- Handle the Length overflow label as `50+` only when the existing open-ended category is present.

## Project Structure

### Documentation (this feature)

```text
specs/026-distributions-labels-colors/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── distributions-ui.md
└── tasks.md                 # Created by /speckit-tasks, not this plan
```

### Source Code (repository root)

```text
index.html
src/
├── dashboard-distributions.js
└── distribution-utils.js
__tests__/
├── distribution-utils.test.js
└── index-script-syntax.test.js
```

**Structure Decision**: Keep the existing static-browser project structure. Add the color-scheme control and markup in `index.html`; keep session state, Chart.js options, legend configuration, N/A transitions, and axis callbacks in `src/dashboard-distributions.js`; keep reusable palette and value-format helpers in `src/distribution-utils.js`; extend the two existing focused test files.

## Phase 1: Design Summary

The derived state and validation rules are documented in [data-model.md](data-model.md). The user-facing behavior is documented in [contracts/distributions-ui.md](contracts/distributions-ui.md). Runnable validation steps are documented in [quickstart.md](quickstart.md).

### Planned implementation slices

1. Add palette selection state and the two-option color control, then route bar/point/per-sport colors through a single palette-aware helper.
2. Add the All Sports + Histogram N/A guard and preserve the existing empty-state cleanup for no data and unsupported combinations.
3. Add metric axis titles, duration/tick formatting, unit-free Pace labels, Bike whole-number display, mixed-unit All Sports Pace wording, and Length `50+` rendering.
4. Configure all visible distribution legends with filled circular point markers.
5. Add focused tests for pure formatting/palette behavior and inline-script contracts, then run the quickstart checks.

## Post-Design Constitution Check

| Gate | Status | Evidence |
|---|---|---|
| Static delivery preserved | PASS | No build step, bundler, or new runtime dependency is introduced. |
| Module bridge preserved | PASS | Utility additions remain exportable through CommonJS and `window.distributionUtils`; DOM work remains in the dashboard script. |
| Test scope identified | PASS | Focused Jest command and full root suite are specified in `quickstart.md`. |
| Privacy and dependency boundaries preserved | PASS | No raw file handling, API calls, service dependencies, or cross-runtime contracts change. |
| Design artifacts complete | PASS | Research, data model, UI contract, and quickstart are present; no unresolved technical clarifications remain. |

## Complexity Tracking

No Constitution Check violations. No complexity exception is required.
