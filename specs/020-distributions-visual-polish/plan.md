# Implementation Plan: Distributions Visual Polish

**Branch**: `020-distributions-visual-polish` | **Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/020-distributions-visual-polish/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Polish the `018-activity-distributions`/`019-distributions-refinements` "Distributions" tab:
change its initial render to "All Sports" + "Line" mode; apply a consistent
yellow-to-red "fire" color gradient (slow/short → fast/long) to every metric in both
display modes, using per-point colors for lines (so per-sport lines stay
distinguishable via their existing stroke color/legend while points still carry the
gradient); switch Duration's bucket-boundary step selection to a minutes-based "nice
step" table instead of the generic 1-2-5×10^n sequence; move Pace's unit text from
every bucket label onto the axis title (bucket labels drop the repeated unit); add an
IQR-based lower-fence "smaller than" underflow bucket scoped to the Pace metric only;
reverse the x-axis order for Pace when a single Run or Swim sport is selected (not
for "All Sports", where the shared per-sport axis from `019` cannot be reversed
per-sport without breaking axis alignment); and show an explicit "N/A" indicator for
Elevation gain + Swim (both as a single-sport selection and as an omitted line in
"All Sports" + Line mode). All changes extend the existing `src/distribution-utils.js`
module and `index.html`'s `renderDistributionsChart()`; no new dependency, tab, or
metric is introduced.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Chart.js (already used by `renderDistributionsChart()`, including per-point `pointBackgroundColor` arrays already supported by its bar/line chart types); existing `src/distribution-utils.js`; no new dependency

**Storage**: In-memory imported dataset only (`processedActivities`); no persistence changes; the User Story 1 default is a plain `let` initializer with no cross-session persistence

**Testing**: Jest in the Node environment — extend `__tests__/distribution-utils.test.js` (fire-gradient color mapping, Duration nice-step table, Pace underflow bucket, axis-reversal metadata) and `__tests__/index-script-syntax.test.js` (default state, axis title/unit placement, Swim N/A wiring)

**Target Platform**: Static browser app served by a plain file server, desktop and narrow browser viewports

**Project Type**: Static browser web application with reusable data utilities

**Performance Goals**: Color-mapping and bucket computation must stay within the existing Distributions tab render budget; no new network calls

**Constraints**: Preserve the static-browser architecture (no bundler/build step), CommonJS/`window.*` module bridges, local-only processing, and all `018`/`019` behavior not explicitly changed here; Pace continues to combine sport-specific values without unit conversion in "All Sports" view (per `018`'s FR-005a) — the axis-reversal and underflow-bucket refinements from this feature apply only where they can be applied unambiguously (single-sport Pace views for reversal; the Pace metric as a whole for the underflow bucket, per this feature's clarification)

**Scale/Scope**: Changes localized to `index.html`'s state initializers and `renderDistributionsChart()`, and `src/distribution-utils.js`'s bucket/formatting/color functions, plus their tests; no new files beyond tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution principle | Status | Evidence / plan alignment |
|---|---|---|
| I. Static Browser-First Delivery | PASS | All changes stay inside `index.html`'s existing rendering code and the existing `src/distribution-utils.js` module; no build step or new CDN dependency (Chart.js's existing per-point color array support is used, not a new plugin). |
| II. Dual-Target Reusable Modules | PASS | New/changed color-mapping, nice-step, and underflow-bucket logic is added to `src/distribution-utils.js` as pure functions with the existing CommonJS + `window.distributionUtils` bridge. |
| III. Narrowest-Scope Test-First Verification | PASS | Each change (default state, color scheme, Duration steps, Pace unit placement, underflow bucket + axis reversal, Swim N/A) gets a focused unit/contract test before/alongside its implementation; no dashboard tab is added or removed, so no `tab-navigation.js` changes are required. |
| IV. Faithful Locale-Aware Data Parsing | PASS | No changes to CSV/GPX parsing, column detection, or sport normalization; this feature only changes how already-parsed values are bucketed, colored, and labeled. |
| V. Explicit Privacy & Network Boundaries | PASS | All changes operate on the already-local, in-memory dataset; no new network calls or data leave the browser. |
| Repository & Dependency Boundaries | PASS | Changes stay in root frontend modules/tests (`index.html`, `src/distribution-utils.js`, `__tests__/`) and do not touch `services/api`. |
| Development Workflow | PASS | Scope is limited to the Distributions tab's default state, color scheme, bucket-boundary rules, and Swim/Elevation handling. |

## Project Structure

### Documentation (this feature)

```text
specs/020-distributions-visual-polish/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── distributions-visual-polish-ui.md   # Updated chart/color/axis contract
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
└── distribution-utils.js   # Extended: fire-gradient color mapping, Duration
                             # minutes-based nice steps, Pace-only underflow bucket,
                             # axis-reversal metadata, unit-less bucket labels for Pace

index.html                   # Initial state: sport='All', mode='line'
                              # renderDistributionsChart(): fire colors (bars/points),
                              # Pace axis title unit, Swim+Elevation N/A handling

__tests__/
├── distribution-utils.test.js   # Extended: color mapping, Duration steps, Pace
│                                 # underflow bucket, axis-reversal metadata
└── index-script-syntax.test.js  # Extended: default state, axis/unit contract,
                                  # Swim N/A wiring
```

**Structure Decision**: Single static-browser project (existing layout, unchanged from
`018`/`019`). No new modules, tabs, or files are introduced besides tests; all logic
changes extend the existing `src/distribution-utils.js` module and `index.html`'s
existing state initializers and `renderDistributionsChart()` function.

## Complexity Tracking

> No Constitution Check violations. This section is not applicable.

