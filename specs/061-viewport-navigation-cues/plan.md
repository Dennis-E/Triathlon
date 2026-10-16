# Implementation Plan: Viewport-Visible Navigation Cues and Arrow Handling

**Branch**: `061-viewport-navigation-cues` | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/061-viewport-navigation-cues/spec.md`

## Summary

Keep the four existing directional cues visible while users scroll long visualizations, vertically center the left/right cues, and make Up/Down select the focused eligible filter or, when none has focus, the first eligible filter in the active visualization. Use a viewport-fixed, non-interactive cue layer and active-dashboard key arbitration; preserve modal and native-control behavior.

## Technical Context

**Language/Version**: Browser JavaScript in classic scripts; Node.js for Jest tests

**Primary Dependencies**: Existing DOM and CSS features, dashboard globals, and Jest 30.x; no new dependencies

**Storage**: N/A; cue visibility and filter selection are transient interface state

**Testing**: `npm test -- --runInBand __tests__/index-script-syntax.test.js`; manual browser checks from [quickstart.md](quickstart.md)

**Target Platform**: Static browser application, desktop and narrow/mobile viewports

**Project Type**: Static web application with classic dashboard orchestration scripts

**Performance Goals**: Cues remain in view during scrolling and resize; handled filter changes respond in the same key interaction; cue feedback begins within 250 ms and clears within 1.5 s

**Constraints**: Preserve left/right navigation, active-filter summaries, reduced-motion support, native select/range/checkbox behavior, and modal focus behavior; suppress page scrolling for handled dashboard Up/Down input; do not obscure essential chart content

**Scale/Scope**: One active visualization at a time, its visible single-choice filter groups, and the existing four cue elements; no new views, values, storage, or network behavior

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. The feature stays in the static site and introduces no build step.
- **II. Dual-Target Reusable Modules**: PASS. No reusable helper module is required; DOM orchestration remains in the existing dashboard script.
- **III. Narrowest-Scope Test-First Verification**: PASS. Add focused assertions in the existing dashboard integration suite and run it; no dashboard tab or visualization is added.
- **IV. Faithful Locale-Aware Data Parsing**: N/A. Import and parsing are unchanged.
- **V. Explicit Privacy & Network Boundaries**: PASS. No user data leaves the browser and no network behavior changes.

**Gate result**: PASS. No constitutional violation or unresolved clarification remains.

## Project Structure

### Documentation (this feature)

```text
specs/061-viewport-navigation-cues/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── dashboard-navigation-cues.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
index.html
src/
└── dashboard-tabs.js
__tests__/
└── index-script-syntax.test.js
```

**Structure Decision**: Keep cue markup and viewport positioning in `index.html`; keep active-view key arbitration, filter selection, and cue activation in `src/dashboard-tabs.js`; extend the existing integration assertions in `__tests__/index-script-syntax.test.js`. No new module or test harness is warranted.

## Phase 0: Research

See [research.md](research.md). Existing cues and filter update paths are reusable; no external research, new technology choice, or interface integration is required.

## Phase 1: Design

- [Transient interaction model](data-model.md): viewport cues, active visualization, and filter choice.
- [UI contract](contracts/dashboard-navigation-cues.md): cue placement, key precedence, and fallback filter selection.
- [Quickstart](quickstart.md): focused Jest and browser checks, including scroll and viewport-size scenarios.

## Constitution Check (Post-Design)

- **I. Static Browser-First Delivery**: PASS. Design uses existing browser CSS/JavaScript and needs no build tooling.
- **II. Dual-Target Reusable Modules**: PASS. No new reusable logic boundary is introduced; dashboard DOM behavior remains in the existing orchestration script.
- **III. Narrowest-Scope Test-First Verification**: PASS. The quickstart names the existing focused Jest suite and manual browser acceptance checks.
- **IV. Faithful Locale-Aware Data Parsing**: N/A. Data parsing remains untouched.
- **V. Explicit Privacy & Network Boundaries**: PASS. All state remains local and transient.

**Post-design gate result**: PASS. No violations require complexity justification.
