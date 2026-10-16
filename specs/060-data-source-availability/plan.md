# Implementation Plan: Data-Source-Aware Visualizations

**Branch**: `060-data-source-availability` | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/060-data-source-availability/spec.md`

## Summary

After a completed import, expose only dashboard visualization tabs whose view-specific data model can produce meaningful, non-empty output from the imported activities. Keep availability source-agnostic so Strava and TrainingPeaks fields are handled by the same view predicates. Recompute visibility from the current import, synchronize tab navigation, and move away from a selected tab when it becomes unavailable. This is presentation-only: imported files, activity records, and values are not modified.

## Technical Context

**Language/Version**: Browser-compatible JavaScript; repository uses classic scripts and CommonJS-compatible utility modules.

**Primary Dependencies**: Existing CDN-loaded visualization libraries; no new dependency expected.

**Storage**: In-memory imported dataset and per-import auxiliary data (GPS tracks and FIT best efforts); no persistence added.

**Testing**: Root Jest suite in Node. Use focused tests for tab navigation, import orchestration, and each affected view/model; DOM orchestration tests use the repository's injected/mock document or VM harnesses.

**Target Platform**: Static browser application served without a build step.

**Project Type**: Static browser dashboard with reusable `src/` utilities and classic-script DOM orchestration.

**Performance Goals**: Recompute readiness once per completed dataset application and avoid additional full-dataset scans when existing render models already expose the necessary output.

**Constraints**: Preserve the existing tab IDs, script load order, source parser semantics, local-only activity processing, imported activity values, ARIA tab behavior, keyboard navigation, and Share/Export behavior. No view is available merely because its source is Strava or TrainingPeaks; availability is based on renderable data. The feature changes presentation only and does not edit or delete imported data.

**Scale/Scope**: Twelve existing visualization tabs; no new visualization, import source, cross-source merge workflow, or persisted readiness state.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|---|---|---|
| I. Static browser-first delivery | PASS | Use existing static page and classic script wiring; no bundler or server feature is introduced. |
| II. Dual-target reusable modules | PASS | Any shared readiness/filtering logic remains pure and CommonJS + `window.*` compatible; DOM updates stay in dashboard orchestration. |
| III. Narrowest-scope test-first verification | PASS | Update tab constants/IDs behavior, HTML markup/dispatch, accessible keyboard navigation and focused Jest coverage together. No new visualization tab is introduced. |
| IV. Faithful locale-aware parsing | PASS | Read normalized activity fields only; do not alter CSV, TrainingPeaks ZIP, FIT, or GPX parsing semantics. |
| V. Explicit privacy and network boundaries | PASS | Readiness is computed locally from in-memory activities and auxiliary maps; no activity data is sent or persisted. |
| Repository/dependency boundaries | PASS | Changes stay in root app, its utility modules, markup, and root Jest tests; no API dependencies or new package required. |

No constitution violations or unresolved product clarifications were identified. The view-specific minimum is operationalized as sufficient valid model output for that view, not an arbitrary shared activity-count threshold.

## Project Structure

### Documentation (this feature)

```text
specs/060-data-source-availability/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── visualization-availability.md
└── tasks.md             # Created by /speckit-tasks, not this command
```

### Source Code (repository root)

```text
index.html                         # tab markup, panels, inline dispatch
src/dashboard-import.js            # apply completed imported datasets
src/dashboard-tabs.js              # dashboard view dispatch and fallback
src/tab-navigation.js               # tab order, accessible state, keyboard cycling
src/dashboard-export.js             # per-tab export availability
src/dashboard-*.js                  # per-view model/render readiness inputs
src/*-utils.js                      # pure data/model helpers, where applicable
__tests__/*.test.js                 # focused unit, wiring, and import tests
```

**Structure Decision**: Keep import orchestration in `dashboard-import.js`, tab rendering/navigation in the existing dashboard/tab modules, and shared pure decision logic in a reusable utility only if it removes duplication across navigation consumers. Derive each view's readiness from its existing model output or a small pure selector adjacent to that model. Update `index.html` and the tab-navigation tests in the same change. Do not change imported activity records, import parsers, or add another application layer.

## Post-Design Constitution Check

| Gate | Status | Post-design review |
|---|---|---|
| I. Static browser-first delivery | PASS | Design uses existing browser scripts and in-memory data; no build or server component. |
| II. Dual-target reusable modules | PASS | Shared readiness decisions are pure/testable; DOM visibility remains in dashboard orchestration. |
| III. Narrowest-scope test-first verification | PASS | Plan includes updates to tab behavior, matching markup/dispatch, keyboard navigation, and focused tests. |
| IV. Faithful locale-aware parsing | PASS | No parsing or sport-normalization changes are planned. |
| V. Explicit privacy and network boundaries | PASS | Availability uses only current in-memory activity and auxiliary data. |

No post-design constitution violations.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations.
