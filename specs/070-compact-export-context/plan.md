# Implementation Plan: Compact Export Context

**Branch**: `070-compact-export-context` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/070-compact-export-context/spec.md`

## Summary

Remove available filter and view options from every exported image, retain only the selected context that determines the current visualization, and use the recovered space to fit the chart as large as possible in the existing square PNG without cropping or distortion. Apply this through the shared export composition for dashboard targets and Personal Best detail tiles. Keep the active context derived from the existing selected UI state, and add Distance aggregation to that context.

## Technical Context

**Language/Version**: Browser JavaScript in classic scripts; Node.js CommonJS for reusable utilities and Jest tests

**Primary Dependencies**: Existing `html2canvas` CDN capture and `src/export-utils.js`; no new dependency

**Storage**: N/A; export state, canvas, preview, and PNG remain browser-local

**Testing**: Root Jest suite; focused `export-utils.test.js` and `dashboard-export-download.test.js`, plus `index-script-syntax.test.js` if wiring changes

**Target Platform**: Static browser app in supported desktop and mobile browsers

**Project Type**: Static browser application

**Performance Goals**: Reuse the current single capture/composition pass; no added network round trips or per-control image captures

**Constraints**: Preserve the 1080 x 1080 square PNG, preview/download flow, chart aspect ratio, existing dashboard selections, and local-only export behavior; no bundler or new service

**Scale/Scope**: All 13 existing visualization-tab export targets and Personal Best detail exports; no persisted data model or new dashboard tab

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution gate | Status | Plan evidence |
|---|---|---|
| Static browser-first delivery | PASS | Reuse the current static scripts, canvas composition, and CDN capture; add no build step or dependency. |
| Dual-target reusable modules | PASS | Put reusable fit/layout calculations in the existing CommonJS + `window.exportUtils` module; keep DOM/canvas orchestration in `src/dashboard-export.js`. |
| Narrowest-scope test-first verification | PASS | Extend focused root Jest tests for fit/context and composition behavior; no tab navigation change is planned. |
| Locale-aware parsing | N/A | No CSV, GPX, or sport normalization behavior changes. |
| Explicit privacy/network boundaries | PASS | Keep capture, composition, preview, and download local; do not call the analysis API. |
| Repository/dependency boundaries | PASS | Changes stay within the root static app and Jest suite; API and CLI surfaces are untouched. |

No Constitution violations or exceptions are required.

## Project Structure

### Documentation (this feature)

```text
specs/070-compact-export-context/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── export-composition.md
```

### Source Code (repository root)

```text
src/
├── dashboard-export.js       # Shared DOM capture, active context, and square canvas composition
└── export-utils.js           # Pure context and aspect-preserving layout helpers

__tests__/
├── export-utils.test.js              # Context and fit/layout rules
└── dashboard-export-download.test.js # Composition behavior and existing export flow

index.html                    # Existing script wiring and preview UI; no tab changes planned
```

**Structure Decision**: Keep the established static-app export architecture. `src/dashboard-export.js` owns DOM-derived context and canvas rendering; pure calculations remain in `src/export-utils.js`. The same renderer serves all tab and Personal Best detail targets. Retain the existing target shape and utility APIs where possible, but do not draw `availableControls` into the exported PNG.

## Phase 0 Research Summary

- The current composition separately draws `target.filters` and `target.availableControls`; the latter creates the view/options block to remove.
- Active filter values already come from the controls used by each visualization. Distance must additionally report its selected aggregation.
- The existing export contract defines a square 1080 x 1080 PNG and a shared preview/download flow. Preserve both.
- A total pixel-area threshold varies with source aspect ratio in a fixed square. Use the maximum aspect-preserving fit and apply the revised 80% criterion to its limiting available dimension; do not crop or stretch.
- No external interface, dependency, persistent model, or unresolved technical question was identified. See [research.md](research.md).

## Phase 1 Design Summary

- The export target's `filters` are the sole source of visible active context. Empty context uses no reserved strip; `availableControls` remains non-rendered metadata for compatibility.
- Fit the captured visualization to the largest bounds available after the existing header and optional active-context line. Keep the applicable legend and existing branding behavior.
- Test the pure fit/context rules, assert that composition omits option/control labels, and cover representative tab and Personal Best preview/download flows.
- The user-facing image contract is documented in [contracts/export-composition.md](contracts/export-composition.md); validation steps are in [quickstart.md](quickstart.md), and entity definitions are in [data-model.md](data-model.md).

## Post-Design Constitution Check

All pre-design gates remain PASS or N/A. The design adds no dependencies, server calls, dashboard tab, or persisted state; it preserves the square PNG and local export boundary. Focused root Jest tests are the required implementation gate.

## Complexity Tracking

No violations; no complexity justification is required.
