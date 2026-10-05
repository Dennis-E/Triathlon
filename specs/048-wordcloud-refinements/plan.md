# Implementation Plan: Wordcloud Sharing and Controls

**Branch**: `048-wordcloud-refinements` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/048-wordcloud-refinements/spec.md`

## Summary

Refine the existing Wordcloud tab rather than create another visualization: register its canvas with the existing branded local share/export preview-download flow; exclude tokens containing fewer than two Unicode letters; initialize the word-count slider at 50; and add an accessible responsive ranked-list collapse control. The list starts expanded on initial load and each time its tab is activated, while word-selection and slider values remain available during the page session. Export must wait for the current asynchronous canvas render and must reject empty, unsupported, or incomplete cloud states.

## Technical Context

**Language/Version**: Existing browser JavaScript in classic dashboard scripts and CommonJS-compatible reusable utilities; Node.js/Jest for tests.

**Primary Dependencies**: Existing wordcloud2.js 1.2.3 CDN library, html2canvas, dashboard export utilities, Tailwind classes, and Jest. No new runtime package or service.

**Storage**: Existing `processedActivities[].name` in browser memory; slider and term selections are transient page-session UI state. Collapsed state resets on every Wordcloud tab activation.

**Testing**: Jest with Node environment; focused tests for Unicode tokenization, dashboard states, export helpers, tab behavior, and markup/wiring, then the full root suite. Browser smoke tests validate async canvas export and responsive layout.

**Target Platform**: Existing static browser app on supported desktop and mobile browsers.

**Project Type**: Static browser frontend with CommonJS-testable utility modules and classic DOM-orchestration scripts.

**Performance Goals**: The existing 50-term initial view and 100-term maximum must render and complete within the current renderer's bounded layout behavior; export waits for completion instead of sampling a fixed delay.

**Constraints**: No bundler/build step; preserve the current local-only processing and branded square export composition; do not send activity titles, terms, or images to services. New dashboard visualizations must have working Share/Export unless a justified exception is specified, per Constitution Principle III.

**Scale/Scope**: Existing Wordcloud tab only. Change its eligibility threshold, default display count, right-side ranking-panel layout and existing Share/Export support. No new activity filters, persistence, remote sharing, or tab identity.

## Constitution Check

*Gate: evaluate before and after design.*

| Principle / constraint | Status | Plan evidence |
|---|---|---|
| I. Static browser-first delivery | PASS | Reuses existing static HTML, CDN dependencies, and classic scripts; no bundler or service. |
| II. Dual-target reusable modules | PASS | Unicode eligibility stays in the existing pure/CommonJS + `window.*` wordcloud utility. |
| III. Test-first verification and Share/Export requirement | PASS | Update the existing view/markup/tests; register Wordcloud title, slug, target, data availability, capture completion, and tests in the existing local export path. |
| IV. Locale-aware data handling | PASS | Token eligibility counts Unicode letters after normalization, preserving locale-aware activity titles. |
| V. Privacy/network boundaries | PASS | Exports use the existing local canvas preview/download flow; no titles, word data, or image uploads. |
| Focused scope/dependency boundaries | PASS | No API, CLI, new package, import format, or persistence change. |

No gate failures or unresolved clarification markers remain.

## Project Structure

### Documentation (this feature)

```text
specs/048-wordcloud-refinements/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── ui-contract.md
```

### Source Code and Tests

```text
src/wordcloud-utils.js                    # Exclude tokens with fewer than two Unicode letters
src/dashboard-wordcloud.js                # Slider default, collapse/expand state, resize and render completion
src/dashboard-tabs.js                     # Reset list expanded on every Wordcloud tab activation
src/dashboard-export.js                   # Wordcloud target, available controls, has-data state, async render wait
src/export-utils.js                       # Wordcloud display title and filename slug
index.html                                 # Default slider value, list toggle/rail, share/export button
__tests__/wordcloud-utils.test.js          # Unicode one-letter and combining-mark cases
__tests__/wordcloud-dashboard.test.js      # Default, toggle states, selection retention and accessible control
__tests__/export-utils.test.js             # Export title, slug, target and no-data validation
__tests__/index-script-syntax.test.js      # Button, canvas target, dispatch, registration and script integration
```

**Structure Decision**: Extend existing utility, renderer, tab, and export paths. Capture the Wordcloud canvas only, not its list/controls. Avoid a new export mechanism; use existing title/slug configuration and shareable image modal.

## Phase 0: Research Decisions

See [research.md](research.md) for alternatives and rationale. Key decisions:

- Integrate Wordcloud into the existing branded, local preview/download flow.
- Await wordcloud2.js render completion before capture; the current fixed chart delay alone is insufficient.
- Count Unicode letters after normalization; exclude a token when it contains fewer than two letters.
- Set the initial display limit to 50 with the existing slider bounds 10–100.
- Start the ranked list expanded on every tab activation; collapse to a right rail on wide screens and a compact horizontal control on narrow screens.
- Keep list inclusion, count and collapse state in browser memory only; export only the displayed cloud.

## Phase 1: Design and Contracts

- [Data model](data-model.md) defines eligible token length, display limit, included-word state, collapse state, render completion, and the export target.
- [UI contract](contracts/ui-contract.md) specifies Share/Export availability, capture scope, no-data handling, responsive collapse, accessibility, and reset behavior.
- [Quickstart](quickstart.md) describes automated/browser validation including real canvas completion, mobile and desktop layout, and local-only export checks.

## Constitution Check (Post-Design)

| Gate | Status | Re-evaluation |
|---|---|---|
| Browser-first static operation | PASS | Existing CDN and classic-script architecture only. |
| Dual-target reusable utility | PASS | One-letter eligibility remains pure and tested in both CommonJS/browser use. |
| Share/Export and tab conventions | PASS | Wordcloud uses registered export metadata, an accessible button, complete-capture readiness, no-data state, and focused tests. |
| Privacy | PASS | No export payload leaves the local browser flow. |
| Test-first and narrow verification | PASS | Test coverage precedes utility/UI/export changes; run focused Jest and full root suite. |

No complexity exception is required.

## Out of Scope

- Direct Instagram/Strava publishing, OS share sheet, upload, or email attachment.
- Changing branding, square-image framing, QR code, preview modal, or download policy.
- Persisting collapse state across tab changes/reloads or slider/checkbox settings across data imports.
- New visualizations, filters, import changes, or a new export backend.
