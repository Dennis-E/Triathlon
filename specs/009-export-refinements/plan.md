# Implementation Plan: Export Refinements

**Branch**: `009-export-refinements` | **Date**: 2026-09-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Refine the existing local export flow so its domain, logo sizing, filter/view illustration,
button wording, preview contents, and personal-best detail placement match the revised
sharing experience. Keep the static browser architecture and make reusable layout and
metadata decisions testable through the existing CommonJS utility module.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Browser JavaScript (ES2019+), HTML, CSS utility classes

**Primary Dependencies**: Existing CDN libraries: html2canvas, Lucide, Chart.js, Tailwind CSS; Jest for Node-side tests

**Storage**: N/A; export data remains in the browser session

**Testing**: Jest (`npm test`), inline-script/static assertions in `__tests__/index-script-syntax.test.js`, manual browser validation via `python -m http.server`

**Target Platform**: Modern desktop and narrow-viewport browsers served from the static site, including `https://dennis-e.github.io/Triathlon/`

**Project Type**: Static browser web application

**Performance Goals**: Preserve the existing local export interaction; generate the preview without additional server requests and without delaying the existing capture settle behavior.

**Constraints**: No bundler or build step; no export image upload; use existing local assets; preserve source aspect ratios; keep platform logos out of preview/download image content; retain CommonJS plus `window.*` module compatibility.

**Scale/Scope**: Six supported visualization export controls, one shared export composition, and the personal-best overview/detail popup flow.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|------|--------|----------|
| I. Static Browser-First Delivery | PASS | Changes remain in `index.html` and `src/`; no bundler, build step, or server feature is introduced. |
| II. Dual-Target Reusable Modules | PASS | Pure aspect-ratio/domain/control metadata helpers remain in `src/export-utils.js` with CommonJS and browser-global exports. |
| III. Narrowest-Scope Test-First Verification | PASS | Update `__tests__/export-utils.test.js` and `__tests__/index-script-syntax.test.js`; validate with root Jest and static browser checks. |
| IV. Faithful Locale-Aware Data Parsing | PASS | No CSV, GPX, sport normalization, or parsing behavior is changed. |
| V. Explicit Privacy & Network Boundaries | PASS | Export continues using browser-local data and local assets; no API upload is added. |
| Repository & Dependency Boundaries | PASS | Root static app and root Jest suite only; no `services/api` dependency is introduced. |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
index.html                         # dashboard markup, export controls, PB popup, canvas composition
src/export-utils.js                # pure export metadata and layout helpers
__tests__/export-utils.test.js     # utility behavior and asset/domain contracts
__tests__/index-script-syntax.test.js # static markup and inline-script assertions
specs/009-export-refinements/      # plan and design artifacts
```

**Structure Decision**: Keep the feature in the existing static browser surface. Put
testable, DOM-free decisions such as canonical branding, aspect-ratio fitting, and
available-control metadata in `src/export-utils.js`; keep DOM capture, canvas drawing,
and popup wiring in `index.html`; extend the existing root Jest tests rather than adding
a browser test framework.

## Phase 0 Research Summary

- Existing `computeSquareFit` already provides the correct contain/letterbox model but
  is not used by `drawExportComposition`; the plan will reuse or generalize it for
  natural image dimensions rather than passing fixed distorted dimensions.
- The canonical domain belongs in `EXPORT_BRAND_CONFIG`, while platform logos should
  remain available to button markup but be excluded from `drawExportComposition`.
- The export currently summarizes active filters as text only. The available-view
  picture should be a controlled snapshot of the current dashboard labels/states,
  generated from current DOM controls or equivalent metadata so it cannot drift from
  the UI. It must remain a non-interactive image region in the final export.
- Personal-best export ownership should move to `pbDetailOverlay`: the overview and
  collapsed tiles lose export actions, and the currently active `activePbDetailModel`
  supplies the detail target when the popup action is used.
- Browser pixel and responsive checks are manual because the repository's Jest
  environment is Node-only and has no existing DOM/canvas runner. Static assertions
  and pure helper tests will cover the contract that can be verified without a browser.

## Phase 1 Design Summary

- Add a pure logo-fit helper or extend `computeSquareFit` to return dimensions for a
  source image inside an arbitrary box; use `assets.logo.naturalWidth/naturalHeight`
  and `assets.strava.naturalWidth/naturalHeight` in the canvas composition.
- Keep the Instagram and Strava asset paths for controls, but do not load or draw them
  as composition elements unless another existing flow requires the path metadata.
- Add a pure representation for available filters/view buttons, including label and
  selected state, and have the composition render that representation in a bounded,
  readable region alongside the active filter summary.
- Change all visualization and detail-popup export controls to the exact label
  `Export for Insta / Strava`; use the Strava icon at a larger responsive control size.
- Add one detail-popup export action that builds a `pb-tile` target from
  `activePbDetailModel`, and remove the overview/tile export actions.
- Update tests for the exact domain, helper dimensions, control text/icon ownership,
  absence of platform-logo draw calls, and PB export placement. Validate manually at
  desktop and narrow viewport sizes.

## Constitution Check (Post-Design)

All gates remain **PASS**. The design adds no new runtime surface, does not alter data
parsing or API behavior, preserves browser/global module exports, and keeps generated
images local to the browser. No complexity exception is required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The feature fits the existing static app and test surfaces. |
