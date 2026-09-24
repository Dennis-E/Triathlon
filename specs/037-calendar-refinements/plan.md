# Implementation Plan: Training Calendar Refinements

**Branch**: `037-calendar-refinements` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/037-calendar-refinements/spec.md`

## Summary

Refine the existing Training Calendar visualization into a multi-year view with one
complete year block per represented year, newest first and no year selector. Add a
shared Green, Blue, or Fire palette, keep empty cells bright and neutral across all
palettes, and preserve existing local aggregation, sport filters, day details, and
keyboard behavior. The change extends the existing calendar utility and dashboard
renderer rather than adding a new tab or dependency.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Existing static HTML, Tailwind classes, current calendar utility and dashboard scripts; no new dependency

**Storage**: In-memory `processedActivities` and session-local palette state; no persistence changes

**Testing**: Jest in Node for pure multi-year/palette logic; static HTML/script contract tests; manual browser validation at desktop and narrow widths

**Target Platform**: Static browser app served by a plain file server

**Project Type**: Static browser web application with reusable visualization utilities and classic dashboard orchestration

**Performance Goals**: Render at least five year blocks within 2 seconds after opening and repaint all visible blocks after palette or sport changes within 1 second for supported datasets

**Constraints**: No bundler or build step; preserve CommonJS/`window.*` bridge, local-only data processing, existing sport semantics, keyboard access, and responsive horizontal scrolling; no year selector in the refined view

**Scale/Scope**: One existing visualization tab, multi-year view-model extension, three fixed palettes, shared legend/empty styling, focused tests and manual validation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|---|---|---|
| I. Static Browser-First Delivery | PASS | Refinements stay in the existing static page and classic dashboard scripts; no bundler, server, or dependency is added. |
| II. Dual-Target Reusable Modules | PASS | Multi-year grouping and palette definitions remain pure logic in `src/training-calendar-utils.js` with CommonJS and `window.*` exports; DOM updates stay in the dashboard renderer. |
| III. Narrowest-Scope Test-First Verification | PASS | Existing calendar utility, tab-navigation, and index-script tests are extended and the focused Jest command is documented. No new tab is introduced. |
| IV. Faithful Locale-Aware Data Parsing | PASS | The refinement consumes existing parsed activities and does not alter CSV/GPX parsing or sport normalization. |
| V. Explicit Privacy & Network Boundaries | PASS | All palette and multi-year rendering operates over the local in-memory dataset; no API or network boundary changes. |
| Repository and dependency boundaries | PASS | Changes remain in root frontend modules, tests, and feature documentation; `services/api` is untouched. |

## Project Structure

### Documentation (this feature)

```text
specs/037-calendar-refinements/
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
├── training-calendar-utils.js       # Extend multi-year model and palette definitions
├── dashboard-training-calendar.js   # Render year blocks, palette controls, and shared legend
├── dashboard-import.js              # Reset/init refined calendar state after import
└── tab-navigation.js                # Existing tab remains unchanged except for regression coverage

__tests__/
├── training-calendar-utils.test.js  # Extend year ordering, palettes, and empty-state tests
└── index-script-syntax.test.js      # Extend UI/script contract assertions

index.html                           # Replace year selector with palette controls and multi-year container
```

**Structure Decision**: Extend the existing `trainingCalendar` tab in place. Pure
multi-year grouping, palette tokens, and intensity metadata remain in the reusable
utility. The dashboard renderer owns DOM controls and year-block rendering, while
`index.html` supplies the existing panel with a multi-year container and palette
controls. No new tab, build step, API, or storage layer is required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The refinement follows the existing static-browser and module boundaries. |
