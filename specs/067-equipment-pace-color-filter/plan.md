# Implementation Plan: Equipment Pace Color Selection and Progressive Fire Bars

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/067-equipment-pace-color-filter/spec.md`.

The setup script reports `067-equipment-pace-color-filter` as its feature identifier; it is not a request to create or switch a Git branch.

## Summary

Add the existing Color scheme selector pattern to single-type Equipment Pace views, offering On fire and Monochrome blue. Preserve all aggregation, labels, ordering, relative-speed bar lengths, and the clarified All-view type colors from feature 066.

Separate color normalization from bar normalization. A small pure equipment utility derives the minimum and maximum displayed valid speed. The Equipment renderer uses the existing fire palette in one shared horizontal CanvasGradient between the pixel positions of those bounds. Each unchanged bar clips that same gradient, leaving the slowest bar yellow and the fastest endpoint red. Equal or single-item comparisons remain yellow. Recompute pixel geometry at drawing time and retain the existing local export flow.

## Technical Context

**Language/Version**: Existing browser JavaScript with CommonJS utility exports; no transpilation or new language target.

**Primary Dependencies**: Existing CDN-loaded Chart.js and html2canvas, existing equipment/distribution utilities, and existing Jest tooling. No new package or CDN script.

**Storage**: One in-memory Equipment color-scheme variable, default `fire`; no persistent storage, schema migration, or network storage.

**Testing**: Root Jest in the Node environment; pure-function tests and existing VM/DOM/Chart mocks, followed by real-browser visual, interaction, and export validation.

**Target Platform**: Existing supported desktop/mobile browsers, explicitly checked at 375 px and 1280 px viewport widths.

**Project Type**: Static browser application with classic orchestration scripts and dual-target reusable utilities.

**Performance Goals**: Color switching visible within one second for 100 equipment items on a recorded reference device. Range calculation and bar assignment linear in the displayed item count; one shared gradient per draw.

**Constraints**: No build step; preserve public utility APIs and script order; use synthetic local data; no changes to imports, API service, palette semantics, navigation IDs, or performance aggregation.

**Scale/Scope**: Existing Equipment Pace view only. Shoes and Bikes receive selectable schemes; All, other metrics, timeline, and yearly usage retain existing behavior.

## Constitution Check

*Pre-research gate: PASS. Post-design gate: PASS. No exceptions or constitutional amendments required.*

| Principle | Pre-research assessment | Post-design assessment |
|-----------|-------------------------|------------------------|
| I. Static Browser-First Delivery | Existing static UI and renderer own this behavior. | Native selector and CanvasGradient use existing scripts and libraries only. |
| II. Dual-Target Reusable Modules | Reusable bounds computation belongs in equipment-utils. | Add one pure helper to both existing export bridges; keep drawing and DOM access in dashboard-equipment. |
| III. Narrowest-Scope Test-First Verification | Existing utility, Equipment, syntax, export, and navigation tests can validate the change. | Run focused tests after each implementation slice; browser checks cover actual pixels and downloads. Existing Equipment tab ID, dispatch, and capture mapping remain synchronized and unchanged; run their regression tests. No tab is added or renamed. |
| III. Share/Export coverage | Existing Equipment capture target and local preview/download already exist. | Preserve capture and no-data behavior; exercise both schemes and actual gradients in preview and downloaded PNG. |
| IV. Faithful Locale-Aware Data Parsing | No parsing changes are needed. | Aggregation, speed conversion, units, and relative-speed bar values remain untouched. |
| V. Explicit Privacy & Network Boundaries | No new data transport is needed. | Use synthetic local fixtures; no API, CLI, telemetry, personal-file, or privacy-copy changes. |

## Project Structure

### Documentation (this feature)

```text
specs/067-equipment-pace-color-filter/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
    equipment-pace-colors.md
  checklists/
    requirements.md
```

Task generation belongs to the subsequent `/speckit-tasks` phase and is not performed here.

### Source Code (repository root)

```text
index.html                                  selector markup
src/equipment-utils.js                      additive pure range helper
src/dashboard-equipment.js                  local state, setter, control visibility, drawing
src/distribution-utils.js                   existing palette reused without semantic changes
src/dashboard-export.js                     existing capture flow retained
__tests__/equipment-utils.test.js           range and normalization invariants
__tests__/dashboard-equipment.test.js       state, drawing geometry, resize, fallback behavior
__tests__/index-script-syntax.test.js        markup and classic-script wiring
__tests__/distribution-utils.test.js        unchanged palette regression
__tests__/dashboard-export-download.test.js Equipment preview/download coverage
__tests__/tab-navigation.test.js            existing tab contract regression
README.md                                   brief color-choice behavior documentation
```

**Structure Decision**: Extend the existing ownership boundaries and test files; no new source module, test framework, state subsystem, or export path. The two reused utility palettes and export capture do not require source edits unless focused validation exposes a necessary local integration defect.

## Phase 0: Research Outcome

Completed in [research.md](research.md). Resolved the performance direction, range normalization, shared pixel geometry, palette reuse, selector lifecycle, and export timing risks. No unresolved clarification remains.

## Phase 1: Design Outcome

- [data-model.md](data-model.md) defines state, valid displayed rows, range invariants, and transitions.
- [contracts/equipment-pace-colors.md](contracts/equipment-pace-colors.md) fixes the additive utility API, UI IDs, rendering behavior, and export invariants.
- [quickstart.md](quickstart.md) supplies focused test commands and end-to-end acceptance scenarios.

Implement in small validated slices: pure range helper and tests; selector/state/visibility and tests; shared gradient and lifecycle tests; export regression, browser acceptance, and brief user documentation. This is a design sequence, not a generated task list.

## Verification Strategy

The first discriminating check is a two/three-item comparison: the slowest endpoint must receive the yellow palette start, not `getFireGradientColor(barValue)` near the hot end. Utility tests establish the actual speed range; renderer mocks record gradient endpoints and stops and prove bar values did not change.

Run the focused commands in [quickstart.md](quickstart.md) after their corresponding code slices. Real-browser screenshots and canvas-pixel sampling must separately confirm visible gradients, correct framing, responsive controls, and preview/download parity. Record browser/device details and the 100-item switch time. Mocked drawing alone is not evidence that the gradient rendered.

## Complexity Tracking

No violations or additional architectural layers. Existing classic script order, tab contracts, and local image capture are preserved.
