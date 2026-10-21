# Implementation Plan: Restore Swim GPS Heatmap Visibility

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

**Feature directory / setup identifier**: `062-restore-swim-heatmap`. The setup script reports this identifier as BRANCH; the actual Git branch above remains unchanged.

**Input**: [Feature specification](spec.md), including the user-approved TrainingPeaks error-handling exception.

## Summary

Restore standalone Strava FIT swim routes by making file ownership, not the mere presence of summary timestamps, control record segmentation. A recording assigned to one activity supplies its full records to existing GPS and bike-power extraction. A recording assigned to multiple activities supplies only records with unambiguous ownership under valid bounded activity intervals. Keep the separate TrainingPeaks import path, sport normalization, simplification, heatmap controls, and export interfaces unchanged.

The standalone loss has a synthetic reproduction; the user's personal export has not been examined. This command produces design artifacts only, not the implementation.

## Technical Context

**Language/Version**: Existing browser-compatible JavaScript and CommonJS; no new language features or Node minimum version requirement (the root package declares no engine version).

**Primary Dependencies**: Existing JSZip and fit-file-parser 1.10.0 browser integration, Leaflet, and html2canvas. Root Jest ^30.4.2; no new dependencies.

**Storage**: In-memory imported activities, GPS tracks, and bike power efforts. No persistence or migration.

**Testing**: Root Jest in the Node environment; existing injected FIT dependencies and VM dashboard harnesses. Browser inspection for visible routes and exported image contents.

**Target Platform**: Existing static browser app; Node for reusable-module tests.

**Project Type**: Static web application without a build step; the separate Express API and extraction CLI are unchanged.

**Performance Goals**: Parse/decompress each FIT file at most once; retain 2,000-point track cap and current simplification; do not increase segmentation beyond the existing records-by-activities complexity. Standalone files bypass segmentation entirely.

**Constraints**: Preserve public signatures and CommonJS/browser globals, locale-aware CSV semantics, local raw-file processing, existing network boundaries, and TrainingPeaks all-or-nothing failure behavior.

**Scale/Scope**: One importer ownership decision and its shared-record segmentation helper; extend existing importer, heatmap, and export tests. No new tabs, UI redesign, API changes, parser replacement, or dependency changes.

## Constitution Check

*Initial gate before research: PASS. Post-design gate: PASS.*

| Principle | Initial Review | Post-Design Evidence |
|-----------|----------------|----------------------|
| I. Static Browser-First Delivery | PASS: no build/runtime change | Existing classic scripts and CDN loading remain unchanged. |
| II. Dual-Target Reusable Modules | PASS: existing importer owns the decision | Preserve exports/globals and injected dependencies; no DOM added to utilities. |
| III. Narrowest-Scope Test-First Verification | PASS: focused regression tests planned | Import red/green checks, real import-to-segment checks, existing VM harnesses, and browser export verification specified in quickstart. No tab added or changed. |
| IV. Faithful Locale-Aware Data Parsing | PASS: no normalization or parser redesign | German/English summary cases included; singleton ownership bypasses timing without changing summary date parsing or GPX regex. |
| V. Explicit Privacy & Network Boundaries | PASS: synthetic data only | No personal fixtures, uploads, new services, or new persistence. Existing map/CDN requests remain possible. |
| Repository boundaries / focused changes | PASS | Root application/tests/docs only; no API or CLI dependency crossing. |

No violations or exceptions to the constitution are required. The clarified FR-005 preserves existing TrainingPeaks error semantics rather than expanding into partial imports.

## Project Structure

### Documentation (this feature)

```text
specs/062-restore-swim-heatmap/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/import-heatmap.md
  checklists/requirements.md
```

Task generation is the next workflow phase; no task file is generated here.

### Source Code (repository root)

```text
src/zip-importer.js                       # ownership selection and shared segmentation
src/heatmap-utils.js                      # unchanged integration consumer
src/dashboard-heatmap.js                  # unchanged filter/map consumer
src/dashboard-export.js                   # unchanged export consumer
__tests__/zip-importer.test.js             # regression and compatibility coverage
__tests__/heatmap-utils.test.js            # real imported route -> sport segments
__tests__/dashboard-heatmap.test.js         # filter and empty-state coverage
__tests__/dashboard-export-download.test.js # existing preview/download harness
__tests__/export-utils.test.js             # existing target/context coverage
docs/IMPORT_FEATURE.md                     # concise cause, behavior, limitations
```

**Structure Decision**: Keep production changes in the existing importer. Reuse test files and helpers, adding coverage only where it proves a requirement not already covered. Do not modify markup, tab registration, rendering, or export wiring unless a focused check demonstrates a defect in this same workflow.

## Phase 0: Research Outcome

[research.md](research.md) records the controlling path, reproduced failure, test gap, alternatives, and source-specific boundaries. All design questions are resolved. The actual user export and real exported PNG remain verification inputs, not prerequisites for this design.

## Phase 1: Design

1. Add regression cases first in the existing importer suite: full summary fields plus valid swim coordinates, timing mismatch, moving-duration truncation, missing record timestamps, and compressed input. Confirm failure before fixing the selector.
2. In `extractGpsAndPowerFromZip`, select all parsed records when the file maps to exactly one activity. Invoke shared segmentation only for multiple associations; do not compute segmentation before deciding ownership. Feed both GPS and bike power from the same selected records.
3. For shared FIT files, initialize empty results for all owners. Require distinct activity IDs and finite, increasing start/end intervals for every association; if these prerequisites fail, retain no records from that file. For valid intervals, assign a timestamped record only when exactly one interval contains it. Omit missing timestamps, gaps, and overlapping matches; never fall back to the whole file or the first activity. Retain existing inclusive endpoints, omitting an exact boundary point if two intervals match it.
4. Keep `parseGpsFileEntries` parsing, `importTrainingPeaksZips`, `getSessionRecords`, GPX behavior, and output shapes unchanged. Document that CSV-derived shared boundaries remain imperfect evidence, not reconstructed FIT-session truth.
5. Exercise real extracted swim tracks through `buildRouteSegments` for All/Swim/Bike/Run; use existing dashboard and export harnesses for state and target/context assertions. Validate actual map and PNG contents in a browser after implementation.
6. Record the regression explanation and known shared-boundary limitation in existing import documentation; retain test evidence distinguishing the synthetic trigger from the unexamined personal export.

Detailed rules are in [data-model.md](data-model.md) and [contracts/import-heatmap.md](contracts/import-heatmap.md). Executable verification steps and browser acceptance scenarios are in [quickstart.md](quickstart.md).

## Requirement Coverage

| Requirements | Planned Verification |
|--------------|----------------------|
| FR-001, FR-006 / SC-001, SC-004 | Standalone timing, duration, timestamp and compression regression cases; red/green result. |
| FR-002 / SC-001 | Actual imported swim tracks produce segments for All/Swim only; dashboard empty-state check. |
| FR-003 / SC-002 | Shared disjoint, overlapping, adjacent, missing-boundary and missing-timestamp cases with explicit expected ownership. |
| FR-004 / SC-003 | Standalone Run/Bike parity, bike power, one-parse invariant, TrainingPeaks swim and existing transactional-failure checks. |
| FR-005 | No-GPS/single-point route cases, corrupt Strava neighbor isolation, preserved TrainingPeaks complete failure. |
| FR-007 | Existing import documentation records demonstrated cause, coverage gap and limits of evidence. |
| FR-008 / SC-005 | Existing heatmap export target/context/no-data tests plus visible route in browser preview/download. |
| FR-009 | Synthetic fixtures and injected dependencies; review for no personal data, persistence or network changes. |
