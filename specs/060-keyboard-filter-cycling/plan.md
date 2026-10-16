# Implementation Plan: Keyboard Navigation for Visualization Filters

**Branch**: `060-keyboard-filter-cycling` | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/060-keyboard-filter-cycling/spec.md`

## Summary

Extend the existing dashboard keyboard navigation so Tab/Shift+Tab navigate visualization tabs like Right/Left while focus is in the tab list, and Up/Down cycle only the focused eligible filter's choices. Reuse the current tab-navigation helpers, dashboard filter event handling, filter summary, and directional cues; add no dependencies, persistence, or external interfaces.

## Technical Context

**Language/Version**: Browser JavaScript in classic scripts; Node.js for Jest tests

**Primary Dependencies**: Existing dashboard globals and DOM APIs; Jest 30.x; no new dependencies

**Storage**: N/A; navigation state is transient UI state

**Testing**: `npm test -- --runInBand __tests__/tab-navigation.test.js` and `npm test -- --runInBand __tests__/index-script-syntax.test.js`

**Target Platform**: Static browser application served from the repository root

**Project Type**: Static web application with CommonJS/browser-bridged navigation utilities and classic dashboard orchestration scripts

**Performance Goals**: Apply a selected filter and refresh its visualization in the same interaction; begin cue feedback within 250 ms and clear it within 1.5 s

**Constraints**: Preserve normal Tab and arrow-key behavior outside eligible keyboard contexts; do not scroll the page for handled filter changes; preserve native select/range behavior and existing active-filter summaries; no build step

**Scale/Scope**: Existing visualization tab list, visible active-panel filter groups, and four directional cues; no new views or filter choices

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. Changes stay in the current static browser app and require no bundler or build step.
- **II. Dual-Target Reusable Modules**: PASS. Any shared stepping/navigation logic stays in `src/tab-navigation.js` and retains its CommonJS and `window.*` exports; DOM coordination stays in `src/dashboard-tabs.js`.
- **III. Narrowest-Scope Test-First Verification**: PASS. Add focused navigation and markup/script assertions in existing Jest suites and run both scoped commands before completion. No visualization tab is added.
- **IV. Faithful Locale-Aware Data Parsing**: N/A. The feature does not change import or parsing behavior.
- **V. Explicit Privacy & Network Boundaries**: PASS. No data leaves the browser and no network/API behavior changes.

**Gate result**: PASS. No constitutional violation or unresolved technical clarification is identified.

## Project Structure

### Documentation (this feature)

```text
specs/060-keyboard-filter-cycling/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── dashboard-keyboard-navigation.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
index.html
src/
├── tab-navigation.js
└── dashboard-tabs.js
__tests__/
├── tab-navigation.test.js
└── index-script-syntax.test.js
```

**Structure Decision**: Keep the existing static-app boundaries. Pure tab-order and choice-stepping behavior belongs in `src/tab-navigation.js`; active-panel event coordination and directional feedback belong in `src/dashboard-tabs.js`; markup and browser wiring remain in `index.html`. Extend the current Jest tests instead of introducing a new test layer.

## Phase 0: Research

See [research.md](research.md). The existing implementation provides the required navigation, active-panel filter handling, summary, and cue primitives; no new technology or external integration is needed.

## Phase 1: Design

- [Data model](data-model.md): transient visualization, focused filter group, and directional cue state.
- [UI contract](contracts/dashboard-keyboard-navigation.md): key-to-action behavior, context boundaries, and success feedback.
- [Quickstart](quickstart.md): focused Jest commands and browser scenarios.

## Constitution Check (Post-Design)

- **I. Static Browser-First Delivery**: PASS. The design adds no build tooling or runtime dependency.
- **II. Dual-Target Reusable Modules**: PASS. Shared navigation logic remains browser/CommonJS compatible; DOM work remains in the existing dashboard script.
- **III. Narrowest-Scope Test-First Verification**: PASS. The quickstart specifies focused tests for utility behavior and dashboard markup/script integration.
- **IV. Faithful Locale-Aware Data Parsing**: N/A. Parsing is untouched.
- **V. Explicit Privacy & Network Boundaries**: PASS. Filter and navigation state remain local and transient.

**Post-design gate result**: PASS. No violations require complexity justification.
