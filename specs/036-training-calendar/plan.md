# Implementation Plan: Training Calendar View

**Branch**: `036-training-calendar` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/036-training-calendar/spec.md`

## Summary

Add a new Training Calendar visualization that shows every day in a selected year as a
Monday-first heatmap grid. A pure dual-target utility aggregates local-date activity
records, applies the clarified duration -> distance -> count fallback, maps unknown
sports to an explicit `Other` view category, and assigns five relative intensity
levels. A classic dashboard script renders the tab, controls, day details, empty state,
and responsive grid using existing static-browser conventions.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Existing static HTML, Tailwind utility classes, existing tab-navigation helpers; no new dependency

**Storage**: In-memory `processedActivities`; no persistence changes

**Testing**: Jest in the Node environment for calendar utility and tab behavior; static HTML/script contract tests; manual browser validation with synthetic or supplied local data

**Target Platform**: Static browser app served by a plain file server, desktop and narrow browser viewports

**Project Type**: Static browser web application with reusable visualization utilities and classic dashboard orchestration scripts

**Performance Goals**: Build the initial grid for up to 10,000 activities within 2 seconds after import and update year/sport selection within 1 second

**Constraints**: No bundler or build step; preserve CommonJS/`window.*` bridge; preserve parser semantics; keep raw files local; do not mutate imported activities; maintain keyboard accessibility and responsive horizontal scrolling

**Scale/Scope**: One new visualization tab, one new reusable utility, one dashboard renderer, one UI contract, and focused tests for aggregation, tab wiring, and HTML/script contracts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|---|---|---|
| I. Static Browser-First Delivery | PASS | The feature uses `index.html` and classic scripts; no bundler, build step, server, or new external dependency is introduced. |
| II. Dual-Target Reusable Modules | PASS | Calendar aggregation and intensity logic are planned for `src/training-calendar-utils.js` with CommonJS and `window.trainingCalendarUtils` exports. DOM rendering stays in `src/dashboard-training-calendar.js`. |
| III. Narrowest-Scope Test-First Verification | PASS | The new tab updates `src/tab-navigation.js`, matching `index.html` markup/dispatch, `__tests__/tab-navigation.test.js`, and `__tests__/index-script-syntax.test.js`; utility behavior gets a focused Jest suite. |
| IV. Faithful Locale-Aware Data Parsing | PASS | The feature reads existing parsed activities, uses local calendar dates, preserves existing distance semantics, and exposes unknown sports as `Other` without changing parser classification. |
| V. Explicit Privacy & Network Boundaries | PASS | Aggregation and rendering operate on the local in-memory dataset; no raw data is sent to a new service and no API surface is changed. |
| Repository and dependency boundaries | PASS | Changes stay within root static-app modules, `index.html`, feature documentation, and root Jest tests; `services/api` is untouched. |

## Project Structure

### Documentation (this feature)

```text
specs/036-training-calendar/
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
├── training-calendar-utils.js       # NEW: pure calendar model and intensity calculations
├── dashboard-training-calendar.js   # NEW: DOM controls and grid renderer
├── tab-navigation.js                 # Register the new visualization tab
└── dashboard-tabs.js                 # Dispatch the renderer when the tab activates

__tests__/
├── training-calendar-utils.test.js  # NEW: date grouping, fallback, levels, filters
├── tab-navigation.test.js           # Extend tab registration and cycling coverage
└── index-script-syntax.test.js      # Extend static markup and script wiring contracts

index.html                           # New tab/panel markup and script loading
```

**Structure Decision**: Follow the existing single-project static-app layout. Pure
calendar calculations belong in a new dual-target module. DOM state, event listeners,
and grid rendering belong in a new dashboard orchestration script loaded in the
existing script order. `index.html` owns the tab and panel markup, while the existing
tab-navigation module remains the source of keyboard and ARIA tab behavior.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The design conforms to the existing static-browser and module boundaries. |
