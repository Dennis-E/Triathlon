# Implementation Plan: Pie Charts

**Branch**: `049-pie-charts` | **Date**: 2026-10-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/049-pie-charts/spec.md`

## Summary

Add a "Pie Charts" dashboard tab showing one large, polished Chart.js pie of the locally imported activities. Users choose a grouping dimension (Sport, Duration, Pace, Equipment, Length, Power), a slice measure (Activities, Time, Distance), a sport filter (All/Run/Bike/Swim) and a colour scheme (On fire / Monochrome blue). A new pure dual-target utility `src/pie-chart-utils.js` computes ordered, ≤ 8 slices by reusing the Distributions bucketing and labels; a classic DOM-orchestration script `src/dashboard-pie-charts.js` renders chart, HTML legend, summary and empty state. The tab is wired into tab navigation and the existing Share/Export flow, and the landing "And much more" tile gets a "Pie charts" bullet.

## Technical Context

**Language/Version**: Browser JavaScript (classic scripts / CommonJS-compatible ES syntax); Node.js for Jest.

**Primary Dependencies**: Existing CDN Chart.js, Tailwind CDN, html2canvas (export); existing `distribution-utils.js`. No new dependency.

**Storage**: In-memory `processedActivities` and transient selection state; no persistence.

**Testing**: Jest (`node` environment): new `__tests__/pie-chart-utils.test.js`, updates to `tab-navigation.test.js`, `index-script-syntax.test.js`, `preview-assets.test.js`; root `npm test`; manual static-server validation per [quickstart.md](quickstart.md).

**Target Platform**: Modern desktop and mobile browsers via static file server.

**Project Type**: Static browser frontend with CommonJS-testable utilities.

**Performance Goals**: Any selection change re-renders within 1 s for ≤ 5,000 activities (single O(n) pass plus bucketing).

**Constraints**: No build step; no new network requests; full tab registration (constants, ARIA markup, dispatch, keyboard, tests); export capture must include legend; no horizontal overflow on narrow screens.

**Scale/Scope**: One new tab, one new utility, one new dashboard script, one additive export in `distribution-utils.js`, export map registration, one landing bullet.

## Constitution Check

*Gate: evaluate before and after design.*

| Principle / constraint | Status | Plan evidence |
|---|---|---|
| I. Static browser-first delivery | PASS | Uses already loaded Chart.js; classic `<script src>` tags; no bundler. |
| II. Dual-target reusable modules | PASS | Slice computation in pure `src/pie-chart-utils.js` with `module.exports` + `window.pieChartUtils`; DOM work in classic `src/dashboard-pie-charts.js`. |
| III. Test-first verification + Share/Export | PASS | Tab constants, HTML, dispatch and tab tests updated together; export target, data/no-data flag, view IDs and context registered with tests. |
| IV. Locale-aware data semantics | PASS | Consumes normalized `sport`, `distance` (km), `duration`; unknown sports (`null`) excluded, never reclassified. |
| V. Privacy/network boundaries | PASS | Only in-memory data; no new requests; synthetic test fixtures. |
| Dependency boundaries / public APIs | PASS | Only additive export (`findBucketIndexForValue`) in `distribution-utils.js`; no API/CLI changes. |

No violations.

## Project Structure

### Documentation (this feature)

```text
specs/049-pie-charts/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── pie-chart-utils.md
│   └── ui-contract.md
└── checklists/requirements.md
```

### Source Code and Tests

```text
index.html                            # Landing bullet, tab button/panel + controls, script tags
src/pie-chart-utils.js                # NEW pure slice computation, colors, formatting
src/dashboard-pie-charts.js           # NEW DOM orchestration, Chart.js pie, legend, empty state
src/distribution-utils.js             # Additive export of findBucketIndexForValue
src/tab-navigation.js                 # pieCharts key, button/panel IDs, order
src/dashboard-tabs.js                 # Render dispatch / focus mapping for pieCharts
src/dashboard-export.js               # Capture target, exportable flag, view IDs, controls/context
__tests__/pie-chart-utils.test.js     # NEW unit tests
__tests__/tab-navigation.test.js      # Tab registration and keyboard cycle
__tests__/index-script-syntax.test.js # Script order / wiring
__tests__/preview-assets.test.js      # "Pie charts" bullet in And much more tile
```

**Structure Decision**: Extend the existing static app following the Distributions/Wordcloud pattern: one pure utility plus one dashboard script, wired through `index.html`, tab navigation and export.

## Phase 0: Research

See [research.md](research.md). Key decisions: Chart.js `pie` with inline percentage-label plugin and HTML legend; numeric bucketing via `computeDistributionBuckets` with target 6; All-Sports pace as normalized km/h; measures from `duration`/`distance`; Equipment top 7 + "Other"; gradient-sampled colors with a new blue gradient; full export registration.

## Phase 1: Design and Contracts

- [Data model](data-model.md): selection state, slice/result structure, ordering and validation rules.
- [Utility contract](contracts/pie-chart-utils.md): `computePieSlices`, `getPieSliceColors`, `formatPieMeasureValue`, constants.
- [UI contract](contracts/ui-contract.md): IDs, controls, layout, empty state, export, landing tile, script order.
- [Quickstart](quickstart.md): automated and manual validation.

## Constitution Check (Post-Design)

| Gate | Status | Re-evaluation |
|---|---|---|
| Static browser-first | PASS | No new libraries or build tooling. |
| Reusable logic testable | PASS | All grouping/measure/color logic is pure and Node-testable. |
| Tab + export completeness | PASS | UI contract enumerates every registration point including export context. |
| Privacy | PASS | No new network calls; data stays in memory. |
| Focused scope | PASS | Only listed files change. |

## Out of Scope

- Date-range filter, persisting selections, doughnut/multi-pie layouts, a landing preview image, and changes to import or API.
