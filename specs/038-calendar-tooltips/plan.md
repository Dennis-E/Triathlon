# Implementation Plan: Training Calendar Contrast and Tooltips

**Branch**: `038-calendar-tooltips` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/038-calendar-tooltips/spec.md`

## Summary

Strengthen the existing Green and Blue palette tokens, use `#F1F5F9` as the shared
very-light-gray empty-day token, and add a context-bound local
tooltip for each active calendar day. The reusable calendar utility will retain
tooltip-safe activity summaries per filtered day, while the dashboard renderer will
anchor one shared tooltip layer to the hovered or focused cell. The existing global
`trainingCalendarDetails` area will be removed; multi-year blocks, sport filters,
palette controls, and local-only processing remain unchanged.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Existing static HTML, Tailwind classes, current training-calendar utility and dashboard renderer; no new dependency

**Storage**: In-memory `processedActivities` and transient local tooltip state; no persistence changes

**Testing**: Jest in Node for palette and tooltip-summary logic; static HTML/script contract tests; manual browser validation for hover, focus, collision, and multi-year context

**Target Platform**: Static browser app served by a plain file server, desktop and narrow browser viewports

**Project Type**: Static browser web application with reusable visualization utilities and classic dashboard orchestration

**Performance Goals**: Show all matching activity rows within 300 milliseconds of entering a day cell and keep tooltip rerendering below 1 second for supported datasets

**Constraints**: No bundler or build step; preserve CommonJS/`window.*` bridge, local-only processing, existing multi-year/sport/palette behavior, keyboard access, and responsive scrolling; use `#F1F5F9` rather than pure white for empty cells; remove the global bottom detail area

**Scale/Scope**: One existing calendar utility, one dashboard renderer, one local tooltip layer, palette token updates, focused tests, and no new tab/API/storage surface

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|---|---|---|
| I. Static Browser-First Delivery | PASS | The change stays in the existing static page and classic dashboard scripts; no bundler, server, or dependency is introduced. |
| II. Dual-Target Reusable Modules | PASS | Tooltip-safe activity summaries and palette metadata remain pure logic in `src/training-calendar-utils.js` with CommonJS and `window.*` exports; DOM positioning stays in the dashboard renderer. |
| III. Narrowest-Scope Test-First Verification | PASS | Existing calendar utility and index-script tests are extended; no new tab is added, so existing tab contracts remain intact. |
| IV. Faithful Locale-Aware Data Parsing | PASS | The feature consumes existing parsed activity records and does not alter CSV/GPX parsing or sport normalization. |
| V. Explicit Privacy & Network Boundaries | PASS | Tooltip content is derived locally from the in-memory dataset; no network or API behavior changes. |
| Repository and dependency boundaries | PASS | Changes remain in root frontend modules, tests, and feature documentation; `services/api` is untouched. |

## Project Structure

### Documentation (this feature)

```text
specs/038-calendar-tooltips/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── training-calendar-utils.js       # Extend palette tokens and tooltip-safe day summaries
└── dashboard-training-calendar.js   # Render local tooltip and remove global detail updates

__tests__/
├── training-calendar-utils.test.js  # Tooltip summaries and stronger palette tests
└── index-script-syntax.test.js      # Local tooltip and removed-global-area contracts

index.html                           # Tooltip layer/styles and removal of trainingCalendarDetails
```

**Structure Decision**: Extend the existing Training Calendar implementation in place.
The utility owns pure activity-summary and palette logic; the dashboard renderer owns
the single anchored tooltip layer and pointer/focus lifecycle. `index.html` provides
the tooltip host and responsive styling. No new tab, build step, API, or storage layer
is required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The design follows the existing static-browser and module boundaries. |
