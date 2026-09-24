# Implementation Plan: Social Share Branding & Favicons

**Branch**: `035-social-share-branding` | **Date**: 2026-09-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/035-social-share-branding/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Publish a static 1200x630 branded social preview image and a favicon/app-icon set derived
from the circular TriAnalytica emblem, then add a single, non-duplicated set of `<title>`,
description, Open Graph, and Twitter card `<head>` tags plus icon `<link>` elements to
`index.html`, all referencing the correct GitHub Pages subpath (`/Triathlon/`) or the
explicit absolute production URL for social crawlers. No application behavior, layout, or
test-covered logic changes.

## Technical Context

**Language/Version**: HTML5 head metadata + static PNG/ICO assets (no new JS/TS logic)

**Primary Dependencies**: None — CDN-script static site per existing convention; no image-processing library added (icon variants are pre-rendered files, not generated at runtime)

**Storage**: Static files only (social preview and favicon/app-icon files under `assets/`) served by GitHub Pages

**Testing**: Root Jest suite (`npm test`) for regression coverage of existing suites (e.g. [__tests__/preview-assets.test.js](../../__tests__/preview-assets.test.js), [__tests__/legal-footer.test.js](../../__tests__/legal-footer.test.js)) plus manual verification via Open Graph/Twitter card debugger and direct asset URL checks

**Target Platform**: Static site on GitHub Pages, served at `https://dennis-e.github.io/Triathlon/`

**Project Type**: Single static web project (no frontend/backend split for this feature)

**Performance Goals**: N/A — static asset additions with negligible payload; no runtime performance targets apply

**Constraints**: No bundler/build step (Principle I); assets must resolve correctly when the repo root maps to the `/Triathlon/` GitHub Pages subpath; social metadata URLs must be absolute production URLs, not root-relative paths that escape the subpath

**Scale/Scope**: One HTML file (`index.html` `<head>`) plus up to 7 new static image files at repo root; no new source modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Static Browser-First Delivery)**: PASS. Change is limited to `<head>` markup in `index.html` and static asset files at the repo root; no bundler, build step, or new tooling is introduced.
- **Principle II (Dual-Target Reusable Modules)**: N/A. No new reusable logic is added under `src/`; this feature only touches head metadata and binary assets.
- **Principle III (Narrowest-Scope Test-First Verification)**: PASS. Root `npm test` will be run after the `index.html` change to confirm no regression in existing suites (e.g. `preview-assets.test.js`, `legal-footer.test.js`, `index-script-syntax.test.js`). No dashboard tab is touched, so the tab-navigation update rule does not apply.
- **Principle IV (Faithful Locale-Aware Data Parsing)**: N/A. No CSV/GPX parsing is touched.
- **Principle V (Explicit Privacy & Network Boundaries)**: PASS. Meta description/OG copy continues to accurately describe local, in-browser data exploration; no new network calls are introduced by this feature, and `services/api/` is untouched.

No violations identified; Complexity Tracking section is not needed.

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design (data-model.md, contracts/, quickstart.md).*

- **Principle I**: PASS — design confirms only `<head>` markup + static files, no build step introduced.
- **Principle II**: N/A — confirmed no new `src/` module is required.
- **Principle III**: PASS — quickstart.md specifies running root `npm test` as the verification gate before completion.
- **Principle IV**: N/A — unchanged.
- **Principle V**: PASS — data-model.md's copy remains accurate about local, in-browser processing; no new network endpoints are introduced.

Gate re-confirmed: no violations, no complexity justification required.

## Project Structure

### Documentation (this feature)

```text
specs/035-social-share-branding/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── head-metadata.md # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html                          # canonical <head> edit: title, description, OG/Twitter meta, icon <link> tags
assets/social-preview.png           # new: 1200x630 social share image
assets/favicon.ico                  # new: multi-size legacy favicon
assets/favicon-16x16.png            # new
assets/favicon-32x32.png            # new
assets/apple-touch-icon.png         # new: 180x180
assets/android-chrome-192x192.png   # new
assets/android-chrome-512x512.png   # new
assets/
├── Square Logo.png                 # existing circular emblem source artwork used to derive favicons
└── logo.png                        # existing wide wordmark — explicitly NOT used for favicon-sized assets
__tests__/
├── preview-assets.test.js          # existing regression coverage for index.html markup
└── index-script-syntax.test.js     # existing regression coverage for index.html script validity
```

**Structure Decision**: Single static project (Option 1, minimal form) — no
`src/` or `services/api/` changes are needed. All work is (a) new static image
assets at the repository root so GitHub Pages serves them under
`/Triathlon/`, and (b) a metadata-only edit to `index.html`'s existing single
`<head>`, consistent with Principle I (no bundler/build step) and Principle II
(this is not reusable JS logic, so no `src/` dual-target module applies).

## Complexity Tracking

> No Constitution Check violations were identified; this section is not
> applicable to this feature.
