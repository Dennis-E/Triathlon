# Implementation Plan: Import-Screen Polish

**Branch**: `024-import-screen-polish` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/024-import-screen-polish/spec.md`

## Summary

Improve the Strava import modal with prepared previews of existing TriAnalytica visualizations and rotating status copy while preserving a single clear headline, progress bar, and black detail box. Correct FIT GPS handling at the importer boundary by segmenting records into one time-bounded track per imported activity, including Garmin multisport child sessions, before existing simplification and dashboard display.

## Technical Context

**Language/Version**: JavaScript, browser-compatible CommonJS modules, Node.js test runtime

**Primary Dependencies**: Existing static HTML UI, Chart.js, Lucide, CDN assets, JSZip, fit-file-parser, Papa Parse, Jest

**Storage**: Browser-local imported dataset only; no new persistent storage

**Testing**: Jest with the Node environment; focused ZIP importer tests followed by the root suite; manual static-browser validation

**Target Platform**: Modern desktop and mobile browsers served by a plain static file server

**Project Type**: Static browser web application

**Performance Goals**: Preview rotation must not add measurable import work; total import duration change should remain within the specified 5% target; existing single-pass FIT parsing must be preserved.

**Constraints**: No bundler or build step; preserve existing public data shapes and local-file privacy boundaries; do not parse FIT files more than once per source file; no DOM-only reusable utility logic.

**Scale/Scope**: One import modal, the existing ZIP/FIT GPS extraction path, synthetic multisport coverage, and the affected root tests; no new backend or dashboard tab.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. UI changes remain in existing static HTML/classic scripts; no bundler or build step is introduced.
- **II. Dual-Target Reusable Modules**: PASS. FIT segmentation remains reusable logic in `src/zip-importer.js`, preserving its CommonJS/browser-global bridge and Node-compatible parsing.
- **III. Narrowest-Scope Test-First Verification**: PASS. Add focused Jest coverage in `__tests__/zip-importer.test.js`, then run the root suite; no tab change is involved.
- **IV. Faithful Locale-Aware Data Parsing**: PASS. CSV semantics and sport normalization remain unchanged; FIT records are only assigned to the correct session interval.
- **V. Explicit Privacy & Network Boundaries**: PASS. Previews are prepared local UI content and tests use synthetic records; no API or raw-export handling changes.

No gate violations require complexity justification.

## Project Structure

### Documentation (this feature)

```text
specs/024-import-screen-polish/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── import-screen.md
└── tasks.md              # Created by /speckit-tasks, not by this plan
```

### Source Code (repository root)

```text
index.html                         # import modal markup and prepared preview content
src/dashboard-import.js            # modal state, preview rotation, status updates
src/zip-importer.js                # FIT record/session segmentation and GPS extraction
__tests__/zip-importer.test.js     # synthetic FIT and regression coverage
```

**Structure Decision**: Preserve the existing static browser structure. Keep DOM orchestration in `index.html` and `src/dashboard-import.js`; keep FIT/GPS data logic in `src/zip-importer.js`; extend the existing importer test file instead of introducing a new test framework or directory.

## Complexity Tracking

No constitutional violations.
