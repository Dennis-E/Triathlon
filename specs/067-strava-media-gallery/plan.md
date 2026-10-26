# Implementation Plan: Strava Media Gallery

**Branch**: `067-strava-media-gallery` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification in `specs/067-strava-media-gallery/spec.md`

## Summary

Extend the existing Strava ZIP import to validate and expose local JPG/MP4 media during the current page session, then add a conditionally available media gallery with activity context, filters, annual views, and local PNG export. Reuse JSZip, the current dashboard dataset/tab orchestration, and the existing preview/download export flow. Resolve associations only through exact validated media references; never infer links from captions or nearby timestamps. Keep media bytes in session memory, extract/display requested items on demand, and release object URLs when the imported dataset is replaced. Rasterize exports locally so embedded source-photo location metadata is not retained; visible route inclusion remains a separate opt-in.

## Technical Context

**Language/Version**: Browser JavaScript and Node.js-compatible CommonJS utilities; static scripts, no compilation step.

**Primary Dependencies**: Existing JSZip 3.10.1 CDN loader in `src/zip-importer.js`, Papa Parse for CSV import, html2canvas for local visual export, and Jest 30 for tests. No new server or external media service.

**Storage**: In-memory import-session state only. No localStorage, IndexedDB, cookies, application database, or media upload. Revoke created object URLs on dataset replacement and page teardown.

**Testing**: Root Jest suite in the Node environment. Add focused tests for pure media utilities, ZIP extraction/reconciliation, dataset integration, conditional tab availability, tab navigation, export mapping/privacy, and script syntax. Add browser verification with the private local reference ZIP; never commit that ZIP or derived media.

**Target Platform**: Modern desktop and mobile browsers served as the existing static application.

**Project Type**: Static browser dashboard with CommonJS/browser-bridged reusable utilities and classic-script DOM orchestration.

**Performance Goals**: For at least 1,000 media entries, show a requested preview within 2 seconds on the reference device; do not decode or render every original at once. Video playback is user initiated only.

**Constraints**: Strava only in this feature; JPG and MP4 based on the reference export. Media and associated content stay local and non-persistent. Exact associations only; import must continue when individual media are missing, corrupt, unsupported, or ambiguous. No object, face, or AI image analysis. The new tab must support the existing local preview/download flow.

**Scale/Scope**: Reference export contains 1,256 JPGs, 205 MP4s, 1,458 media-manifest rows, and 924 activities with media references. The import must account for every reference, manifest row, and discovered media file, including discrepancies, without asserting that counts imply successful matches.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Plan decision | Status |
|-----------|------|---------------|--------|
| I. Static Browser-First Delivery | No bundler, build step, or required backend | Extend the current static page and CDN-loaded browser libraries | PASS |
| II. Dual-Target Reusable Modules | Reusable parsing/reconciliation logic remains testable in Node and available in the browser | Add pure `src/media-utils.js` with CommonJS and `window.*` bridge; keep DOM work in a dashboard orchestration script | PASS |
| III. Narrowest-Scope Test-First Verification | Update tab constants, markup, dispatch, export wiring, and focused tests together | Register the media tab in `src/tab-navigation.js`, `index.html`, `src/dashboard-tabs.js`, `src/dashboard-export.js`, and matching tests | PASS |
| IV. Faithful Locale-Aware Data Parsing | Preserve German/English CSV support and existing sport/distance semantics | Reuse current CSV import; parse media headers without changing activity normalization or GPX behavior | PASS |
| V. Explicit Privacy & Network Boundaries | No media/activity upload or persistence; privacy wording remains precise | Keep media in local session memory, exclude it from analysis-counter payloads, strip embedded location metadata from image exports, and keep routes excluded by default | PASS |

No constitution violations or waivers are required.

## Design Decisions

- **Association identity**: Compare each activity media reference only with a complete filename recorded by the media manifest and a corresponding ZIP entry. Normalize only representation details needed to compare the same path; require a single candidate. Do not use caption, date proximity, or partial-name heuristics. Any unresolved candidate remains visibly unassigned/ambiguous.
- **Import boundary**: Extend `importStravaZip()` to return a media inventory and reconciliation report alongside existing CSV, FIT, and GPS results. Put this data on the Strava imported dataset; TrainingPeaks dataset construction supplies no media inventory.
- **Media lifetime**: Keep entry descriptors and the loaded archive reachable only from the active imported dataset. Read/decode media on demand; cache only session object URLs needed by visible items and release them when replacing the dataset. Do not serialize media to browser storage.
- **Date/filter behavior**: Use a reliable media capture date when available. If absent, use the date of a uniquely associated activity and preserve that it is activity-derived; otherwise treat the item as undated and keep it discoverable. Sport/activity filters apply only when association is unique.
- **Interaction states**: Make gallery filters, selection, preview, and playback controls keyboard-operable with visible focus and meaningful accessible names. Show distinct loading, loaded, empty, and failed states for requested media without exposing filenames or captions in diagnostics.
- **Gallery/export**: Add a media dashboard renderer and a conditional visualization-availability flag. Keep the existing branded local preview/download path. Static exports are newly rasterized images; never export original image bytes, so source GPS metadata is discarded. Route/map content is omitted by default and can appear only after explicit selection and preview.
- **Video behavior**: Request metadata/poster/frame data only as needed. Never set autoplay; videos in static annual views/collages use a still preview, while playback in the gallery requires an explicit user action.

## Project Structure

### Documentation (this feature)

```text
specs/067-strava-media-gallery/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── media-gallery-ui.md
└── tasks.md                 # Created by /speckit-tasks, not by this plan
```

### Source Code (repository root)

```text
src/
├── media-utils.js                  # New pure parsing, reconciliation, filtering helpers
├── zip-importer.js                 # Read media manifest and extract media on demand
├── dashboard-import.js             # Attach Strava media inventory; retain TP behavior
├── visualization-availability.js   # Gate media tab on readable media
├── tab-navigation.js               # Register media tab IDs and ordering
├── dashboard-media.js              # New gallery, filters, preview, and local collage view
├── dashboard-export.js             # Capture target, export availability, privacy-safe raster
└── export-utils.js                  # Media tab title/slug/metadata
index.html                           # Tab markup, dispatch, static script order
__tests__/
├── zip-importer.test.js
├── dashboard-import.test.js
├── visualization-availability.test.js
├── tab-navigation.test.js
├── dashboard-export-download.test.js
├── export-utils.test.js
└── index-script-syntax.test.js
```

**Structure Decision**: Keep the feature within the existing static application. Reusable identity/status/filter logic belongs in a dual-target utility; the gallery DOM and user interactions belong in a new classic dashboard orchestration script, wired through the existing tab and export registries. No API or service changes are planned.

## Constitution Check (Post-Design)

All gates still pass. The media tab has a registered local Share/Export target and focused no-data/export tests. The no-upload/no-persistence boundary is preserved, and the TrainingPeaks path remains media-free. Private exports are local manual validation inputs only.

## Complexity Tracking

No constitution violations; no exception or additional project boundary is introduced.
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
