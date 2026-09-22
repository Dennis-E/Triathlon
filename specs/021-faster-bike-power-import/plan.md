# Implementation Plan: Faster Bike Power Import

**Branch**: `021-faster-bike-power-import` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/021-faster-bike-power-import/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Bike power import is slow because each bike activity's FIT file is read, gzip-decompressed
(when applicable), and parsed by the FIT parser twice during a single ZIP import: once in
`extractGpsTracksFromZip` (for GPS trackpoints) and again in `extractFitPowerEffortsFromZip`
(for power efforts). The fix is to parse each bike activity's FIT file once per import and
derive both the GPS trackpoints and the power efforts from that single parsed record set,
eliminating the redundant decompression/parse pass while preserving identical output
(GPS tracks, power efforts, personal bests) and progress reporting.

## Technical Context

**Language/Version**: JavaScript (ES2020+), runs unmodified in Node (Jest, CommonJS) and modern browsers

**Primary Dependencies**: JSZip (CDN, `window.JSZip`), `fit-file-parser` (dynamically imported via `esm.sh` in-browser), native `DecompressionStream` (gzip) — all already in use, no new dependencies

**Storage**: N/A — purely in-memory processing of an in-browser ZIP import; no persistence changes

**Testing**: Jest, `node` test environment (not jsdom) — [__tests__/zip-importer.test.js](../../__tests__/zip-importer.test.js) and [__tests__/power-pb-utils.test.js](../../__tests__/power-pb-utils.test.js)

**Target Platform**: Static browser app (client-side only), served without a build step

**Project Type**: Single project — reusable module change in `src/zip-importer.js`, no new surfaces

**Performance Goals**: Reduce bike power extraction phase time by ≥50% for 100 bike activities with power data (SC-001); bike-activity import time should not exceed GPS-only extraction time by more than ~10% (SC-002)

**Constraints**: No bundler/build step (Constitution I); module must keep CommonJS + `window.*` bridge and remain Node-testable without DOM-only APIs (Constitution II); output (GPS tracks, power efforts, PB values) must stay byte-identical to today (Constitution III, FR-002/SC-003); existing narrowest-scope tests must pass before considering the work done

**Scale/Scope**: Strava exports ranging from a handful to 1000+ activities, with a subset being bike activities carrying FIT power data; change is scoped to the FIT-file processing path in `src/zip-importer.js` only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. No bundler/build step introduced; the change only restructures how `src/zip-importer.js` reads FIT bytes during an existing import flow that runs in a plain static page.
- **II. Dual-Target Reusable Modules**: PASS. `src/zip-importer.js` keeps its CommonJS `module.exports` + `window.*` bridge; all FIT parsing stays regex/library-based (no DOM-only APIs), so Jest (`node` env) and the browser keep running the same code.
- **III. Narrowest-Scope Test-First Verification**: PASS (planned). Change is confined to `src/zip-importer.js`; no dashboard tab is touched, so `npm test` (root) is the narrowest relevant command. Existing tests in `zip-importer.test.js` and `power-pb-utils.test.js` are the correctness baseline (FR-002/SC-003) and must continue to pass; new/updated tests will assert the FIT parser is invoked once per bike activity file instead of twice.
- **IV. Faithful Locale-Aware Data Parsing**: PASS. No changes to CSV column handling, sport normalization, or GPX regex parsing; FIT record interpretation (trackpoints, power) is reused as-is, only the number of parse passes changes.
- **V. Explicit Privacy & Network Boundaries**: PASS. No new network calls; FIT files remain local, in-memory ZIP entries. No `services/api` code is touched.

No violations — Complexity Tracking section is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/021-faster-bike-power-import/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is generated: this feature changes internal FIT-parsing
behavior inside `src/zip-importer.js` only and does not add, remove, or change any
public API, UI contract, or external interface.

### Source Code (repository root)

```text
src/
├── zip-importer.js        # extractGpsTracksFromZip, extractFitPowerEffortsFromZip,
│                           # buildFitPowerEfforts, extractFitTrackpoints, importStravaZip
│                           # → merge the two FIT-parsing passes into one per bike activity
└── power-pb-utils.js       # unchanged: calculateRollingPowerEfforts, POWER_DURATIONS

__tests__/
├── zip-importer.test.js    # extend/update to assert single-parse behavior + unchanged output
└── power-pb-utils.test.js  # unchanged; remains the correctness baseline for power efforts
```

**Structure Decision**: Single project (static browser app + `src/` reusable modules, per
Constitution I/II). The change is isolated to `src/zip-importer.js`'s FIT-file handling
functions (`extractGpsTracksFromZip`, `extractFitPowerEffortsFromZip`, `importStravaZip`) and
their tests in `__tests__/zip-importer.test.js`; no other module, dashboard tab, or the
`services/api` service is affected.

## Complexity Tracking

> No Constitution Check violations — this section is intentionally left empty.
