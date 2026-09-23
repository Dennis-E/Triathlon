# Implementation Plan: Distribution Chart Cleanup

**Branch**: `027-distribution-chart-cleanup` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/027-distribution-chart-cleanup/spec.md`

## Summary

Correct the Distributions chart's visual semantics: derive histogram ticks from individual bucket boundaries, remove visible point markers from smoothed lines, match legend fills to their line strokes, normalize All Sports Pace to a shared km/h value, and make the monochrome-blue treatment flat medium-dark blue for histograms and line/fill output. The implementation stays within the existing utility and dashboard-renderer boundaries and preserves source activities.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Existing Chart.js CDN runtime, `src/distribution-utils.js`, `src/dashboard-distributions.js`, `src/scatter-utils.js`; no new dependency

**Storage**: In-memory imported activities and derived chart state; no persistence changes

**Testing**: Jest in the Node environment for conversion, bucket/tick helpers, and inline-script contracts; manual browser validation with the static server

**Target Platform**: Static browser app served by a plain file server, desktop and narrow browser viewports

**Project Type**: Static browser web application with reusable data/visualization utilities

**Performance Goals**: Boundary-label derivation and km/h conversion must run within the existing Distributions render path without extra network requests or mutation of imported activity records

**Constraints**: Preserve static-browser delivery, CommonJS/`window.*` bridges, existing single-sport metric semantics, N/A behavior, bucket counts where not explicitly changed, and local-only data processing

**Scale/Scope**: One existing dashboard tab; changes limited to `src/distribution-utils.js`, `src/dashboard-distributions.js`, `__tests__/distribution-utils.test.js`, `__tests__/index-script-syntax.test.js`, and feature documentation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Constitution principle | Status | Evidence / plan alignment |
|---|---|---|
| I. Static Browser-First Delivery | PASS | The solution uses existing static scripts and Chart.js options; no build step or dependency is added. |
| II. Dual-Target Reusable Modules | PASS | km/h conversion, tick derivation, and color helpers remain pure/exported utility logic; DOM and Chart.js orchestration remains in the dashboard script. |
| III. Narrowest-Scope Test-First Verification | PASS | Focused utility and inline-script tests cover conversion, tick boundaries, marker visibility, legend colors, and palette behavior before the full root suite. No tab is added or removed. |
| IV. Faithful Locale-Aware Data Parsing | PASS | No CSV, GPX, locale parsing, or sport normalization behavior changes; only derived visualization values are added. |
| V. Explicit Privacy & Network Boundaries | PASS | Imported data stays local and no API or network behavior changes. |
| Repository & Dependency Boundaries | PASS | Work remains in root frontend modules and root Jest tests; services and CLI are untouched. |
| Development Workflow | PASS | Scope is limited to the distribution chart's derived values and presentation. |

## Phase 0: Research Summary

Research is complete in [research.md](research.md). Key decisions:

- Normalize All Sports Pace to km/h in reusable metric extraction, without mutating activities.
- Keep descriptive range labels for contextual use but derive separate histogram boundary ticks.
- Set line point radii to zero and move color semantics to line strokes and fills.
- Match point-style legend fill to the dataset line color.
- Use one medium-dark blue for monochrome-blue histogram bars and line/fill output.

## Project Structure

### Documentation (this feature)

```text
specs/027-distribution-chart-cleanup/
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
src/
├── distribution-utils.js        # km/h conversion, boundary/tick helpers, palettes
└── dashboard-distributions.js   # Chart.js line/bar dataset and axis configuration
__tests__/
├── distribution-utils.test.js   # conversion, bucket boundaries, color/format tests
└── index-script-syntax.test.js  # dashboard rendering contract assertions
```

**Structure Decision**: Keep the existing static-browser layout. Reusable derived-value and label logic belongs in `src/distribution-utils.js`; Chart.js dataset, legend, line/fill, and axis configuration belongs in `src/dashboard-distributions.js`. No tab-navigation change is required.

## Phase 1: Design Summary

The derived entities and conversion rules are in [data-model.md](data-model.md). The user-facing contract is in [contracts/distributions-ui.md](contracts/distributions-ui.md). Runnable test and browser scenarios are in [quickstart.md](quickstart.md).

### Planned implementation slices

1. Add and test All Sports Pace km/h extraction without changing single-sport Pace behavior.
2. Add and test boundary tick derivation and unit-free axis formatting for histograms and lines.
3. Remove visible line points, apply palette colors to strokes/fills, and synchronize legend marker fills.
4. Flatten monochrome-blue histogram bars to one medium-dark color.
5. Run focused tests, full regression tests, and the documented browser validation.

## Post-Design Constitution Check

| Gate | Status | Evidence |
|---|---|---|
| Static delivery preserved | PASS | No bundler, build step, or external dependency is introduced. |
| Module bridge preserved | PASS | New utility functions remain available through CommonJS and `window.distributionUtils`. |
| Data integrity preserved | PASS | Activity objects remain unchanged; only All Sports Pace derives a normalized display metric. |
| Test scope identified | PASS | Focused and full Jest commands plus manual browser scenarios are documented. |
| Privacy and dependency boundaries preserved | PASS | No API, export, import-source, or service changes are planned. |
| Design artifacts complete | PASS | Research, data model, UI contract, and quickstart contain no unresolved clarifications. |

## Complexity Tracking

No Constitution Check violations. No complexity exception is required.
