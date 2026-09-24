# Implementation Plan: Workout Time Visualization

**Branch**: `030-workout-time` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/030-workout-time/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a new Workout Time visualization tab that counts imported workouts by start-time
patterns across four selectable granularities: time of day, weekday, day of month,
and month of year. The feature will preserve start timestamps in the normalized
activity data, filter the existing in-memory activity set by the dashboard's sport
and date-range selections, calculate deterministic groups in a pure dual-target
utility, and render the selected result through the existing Chart.js/export patterns.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Existing Chart.js CDN dependency; existing tab-navigation, dashboard filter, and export utilities; no new dependency

**Storage**: In-memory imported activity data (`processedActivities`); no persistence changes

**Testing**: Jest in the Node environment; focused utility, parser/processing, tab-navigation, script-syntax, and export metadata tests

**Target Platform**: Static browser app served by a plain file server, desktop and narrow browser viewports

**Project Type**: Static browser web application with reusable data utilities and classic dashboard orchestration scripts

**Performance Goals**: For up to 10,000 activities on a supported desktop browser, filtering, grouping, and chart re-render complete within 500 milliseconds after a granularity or filter change

**Constraints**: No bundler or build step; CommonJS plus `window.*` bridge for reusable logic; local-only raw-file processing; preserve All/Run/Bike/Swim and date-range semantics; retain start time from German and English activity timestamps; no API changes

**Scale/Scope**: One new visualization tab, one reusable time-aggregation utility, normalized start-time support in both import paths, related tab/export wiring, and focused tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution principle | Status | Evidence / plan alignment |
|---|---|---|
| I. Static Browser-First Delivery | PASS | The tab and controls remain in `index.html`/classic dashboard scripts, use existing Chart.js, and run from a plain static file server. |
| II. Dual-Target Reusable Modules | PASS | Time parsing/grouping/filter helpers live in a pure CommonJS + `window.*` utility; DOM orchestration remains in the dashboard script. |
| III. Narrowest-Scope Test-First Verification | PASS | The plan updates tab constants, markup/dispatch, tab tests, parser/processing tests, utility tests, and export/syntax checks together. |
| IV. Faithful Locale-Aware Data Parsing | PASS | German and English activity timestamps remain supported, start time is preserved without changing sport normalization or existing distance semantics. |
| V. Explicit Privacy & Network Boundaries | PASS | Computation stays over the local in-memory dataset; no new network request, storage, or API surface is introduced. |
| Repository & Dependency Boundaries | PASS | Changes stay in root static-app modules/tests and do not cross into `services/api`. |
| Development Workflow | PASS | Scope is limited to the new tab, timestamp field support, utility logic, direct wiring, tests, and feature documentation. |

## Project Structure

### Documentation (this feature)

```text
specs/030-workout-time/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
src/
├── dashboard-utils.js              # Extend normalized activity with start timestamp
├── dashboard-import.js             # Keep browser import path's timestamp
├── workout-time-utils.js           # NEW: pure filtering and four-granularity grouping
├── dashboard-workout-time.js       # NEW: tab controls and Chart.js orchestration
├── tab-navigation.js               # Register new tab
├── dashboard-tabs.js               # Dispatch and tab-opening integration
├── dashboard-export.js              # Capture/context integration
└── export-utils.js                 # Title, slug, and export metadata

index.html                          # Tab markup, controls, canvas, script ordering

__tests__/
├── workout-time-utils.test.js       # NEW: grouping/filter/date edge cases
├── parsing.test.js                  # Timestamp parsing coverage
├── processing.test.js               # Normalized field coverage
├── tab-navigation.test.js           # New tab registration and keyboard order
├── index-script-syntax.test.js      # Script loading/dispatch contract
└── export-utils.test.js             # Export title/slug metadata
```

**Structure Decision**: Keep the existing single static-browser project. Reusable
timestamp and grouping logic is isolated in `src/workout-time-utils.js`; the import
normalization remains in the two established processing paths; DOM/chart wiring is a
dedicated classic dashboard script loaded in the documented order. No backend,
database, or new external interface is needed.

## Complexity Tracking

No Constitution Check violations. This section is not applicable.
