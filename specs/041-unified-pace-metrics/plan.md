# Implementation Plan: Unified Pace versus Metrics Visualization

**Branch**: `041-unified-pace-metrics` | **Date**: 2026-09-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/041-unified-pace-metrics/spec.md`

## Summary

Replace the separate Heartrate vs Pace and Cadence vs Pace dashboard tabs with one
Pace vs ... tab. It uses one selected sport and one selected metric (heart rate,
cadence, elevation gain, or distance), retains the existing local date filtering,
year visibility checkboxes, and trend-line toggle, and changes labels and tooltips by
metric and sport. The existing heart-rate export capability migrates to the unified
tab; no new data leaves the browser.

## Technical Context

**Language/Version**: JavaScript (browser ES2015+ and Node CommonJS for Jest)

**Primary Dependencies**: Existing Chart.js, Papa Parse, html2canvas, and Lucide CDN resources; Jest 30

**Storage**: In-memory activity data from the local Strava export; no new persistence

**Testing**: Jest 30 in Node plus served-browser checks with `python -m http.server`

**Target Platform**: Modern desktop and mobile browsers served as a static site

**Project Type**: Static browser application; no API or service changes

**Performance Goals**: A metric or year visibility change renders a chart or its empty state within one second for a 3,000-activity import

**Constraints**: No bundler or new dependency; reusable logic remains CommonJS plus browser-global; only one sport may be selected; imported raw data remains local

**Scale/Scope**: One replacement dashboard tab and landing preview, one generic point model, one unified renderer, migrated export metadata, removal of the separate cadence renderer, and focused parser/utility/navigation/export/browser tests

## Constitution Check

*GATE: Passed before Phase 0 research and re-checked after Phase 1 design.*

| Principle | Plan assessment |
|-----------|-----------------|
| I. Static Browser-First Delivery | PASS - Reuses the static page and existing browser libraries; no build step or server work. |
| II. Dual-Target Reusable Modules | PASS - Generic point selection is a pure `scatter-utils.js` API with both CommonJS and `window.scatterUtils` exports; rendering remains dashboard orchestration. |
| III. Narrowest-Scope Test-First Verification | PASS - The plan covers generic point tests, navigation, export metadata, script order, focused Jest, full Jest, and browser checks. |
| IV. Faithful Locale-Aware Data Parsing | PASS - It reuses normalized heart rate, cadence, elevation gain, and distance fields without changing duplicate distance or sport normalization semantics. |
| V. Explicit Privacy & Network Boundaries | PASS - All points and exports derive from existing browser-resident data and add no network request. |

No constitution violation requires a complexity justification.

## Project Structure

### Documentation (this feature)

```text
specs/041-unified-pace-metrics/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html                         # Unified tab, panel, landing preview, and script list
src/
├── dashboard-utils.js             # Existing locale-aware normalized activity data
├── dashboard-import.js            # Unified scatter reset after imports
├── scatter-utils.js                # Generic PaceMetricPoint construction and validation
├── dashboard-scatter.js            # Renamed/generalized Pace vs ... renderer and controls
├── dashboard-cadence-scatter.js   # Removed after its behavior is merged
├── dashboard-export.js             # Unified tab capture target and filter context
├── export-utils.js                 # Unified display title, slug, and legend metadata
├── dashboard-tabs.js               # paceMetrics render dispatch and landing routing
└── tab-navigation.js               # paceMetrics tab IDs and keyboard navigation
__tests__/
├── scatter-utils.test.js
├── heartrate-pace-visualization.test.js
├── tab-navigation.test.js
├── index-script-syntax.test.js
├── export-utils.test.js
├── preview-assets.test.js
└── legal-footer.test.js
specs/041-unified-pace-metrics/
└── contracts/pace-metrics-ui.md
```

**Structure Decision**: Generalize the established heart-rate scatter renderer
instead of retaining parallel heart-rate and cadence renderers. The generic utility
owns per-metric qualification and point construction; the unified renderer owns all
DOM state and Chart.js configuration. Existing export support migrates to the new key
because it replaces an already exportable visualization.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No complexity exceptions are required for this feature.
