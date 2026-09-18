# Implementation Plan: Export Layout Density

**Branch**: `011-export-layout-density` | **Date**: 2026-09-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Increase export readability and density by measuring wrapped filter rows, enlarging
export typography, fitting PB captures to their actual content bounds, and consolidating
branding, domain, and QR code into a single header without a footer.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Browser JavaScript (ES2019+), HTML, CSS utility classes

**Primary Dependencies**: Existing html2canvas, Chart.js, Lucide, Tailwind CSS CDN libraries; Jest

**Storage**: N/A; export remains browser-local

**Testing**: Jest, inline-script/static assertions, and browser checks through `python -m http.server`

**Target Platform**: Modern desktop and narrow-viewport browsers

**Project Type**: Static browser web application

**Performance Goals**: Preserve local export responsiveness and keep all required content visible without adding network work.

**Constraints**: No bundler or API changes; preserve logo aspect ratios, exact domain, local processing, and existing export controls/PB capture behavior.

**Scale/Scope**: One shared square export composition, six visualization targets, PB detail targets, and all filter/control/legend metadata.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|------|--------|----------|
| I. Static Browser-First Delivery | PASS | Changes remain in `index.html` and `src/export-utils.js`; no build step is introduced. |
| II. Dual-Target Reusable Modules | PASS | Pure row/layout and fit helpers remain CommonJS and browser-global compatible. |
| III. Narrowest-Scope Test-First Verification | PASS | Extend export utility and inline-script tests, then run focused and full root Jest suites. |
| IV. Faithful Locale-Aware Data Parsing | PASS | No import, CSV, GPX, or sport normalization code changes. |
| V. Explicit Privacy & Network Boundaries | PASS | Composition uses browser-local data/assets and does not upload images. |
| Repository & Dependency Boundaries | PASS | Only root static app and root tests are in scope. |

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
specs/011-export-layout-density/
```

**Structure Decision**: Keep deterministic layout calculations in `src/export-utils.js`
for Node/browser testing. Keep canvas drawing, header composition, and PB-specific
capture sizing in `index.html`. Extend the existing root tests and use the static browser
server for visual checks.

## Phase 0 Research Summary

- The current available-control renderer advances by a nominal pill height and then
  adds spacing, but it does not measure the actual wrapped row count. This causes the
  next row or legend to start too early and can clip the last row.
- The current composition reserves a footer band and draws branding/domain/QR there.
  Moving those elements into the header allows the footer band to be removed and gives
  the chart and metadata a single continuous content area.
- PB captures are currently fitted inside the same broad composition bounds as other
  visualizations. A target-kind-specific content fit can give PB charts more usable
  area without changing their aspect ratio.
- Typography should be increased in the canvas drawing calls, with row wrapping and
  bounded regions adjusted together so larger text does not recreate collisions.

## Phase 1 Design Summary

- Add a pure row-layout helper that accepts control widths, available width, row height,
  line padding, and spacing, returning actual row starts/bottoms and total height.
- Render available controls using measured row bottoms; place filters, controls, and
  legend from those returned coordinates rather than fixed y-values.
- Use a header with logo, title, larger supporting text, domain, and QR code. Remove
  footer rectangles and footer logo/domain/QR drawing.
- Use a larger content font scale for filter, control, legend, domain, and supporting
  labels. Fit PB captures against a tighter PB-specific content box while preserving
  contain behavior.
- Keep the existing canonical domain, local assets, platform-control icons, no-data
  behavior, and stable PB wrapper target unchanged.

## Constitution Check (Post-Design)

All gates remain **PASS**. The design changes only export presentation and pure layout
helpers; parsing, API boundaries, and privacy behavior remain untouched.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The feature fits the existing static app and test surfaces. |
