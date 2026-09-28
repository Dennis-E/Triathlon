# Implementation Plan: Landing Preview and Navigation

**Branch**: `044-landing-preview-navigation` | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/044-landing-preview-navigation/spec.md`

## Summary

Make the existing visualization tab strip adapt to available width, with accessible left/right controls that reveal one next hidden tab per activation, and keep every tab reachable without page-level horizontal overflow. The Workout Time landing-page preview is already present in the current source; preserve it and verify its asset, destination, and import gate rather than adding a duplicate card. See [research.md](research.md) for repository findings and the selected interaction design.

## Technical Context

**Language/Version**: Browser JavaScript (ES2020+); existing project runtime, no pinned browser version

**Primary Dependencies**: Existing browser DOM and CSS utilities; no new runtime dependency

**Storage**: None; overflow and scroll position are transient view state

**Testing**: Jest 30 in Node (no jsdom); injected/mock DOM tests for navigation decisions; markup/script-syntax tests; manual browser checks at narrow and wide widths

**Target Platform**: Current desktop and mobile browsers, delivered by the existing static site

**Project Type**: Static browser application without bundler/build step

**Performance Goals**: Directional controls respond immediately to activation and keep visibility synchronized with scroll and resize; no network request or layout-heavy polling

**Constraints**: Preserve tab order, destinations, ARIA tab selection, keyboard arrow behavior, and existing preview/import behavior. Keep scroll controls outside the tablist's roving-tabindex sequence but reachable through normal page keyboard focus; do not obscure tabs.

**Scale/Scope**: One existing nine-tab navigation strip, two directional controls, and verification of the existing Workout Time preview; no new visualization or data model

## Constitution Check

*GATE: Checked before Phase 0 and re-checked after Phase 1. No violations.*

| Constitution requirement | Before research | After design | Plan response |
|---|---|---|---|
| I. Static browser-first delivery | PASS | PASS | Use existing HTML and classic browser scripts; no build tooling or new package. |
| II. Dual-target reusable modules | PASS | PASS | Implement next-clipped-tab selection as a pure dual-target helper in `src/tab-navigation.js`; keep DOM measurement and event wiring in existing dashboard orchestration. |
| III. Narrowest-scope test-first verification | PASS | PASS | Extend tab-navigation and script-syntax tests; run focused Jest tests and manually inspect narrow/wide browser behavior. No tab identities or order changes. |
| IV. Locale-aware data parsing | PASS | PASS | No import, parsing, sport normalization, or unit behavior changes. |
| V. Privacy and network boundaries | PASS | PASS | No activity data, network calls, or private source assets involved. |
| Repository and dependency boundaries | PASS | PASS | Root static frontend and root Jest tests only; no API/CLI changes or new dependencies. |

**Gate result**: PASS. The feature stays within existing UI architecture and does not require exceptions or complexity justification.

## Project Structure

### Documentation (this feature)

```text
specs/044-landing-preview-navigation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── visualization-navigation-ui.md
├── checklists/
│   └── requirements.md
└── tasks.md              # Created by /speckit-tasks, not this plan
```

### Source Code (repository root)

```text
index.html                         # Tablist wrapper, directional controls, responsive overflow viewport
src/dashboard-tabs.js              # DOM event/resize/scroll orchestration and reveal-next action
src/tab-navigation.js              # Pure/testable tab sequence and next-clipped-tab decision
__tests__/index-script-syntax.test.js
__tests__/tab-navigation.test.js
__tests__/preview-assets.test.js   # Existing coverage; change only if the baseline contract is missing
```

**Structure Decision**: Focused in-place change to the existing static browser UI. Keep current tab identities and destinations; add a non-tablist control layer around a constrained scrolling viewport. A pure geometry-based helper in `src/tab-navigation.js` selects the next clipped tab; `src/dashboard-tabs.js` measures actual DOM bounds and orchestrates scroll/resize/activation events. Extend existing tests rather than introducing a component framework. The Workout Time card already exists in `index.html` with its image, title, and `openDashboardTab('workoutTime')` action and is included in `preview-assets.test.js`; do not duplicate it. If its reported absence reproduces on the target page, diagnose the discrepancy and restore the existing card rather than inventing another preview.

## Complexity Tracking

No constitution violations or additional infrastructure components are planned.
