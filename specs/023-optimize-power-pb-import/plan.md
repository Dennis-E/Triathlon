# Implementation Plan: Optimized Bike Power PB Import

**Branch**: `023-optimize-power-pb-import` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/023-optimize-power-pb-import/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Replace the current quadratic rolling-power scan with a prepared-record, monotonic
sliding-window calculation that evaluates all eight supported durations in linear time
after one normalization pass. Keep `calculateRollingPowerEfforts` and the existing ZIP
import APIs backward-compatible, preserve exact window/coverage/tie semantics, skip
no-power activities early, and add differential correctness tests plus reproducible
synthetic scaling and browser benchmarks. Optional timing hooks will distinguish FIT
parsing, GPS processing, and power-PB calculation without collecting personal data.

## Technical Context

**Language/Version**: JavaScript (ES2020+), executed directly in modern browsers and Node.js/Jest

**Primary Dependencies**: Existing `fit-file-parser` browser import, JSZip CDN integration, native `performance.now()`/`Date.now()` timing fallback; no new runtime dependency

**Storage**: N/A; activity records and benchmark measurements remain in memory

**Testing**: Jest in the root Node environment, synthetic differential fixtures, deterministic scaling checks, and a documented manual browser benchmark

**Target Platform**: Static browser application served by a plain HTTP server; CommonJS-compatible Node test environment

**Project Type**: Static web application with reusable dual-target JavaScript utility modules

**Performance Goals**: Four-hour/one-second activity with positive integer FIT watts processed for all durations within 2 seconds in the manual browser benchmark; doubling equivalent integer-watt records costs no more than 2.5x using three warm-ups and seven measured runs; at least 75% reduction versus the characterized baseline

**Constraints**: Exact preservation of inclusive window bounds, 80% coverage formula, invalid-power handling, first-wins ties, and output fields; no bundler; no real Strava data in tests; no regression to GPS/non-bike imports; public exports and signatures remain compatible

**Scale/Scope**: Eight fixed durations; 14,401 records for the single-ride benchmark; 100 two-hour activities at one-second density (720,000 records total) for history validation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. The design changes plain JavaScript
  utilities and adds static validation guidance only; no build step or framework is
  introduced.
- **II. Dual-Target Reusable Modules**: PASS. Power calculations remain pure and keep
  CommonJS exports plus the `window.powerPbUtils` bridge. Timing uses injected or
  universally available clocks and does not require DOM APIs.
- **III. Narrowest-Scope Test-First Verification**: PASS. Differential and scaling
  tests are planned in the existing root Jest suite, followed by `npm test`; the hard
  two-second threshold remains a documented browser benchmark to avoid CI flakiness.
- **IV. Faithful Locale-Aware Data Parsing**: PASS. CSV/GPX parsing, sport
  normalization, and distance-column semantics are unchanged.
- **V. Explicit Privacy & Network Boundaries**: PASS. Tests and benchmarks use
  synthetic records; timing output contains durations/counts only and raw exports stay
  local.
- **Repository & Dependency Boundaries**: PASS. Work stays in the root static app and
  does not depend on `services/api` or alter the standalone extractor.

**Post-design re-check**: PASS. The Phase 1 model and contracts preserve all existing
public entry points, add no external service, and keep validation data synthetic. No
constitutional exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/023-optimize-power-pb-import/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── power-pb-processing.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── power-pb-utils.js     # Prepared records and rolling-power calculations
└── zip-importer.js       # Combined import orchestration and phase timing

__tests__/
├── power-pb-utils.test.js # Differential semantics and scaling regression tests
└── zip-importer.test.js   # Import integration, timing, progress, and failure isolation

scripts/
└── benchmark-power-pb.js  # Reproducible synthetic benchmark report

docs/
└── test-power-pb-performance.html # Static browser benchmark and progress-gap harness
```

**Structure Decision**: Keep the existing single static-app structure. The core
algorithm belongs in `src/power-pb-utils.js`; `src/zip-importer.js` owns only import
orchestration and phase boundaries. Existing Jest files exercise the reusable and
integration layers, while one root script provides repeatable synthetic timing without
adding a second application or dependency surface.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations.
