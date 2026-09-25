# Implementation Plan: Cadence versus Pace Visualization

**Branch**: `040-cadence-pace` | **Date**: 2026-09-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/040-cadence-pace/spec.md`

## Summary

Add a local-only Cadence versus Pace visualization that presents one qualifying
activity as one scatter point. It retains average cadence and optional total steps
while importing German and English Strava CSV exports, produces a pure cadence-point
model for Run, Bike, and Swim, and renders a dedicated dashboard tab. The UI exposes
only sports with qualifying points, calls the measurements Schrittfrequenz,
Trittfrequenz, or Schwimmrhythmus as appropriate, and provides an explicit empty
state when no measurement is usable.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript (browser ES2015+ and Node CommonJS for Jest)

**Primary Dependencies**: Chart.js and Papa Parse from existing CDN tags; Jest 30 for tests

**Storage**: In-memory browser state from the local Strava export; no persistent storage

**Testing**: Jest 30 in the Node environment; served-browser validation with `python -m http.server`

**Target Platform**: Modern desktop and mobile browsers served as a static site

**Project Type**: Static browser application with a separate optional Express API that this feature does not use

**Performance Goals**: For a 3,000-row import, opening the Cadence versus Pace tab or switching its sport selector completes chart rendering within one second; maintain usable point selection with roughly 1,000 points per sport

**Constraints**: No bundler, no new browser dependencies, raw export data remains local, reusable logic must expose both CommonJS and browser-global interfaces, and only `Run`, `Bike`, and `Swim` are normalized sports

**Scale/Scope**: One new visualization tab; two new activity fields; one pure point-model helper; one dashboard orchestration script; focused parser, utility, navigation, syntax, and browser checks

## Constitution Check

*GATE: Passed before Phase 0 research and re-checked after Phase 1 design.*

| Principle | Plan assessment |
|-----------|-----------------|
| I. Static Browser-First Delivery | PASS - Uses existing classic scripts and existing CDN Chart.js; no build step or backend work. |
| II. Dual-Target Reusable Modules | PASS - Parsing-compatible point construction stays in `src/scatter-utils.js` with CommonJS and `window.scatterUtils` exports. DOM/chart work stays in a classic dashboard script. |
| III. Narrowest-Scope Test-First Verification | PASS - Parser, point model, tab navigation, script syntax, and manual browser checks are specified in [quickstart.md](quickstart.md). |
| IV. Faithful Locale-Aware Data Parsing | PASS - Both German and English cadence/step headers are recognized; duplicate distance semantics and strict sport normalization remain unchanged. |
| V. Explicit Privacy & Network Boundaries | PASS - The visualization uses the imported browser-resident activity set and adds no requests or raw-data transfer. |

No constitution violation requires a complexity justification.

## Project Structure

### Documentation (this feature)

```text
specs/040-cadence-pace/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
index.html                         # Script order, tab button, tab panel, inline dispatch
src/
├── dashboard-utils.js             # Testable CSV-to-activity normalization
├── dashboard-import.js            # Browser CSV-to-activity normalization and import lifecycle
├── scatter-utils.js                # Pure cadence-point selection and sport availability helpers
├── dashboard-cadence-scatter.js   # Dedicated DOM and Chart.js rendering for this tab
├── dashboard-tabs.js              # Render dispatch when the new tab becomes active
└── tab-navigation.js              # Tab order, IDs, active state, keyboard navigation
__tests__/
├── processing.test.js              # German/English cadence and total-step parser coverage
├── scatter-utils.test.js          # Qualifying-point and sport-availability coverage
├── tab-navigation.test.js         # New tab IDs, navigation, and ARIA state
└── index-script-syntax.test.js    # Script parsing and load-order coverage
specs/040-cadence-pace/
└── contracts/cadence-pace-ui.md   # UI and data contract for the new visualization
```

**Structure Decision**: Extend the single static browser application. The pure
data-selection API belongs in the existing dual-target `scatter-utils.js`; the
separate dashboard script prevents cadence-specific DOM state from becoming coupled to
the existing heart-rate chart. No service, endpoint, or database is introduced.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No complexity exceptions are required for this feature.
