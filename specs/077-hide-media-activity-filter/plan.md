# Implementation Plan: Hide Media Activity Filter

**Branch**: `077-hide-media-activity-filter` | **Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/077-hide-media-activity-filter/spec.md`

## Summary

Remove Activity, route-inclusion, pin, and per-item selection controls from the Media gallery while keeping year and sport filters, media-to-activity associations, and access to activity details/routes. Collages use the active year/sport-filtered media set; recap and collage images always exclude routes. Clear the redundant export-ready status after creating an export so the existing preview flow is the confirmation. Leave the reusable media-filter utility's public behavior unchanged.

## Technical Context

**Language/Version**: Existing HTML and browser JavaScript; Node.js CommonJS/Jest test environment. No new language features or runtime surface.

**Primary Dependencies**: Existing Media dashboard orchestration in `src/dashboard-media.js`, export-control summary in `src/dashboard-export.js`, and Jest 30. No new dependencies.

**Storage**: No change. Media and gallery session state remain in memory for the active page session.

**Testing**: Focused Jest suites in `__tests__/dashboard-media.test.js`, `__tests__/dashboard-export-download.test.js`, and `__tests__/index-script-syntax.test.js`; manual browser check through the existing static server.

**Target Platform**: Existing static browser app and the repository's Node.js Jest environment.

**Project Type**: Static browser application with classic dashboard orchestration scripts.

**Performance Goals**: Preserve current bounded gallery rendering and avoid adding work to media rendering or filtering.

**Constraints**: No bundler or new package; preserve existing tab IDs/order, year and sport filtering, activity associations and detail/route navigation, local media handling, and the export preview/download flow. Media exports never include routes. No data-model or import changes.

**Scale/Scope**: Media gallery controls and their dashboard wiring/export summary plus one redundant status message; focused assertions in existing tests. Activity lookup remains for media details and route navigation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-research gate: PASS.** This is a focused behavior change in the existing static dashboard and introduces no new architecture.

| Principle or boundary | Design evidence | Post-design result |
| --- | --- | --- |
| I. Static Browser-First Delivery | Existing HTML and classic browser scripts; no build tooling or dependencies | PASS |
| II. Dual-Target Reusable Modules | No reusable utility changes; dashboard DOM orchestration remains in its existing owner | PASS |
| III. Narrowest-Scope Test-First Verification | Update focused Media, export-summary, and markup assertions; preserve tab wiring and IDs | PASS |
| III. Dashboard tab and Share/Export contracts | No tab is added or changed; existing Media export remains available | PASS |
| IV. Faithful Locale-Aware Data Parsing | Import, sport normalization, CSV, and GPX behavior are untouched | PASS |
| V. Explicit Privacy & Network Boundaries | No media transfer, storage, or API changes | PASS |
| Repository boundaries and focused workflow | Changes stay within existing Media markup, dashboard/export orchestration, and their tests | PASS |

## Project Structure

### Documentation (this feature)

```text
specs/077-hide-media-activity-filter/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
`-- contracts/
    `-- media-gallery-filters.md
```

### Source Code (repository root)

```text
index.html                              # Media filter markup
src/dashboard-media.js                  # Media filter state and event wiring
src/dashboard-export.js                 # Export filter summary
__tests__/dashboard-media.test.js       # Media rendering and filter behavior
__tests__/dashboard-export-download.test.js
__tests__/index-script-syntax.test.js   # Markup contract assertions
```

**Structure Decision**: Keep the UI and behavior in their current owners. Do not modify `src/media-utils.js`, media import/model code, tab navigation, or pin/inspect controls in other visualizations. Remove the Media pin adapter and manual selection state from `src/dashboard-media.js`; preserve its activity lookup for details and route navigation while keeping exported route drawings disabled.

## Phase 0: Research Decisions

Completed in [research.md](research.md). Repository inspection confirmed the filter's markup, dashboard state/event wiring, export-control summary, current tests, and the separate activity-detail lookup. No unresolved technical unknowns or new technology choices require external research.

## Phase 1: Design and Contracts

- [data-model.md](data-model.md) records that no media or activity data model changes; only the Media gallery's selectable filter state narrows to year and sport.
- [contracts/media-gallery-filters.md](contracts/media-gallery-filters.md) specifies the visible controls and preserved activity context.
- [quickstart.md](quickstart.md) gives focused Jest and browser validation steps.

## Implementation Sequence and Verification

1. Update dashboard and markup tests to assert that Activity, route-inclusion, pin, and per-item selection controls are absent; Year/Sport filtering, direct media preview, and linked activity details remain; collages follow active filters; exports omit routes and redundant ready status.
2. Remove the Activity, route-inclusion, pin, and per-item selection controls from the Media UI; remove their state, adapter, and handlers from `src/dashboard-media.js`. Preserve `getMediaGalleryActivityOptions()` for activity details and route navigation.
3. Compose collages from the active filter result, keep route drawings out of recap/collage output, clear the redundant success status, and keep the Media export-control summary limited to visible Year/Sport controls.
4. Run `npm test -- --runInBand __tests__/dashboard-media.test.js __tests__/dashboard-export-download.test.js __tests__/index-script-syntax.test.js`.
5. Serve the app with `python -m http.server`, open the Media visualization, and verify both controls are absent, year/sport filters work, linked activity details remain, routes are excluded from exports, and preview opens without the redundant status message.

**Post-design gate: PASS.** Design preserves all applicable constitution principles. No clarification, tab-navigation, data, privacy, dependency, or API exception is needed.

## Complexity Tracking

No constitution violations or added architectural abstractions.
