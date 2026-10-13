# Implementation Plan: Training Calendar Visual Redesign

**Branch**: `054-calendar-visual-redesign` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/054-calendar-visual-redesign/spec.md`

## Summary

Refine the existing multi-year training calendar to follow the supplied GitHub contribution-calendar layout: compact weekly columns, seven weekday rows, aligned month labels, a low-contrast but detectable dark zero-activity state, and a compact Less-to-More legend below the calendars. Retain the existing activity model, palette and sport filters, keyboard-accessible day buttons, tooltip, stacked years, and local image-export workflow. Implement within the current static page and calendar renderer; do not add dependencies, tabs, services, or a new export mechanism.

## Technical Context

**Language/Version**: Browser JavaScript (existing project runtime; Node.js for Jest tests)

**Primary Dependencies**: Existing browser globals and Tailwind utility classes; no new dependencies

**Storage**: None; calendar data is derived from imported in-memory activities

**Testing**: Jest in Node environment; static markup/script-wiring checks and focused training-calendar utility tests, plus manual browser verification for layout and export capture

**Target Platform**: Static browser application served from a plain file server; desktop and narrow viewports

**Project Type**: Existing static web application, with classic DOM-orchestration scripts and CommonJS/browser-bridge utility modules

**Performance Goals**: Preserve responsive rendering for existing multi-year datasets; retain the current 10,000-activity, under-2-second model budget where applicable

**Constraints**: No bundler or build step; no API or data-storage changes; preserve current local processing and export flow; inactive-day contrast must be >1.0:1 and <=1.2:1 against its rendered background, with active level 1 at least 3:1 against the inactive state

**Scale/Scope**: One existing Training Calendar dashboard panel; all years in the imported data remain stacked newest-first; no new tab or independently exposed API

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|------|--------|----------|
| Static browser-first delivery; no build step or new runtime dependency | PASS | UI work stays in `index.html` and existing `src/` scripts. |
| Reusable logic remains browser/Node compatible | PASS | Calendar data/color tokens remain in `src/training-calendar-utils.js`; DOM rendering remains in the existing dashboard script. |
| Narrowest-scope tests planned | PASS | Focused utility and script/markup/export-wiring Jest tests are identified in `quickstart.md`. |
| Existing visualization export behavior retained | PASS | Existing Training Calendar export button, capture target, metadata, and preview/download flow are preserved and validated. |
| Privacy and dependency boundaries preserved | PASS | No raw activity data leaves the browser; no API, storage, or package changes. |

**Gate result**: PASS. No constitution exceptions or complexity justifications are needed. This is a refinement of an existing visualization, not a new dashboard tab.

## Project Structure

### Documentation (this feature)

```text
specs/054-calendar-visual-redesign/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
index.html
src/
├── dashboard-training-calendar.js
├── dashboard-export.js       # Existing capture flow; change only if verification requires it
└── training-calendar-utils.js
__tests__/
├── training-calendar-utils.test.js
├── index-script-syntax.test.js
└── export-utils.test.js
```

**Structure Decision**: Keep this narrowly scoped to the existing Training Calendar markup, renderer, and color/model utility. Update focused tests in the existing Jest suite. No new source directories, modules, contract surface, backend, or dashboard navigation entry are required.
