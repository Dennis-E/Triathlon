# Implementation Plan: Remove Filter Summary Bubbles

**Branch**: `062-remove-filter-bubbles` | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/062-remove-filter-bubbles/spec.md`

## Summary

Remove the redundant active-filter summary row above dashboard visualizations. Keep filter controls, their selected-state indication, and their effect on each visualization unchanged. The summary is presentation-only and is maintained by a renderer in `src/dashboard-tabs.js`, with markup in `index.html` and a corresponding structural assertion in `__tests__/index-script-syntax.test.js`.

## Technical Context

**Language/Version**: JavaScript (browser scripts); Node.js for Jest tests

**Primary Dependencies**: Existing browser DOM APIs; Jest 30 for tests; no new dependencies

**Storage**: None; this change does not add or modify persisted data

**Testing**: `npm test -- --runInBand __tests__/index-script-syntax.test.js`; root Jest suite for the final gate

**Target Platform**: Static browser application served from a local or hosted web server

**Project Type**: Static browser-first web application

**Performance Goals**: No new performance target; removing summary rendering and update listeners must not delay filter changes or chart updates

**Constraints**: Preserve existing filter and visualization behavior; retain static-browser delivery and script ordering; do not change import, chart, or export behavior

**Scale/Scope**: One dashboard-wide summary row and its renderer/update paths, plus the focused structural test; existing filter controls remain unchanged

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Rationale |
|---|---|---|
| Static browser-first delivery | PASS | The change removes existing browser UI and adds no build step, dependency, or service. |
| Dual-target reusable modules | PASS | No reusable data-processing module is introduced or changed; the affected dashboard script is DOM orchestration. |
| Narrowest-scope test-first verification | PASS | The plan updates the focused structural test and runs it before the root Jest suite. No tab is added or changed. |
| Share/Export requirement | N/A | This feature adds no visualization tab and changes no export flow. |
| Data parsing and privacy | PASS | Import processing, personal data, and API behavior are unchanged. |
| Repository/dependency boundaries | PASS | Work stays within the existing static frontend and root Jest tests; no dependency is added. |

No constitution violations or unresolved technical questions were identified.

## Project Structure

### Documentation (this feature)

```text
specs/062-remove-filter-bubbles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)
```text
index.html
src/dashboard-tabs.js
__tests__/index-script-syntax.test.js
```

**Structure Decision**: Keep the change within the existing dashboard orchestration in `src/dashboard-tabs.js`, the summary markup in `index.html`, and its focused test in `__tests__/index-script-syntax.test.js`. Remove the summary renderer and its now-unused update wiring; do not alter filter controls or their callbacks. Update structural assertions so they verify the summary is absent and dashboard navigation/filter handlers remain. No external interface is introduced, so `contracts/` is omitted.

## Constitution Check (Post-Design)

All pre-design gates remain satisfied. The design adds no modules, dependencies, tabs, APIs, persistence, or export behavior. The relevant implementation files and focused verification follow the static-app conventions.
