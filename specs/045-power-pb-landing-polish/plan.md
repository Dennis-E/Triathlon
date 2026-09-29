# Implementation Plan: Power PB and Landing Preview Polish

**Branch**: `045-power-pb-landing-polish` | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

## Summary

Correct the all-time Bike power profile consistently across its compact PB tile, full-screen detail view, and downloaded image export; use duration categories rather than activity dates on that profile's horizontal axis. Keep the compact chart legible, broaden the landing-card description beyond distance, and adapt the actual Personal Bests dashboard's shared sticky Swim/Bike/Run header for mobile, where each sport's content must follow its own heading. The implementation will extend the existing PB detail chart model/rendering for a duration-based x-axis, retain the existing browser-local export capture path, and adjust dashboard markup without changing PB calculations or adding runtime dependencies.

## Technical Context

**Language/Version**: HTML5, CSS utility classes, browser JavaScript; current Node.js for Jest

**Primary Dependencies**: Existing static app scripts, Lucide, browser-local `html2canvas` export flow, Jest; no new dependency

**Storage**: In-memory imported activities and PB view models; generated image remains browser-local and downloaded by the user; no persistence changes

**Testing**: Focused Jest tests for `power-pb-utils` and HTML/inline-script contracts in `index-script-syntax.test.js`; full root Jest suite; manual desktop/mobile browser validation

**Target Platform**: Modern desktop and mobile browsers served as a static site

**Project Type**: Static browser web application with classic dashboard orchestration scripts and CommonJS/browser-global utility modules

**Performance Goals**: Use existing render and export paths; do not add a chart render pass, network request, or perceptible delay to PB loading/export

**Constraints**: Preserve PB calculations and records; retain browser-local export; no bundler/build step or new runtime dependency; keep the Personal Bests dashboard readable from mobile through desktop; `index.html` owns landing markup and dashboard structure

**Scale/Scope**: One Bike all-time power profile and its tile/detail/export views, one landing Personal Bests card description and its three sport preview groups; no API, tab, data-import, or persistence changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery — PASS**: Changes stay in existing HTML and browser scripts; no build step or backend is introduced.
- **II. Dual-Target Reusable Modules — PASS**: PB profile derivation stays in the existing pure `src/power-pb-utils.js` module with its current CommonJS and `window.powerPbUtils` bridge; chart orchestration remains in the classic dashboard script.
- **III. Narrowest-Scope Test-First Verification — PASS**: Extend power PB utility and inline/markup contract tests, run focused Jest tests, then the full root suite. No dashboard tab is added or removed.
- **IV. Faithful Locale-Aware Data Parsing — PASS**: No CSV/GPX parsing or sport normalization changes.
- **V. Explicit Privacy & Network Boundaries — PASS**: Profile content is derived from already-local imported activities; export remains browser-local and must not send chart data to the analysis API.
- **Repository & Dependency Boundaries — PASS**: Work stays in the root static app and root Jest suite; no API/CLI dependency changes.

## Project Structure

### Documentation (this feature)

```text
specs/045-power-pb-landing-polish/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── power-pb-landing-ui.md
└── tasks.md             # Created by /speckit-tasks; not part of this plan workflow
```

### Source Code (repository root)
```text
index.html                              # Personal Bests dashboard sport header/grid and landing-card description
src/dashboard-power-pb.js               # Profile tile and full-screen detail chart rendering/model wiring
src/dashboard-export.js                 # Existing browser-local PB detail image export flow; preserve behavior
src/power-pb-utils.js                    # Existing profile point selection and pure profile helpers
__tests__/index-script-syntax.test.js    # Inline PB renderer, detail-axis, export wiring, and preview markup contracts
__tests__/power-pb-utils.test.js         # Profile selection and duration-label helper coverage
```

**Structure Decision**: Preserve the existing static-browser architecture. Keep all-time profile selection and any reusable duration/category derivation in `src/power-pb-utils.js`; keep SVG and detail-overlay chart rendering in `src/dashboard-power-pb.js`; retain the current export route in `src/dashboard-export.js`; update the landing Personal Bests preview in `index.html`. Add only focused tests and feature design documentation. No external contract is required because this change adds no system-facing API.

## Phase 0: Research Summary

See [research.md](research.md). The current compact profile already plots duration on x and watts on y. Its enlarge button, however, supplies profile points as ordinary date/value PB records, and the generic detail renderer intentionally builds a chronological date/year x-axis; the export captures that same detail SVG. Treat the all-time profile as a duration-category chart model so tile, detail, and export retain identical ordered duration/watt pairs. Keep activity date/title as point context for labels or tooltips, not the horizontal scale.

## Phase 1: Design Summary

The profile point model and display invariants are defined in [data-model.md](data-model.md). The full-screen chart, export, and responsive dashboard-heading requirements are specified in [contracts/power-pb-landing-ui.md](contracts/power-pb-landing-ui.md). Runnable validation and viewport checks are in [quickstart.md](quickstart.md).

### Planned implementation slices

1. Add focused contracts for profile model axis mode, duration tick labels, and consistency across compact/detail/export views; add responsive dashboard sport-heading and updated card-copy assertions.
2. Extend the PB detail view model/rendering to support duration-category x values for the all-time profile while preserving date-based timeline charts for all other PB tiles.
3. Ensure the compact all-time profile chart uses a legible plot area consistent with peer Bike PB tiles without changing profile data or counts.
4. Update the landing Personal Bests description and adapt the dashboard's shared sport header into per-sport mobile headings while preserving its desktop alignment.
5. Run focused and full Jest checks, then validate the export and 1-column/multi-column layouts in a browser.

## Phase 1 Constitution Re-check

- Static delivery, module bridge, data parsing, dependency boundaries, and local privacy constraints remain satisfied.
- Existing export capture and download remain browser-local; the profile-specific duration axis is presentation only.
- No tab constants, IDs, dispatch behavior, PB calculations, or API/service behavior changes are planned.
- Focused automated checks and browser validation are specified before implementation is considered complete.

## Complexity Tracking

No Constitution Check violations. No complexity exception is required.
