# Implementation Plan: Hide Partial Country Coverage Note

**Branch**: `071-hide-country-coverage` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/071-hide-country-coverage/spec.md`

## Summary

Remove the partial-coverage sentence from the Countries visited card in both the Lifetime Statistics dashboard and its export. Preserve the country count, names, complete-coverage message, and loading/unavailable states. The dashboard and export share one renderer, so the presentation-only change can remain focused; see [research.md](research.md).

## Technical Context

**Language/Version**: Browser JavaScript (ES2020+) and HTML; existing project runtime, no pinned browser version

**Primary Dependencies**: Existing browser APIs and Jest 30 for tests; no new runtime dependency

**Storage**: None; country summary data remains unchanged

**Testing**: Existing `__tests__/lifetime-statistics-dashboard.test.js` in Jest's Node environment; verify both dashboard and export HTML for partial, complete, loading, and unavailable states

**Target Platform**: Current desktop and mobile browsers served by the existing static site

**Project Type**: Static browser application without a bundler or build step

**Performance Goals**: No additional work beyond existing card rendering; no new requests or runtime processing

**Constraints**: Remove only the partial-coverage message; keep country values, full-coverage text, and loading/unavailable behavior unchanged in both render targets

**Scale/Scope**: One shared Countries visited card renderer and its existing dashboard/export test coverage; no changes to country aggregation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution requirement | Before research | After design | Plan response |
|---|---|---|---|
| I. Static browser-first delivery | PASS | PASS | Keep the behavior in the existing static browser application; no build tooling. |
| II. Dual-target reusable modules | PASS | PASS | No reusable utility or business logic changes; the existing renderer remains in place. |
| III. Narrowest-scope test-first verification | PASS | PASS | Update the existing lifetime-statistics dashboard test and run that focused Jest suite. This feature does not add or change a dashboard tab. |
| IV. Locale-aware data parsing | PASS | PASS | No CSV, GPX, sport, or unit behavior changes. |
| V. Privacy and network boundaries | PASS | PASS | No activity data processing or network/API behavior changes. |
| Repository and dependency boundaries | PASS | PASS | Root frontend and root Jest suite only; no new dependencies. |

**Gate result**: PASS. No constitution violations or unresolved technical decisions were identified.

## Project Structure

### Documentation (this feature)

```text
specs/071-hide-country-coverage/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── country-coverage-ui.md
├── quickstart.md
└── tasks.md             # Created by /speckit-tasks, not this plan
```

### Source Code (repository root)
```text
src/dashboard-lifetime-statistics.js           # Shared Lifetime Statistics and export card renderer
__tests__/lifetime-statistics-dashboard.test.js # Existing renderer and export regression tests
```

**Structure Decision**: Make a narrow presentation change in the existing shared renderer and revise its existing test. No new source module or external interface is needed; the UI behavior contract records the expected output for both render targets.

## Complexity Tracking

No constitution violations or additional infrastructure components are planned.
