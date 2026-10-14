# Implementation Plan: Keyboard Navigation for Visualizations

**Branch**: `059-keyboard-dashboard-navigation` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

## Summary

Preserve the existing left/right visualization-tab cycling and add context-aware up/down adjustment for the currently focused filter. Filter changes must use existing update/render pathways, with a synchronized summary above the active visualization. Four non-interactive directional cues provide brief success feedback. Implement in the existing static frontend without adding dependencies or persisted state; preserve native control behavior and reduced-motion accessibility.

## Technical Context

**Language/Version**: Browser JavaScript (classic scripts and CommonJS-compatible reusable modules), HTML, CSS; Node.js test runtime.

**Primary Dependencies**: Existing browser libraries loaded by CDN, existing dashboard scripts, and Jest 30 at the repository root. No new dependencies.

**Storage**: None. Filter values and cue feedback are transient UI state and use existing dashboard state.

**Testing**: Root Jest, Node environment (not jsdom). Focused tests in `__tests__/tab-navigation.test.js`; markup/inline-script validation in `__tests__/index-script-syntax.test.js`; manual browser validation per [quickstart.md](quickstart.md).

**Target Platform**: Modern desktop and mobile browsers served as a static site; keyboard behaviors primarily target keyboard-capable devices.

**Project Type**: Static browser application with in-page dashboard orchestration and reusable browser/CommonJS utilities.

**Performance Goals**: Keyboard handling and summary/cue updates should be synchronous with normal control interaction and add no perceptible delay to existing visualization rendering. Cues begin within the specification's 250 ms target and end within 1.5 seconds.

**Constraints**: No bundler/build step; no new dependency or network call; preserve CommonJS plus `window.*` bridge for reusable utilities; DOM orchestration remains in existing global dashboard scripts; do not steal native arrow-key behavior from sliders, selects, or checkbox controls; respect reduced-motion settings and maintain existing focus visibility.

**Scale/Scope**: Existing 12 visualization panels and their heterogeneous filter controls; no new tab, imported data shape, persistence, or API surface.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate

- **I. Static Browser-First Delivery**: PASS — changes remain in the existing static page/scripts; no build step is introduced.
- **II. Dual-Target Reusable Modules**: PASS — reusable keyboard/value-step logic, if added, stays browser-compatible, CommonJS-exported, and bridged through `window.*`; DOM-only event wiring remains in dashboard orchestration.
- **III. Narrowest-Scope Test-First Verification**: PASS — focused Jest coverage is planned for keyboard logic and existing left/right behavior. This feature adds no dashboard tab, so the new-tab Share/Export requirement is not triggered.
- **IV. Faithful Locale-Aware Data Parsing**: PASS — no CSV/GPX parsing or sport classification is changed.
- **V. Explicit Privacy & Network Boundaries**: PASS — no import, API, network, or personal-data handling changes.
- **Repository/dependency boundaries**: PASS — only the root static frontend/test suite is in scope; no API or CLI dependencies are added.
- **Scope and complexity**: PASS — focused changes in existing navigation, dashboard wiring, markup, and tests; no architecture or framework migration.

### Post-Design Gate

- **I**: PASS — the proposed design uses existing static HTML/CSS and scripts.
- **II**: PASS — DOM orchestration is confined to dashboard scripts; testable navigation behavior can be exposed as pure reusable helpers with the existing dual-target pattern.
- **III**: PASS — the plan includes focused tests for keyboard navigation, control-specific edge behavior, and markup/script integration. No new tab is introduced.
- **IV–V**: PASS — neither parsing nor network/privacy behavior is affected.
- **No unjustified constitution violations identified.**

## Phase 0: Research

See [research.md](research.md). The investigation resolves key ownership, heterogeneous filter semantics, summary source-of-truth, visual cue accessibility, and test/runtime constraints. No `NEEDS CLARIFICATION` items remain.

## Phase 1: Design

- Conceptual entities and state transitions: [data-model.md](data-model.md).
- Internal user-interface behavior contract: [contracts/dashboard-keyboard-navigation.md](contracts/dashboard-keyboard-navigation.md).
- Runnable automated and browser validation scenarios: [quickstart.md](quickstart.md).
- No external/public API contract is required.

## Project Structure

### Documentation (this feature)

```text
specs/059-keyboard-dashboard-navigation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── dashboard-keyboard-navigation.md
└── tasks.md  # Created in the task-generation phase
```

### Source Code (repository root)

```text
index.html                          # Dashboard markup, inline wiring, and UI cues/summary
src/tab-navigation.js               # Reusable keyboard/navigation helpers
src/dashboard-tabs.js               # Dashboard tab/filter/cue event orchestration
__tests__/tab-navigation.test.js    # Focused navigation/value-step unit tests
__tests__/index-script-syntax.test.js # Markup and inline-script integration validation
```

**Structure Decision**: Keep the work within the existing static frontend ownership boundaries. Reusable logic belongs in `src/tab-navigation.js`; DOM event wiring and rendering coordination belong in `src/dashboard-tabs.js`/`index.html`. Tests stay in the root Jest suite. Exact separation of summary rendering from event wiring is a task-phase detail, not a new module requirement.

## Complexity Tracking

No constitution violations or complexity exceptions require justification.
