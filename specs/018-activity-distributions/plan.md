# Implementation Plan: Activity Distributions Visualization

**Branch**: `018-activity-distributions` | **Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/018-activity-distributions/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a new "Distributions" visualization tab to the existing static dashboard that lets
users pick one metric (Length, Duration, Pace, Elevation gain, or Power/Watt) and see
how their imported activities are distributed across that metric's value range. The
tab reuses the dashboard's existing sport filter (All/Run/Bike/Swim) and the
"Heartrate vs Pace" tab's dual-handle date-range control as the time horizon, and adds
a display-mode toggle between a bar histogram and an approximated smoothed line. Pace
values across mixed sports reuse the existing `getSportPerformanceMetric` convention
from `src/scatter-utils.js` (pace_run min/km, pace_swim min/100m, speed_bike km/h)
already combined on one axis in "Heartrate vs Pace", rather than introducing a new
conversion. A new `src/distribution-utils.js` module computes buckets (fixed target of
10-15 evenly-sized buckets over the filtered dataset's observed min/max) and filters
activities per metric/time-horizon/sport, following the existing dual CommonJS +
`window.*` module pattern; `index.html` renders the tab, controls, and Chart.js
bar/line chart, and wires it into export.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Chart.js (already loaded via CDN in `index.html`, used by the "Heartrate vs Pace" and other charts); new `src/distribution-utils.js` reusing `src/scatter-utils.js`'s `getSportPerformanceMetric` for Pace; existing `src/tab-navigation.js` pattern for tab wiring; existing export pipeline (`exportVisualizationTab`)

**Storage**: In-memory imported dataset only (`processedActivities`); no persistence changes

**Testing**: Jest in the Node environment — new `__tests__/distribution-utils.test.js` for bucket/filter logic, plus updates to `__tests__/tab-navigation.test.js` and `__tests__/index-script-syntax.test.js` for the new tab

**Target Platform**: Static browser app served by a plain file server, desktop and narrow browser viewports

**Project Type**: Static browser web application with reusable data utilities

**Performance Goals**: Bucket computation and chart re-render must stay within the existing per-tab render budget (comparable to "Heartrate vs Pace") for datasets of the sizes already supported by the dashboard; no new network calls are introduced

**Constraints**: Preserve the static-browser architecture (no bundler/build step), CommonJS/`window.*` module bridges, local-only processing, and the existing All/Run/Bike/Swim sport-filter and date-range conventions; new metric ("Pace") axis semantics MUST match the existing mixed-unit convention already used by "Heartrate vs Pace" rather than inventing a new normalization scheme

**Scale/Scope**: One new visualization tab (5 metrics × 2 display modes × existing sport/date filters), one new `src/` utility module, updates to `src/tab-navigation.js`, `index.html`, and their tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution principle | Status | Evidence / plan alignment |
|---|---|---|
| I. Static Browser-First Delivery | PASS | New tab, controls, and chart rendering are added directly to `index.html`'s existing rendering code and a plain `src/` module; no bundler, build step, or new CDN dependency beyond the already-loaded Chart.js. |
| II. Dual-Target Reusable Modules | PASS | New `src/distribution-utils.js` follows the CommonJS + `window.*` bridge pattern, exposes pure functions (bucket computation, filtering), and reuses `src/scatter-utils.js`'s existing exported `getSportPerformanceMetric` rather than duplicating pace logic. |
| III. Narrowest-Scope Test-First Verification | PASS | Adding the new tab requires updating `src/tab-navigation.js`'s tab constants/IDs, the matching markup/dispatch in `index.html`, and `__tests__/tab-navigation.test.js` in the same change, per the constitution's explicit rule; new `distribution-utils.test.js` covers bucket/filter logic before wiring the UI. |
| IV. Faithful Locale-Aware Data Parsing | PASS | No changes to CSV/GPX parsing or sport normalization; the feature only reads already-parsed `processedActivities` fields (distance, duration, elevation, avgWatts, sport, date). |
| V. Explicit Privacy & Network Boundaries | PASS | All distribution computation happens client-side over the already-local dataset; no new server calls or data leave the browser. Export reuses the existing local image-export flow. |
| Repository & Dependency Boundaries | PASS | Changes stay in root frontend modules/tests (`index.html`, `src/`, `__tests__/`) and do not touch `services/api`. |
| Development Workflow | PASS | Scope is limited to the new Distributions tab, its supporting utility module, and directly related tests/docs. |

## Project Structure

### Documentation (this feature)

```text
specs/018-activity-distributions/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── distributions-ui.md   # Tab/control/chart UI contract
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── distribution-utils.js   # NEW: metric extraction, bucket computation, filtering
├── scatter-utils.js        # Reused: getSportPerformanceMetric (Pace across sports)
└── tab-navigation.js       # Add 'distributions' to TAB_ORDER/TAB_BUTTON_IDS/TAB_PANEL_IDS

index.html                  # New vizTab/vizPanel for Distributions; chart render + export wiring

__tests__/
├── distribution-utils.test.js   # NEW: bucket/filter unit tests
├── tab-navigation.test.js       # Extended: 'distributions' tab coverage
└── index-script-syntax.test.js  # Extended: inline Distributions script contract assertions
```

**Structure Decision**: Single static-browser project (existing layout). The feature
adds one new reusable module (`src/distribution-utils.js`) alongside the existing
`src/` utilities, extends `src/tab-navigation.js`'s existing tab-list pattern, and adds
the tab's markup/rendering to `index.html`, matching how prior visualization tabs
(e.g., "Heartrate vs Pace", "Equipment mileage") were implemented.

## Complexity Tracking

> No Constitution Check violations. This section is not applicable.
