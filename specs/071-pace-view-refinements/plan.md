# Implementation Plan: Pace-Ansichten verfeinern

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/071-pace-view-refinements/spec.md`

## Summary

Move the Pace-vs-Metrics year controls beside the chart at viewport widths of 768 CSS pixels and above so they do not consume the chart's vertical space. Keep the existing in-memory year-selection behavior: the implementation already preserves disabled years across sport, metric, date-range, and empty-data changes, and resets them on a new import. Preserve a stacked, readable layout below 768 CSS pixels.

## Technical Context

**Language/Version**: Browser-compatible JavaScript, HTML, and CSS; Node.js for Jest tests

**Primary Dependencies**: Existing Chart.js and Tailwind utility classes loaded by the static page; Jest for tests

**Storage**: In-memory dashboard state for the currently imported dataset; no new persistent storage

**Testing**: Focused Jest tests in the Node environment; browser verification at wide and narrow viewport widths

**Target Platform**: Modern desktop and mobile browsers served from the static app

**Project Type**: Static browser application

**Performance Goals**: Preserve the existing chart height and responsive rendering; no additional chart redraws beyond existing filter interactions

**Constraints**: No bundler, new dependency, API, or change to import/network behavior; keep the chart usable when the legend is stacked on narrow screens

**Scale/Scope**: One existing visualization panel, its current dashboard orchestration script, and focused regression coverage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. Reuse the existing markup and classic dashboard script; no build step or new dependency.
- **II. Dual-Target Reusable Modules**: PASS. This is DOM layout orchestration in `src/dashboard-scatter.js`; no reusable data utility is being introduced.
- **III. Narrowest-Scope Test-First Verification**: PASS. Run the existing pace-year test and add focused coverage for any changed behavior. No dashboard tab is added or renamed, so tab registration and export mapping remain untouched. Existing Share/Export stays in place.
- **IV. Faithful Locale-Aware Data Parsing**: PASS. Import parsing and activity values are unchanged.
- **V. Explicit Privacy & Network Boundaries**: PASS. No raw-data handling or network behavior changes.

**Post-Design Re-check**: PASS. The design remains within the existing static dashboard, does not add a tab, API, dependency, persistent data, or network behavior, and retains the required focused-test gate.

## Project Structure

```text
index.html                         # Pace chart and adjacent legend layout
src/dashboard-scatter.js           # Existing year controls and chart orchestration
src/scatter-utils.js               # Existing point and regression data helpers; unchanged
__tests__/dashboard-scatter-years.test.js
specs/071-pace-view-refinements/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/pace-views.md
```

**Structure Decision**: Keep the UI in the existing `index.html` panel and `src/dashboard-scatter.js` DOM orchestration. Keep year-state logic in its current owner and use `__tests__/dashboard-scatter-years.test.js` for focused regression coverage. Add no new runtime module or dashboard tab.

## Complexity Tracking

No constitution violations or added complexity require justification.
