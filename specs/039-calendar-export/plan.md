# Implementation Plan: Training Calendar Transparency and Export

**Branch**: `039-calendar-export` | **Date**: 2026-09-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/039-calendar-export/spec.md`

## Summary

Make empty calendar days use the fixed `rgba(241,245,249,0.5)` token across all palettes and add
the existing branded image-export workflow to the Training Calendar tab. The export
captures the complete `trainingCalendarYears` multi-year container, carries the active
palette and sport filter into export metadata, excludes tooltip overlays, and leaves
the calendar unchanged on no-data or capture failure.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, current Node.js for Jest

**Primary Dependencies**: Existing `export-utils.js`, branded image-preview flow, static HTML, Tailwind classes; no new dependency

**Storage**: In-memory calendar state and transient export state; no persistence changes

**Testing**: Jest utility/export tests, static HTML/script contracts, and manual browser export validation

**Target Platform**: Static browser app served by a plain file server, desktop and narrow viewports

**Project Type**: Static browser web application with reusable export helpers and classic dashboard orchestration

**Performance Goals**: Export up to ten year blocks without clipping and keep export preparation within the existing image-export interaction budget

**Constraints**: No bundler or server changes; use fixed `rgba(241,245,249,0.5)` for empty cells; preserve local-only data processing, existing export branding/error handling, tooltip exclusion, current filter/palette state, and responsive button access

**Scale/Scope**: One existing tab export target, transparency token update, export context/capture registration, focused tests, and no new API/storage surface

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|---|---|---|
| I. Static Browser-First Delivery | PASS | The feature reuses the static page and existing client-side image export; no build step or server is introduced. |
| II. Dual-Target Reusable Modules | PASS | Export target metadata remains in reusable export utilities where appropriate; DOM capture and state restoration remain dashboard orchestration. |
| III. Narrowest-Scope Test-First Verification | PASS | Existing export, calendar utility, and index-script tests are extended; no new tab or tab-navigation change is needed. |
| IV. Faithful Locale-Aware Data Parsing | PASS | Export consumes already parsed calendar data and does not alter CSV/GPX parsing or sport normalization. |
| V. Explicit Privacy & Network Boundaries | PASS | Capture is local and tooltip exclusion prevents unrelated personal detail overlays from entering the image; no API changes occur. |
| Repository and dependency boundaries | PASS | Changes stay within root frontend modules, tests, and feature documentation; `services/api` is untouched. |

## Project Structure

### Documentation (this feature)

```text
specs/039-calendar-export/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── export-utils.js                 # Extend calendar title/slug/context metadata
├── dashboard-export.js             # Register capture target, context, and tooltip exclusion
├── dashboard-training-calendar.js  # Apply transparent empty cells and export state hooks
└── training-calendar-utils.js      # Preserve palette/empty-cell token contract

__tests__/
├── export-utils.test.js             # Calendar target metadata and filename contracts
├── training-calendar-utils.test.js  # Transparent empty-cell token contracts
└── index-script-syntax.test.js      # Export button, target wiring, and no-tooltip capture checks

index.html                           # Calendar export button and transparent cell styling
```

**Structure Decision**: Extend the existing branded tab-export pipeline with a
`trainingCalendar` capture target pointing to the full multi-year container. Keep
calendar rendering and tooltip hiding in dashboard orchestration, and keep export
metadata pure and testable in existing export utilities. No new tab, dependency, API,
or storage layer is required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The design follows existing static-browser and export boundaries. |
