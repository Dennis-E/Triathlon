# Implementation Plan: Bike Power Personal Bests

**Branch**: `015-bike-power-personal-bests` | **Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/015-bike-power-personal-bests/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Make existing bike watt data discoverable in Personal Bests without confusing
whole-activity average power with duration-specific power records. The plan adds a
pure, testable power-record model for average and interval observations, wires FIT
power observations into the existing import result, and updates the Bike PB column
to render clearly labeled average-power and duration-power sections. No new tab,
server endpoint, or persisted storage is required.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Existing `fit-file-parser` dynamic browser import and existing CDN libraries; no new dependency

**Storage**: In-memory imported dataset only; raw files remain local

**Testing**: Jest in the Node test environment plus inline-script syntax/markup assertions and manual static-browser smoke checks

**Target Platform**: Static browser app served by a plain file server; desktop and narrow browser viewports

**Project Type**: Static browser web application with reusable data utilities

**Performance Goals**: Power extraction must remain within the existing ZIP import flow and must not make the PB view noticeably slower for the existing activity scale

**Constraints**: Preserve CommonJS/window bridges, German/English parsing, local-data privacy, existing PB categories, and current public function signatures unless all call sites/tests change together

**Scale/Scope**: One Personal Bests panel, existing Bike power durations (5m, 10m, 20m, 60m), supported Strava CSV/FIT import paths, and synthetic Jest fixtures

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution principle | Status | Evidence / plan alignment |
|---|---|---|
| I. Static Browser-First Delivery | PASS | Changes remain in the static `index.html` flow and browser-compatible `src/` modules; no bundler or build step. |
| II. Dual-Target Reusable Modules | PASS | Power normalization and PB calculations live in a pure CommonJS module with a `window.*` bridge; DOM rendering remains in `index.html`. |
| III. Narrowest-Scope Test-First Verification | PASS | Add focused power/import tests and inline-script assertions, then run the relevant Jest slice before the full root suite. |
| IV. Faithful Locale-Aware Data Parsing | PASS | Preserve German/English average-power headers, localized numeric parsing, strict Bike filtering, and FIT power units. |
| V. Explicit Privacy & Network Boundaries | PASS | Raw exports and generated power records remain local; no API or server changes are planned. |
| Repository & Dependency Boundaries | PASS | Only root frontend modules/tests are touched; no dependency crosses into `services/api`. |
| Development Workflow | PASS | Scope is limited to import normalization, power PB rendering, focused tests, and validation documentation. |

## Project Structure

### Documentation (this feature)

```text
specs/015-bike-power-personal-bests/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── power-pb-ui.md    # Bike Power Personal Bests UI contract
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
```text
src/
├── power-pb-utils.js
├── zip-importer.js
└── ...

__tests__/
├── power-pb-utils.test.js
├── processing.test.js
├── zip-importer.test.js
└── index-script-syntax.test.js

index.html
```

**Structure Decision**: Keep the existing static-browser structure. Reusable power
logic belongs in `src/power-pb-utils.js`; FIT extraction remains at the existing ZIP
import boundary in `src/zip-importer.js`; presentation changes remain in the existing
Personal Bests renderer in `index.html`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | No constitution violations. | No exception is required. |

## Phase 0: Research

Research is recorded in [research.md](research.md). It resolves the existing data
flow, the distinction between average and duration-specific power, the FIT import
boundary, and the test strategy without introducing a new external dependency.

## Phase 1: Design

- Define the normalized observation and personal-best entities in [data-model.md](data-model.md).
- Document the user-visible Bike PB behavior in [contracts/power-pb-ui.md](contracts/power-pb-ui.md).
- Provide automated and browser smoke validation in [quickstart.md](quickstart.md).

## Post-Design Constitution Re-check

All gates remain PASS after design. The design keeps local processing, existing
module boundaries, locale-aware parsing, and narrow Jest verification intact. The
only new reusable surface is the pure power utility module with both Node and browser
entry points.
