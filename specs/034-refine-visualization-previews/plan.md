# Implementation Plan: Refine Visualization Previews

**Branch**: `034-refine-visualization-previews` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Regenerate the seven affected landing-page preview assets from explicit dashboard
capture states. Use Run plus a focused 2021-2026 range for Heartrate vs Pace, Bikes
only for Equipment and Timeline, Activities mode for Timeline, a visible 50 km PB
tile, a Rheinland-area Heatmap view, and chart crops that include x-axes for
Distributions and Workout Time. Keep the existing public asset paths and card actions.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Existing HTML5/static browser app with local browser screenshot capture

**Primary Dependencies**: Existing dashboard controls, Chart.js, Leaflet route map, and local PNG assets; no new runtime dependency

**Storage**: Replacement derived PNGs under `assets/previews/`; private export remains local and ignored

**Testing**: Focused Jest asset/reference tests, asset-review checklist, browser screenshot checks at desktop and 390px mobile widths, and full root Jest suite

**Target Platform**: Modern browsers served by `python -m http.server`

**Project Type**: Static browser app with local-only preview preparation

**Performance Goals**: Corrected PNGs render immediately in the existing landing cards without runtime filtering or private-data loading

**Constraints**: Preserve existing asset paths and card behavior, keep private data out of public files, retain privacy review, and capture enough chart area for readable axes and labels

**Scale/Scope**: Seven replacement PNGs, one capture-state record, one asset-review update, focused tests, and no dashboard logic or markup redesign

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

All gates pass:

- **Static Browser-First Delivery**: Only derived static PNGs and capture documentation change; the public page remains buildless and export-independent.
- **Dual-Target Reusable Modules**: No reusable module or parsing logic is added.
- **Narrowest-Scope Test-First Verification**: Existing preview asset tests are extended or rerun, followed by the full root Jest suite.
- **Faithful Locale-Aware Data Parsing**: Existing CSV/GPX semantics remain unchanged; capture uses the existing dashboard state.
- **Explicit Privacy & Network Boundaries**: The private export is used only locally; Rheinland context and equipment labels are reviewed before public replacement assets are kept.

## Project Structure

### Documentation (this feature)

```text
specs/034-refine-visualization-previews/
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
assets/previews/                  # Replacement corrected PNG assets
specs/033-landing-visualization-previews/asset-review.md # Existing privacy review
specs/034-refine-visualization-previews/capture-states.md # Capture-state record
__tests__/preview-assets.test.js  # Existing public asset and contract checks
```

**Structure Decision**: Replace only the affected files in `assets/previews/` and
record exact filter/view/crop choices in `capture-states.md`. Keep all dashboard
runtime code unchanged. Update the existing asset review so the corrected images have
explicit visibility and privacy approval.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The defect is in derived preview captures, so replacement assets and capture documentation are sufficient. |
