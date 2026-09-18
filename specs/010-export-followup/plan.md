# Implementation Plan: Export Follow-up Fixes

**Branch**: `010-export-followup` | **Date**: 2026-09-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Repair the follow-up export regressions without changing the existing export contract:
restore the Instagram icon after the label, make metadata regions sequential and
collision-free, and capture personal-best detail through a browser-safe target that
remains valid throughout the asynchronous export request.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Browser JavaScript (ES2019+), HTML, CSS utility classes

**Primary Dependencies**: Existing html2canvas, Lucide, Chart.js, Tailwind CSS CDN libraries; Jest for Node-side tests

**Storage**: N/A; export content remains in browser memory

**Testing**: Jest (`npm test`), static inline-script assertions, and browser validation through the local static server

**Target Platform**: Modern desktop and narrow-viewport browsers

**Project Type**: Static browser web application

**Performance Goals**: Preserve the existing local capture settle delay and return failed requests to retryable idle state.

**Constraints**: No bundler or API changes; use existing local assets; no upload of personal data or generated images; preserve the exact export label and current preview/download flow.

**Scale/Scope**: Six visualization controls, one PB popup control, one square export composition, and the existing export request state machine.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|------|--------|----------|
| I. Static Browser-First Delivery | PASS | Fixes remain in `index.html` and existing `src/export-utils.js`; no build or server feature is added. |
| II. Dual-Target Reusable Modules | PASS | Any deterministic layout/state helper stays DOM-free and keeps CommonJS plus `window.*` exports. |
| III. Narrowest-Scope Test-First Verification | PASS | Update the export utility and inline-script tests, then run focused and full root Jest suites. |
| IV. Faithful Locale-Aware Data Parsing | PASS | No parsing, normalization, or import behavior changes. |
| V. Explicit Privacy & Network Boundaries | PASS | Capture remains browser-local and no API path is introduced. |
| Repository & Dependency Boundaries | PASS | Only root static app and root tests are touched. |

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
index.html
src/export-utils.js
__tests__/export-utils.test.js
__tests__/index-script-syntax.test.js
specs/010-export-followup/
```

**Structure Decision**: Keep the fix in the existing static browser surface. HTML owns
the control markup, popup lifecycle, DOM capture target, and canvas composition. Pure
metadata and geometry behavior remains testable in `src/export-utils.js`; existing root
Jest and static assertions remain the validation boundary.

## Phase 0 Research Summary

- The Instagram asset still exists in `assets/` and is already part of the export asset
  registry, so the regression is limited to control markup rather than asset discovery.
- The current composition places filters, controls, and legend in fixed coordinates.
  Legend placement must use the returned bottom coordinate from the preceding rendered
  metadata blocks and reserve a hard lower bound before the footer begins.
- `html2canvas` is the current capture dependency. Directly passing the popup SVG as
  the PB target is the likely failure point; a stable wrapper around the popup chart is
  the browser-safe capture target while the popup remains open.
- The asynchronous export already resets `exportRequestState` in its catch path. The
  repair must preserve that reset and ensure the target remains present and stable until
  capture starts.

## Phase 1 Design Summary

- Render each export control as Strava icon, label text, Instagram icon. Use preserved
  aspect-ratio sizing and responsive wrapping so the right icon remains visible.
- Introduce a sequential metadata layout calculation for filter text, available-control
  pills, and legend rows. Draw each block at the next returned y-coordinate and clamp
  the content before the footer/QR region.
- Add a dedicated browser-capturable PB detail wrapper or capture container around the
  selected detail chart. Build PB export targets against that stable wrapper, capture it
  while the popup is open, and retain the selected model in the target metadata.
- Keep no-data and error paths retryable, with `exportRequestState = 'idle'` after any
  failure and no stale preview image.

## Constitution Check (Post-Design)

All gates remain **PASS**. The design changes only existing UI/canvas behavior, keeps
reusable logic dual-target compatible, does not touch parsing or API code, and keeps
export processing local.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The fixes fit the existing static app and test surfaces. |
