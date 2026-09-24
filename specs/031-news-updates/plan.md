# Implementation Plan: News Updates Page

**Branch**: `031-news-updates` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a publicly reachable News page to the static TriAnalytica site, expose it through
the existing header, and publish the first alpha-launch article. The page will be a
standalone static HTML document sharing the site's visual language and feedback
address, so visitors can read the announcement without importing training data or
using dashboard state.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: HTML5 and browser JavaScript supported by the existing static app

**Primary Dependencies**: Existing CDN-loaded Tailwind CSS and Lucide assets only if needed; no new dependency

**Storage**: Static files; no News-specific storage

**Testing**: Jest HTML contract assertions and existing `index-script-syntax.test.js`; manual browser checks via `python -m http.server`

**Target Platform**: Modern desktop and mobile browsers served by a plain static file server

**Project Type**: Static browser web application

**Performance Goals**: News navigation and article content are available on initial page load without dashboard import work

**Constraints**: Preserve the no-bundler setup, avoid coupling News content to uploaded Strava data, keep narrow viewports free of horizontal scrolling, and keep feedback wording accurate

**Scale/Scope**: One new static page, one header link, one published article, focused HTML assertions, and no CMS, comments, search, subscriptions, or authentication

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

All gates pass:

- **Static Browser-First Delivery**: The page and header link remain static files and work through `python -m http.server`; no bundler or backend is introduced.
- **Dual-Target Reusable Modules**: No reusable data-processing module is needed. News markup is page-owned UI and does not create a new `src/` utility.
- **Narrowest-Scope Test-First Verification**: Add focused HTML contract coverage and run the existing root Jest suite, including inline script syntax validation.
- **Faithful Locale-Aware Data Parsing**: No CSV, GPX, or training-data parsing changes are involved.
- **Explicit Privacy & Network Boundaries**: The page contains public editorial content only and does not change local file processing or analysis API behavior.

## Project Structure

### Documentation (this feature)

```text
specs/031-news-updates/
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
index.html                         # Existing dashboard and header link
news.html                          # New standalone News page and first article
__tests__/news-page.test.js        # HTML contract coverage for navigation and article content
specs/031-news-updates/            # This feature's planning and validation artifacts
```

**Structure Decision**: Use the existing static root layout. Add a sibling
`news.html` document because the feature is a public editorial page rather than a
dashboard tab. Keep the header link in `index.html`, share only simple visual and
navigation conventions, and verify both documents through focused Jest source
contracts. No `src/` module, API route, database, or dashboard tab is required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The design stays within the existing static project structure. |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
