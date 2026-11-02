# Implementation Plan: Personal About Page

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-11-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/076-about-page/spec.md`

## Summary

Add a standalone static `about.html` containing Dennis's approved English introduction. Add an About link immediately after News in the existing main header, retaining the logo action, News destination, and import status IDs and behaviour. The About header provides News and Back to dashboard links; the final Explore your training action and the return link both target `./index.html`.

Use the existing site's sans-serif typography, slate surfaces, light text, and restrained amber accents in an unframed, single-column editorial layout. Do not copy News article cards, decorative gradients, or dashboard scripts. No new application JavaScript, packages, storage, API, or dashboard tab is needed. The supplied copy, not a generic About headline, determines the heading hierarchy.

## Technical Context

**Language/Version**: HTML5 and CSS; existing JavaScript/CommonJS test tooling only, with no new application JavaScript.

**Primary Dependencies**: Existing Tailwind CDN convention used by `news.html`; page-local CSS for typography, spacing, reflow, and focus states; existing `assets/logo.png`. No new dependencies or fonts.

**Storage**: Static page content only; no new persisted data, browser storage, or imported workout access.

**Testing**: Existing Jest 30 Node environment with `fs`/`path` HTML contract assertions. New focused About suite plus existing News and legal-footer regression suites. Browser validation covers layout, keyboard use, computed contrast, direct navigation, and text enlargement; no new browser-testing dependency is required.

**Target Platform**: Current desktop and mobile browsers served by a plain static server, including direct access to `about.html`.

**Project Type**: Static browser application with a sibling informational HTML page.

**Performance Goals**: Deliver all editorial content in the initial document; no feature-specific data requests, import prerequisite, or client-rendering wait. Navigation requires one activation in either direction.

**Constraints**: Preserve all approved wording and Unicode punctuation; one h1 and three h2 headings; 320/375/768/1440 CSS pixel layout checks; 200% text enlargement; 4.5:1 normal-text and 3:1 large-text contrast; visible keyboard focus. No photographs, counters, testimonials, new signup flow, dashboard changes, or additional product claims.

**Scale/Scope**: One new page, one existing header integration, one focused test suite, and a short README discovery note. Existing News content, source modules, API, and dependency manifests remain unchanged.

## Constitution Check

**Pre-research gate: PASS.** The static informational-page approach satisfies all applicable principles without exceptions.

| Principle or boundary | Design evidence | Post-design result |
| --- | --- | --- |
| I. Static Browser-First Delivery | Plain sibling HTML page; existing CDN styling convention; no build or bundler | PASS |
| II. Dual-Target Reusable Modules | No new reusable logic or module; no artificial CommonJS bridge for static copy | PASS |
| III. Narrowest-Scope Test-First Verification | Add focused content/navigation tests first; run the About slice, then News/legal regressions; browser-check layout/accessibility | PASS |
| III. Dashboard tab and Share/Export contracts | Informational page, not a tab; tab IDs/order/dispatch and exports remain unchanged, as the spec explicitly records | PASS |
| IV. Faithful Locale-Aware Data Parsing | No import, parser, sport normalization, or CSV/GPX changes | PASS |
| V. Explicit Privacy & Network Boundaries | No workout access, new counter/API call, or storage; no claim that the entire site makes no network requests | PASS |
| Repository boundaries and focused workflow | Only root static page, header markup/styles, focused tests, and README change; no API/CLI dependency sharing | PASS |

**Post-design gate: PASS.** Research resolves the navigation target, styling baseline, mobile header risk, and test strategy. No unresolved clarifications or justified violations remain.

## Project Structure

### Documentation (this feature)

```text
specs/076-about-page/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- checklists/requirements.md
`-- contracts/about-page.md
```

Task generation is the next phase; this command does not create `tasks.md`.

### Source Code (repository root)

```text
about.html                         # new static informational page
index.html                         # add About next to News; wrap header group
README.md                          # brief About discovery note next to News
__tests__/about-page.test.js        # new content/navigation contract tests
__tests__/news-page.test.js         # existing regression suite, preserve contracts
__tests__/legal-footer.test.js      # existing regression suite, preserve contracts
```

**Structure Decision**: Follow the existing root-level `news.html` pattern without a router, shared-component extraction, new CSS module, or content-loading abstraction. The implementation surface is deliberately independent of `src/dashboard-*.js` and `src/tab-navigation.js`.

## Phase 0: Research Decisions

Completed in [research.md](research.md): use static HTML, direct relative navigation, exact approved copy, normal-flow responsive header layout, existing styling conventions, and Node source-contract tests supplemented by real-browser checks. Research is grounded in the existing News page, main header, adjacent test suites, and project constitution.

## Phase 1: Design and Contracts

- [data-model.md](data-model.md) describes immutable editorial content and navigation relationships; no runtime data model or state store is introduced.
- [contracts/about-page.md](contracts/about-page.md) defines routes, landmarks, heading/content fidelity, navigation behaviour, reflow, accessibility, and automated coverage.
- [quickstart.md](quickstart.md) defines runnable focused tests and end-to-end browser validation, including a fresh direct page load and separate verification of both return routes.

## Implementation Sequence and Verification

1. Add `__tests__/about-page.test.js` using the existing Node source-reading pattern. Encode the approved content in this suite without an extra fixture file; assert decoded text and order, heading levels, header discovery, and the two return targets separately. Run it and confirm the expected initial failure while `about.html` is absent.
2. Add `about.html` and immediately rerun the focused About checks. A remaining failure for the not-yet-added index link is expected until the adjacent integration step; content, headings, and return-target assertions must pass. Avoid browser-only application logic.
3. Add About immediately after News in the existing index header, make that right-hand group wrap internally, preserve status IDs and the logo's existing `goToLanding()` action, and rerun the same About suite. Do not change dashboard navigation contracts to add a site-level page.
4. Run existing News and legal-footer regression suites alongside About, and add the brief README discovery note. No source changes are required in those regression suites unless a real affected assertion needs adjustment.
5. Serve the static site and complete the browser matrix and editorial review in the quickstart. Record actual results; source regex assertions alone do not prove contrast, text zoom, focus, or layout.

## Complexity Tracking

No constitution violations or added architectural abstractions. No exception is required for a typography-only informational page.
