# Implementation Plan: Distribution Histogram Axis Units

**Branch**: `028-distribution-axis-units` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/028-distribution-axis-units/spec.md`

## Summary

Correct Histogram x-axis labels so they show actual metric boundaries and units rather than category positions such as `0, 1, 2, 3`. The implementation will derive visible labels from existing bucket boundaries, format them through the selected metric's formatter, preserve open-ended bucket labels, and leave bucket membership, counts, filters, and N/A states unchanged.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Existing Chart.js CDN runtime, `src/distribution-utils.js`, `src/dashboard-distributions.js`; no new dependency

**Storage**: In-memory imported activities and derived chart state; no persistence changes

**Testing**: Jest in the Node environment for boundary/formatting helpers and inline-script contracts; manual browser validation with synthetic or supplied local activity data

**Target Platform**: Static browser app served by a plain file server, desktop and narrow browser viewports

**Project Type**: Static browser web application with reusable visualization utilities

**Performance Goals**: Boundary-label derivation must remain within the existing Histogram render path and must not add network calls or mutate imported activities

**Constraints**: Preserve static-browser delivery, CommonJS/`window.*` bridges, existing bucket calculations and counts, current metric/sport/color/date controls, and N/A behavior

**Scale/Scope**: One existing Distributions tab; changes limited to `src/distribution-utils.js`, `src/dashboard-distributions.js`, focused root tests, and feature documentation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Constitution principle | Status | Evidence / plan alignment |
|---|---|---|
| I. Static Browser-First Delivery | PASS | Uses the existing static scripts and Chart.js configuration; no build step or dependency is added. |
| II. Dual-Target Reusable Modules | PASS | Boundary extraction and metric formatting remain pure utility logic with existing CommonJS and browser bridges; axis wiring remains dashboard orchestration. |
| III. Narrowest-Scope Test-First Verification | PASS | Add utility tests for every metric/unit and inline-script tests for category-axis mapping, then run the full root suite. No tab is added or removed. |
| IV. Faithful Locale-Aware Data Parsing | PASS | No CSV, GPX, locale parsing, or sport normalization changes. |
| V. Explicit Privacy & Network Boundaries | PASS | No network, API, import-source, or persistence behavior changes. |
| Repository & Dependency Boundaries | PASS | Work remains in the root frontend modules/tests and does not touch services or the CLI. |
| Development Workflow | PASS | Scope is limited to visible Histogram axis labels and formatting. |

## Phase 0: Research Summary

Research is complete in [research.md](research.md). Key decisions:

- Treat visible axis ticks as a separate derived view from bucket ranges and counts.
- Map category-axis positions back to precomputed metric boundary labels.
- Format Length, Elevation gain, Duration, Pace, and Power through their metric-specific display rules.
- Preserve underflow/overflow labels, de-duplicate repeated rounded ticks, and keep N/A behavior unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/028-distribution-axis-units/
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
├── distribution-utils.js        # boundary extraction and metric tick formatting
└── dashboard-distributions.js   # Chart.js category-axis mapping and callbacks
__tests__/
├── distribution-utils.test.js   # metric/unit/boundary regression tests
└── index-script-syntax.test.js  # renderer contract assertions
```

**Structure Decision**: Keep the existing static-browser structure. Reusable boundary and formatting logic belongs in `src/distribution-utils.js`; Chart.js category-axis callbacks and current-state wiring belong in `src/dashboard-distributions.js`. No tab-navigation changes are required.

## Phase 1: Design Summary

The bucket and tick entities are defined in [data-model.md](data-model.md). The visible behavior is defined in [contracts/distributions-ui.md](contracts/distributions-ui.md). Runnable validation is defined in [quickstart.md](quickstart.md).

### Planned implementation slices

1. Add focused boundary-label and per-metric unit tests.
2. Implement a pure boundary-to-tick formatter with duplicate suppression and open-ended handling.
3. Map Histogram category positions to those labels in the dashboard renderer for every metric and sport.
4. Verify bucket counts, N/A states, and all metric units through focused, full-suite, and browser validation.

## Post-Design Constitution Check

| Gate | Status | Evidence |
|---|---|---|
| Static delivery preserved | PASS | No bundler, build step, or external dependency is introduced. |
| Module bridge preserved | PASS | Utility additions remain available via CommonJS and `window.distributionUtils`. |
| Data and count integrity preserved | PASS | Only visible tick labels change; bucket values and counts remain authoritative. |
| Test scope identified | PASS | Focused tests, full Jest suite, and manual browser scenarios are documented. |
| Privacy and dependency boundaries preserved | PASS | No API, network, import, or service changes are planned. |
| Design artifacts complete | PASS | Research, data model, UI contract, and quickstart contain no unresolved clarifications. |

## Complexity Tracking

No Constitution Check violations. No complexity exception is required.
