# Implementation Plan: Power PB Chart Improvements

**Branch**: `017-power-pb-chart-improvements` | **Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/017-power-pb-chart-improvements/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Refine the existing Bike Power PB visualizations added in `016-bike-power-pb-refinement`:
add a hover tooltip to the all-time power profile, label the profile's y-axis with the
exact highest and lowest plotted watt values instead of a fixed zero baseline, thin the
profile's x-axis duration labels so only the shortest duration and durations of 5
minutes or longer are labeled (points/line stay fully plotted), and replace each
duration tile's static "current best" text with the same inline SVG timeline chart
(axes, trend line, current-best callout, hover tooltip) already used by the other
Personal Bests tiles. No new dependency, dashboard tab, or server interaction is
required; all changes stay inside `index.html`'s existing PB rendering and the shared
chart helpers it already defines.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Existing `src/power-pb-utils.js` (`buildAllTimePowerProfile`), existing inline SVG chart helpers in `index.html` (`appendTimelineAxes`, `appendYAxisLabel`, `appendCurrentBest`, `showPowerPbTooltip`/`movePbTooltip`); no new dependency

**Storage**: In-memory imported dataset only; no persistence changes

**Testing**: Jest in the Node environment, inline-script/markup assertions (`__tests__/index-script-syntax.test.js`, `__tests__/power-pb-utils.test.js`), and static-browser smoke validation

**Target Platform**: Static browser app served by a plain file server, desktop and narrow browser viewports

**Project Type**: Static browser web application with reusable data utilities

**Performance Goals**: Tooltip, axis-label, and per-duration chart rendering must stay within the existing Personal Bests render pass with no perceptible added delay for current datasets (at most 8 duration tiles plus one profile chart)

**Constraints**: Preserve the static-browser architecture, CommonJS/window bridges, local-only power processing, the existing eight supported durations and their PB-qualification rules, and the existing full-screen detail view behavior

**Scale/Scope**: One existing Personal Bests Watt section (profile chart + up to 8 duration tiles), reusing existing shared chart-helper functions in `index.html`, and existing synthetic Jest fixtures

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution principle | Status | Evidence / plan alignment |
|---|---|---|
| I. Static Browser-First Delivery | PASS | All changes remain inline in `index.html`'s existing rendering code; no build step or new CDN dependency is introduced. |
| II. Dual-Target Reusable Modules | PASS | `src/power-pb-utils.js`'s `buildAllTimePowerProfile` gains only display-oriented fields (label-visibility, min/max) with CommonJS + `window.*` exports unchanged in shape/signature. |
| III. Narrowest-Scope Test-First Verification | PASS | Add/extend focused tests for `power-pb-utils` and the inline PB script contract; run them before the full root suite. No tab navigation changes are required. |
| IV. Faithful Locale-Aware Data Parsing | PASS | No changes to CSV/GPX/FIT parsing or sport normalization; only presentation of already-qualified power PBs is affected. |
| V. Explicit Privacy & Network Boundaries | PASS | Tooltip/axis/chart data all derive from the already-local dataset; nothing new is sent to a server. |
| Repository & Dependency Boundaries | PASS | Changes stay in root frontend modules/tests (`index.html`, `src/power-pb-utils.js`, `__tests__/`) and do not touch `services/api`. |
| Development Workflow | PASS | Scope is limited to the existing Bike PB profile/tile renderers, their tests, and this feature's docs. |

## Project Structure

### Documentation (this feature)

```text
specs/017-power-pb-chart-improvements/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── power-pb-chart-ui.md  # Profile/tile chart UI contract
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── power-pb-utils.js       # buildAllTimePowerProfile: add min/max + label-visibility
└── ...

index.html                  # renderBikePowerSection: tooltip, axis labels, per-tile chart

__tests__/
├── power-pb-utils.test.js  # profile min/max + label-visibility unit tests
└── index-script-syntax.test.js  # inline PB script contract assertions
```

**Structure Decision**: Single static-browser project (existing layout). No new
directories are introduced; all logic changes live in the existing
`src/power-pb-utils.js` module and the existing Bike Power section renderer inside
`index.html`, matching how `016-bike-power-pb-refinement` was implemented.

## Complexity Tracking

> No Constitution Check violations. This section is not applicable.
