# Implementation Plan: Export Context Cleanup

**Branch**: `073-export-context-cleanup` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/073-export-context-cleanup/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Remove filter/context text and outer card framing from every existing visualization export while preserving the visualization, its meaningful labels and legends, dashboard state, square PNG format, and shared preview/download flow. Reuse the shared browser capture and canvas composition path; apply frame cleanup only to the cloned capture so the live dashboard remains unchanged.

## Technical Context

**Language/Version**: JavaScript in the existing static browser app; Node.js for Jest tests

**Primary Dependencies**: Existing `html2canvas`, browser Canvas APIs, and Jest; no new dependencies

**Storage**: None; export targets and generated images remain transient and browser-local

**Testing**: Focused root Jest tests in the Node environment plus a manual browser preview/download check

**Target Platform**: Existing static browser app, served without a bundler

**Project Type**: Static browser application

**Performance Goals**: No new latency target; retain the existing capture and preview flow without adding remote work

**Constraints**: Preserve 1080 x 1080 PNG output, chart proportions and data, no-data behavior, and browser-local export processing; do not mutate live filter state or visualization styling

**Scale/Scope**: All existing visualization-tab export targets and Personal Best detail exports; no new tabs, persisted state, or external interfaces

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution gate | Status | Plan evidence |
|---|---|---|
| Static browser-first delivery | PASS | Reuse the current classic browser scripts, `html2canvas`, and Canvas composition; add no build step or dependency. |
| Dual-target reusable modules | PASS | Keep layout calculations in the existing dual-target `src/export-utils.js` only if needed; keep capture and composition orchestration in `src/dashboard-export.js`. |
| Narrowest-scope test-first verification | PASS | Update focused export utility and composition tests, including no-filter-text and preview/download parity. No tab navigation changes are planned. |
| Locale-aware data parsing | N/A | No CSV, GPX, or sport normalization behavior changes. |
| Explicit privacy and network boundaries | PASS | Keep image capture, composition, preview, and download local; do not transmit activity data or generated images. |

No constitution violations or complexity exceptions are required.

## Project Structure

### Source Code (repository root)
```text
src/
├── dashboard-export.js                 # Shared capture, cloned-DOM preparation, and canvas composition
└── export-utils.js                     # Existing target and export-layout helpers

index.html                              # Existing capture target markup and export button wiring
__tests__/
├── dashboard-export-download.test.js  # Composition, cloned capture, PB, heatmap, preview/download behavior
├── export-utils.test.js                # Layout and target helper behavior
└── index-script-syntax.test.js         # Script syntax and export wiring contract
```

**Structure Decision**: Keep the established shared export architecture. `src/dashboard-export.js` owns DOM capture and the 1080 x 1080 composition used by tabs and Personal Best detail targets. `src/export-utils.js` remains the home for pure fit/layout helpers. Apply decorative-frame cleanup to the cloned capture only; change `index.html` only if a target-specific presentation cannot be corrected in the cloned DOM. Do not change dashboard controls or visualization data.

## Phase 0 Research Summary

- The shared composition currently draws `target.filters` as text and reserves vertical space based on the rendered filter rows. Removing the filter draw and its reserved context height removes the labels and blank region together.
- Tab exports and Personal Best detail exports both reach `drawExportComposition()` and use its resulting PNG for both preview and download.
- Decorative root framing is part of captured DOM for a small set of targets (notably Pie Charts and PB detail); Leaflet heatmap framing is applied at its map capture root. Clone styling can remove those outer treatments without changing the live page.
- Explanatory legends are not all supplied by the shared composer: Pace vs years are drawn by the composer, while Pie Charts and Training Calendar legends are inside their captured DOM. Keep those data explanations intact.
- Filter values are display context only. The dashboard controls and the state used to build the charts remain the source of visualization behavior and must not be changed.
- Focused Jest tests use VM and Canvas mocks, so they can prove composition strings, bounds, and clone adjustments but not final browser pixels. A manual browser check is needed for actual frames, embedded legends, heatmap, and preview/download parity.
- No external interface, dependency, persistent model, or unresolved technical question was identified. See [research.md](research.md).

## Phase 1 Design Summary

- Treat filter/context summaries as non-rendered export metadata; do not draw them or allocate a context strip. Fit the captured visualization in the resulting available region while preserving aspect ratio.
- Remove only the outer decorative frame from export capture clones. Do not change live dashboard styles or inner chart marks, legends, axes, and labels required to understand data.
- Omit redundant setting labels by omitting the filter/context summary, including the PB `Metric: Time` line; keep PB title and result.
- Cover generic tab targets, the PB detail path, and representative no-data and preview/download flows with focused tests. Use browser inspection to validate visual output.
- Design details are captured in [data-model.md](data-model.md), [contracts/export-presentation.md](contracts/export-presentation.md), and [quickstart.md](quickstart.md).

## Constitution Check (Post-Design)

All pre-design gates remain **PASS** or **N/A**. The design adds no dependencies, build step, dashboard tab, persisted state, or server call; it preserves CommonJS/browser compatibility for shared helpers and keeps the export local. Focused root Jest tests and a manual browser check are the implementation validation gates.

## Complexity Tracking

No constitution violations.
