# Implementation Plan: Consistent Export Button Width

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/065-fix-export-button-width/spec.md`

## Summary

Keep all eleven standard visualization export buttons compact and consistently aligned when their headers stack on narrow viewports. Reuse one explicit button class and one shared width rule, bounded by the viewport, without changing export behavior, header ordering, existing breakpoints, or unrelated controls. Validate shared markup/CSS with the existing Node/Jest syntax suite and verify rendered geometry at the specified viewport widths in a browser.

## Technical Context

**Language/Version**: HTML and CSS in the static browser application; Node.js for Jest tests.

**Primary Dependencies**: Existing Tailwind CDN utility classes and browser CSS; no new dependency.

**Storage**: None.

**Testing**: `npm test -- --runInBand __tests__/index-script-syntax.test.js __tests__/pie-charts-dashboard.test.js __tests__/wordcloud-dashboard.test.js __tests__/dashboard-export-download.test.js`; manual browser responsive inspection at 320, 375, 640, 768, 1024, and 1440 CSS pixels.

**Target Platform**: Existing static browser app on desktop and mobile browsers, served without a build step.

**Project Type**: Static web application; shared markup and styles in `index.html`.

**Performance Goals**: No measurable runtime or export-capture regression. At each specified viewport, standard export buttons remain content-sized and do not fill the available header row; same-action buttons differ by no more than 2 CSS pixels at a given viewport.

**Constraints**: Preserve existing `exportVisualizationTab` actions, capture targets, preview/download flow, accessible labels, focus/hover states, responsive breakpoints, and export image contents. Do not affect filters or chart dimensions. The PB detail overlay export is out of scope unless implementation proves it shares the affected header structure.

**Scale/Scope**: Eleven standard visualization-header export buttons in `index.html`, their shared styling rule, and focused markup/export regression tests. No new visualization tab or data model.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Pre-design | Post-design | Assessment |
| --- | --- | --- | --- |
| I. Static Browser-First Delivery | PASS | PASS | Existing HTML/CSS only; remains usable through the plain static server. |
| II. Dual-Target Reusable Modules | PASS | PASS | No reusable logic or module is added. |
| III. Narrowest-Scope Test-First Verification | PASS | PASS | Add/extend a markup regression assertion and run the focused export-related Jest suites. No tab navigation changes. |
| IV. Faithful Locale-Aware Data Parsing | PASS | PASS | Import and parsing behavior are unchanged. |
| V. Explicit Privacy & Network Boundaries | PASS | PASS | No data flow, network behavior, or privacy wording changes. |

No constitutional exceptions are required. Existing export functionality remains present and discoverable; this feature changes only button layout.

## Project Structure

### Documentation (this feature)

```text
specs/065-fix-export-button-width/
  spec.md
  checklists/requirements.md
  plan.md
  research.md
  contracts/export-button.md
  quickstart.md
```

No `data-model.md` is needed because the feature adds no data entities or persisted state. `tasks.md` is generated in the next Spec Kit phase.

### Source Code (repository root)

```text
index.html                              shared export-button class and CSS rule
__tests__/index-script-syntax.test.js   assert all standard buttons use shared styling
__tests__/pie-charts-dashboard.test.js  preserve view export wiring regression
__tests__/wordcloud-dashboard.test.js   preserve view export wiring regression
__tests__/dashboard-export-download.test.js  preserve preview/download flow
```

**Structure Decision**: Keep the eleven existing buttons and their inline action wiring in `index.html`. Apply one explicit shared class and a centralized content-width/max-available-width rule. Do not use selectors coupled to `onclick`, alter unrelated header controls, or add a frontend build/test dependency.

## Phase 0 - Research

[research.md](research.md) records the observed header variants, shared button markup, existing test coverage, chosen styling boundary, alternatives and browser limitations. The `sm` and `md` responsive transitions already vary by header; this feature does not change them.

No unresolved technical clarification remains. Jest verifies static contracts but cannot measure rendered flex geometry in the repository's Node environment, so browser viewport checks remain part of acceptance.

## Phase 1 - Design and Contract

[contracts/export-button.md](contracts/export-button.md) defines the affected action set, compact-width and alignment behavior, narrow viewport boundary, preserved export interactions, and the distinction between automated markup checks and rendered browser checks.

[quickstart.md](quickstart.md) provides the focused Jest command, static-server startup, six viewport widths and manual acceptance procedure.

No data model or external API contract applies. Post-design constitution review: PASS; no new tab, data handling, API, dependency, or framework is introduced.

## Implementation Order and Gates

1. Add a focused assertion for the eleven standard buttons and shared CSS contract in `__tests__/index-script-syntax.test.js`; verify it fails before changing markup.
2. Add the shared class to each standard export button and define a content-sized width bounded by available viewport width in `index.html`. Avoid changing parent layout/breakpoints or vertical alignment.
3. Run the focused syntax, visualization-export, and export-download suites. Confirm all eleven actions remain registered with their original target IDs and labels.
4. Serve the existing app and inspect all six viewport widths. Verify a stacked button is compact and remains at the content edge, side-by-side headers remain vertically aligned, labels/icons fit, and no horizontal scrolling appears.
5. Exercise a representative export preview/download and confirm image output and capture targets are unchanged. Record the observed viewport results in the implementation review.

## Verification and Handoff

Acceptance maps to SC-001 through SC-004 through rendered viewport inspection and SC-005 through focused Jest plus a browser export smoke test. Automated tests prove the shared style contract and action wiring; they do not claim pixel-geometry coverage. The plan changes no application code. Next phase: `/speckit-tasks`.
