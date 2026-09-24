# Implementation Plan: Landing Visualization Previews

**Branch**: `033-landing-visualization-previews` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Expand the landing page's visualization preview grid to cover all eight dashboard
visualizations, adding Workout Time and Distributions. Replace generic placeholder
graphics with approved static screenshots captured from the existing dashboard using
the local private export as preparation input. The published page will contain only
derived, sanitized assets and will remain usable without any local export at runtime.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: HTML5/CSS/browser JavaScript; existing Node.js/Jest tooling for contract checks

**Primary Dependencies**: Existing static app, CDN libraries already used by `index.html`, and approved PNG/WebP preview assets; no new runtime dependency required

**Storage**: Versioned derived preview assets under `assets/previews/`; private ZIP remains local and ignored

**Testing**: Jest HTML/source contract tests, asset/privacy inventory checks, and browser checks at desktop/mobile widths using `python -m http.server`

**Target Platform**: Modern desktop and mobile browsers served by a plain static file server

**Project Type**: Static browser web application with local-only asset preparation

**Performance Goals**: Preview cards render on initial landing-page load without parsing a visitor's export; all preview assets remain appropriately sized for a card grid

**Constraints**: Keep raw private data out of runtime and version control, sanitize screenshots, preserve current preview-card actions/import gate, avoid horizontal overflow, and do not introduce a build step

**Scale/Scope**: Eight landing-page preview cards, eight derived screenshot assets, two new card actions, focused tests, and no dashboard visualization redesign

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

All gates pass:

- **Static Browser-First Delivery**: Preview assets are bundled static files referenced by `index.html`; the landing page does not require a build step or private export at runtime.
- **Dual-Target Reusable Modules**: No reusable data-processing module is added; any preparation helper remains separate from browser runtime logic.
- **Narrowest-Scope Test-First Verification**: Extend HTML/source contract coverage and run focused plus complete root Jest tests.
- **Faithful Locale-Aware Data Parsing**: The existing import/parsing path remains unchanged; screenshot preparation uses the existing dashboard behavior and does not redefine CSV/GPX semantics.
- **Explicit Privacy & Network Boundaries**: Raw Strava exports stay local, and public assets are reviewed for identifiers, exact routes, names, and account data before inclusion.

## Project Structure

### Documentation (this feature)

```text
specs/033-landing-visualization-previews/
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
index.html                         # Expanded landing preview grid and asset references
assets/previews/                   # Approved derived screenshots for all visualizations
__tests__/index-script-syntax.test.js # Existing landing/dashboard HTML contract coverage
__tests__/preview-assets.test.js   # Preview coverage, paths, and privacy inventory checks
private-data/export_39173135.zip   # Local preparation input only; never runtime/published
specs/033-landing-visualization-previews/ # Planning and validation artifacts
```

**Structure Decision**: Keep the landing page in `index.html` and store approved
derived screenshots as static assets under `assets/previews/`. Add focused source
contracts for card coverage and asset references. Use the existing dashboard import
and visualization rendering path to prepare screenshots locally, but do not add the
private ZIP or a runtime data-loading path to the public page. No API, database, or
new dashboard tab is required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | Static derived assets satisfy the preview goal without adding a CMS, API, or build pipeline. |
