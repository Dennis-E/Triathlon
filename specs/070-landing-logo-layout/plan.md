# Implementation Plan: Landingpage Logo Layout

**Branch**: `070-landing-logo-layout` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/070-landing-logo-layout/spec.md`

## Summary

Keep both TriAnalytica logo instances on the landing page fully visible and proportional at widths from 320 CSS pixels upward. Adjust the existing responsive layout around the header logo and hero logo so adjacent content can reflow instead of compressing or covering the brand mark. Preserve the existing image and wider-screen appearance; see [research.md](research.md) for the layout decision.

## Technical Context

**Language/Version**: HTML5 and existing browser CSS utilities; no pinned browser version

**Primary Dependencies**: Existing Tailwind CSS CDN and browser layout behavior; no new dependencies

**Storage**: None

**Testing**: Existing Jest 30 Node suite for script/markup integrity; manual browser checks at 320, 375, 768, and 1280 CSS pixels

**Target Platform**: Current desktop and mobile browsers served from the existing static site

**Project Type**: Static browser application without a bundler or build step

**Performance Goals**: Layout updates immediately on viewport resize; no new runtime script or network requests

**Constraints**: Preserve the supplied logo and its aspect ratio; support widths from 320 CSS pixels; do not introduce a build step or dependency

**Scale/Scope**: Two logo instances on the landing page (shared header and hero); no application state or data changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution requirement | Before research | After design | Plan response |
|---|---|---|---|
| I. Static browser-first delivery | PASS | PASS | Adjust existing `index.html` layout only; retain static hosting and current CSS utilities. |
| II. Dual-target reusable modules | PASS | PASS | No reusable business logic is introduced, so no module is needed. |
| III. Narrowest-scope test-first verification | PASS | PASS | Run the existing focused script/markup test and verify the specified viewport sizes in a browser. This feature does not add or change a dashboard tab. |
| IV. Locale-aware data parsing | PASS | PASS | No import, parsing, sport, or unit behavior changes. |
| V. Privacy and network boundaries | PASS | PASS | No personal data processing, network requests, or API changes. |
| Repository and dependency boundaries | PASS | PASS | Root static frontend only; no dependencies or service boundary changes. |

**Gate result**: PASS. No constitution violations or unresolved technical decisions were identified.

## Project Structure

### Documentation (this feature)

```text
specs/070-landing-logo-layout/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── landing-logo-ui.md
├── quickstart.md
└── tasks.md             # Created by /speckit-tasks, not this plan
```

### Source Code (repository root)
```text
index.html                              # Existing header and landing-page hero layout
__tests__/index-script-syntax.test.js   # Existing static page/script integrity check
```

**Structure Decision**: Make the focused presentation change in the existing static page. No new application source module is needed. The UI behavior contract is documented under this feature's `contracts/` directory; browser viewport checks complement the existing Node-based test suite.

## Complexity Tracking

No constitution violations or additional infrastructure components are planned.
