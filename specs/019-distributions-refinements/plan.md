# Implementation Plan: Distributions Chart Refinements

**Branch**: `019-distributions-refinements` | **Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/019-distributions-refinements/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Refine the `018-activity-distributions` "Distributions" tab and the underlying
average-watts data processing: (1) exclude average-watts from Run/Swim activities at
the point of CSV parsing in `index.html`'s `processData()` so no non-Bike activity is
ever treated as having valid power data anywhere in the app; (2) when the sport filter
is "All Sports" and display mode is "Line", render one distinguishable line per sport
(Run/Bike/Swim) computed against one shared set of bucket boundaries, instead of one
blended line; (3) centralize per-metric value/axis formatting (whole minutes or
"Xh Ym" for Duration, "min:ss" plus the existing sport-specific unit for Pace, whole
meters for Elevation, whole/one-decimal km for Length) in `src/distribution-utils.js`
so both Histogram and Line modes render identical, human-friendly labels; and (4)
replace the current fixed-count, evenly-spaced bucket algorithm in
`computeDistributionBuckets` with a "nice number" step-size algorithm plus an
IQR-based (Q3 + 1.5x IQR) overflow bucket for outliers. No new dependency, tab, or
metric is introduced; all changes extend the existing `src/distribution-utils.js`
module and `index.html`'s `renderDistributionsChart()`/`processData()`.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Chart.js (already used by `renderDistributionsChart()`); existing `src/distribution-utils.js` and `src/scatter-utils.js`; no new dependency

**Storage**: In-memory imported dataset only (`processedActivities`); no persistence changes

**Testing**: Jest in the Node environment — extend `__tests__/distribution-utils.test.js` (bucket/formatting/outlier logic), `__tests__/processing.test.js` or an equivalent processData test (avgWatts exclusion), and `__tests__/index-script-syntax.test.js` (per-sport line rendering contract)

**Target Platform**: Static browser app served by a plain file server, desktop and narrow browser viewports

**Project Type**: Static browser web application with reusable data utilities

**Performance Goals**: Bucket computation (including IQR outlier detection and nice-number rounding) and multi-line rendering must stay within the existing Distributions tab render budget for datasets of the sizes already supported by the dashboard; no new network calls

**Constraints**: Preserve the static-browser architecture (no bundler/build step), CommonJS/`window.*` module bridges, local-only processing, and all existing `018-activity-distributions` behavior not explicitly changed here (metric set, sport/date filters, display-mode toggle, empty state, export); Pace continues to combine sport-specific values without unit conversion (per `018`'s FR-005a) — only its display formatting changes

**Scale/Scope**: Changes localized to `index.html`'s `processData()` and `renderDistributionsChart()`, and `src/distribution-utils.js`'s bucket/formatting functions, plus their tests; no new files beyond tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution principle | Status | Evidence / plan alignment |
|---|---|---|
| I. Static Browser-First Delivery | PASS | All changes stay inside `index.html`'s existing rendering/parsing code and the existing `src/distribution-utils.js` module; no build step or new CDN dependency. |
| II. Dual-Target Reusable Modules | PASS | New bucket/formatting/outlier logic is added to `src/distribution-utils.js` as pure functions with the existing CommonJS + `window.distributionUtils` bridge; no DOM-only APIs are introduced. |
| III. Narrowest-Scope Test-First Verification | PASS | Each change (avgWatts exclusion, per-sport lines, formatting, bucket algorithm) gets a focused unit/contract test before/alongside its implementation; no dashboard tab is added or removed, so no `tab-navigation.js` changes are required. |
| IV. Faithful Locale-Aware Data Parsing | PASS | The avgWatts fix (FR-001) changes `processData()`'s output based on the already-normalized `sportCategory`, without altering column detection, locale-aware number parsing, or sport classification rules. |
| V. Explicit Privacy & Network Boundaries | PASS | All changes operate on the already-local, in-memory dataset; no new network calls or data leave the browser. |
| Repository & Dependency Boundaries | PASS | Changes stay in root frontend modules/tests (`index.html`, `src/distribution-utils.js`, `__tests__/`) and do not touch `services/api`. |
| Development Workflow | PASS | Scope is limited to the Distributions tab's rendering/formatting and the shared avgWatts data-processing rule. |

## Project Structure

### Documentation (this feature)

```text
specs/019-distributions-refinements/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── distributions-refinements-ui.md   # Updated chart/legend/formatting contract
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
└── distribution-utils.js   # Extended: nice-number buckets, IQR overflow bucket,
                             # per-metric value formatting, per-sport bucket grouping

index.html                   # processData(): avgWatts excluded for non-Bike activities
                              # renderDistributionsChart(): per-sport lines, formatted
                              # axis/bucket labels, overflow-bucket rendering

__tests__/
├── distribution-utils.test.js   # Extended: nice buckets, IQR outliers, formatting,
│                                 # per-sport grouping
├── index-script-syntax.test.js  # Extended: per-sport line + formatting contract
└── processing.test.js           # Extended (or equivalent): avgWatts excluded for
                                  # non-Bike activities in processData()
```

**Structure Decision**: Single static-browser project (existing layout, unchanged from
`018-activity-distributions`). No new modules, tabs, or files are introduced besides
tests; all logic changes extend the existing `src/distribution-utils.js` module and
`index.html`'s existing `processData()`/`renderDistributionsChart()` functions.

## Complexity Tracking

> No Constitution Check violations. This section is not applicable.

