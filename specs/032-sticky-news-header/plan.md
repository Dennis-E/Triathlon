# Implementation Plan: Sticky News Header

**Branch**: `032-sticky-news-header` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Keep the News page header visible at the top of the browser viewport during vertical
scrolling. The existing logo and `Back to dashboard` link remain unchanged; the page
content receives enough top spacing to avoid being covered by the persistent header.
Focused HTML contract assertions and browser viewport checks will verify the behavior.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: HTML5 and CSS supported by modern desktop and mobile browsers

**Primary Dependencies**: Existing Tailwind CDN classes and local CSS in `news.html`; no new dependency

**Storage**: N/A; visual behavior only

**Testing**: Jest source-level HTML contract tests and browser validation with `python -m http.server`

**Target Platform**: Modern desktop and mobile browsers

**Project Type**: Static browser web application

**Performance Goals**: Header position remains stable during ordinary page scrolling without runtime scripting

**Constraints**: Keep the change limited to `news.html`, preserve existing links and article copy, avoid horizontal overflow, and keep article content below the header

**Scale/Scope**: One page header, one content offset, focused regression tests, and no dashboard/header changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

All gates pass:

- **Static Browser-First Delivery**: The fix uses existing static HTML/CSS and works through `python -m http.server`; no build step or runtime service is added.
- **Dual-Target Reusable Modules**: No reusable module or data-processing logic is introduced.
- **Narrowest-Scope Test-First Verification**: Extend the existing News HTML contract test and run the focused test plus the complete root suite.
- **Faithful Locale-Aware Data Parsing**: No CSV, GPX, or training-data parsing is touched.
- **Explicit Privacy & Network Boundaries**: The visual-only change does not affect imported files, network calls, or the analysis API.

## Project Structure

### Documentation (this feature)

```text
specs/032-sticky-news-header/
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
news.html                          # Fixed News header and content offset
__tests__/news-page.test.js        # Existing News contracts extended for fixed-header markup
specs/032-sticky-news-header/      # Planning and validation artifacts
```

**Structure Decision**: Keep the fix in the existing standalone `news.html` page and
extend the existing `__tests__/news-page.test.js` source contract. No new module,
route, dashboard tab, storage, or service is needed.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The requested behavior is fully covered by page-local CSS and focused HTML checks. |
