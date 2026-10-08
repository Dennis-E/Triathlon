# Implementation Plan: Entertaining Import Experience

**Branch**: `051-entertaining-import-experience` | **Date**: 2026-10-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/051-entertaining-import-experience/spec.md`

## Summary

Enhance the existing Strava import modal with twenty triathlon-specific humorous messages, locally bundled SVG illustrations, reliable personal observations, periodic accurate privacy copy, and factual import-stage feedback. Keep the ZIP/CSV pipeline intact. Store message copy, stable IDs, eligibility, and SVG paths in a small dual-target catalog module at `src/import-experience-catalog.js`; store scene art independently under `assets/import-illustrations/`. Keep DOM/timer lifecycle in the existing `src/dashboard-import.js` orchestrator. Use a shuffled, no-repeat session rotation; derive personal values only after the processed activity list is final, without archive/CSV/FIT/GPX reparsing or dataset copying. Apply a finalization gate to message 20 and respect reduced motion and hidden-tab behavior.

## Technical Context

**Language/Version**: Browser-compatible JavaScript (ES2015+ syntax already used in `src/`), HTML, CSS, and standalone SVG; Node.js CommonJS for Jest-compatible reusable logic.

**Primary Dependencies**: Existing static app scripts and current browser dependencies only; no new runtime or animation dependency.

**Storage**: No persistent storage. Message state/statistics remain in memory for one import session; checked-in local SVGs are static assets.

**Testing**: Root Jest suite in Node environment. Focused unit tests for pure catalog/selection/statistic rules; static HTML/script/asset checks; manual browser validation for layout, SVG rendering, reduced motion, and import lifecycle.

**Target Platform**: Existing modern desktop and mobile browsers running the static TriAnalytica application.

**Project Type**: Static browser application with classic script loading and CommonJS/browser-bridge utility modules.

**Performance Goals**: No additional archive or CSV parse, no large activity-array copy, no continuous JavaScript animation, and no material main-thread work beyond one bounded pass over already processed activities. Meet the specification's ≤5% representative-import duration overhead target. Do not add overhead or claim new support for 2 GB archives beyond the existing pipeline.

**Constraints**: No bundler/build step, no React assumption, no external image/video/GIF/animation library, no transmitted training data or derived statistics, maintain current sport/multisport semantics, use GPU-friendly bounded motion, support `prefers-reduced-motion`, and clean up session resources on every end state.

**Scale/Scope**: Twenty base messages and twenty matching SVG illustrations; up to six optional data-personalized candidates reusing matching art; one recurring privacy reminder; one active import modal/session. No dashboard tab, backend endpoint, or data-model change.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Design response |
|---|---|---|
| I. Static Browser-First Delivery | PASS | Keep direct script and static SVG loading; add no bundler/build step. |
| II. Dual-Target Reusable Modules | PASS | New catalog/selection logic is pure and exposes CommonJS plus a `window` bridge; DOM lifecycle stays in the existing orchestration script. |
| III. Narrowest-Scope Test-First Verification | PASS | Add focused Jest tests and extend script-order/HTML tests; no visualization tab is introduced, so Share/Export tab requirements do not apply. |
| IV. Faithful Locale-Aware Data Parsing | PASS | Do not alter CSV/GPX parsing or sport normalization; consume processed data and its availability flags. |
| V. Explicit Privacy & Network Boundaries | PASS | All copy/art is local, no personal data/statistic is transmitted, and privacy text describes only file processing. |
| Dependency/runtime boundaries | PASS | Change only the root static app/test surface; no API-service or dependency coupling. |

No constitution violations or exceptions are required.

## Project Structure

### Documentation (this feature)

```text
specs/051-entertaining-import-experience/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── import-experience-ui.md
└── tasks.md                  # Created by /speckit-tasks, not this plan
```

### Source Code (repository root)

```text
index.html
src/
├── import-experience-catalog.js   # Copy, stable IDs, eligibility, pure selectors/stat values
└── dashboard-import.js            # Existing modal DOM, progress and session lifecycle
assets/
└── import-illustrations/
    ├── message-01.svg
    ├── ...
    └── message-20.svg
__tests__/
├── import-experience.test.js      # New pure selection/statistics/lifecycle tests
├── dashboard-import.test.js       # Focused import orchestration regressions
└── index-script-syntax.test.js    # Script order, markup and local asset contracts
```

**Structure Decision**: Use the existing root static-web-app structure, with a single separate message catalog under `src/` and independent local SVG files under `assets/import-illustrations/`. The catalog does not embed SVG markup. Register the catalog script before `dashboard-import.js`; keep import-modal DOM/timer ownership in the latter, avoiding a second competing controller. Scope each classic-script module to avoid lexical name collisions. Add no new top-level project or runtime dependency.

## Design Decisions

- Replace, rather than layer over, the existing five-second preview/message rotation.
- Treat generic and personal joke messages as humorous entries for the privacy cadence; after four, show privacy copy secondarily without replacing the primary illustration.
- Accumulate personal values within the existing activity-processing pass and publish candidates only after successful CSV processing. Omit incomplete metric messages rather than display partial totals. Use the exact eligibility rules in [data-model.md](data-model.md).
- Gate message 20 only on whole-application finalization after CSV/dashboard preparation. The ZIP importer's earlier `Finalizing...` event is not equivalent. Never extend the import to display it.
- Preserve actual reported percentages. Remove the orchestration's hard-coded initial 5% and post-ZIP 70% update; update factual stage text without injecting a phase percentage when none is reported, preventing the current 95%→70% regression.
- Pause or defer rotation while the page is hidden; never catch up with rapid consecutive message changes. Stop every timer/resource at success, failure, close, teardown, and replacement import.
- Animate with lightweight local SVG/CSS only. Include a reduced-motion rule in each independently loaded SVG and in the page-level transition.

## Constitution Check (Post-Design)

All gates remain **PASS**. The dual-target catalog preserves existing reuse/testing conventions; new art is local and introduces no dependency; UI orchestration stays within its established module. No dashboard tab or API service is added. Focused tests verify the strongest behavioral risks (eligibility, no-repeat rotation, personal-value suppression, privacy cadence, actual progress values, and cleanup). Large-ZIP behavior remains an explicit constraint rather than a new compatibility promise.

## Complexity Tracking

No constitution violations. No additional project, external service, dependency, or pipeline abstraction is introduced.
