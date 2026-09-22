# Implementation Plan: Bike Power PB Refinement

**Branch**: `016-bike-power-pb-refinement` | **Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/016-bike-power-pb-refinement/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Refine the existing Bike Power Personal Bests implementation: remove the
activity-average power card, move duration-specific Watt records into a dedicated
section below Bike Longest, add short FIT power durations (5s, 30s, 1m, 2m), and
render an all-time duration-versus-watts profile using only available best values.
Reuse the existing local FIT import, power utility, SVG rendering, and Personal Bests
layout; no new tab, server endpoint, or persisted storage is required.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Existing `fit-file-parser` dynamic browser import, existing `src/power-pb-utils.js`, and browser SVG/DOM APIs; no new dependency

**Storage**: In-memory imported dataset only; raw Strava files remain local

**Testing**: Jest in the Node environment, inline-script/markup assertions, and static-browser smoke validation

**Target Platform**: Static browser app served by a plain file server, desktop and narrow browser viewports

**Project Type**: Static browser web application with reusable data utilities

**Performance Goals**: Adding four short durations and one profile must remain within the existing ZIP import and PB render interaction without noticeable slowdown for current datasets

**Constraints**: Preserve the static-browser architecture, CommonJS/window bridges, local-only power processing, existing PB sections, 80% valid-power coverage rule, and no average-watt substitution

**Scale/Scope**: One existing Personal Bests panel, eight Bike power durations, one all-time profile, supported FIT import data, and synthetic Jest fixtures

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution principle | Status | Evidence / plan alignment |
|---|---|---|
| I. Static Browser-First Delivery | PASS | UI remains in `index.html`; reusable calculations remain browser-compatible and no build step is introduced. |
| II. Dual-Target Reusable Modules | PASS | Short-duration definitions, rolling efforts, and profile shaping remain in `src/power-pb-utils.js` with CommonJS and `window.*` exports. |
| III. Narrowest-Scope Test-First Verification | PASS | Add focused utility/import/UI tests and run them before the complete root suite. No tab navigation changes are required. |
| IV. Faithful Locale-Aware Data Parsing | PASS | FIT power records keep existing normalization and invalid-sample rules; CSV average watts are explicitly excluded from this PB feature. |
| V. Explicit Privacy & Network Boundaries | PASS | Power records and profile data remain in the browser; no API or upload path is added. |
| Repository & Dependency Boundaries | PASS | Changes stay in root frontend modules/tests and do not cross into `services/api`. |
| Development Workflow | PASS | Scope is limited to the existing Bike PB renderer, power utility/import path, tests, and quickstart documentation. |

## Project Structure

### Documentation (this feature)

```text
specs/016-bike-power-pb-refinement/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── watt-pb-ui.md     # Watt section and profile UI contract
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
```text
src/
├── power-pb-utils.js       # Duration definitions, rolling efforts, profile shaping
├── zip-importer.js         # FIT power extraction and normalization
└── ...

__tests__/
├── power-pb-utils.test.js  # Short-duration and profile utility coverage
├── zip-importer.test.js     # FIT effort import coverage
└── index-script-syntax.test.js # Section placement and profile UI assertions

index.html                   # Watt section and duration-versus-watts visualization
```

**Structure Decision**: Reuse the existing static-browser structure. Power data
rules stay in `src/power-pb-utils.js`, FIT extraction stays in `src/zip-importer.js`,
and the existing `renderPbChart()` in `index.html` owns Watt-section placement and
SVG profile rendering.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | No constitution violations. | No exception is required. |

## Phase 0: Research

Research is recorded in [research.md](research.md). It resolves the duration
taxonomy, the removal boundary for activity-average PB data, the all-time profile
semantics, and the reuse of the existing FIT rolling-effort path.

## Phase 1: Design

- Define duration categories, duration PBs, and profile points in [data-model.md](data-model.md).
- Document Watt-section placement, labels, empty states, and axes in [contracts/watt-pb-ui.md](contracts/watt-pb-ui.md).
- Provide focused and browser validation scenarios in [quickstart.md](quickstart.md).

## Post-Design Constitution Re-check

All gates remain PASS after design. The design removes only the activity-average PB
presentation/calculation, preserves average watts for unrelated activity details,
keeps FIT-derived duration efforts local, and adds no navigation or service surface.
