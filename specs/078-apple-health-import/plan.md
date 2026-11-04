# Implementation Plan: Apple Health Import

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/078-apple-health-import/spec.md`.

## Summary

Add one original Apple Health ZIP as a landing-page import source. A dedicated classic Web Worker streams the primary XML through pinned zip.js and SAX dependencies, normalizes only running/cycling/swimming workouts, optionally enriches unambiguously attributable measurements in a second pass, and resolves explicit GPX references. The existing dataset commit, 13-view eligibility evaluation, navigation, and image-export flow remain the integration boundary. No new visualization or clinical-data model is introduced.

## Technical Context

**Language/Version**: Existing CommonJS/classic browser JavaScript; modern File, Worker, TextDecoder, and Web Streams APIs. Node 22/24 are the planned automated-test reference environments; verify the installed runtime during implementation.

**Primary Dependencies**: Existing JSZip path stays unchanged. Apple-only `@zip.js/zip.js` 2.8.11 native UMD build and `sax` 1.6.1, pinned CDN scripts in the worker and exact matching root devDependencies for Jest. Existing GPX regex parser and power-best-effort utilities are reused where their semantics fit. No package installation during planning.

**Storage**: User-selected File plus transient worker state and normalized in-memory dashboard data; no upload, persistent health database, or automatic disk extraction. Structural report stays ignored under private-data.

**Testing**: Root Jest 30, node environment; injected archive/parser/worker dependencies and existing VM-based dashboard tests. Browser acceptance through plain HTTP static serving, including actual worker dependencies and image exports. Synthetic fixtures only in version control.

**Target Platform**: Desktop Chromium as the documented large-export acceptance reference, with normal import UI responsive on mobile and graceful capability/resource errors. Serve over HTTP(S); file:// worker execution is not a supported import path.

**Project Type**: Existing static browser app, no bundler/build or API service changes.

**Performance Goals**: Process the specification's >=2,000-workout, >=4.5-million-record, >=3-GB-uncompressed class without retaining the XML or all records. Progress heartbeat approximately once per second and never more than five seconds apart. For fixed workouts, relevant measurements and routes, compare three workloads of 1,000,000 / 2,500,000 / 4,500,000 irrelevant records, three measured repetitions each after warm-up: combined main-thread/worker worst-peak growth from smallest to largest must be <=64 MiB, including backing stores. Follow quickstart's baseline/sampling procedure; missing worker evidence is unverified, not passed. These are acceptance targets, not already measured results.

**Constraints**: Main XML streamed twice when either scalar enrichment or timed-power-series attribution is needed; source averages do not suppress best-effort series collection. One decompression at a time; bounded input/token/entry/result allocations and fail-before-commit limits. Source-local day/time preserved separately from absolute timestamps. External entities never resolved. Current tab IDs/order, source-specific import behavior, analysis-counter payload and API boundaries unchanged. Version-controlled data-model/import contracts, subordinate to spec.md, own normative rules; the private inventory is observational evidence only.

**Scale/Scope**: One archive per import, replacing current history. Public synthetic cases cover all 17 existing activity fields and 13 views. Personal export counts, sample details, and future recovery/clinical metrics remain outside public planning artifacts.

## Constitution Check

*Pre-research review: PASS. Post-design review: PASS subject to implementation acceptance tests, not a claim that the importer already works.*

| Principle / gate | Design evidence | Result |
| --- | --- | --- |
| I: Static browser-first | Classic scripts and same-origin worker; pinned CDN dependencies; plain static server; no compilation | PASS |
| II: Dual-target utilities | apple-health-utils.js and apple-health-importer.js expose CommonJS and browser/worker namespace; worker adapter and dashboard orchestration remain DOM/runtime adapters | PASS |
| III: Focused verification and tab contracts | Existing tab IDs/order retained; actual importer -> availability, navigation, replacement, and export tests required | PASS |
| III: Share/export | No new tabs; every available existing view retains capture; hidden/stale views and in-flight old captures are invalidated | PASS |
| IV: Faithful parsing | Explicit sport whitelist, unit conversions, missing/zero flags, source-local time, existing regex GPX parsing | PASS |
| V: Privacy/network | No health uploads or clinical logging; libraries can make CDN requests; counter remains metadata-only; private source stays ignored | PASS |
| Dependency boundaries | Only root test dependencies change; services/api and Node export CLI untouched | PASS |

No constitution exception is required. Actual large-file, dependency-loading, timezone, and stale-export checks are release gates in [quickstart.md](quickstart.md), not waived risks.

## Project Structure

### Documentation (this feature)

```text
specs/078-apple-health-import/
  spec.md
  checklists/requirements.md
  plan.md
  research.md
  data-model.md
  contracts/apple-health-import.md
  quickstart.md
```

`tasks.md` belongs to the later `/speckit-tasks` phase and is not generated here.

### Source Code (repository root, proposed implementation)

```text
src/apple-health-utils.js          # normalization, identity, attribution, safe date/unit logic
src/apple-health-importer.js       # injectable streaming archive/parser pipeline; dual-target
src/apple-health-worker.js         # worker dependency loading, progress and cancellation adapter
src/dashboard-import.js            # picker, worker client, dataset adapter, transactional orchestration
src/dashboard-tabs.js             # verify/reuse availability and dataset revisions
src/dashboard-export.js            # current-availability and generation-bound export safeguards
src/workout-time-utils.js          # optional sourceLocalStart support; old API behavior retained
src/heatmap-utils.js               # optional disconnected subpaths without false bridges/visits
index.html                        # Apple import action and prerequisite utility script tags
docs/apple-health-export-how-to.html
docs/IMPORT_FEATURE.md
README.md
package.json                      # matching pinned test dependencies
__tests__/apple-health-import.test.js
__tests__/dashboard-import.test.js
__tests__/visualization-availability.test.js
__tests__/tab-navigation.test.js
__tests__/workout-time-utils.test.js
__tests__/heatmap-utils.test.js
__tests__/dashboard-export-download.test.js
```

**Structure Decision**: Add only two reusable modules and one worker adapter; keep the browser worker client inside the existing import owner. Extend neighboring tests rather than introducing a parallel test hierarchy. Reuse existing ZIP/GPX/power helpers where possible without routing multi-GB Apple XML through JSZip string extraction. The proposed new files above are implementation targets, not files created by this planning command.

## Phase 0: Research Decisions

[research.md](research.md) resolves library loading, bounded streaming, XML safety, source-local timestamps, source identity, sample attribution, route linkage, commit behavior, and verification. Two read-only research agents inspected the import ownership boundary and the versioned library APIs. No unresolved design clarifications remain; browser throughput and actual enrichment yield are implementation measurements.

## Phase 1: Design And Contracts

- [data-model.md](data-model.md): normalized fields, additive source-local timestamp context, separate scalar/time-series attribution needs, explicit mandatory fingerprint evidence, route representation and state transitions.
- [contracts/apple-health-import.md](contracts/apple-health-import.md): archive and worker protocols, resource limits, error/diagnostic contracts, all-view readiness matrix, commit and export invariants.
- [quickstart.md](quickstart.md): phased tests, browser validation, private-export acceptance and required evidence.

Implementation sequence: establish synthetic normalization/streaming tests; implement the injectable pipeline and worker; add the landing action and transaction adapter; apply source-local time and export-generation safeguards; validate every view and source replacement; document import guidance and complete large-export/browser acceptance. Generate actionable tasks only with `/speckit-tasks`.

## Requirement Coverage

| Requirement | Design owner | Acceptance evidence |
| --- | --- | --- |
| FR-001 | Landing action, guide and dashboard-import adapter | Quickstart browser workflow; one-file/cancel/retry tests |
| FR-002 | Streaming archive recognizer and primary-entry validation | Case, nesting, multiple-primary and secondary-clinical cases |
| FR-003 | Explicit normalization whitelist | All supported sports and unsupported-with-distance cases |
| FR-004 | Data-model field mapping and sourceLocalStart | All 17 fields, source time and absent-field cases |
| FR-005 | Typed quantities, summary precedence and flags | Unit, summary/legacy, explicit-zero and unknown-unit cases |
| FR-006 | Second-pass provenance/coverage reducers | Source, overlap, pause, conflicting sample and estimator tests |
| FR-007 | Recorded duration plus separate instant/local context | Two-zone midnight/DST tests and no-double-pause cases |
| FR-008 | Explicit reference resolver and segmented route adapter | Missing/corrupt/shared routes, disconnected geometry and Swim |
| FR-009 | Empty gear/title/power/media defaults | No invented gear, title words, media or power bests |
| FR-010 | Contract readiness matrix and existing availability utility | Actual importer results for all 13 tabs, absent/invalid/zero cases |
| FR-011 | Dataset revision, real filters and navigation fallback | Rich-to-sparse replacement, no-view state and hidden-tab navigation |
| FR-012 | Existing metric controls and generation-bound image export | Every eligible view's filters and PNG preview/download |
| FR-013 | Prepared/committed boundary and safe diagnostics | Fatal-main preservation, optional attachment failures, render warning |
| FR-014 | Worker/network ownership and existing counter helper | Synthetic network observation and unchanged counter body |
| FR-015 | Ignored private inventory plus public compatibility contract | All observed categories assigned; no raw health values in public artifacts |
| FR-016 | Bounded two-pass pipeline, limits and heartbeat | Lazy synthetic plateau plus private large-export acceptance |
| FR-017 | Scoped IDs and canonical identity evidence | Duplicate/conflict/overlapping-session and repeat-import determinism |

## Planning Completion

Phase 0 research and Phase 1 design are complete. All constitution design gates pass; no exception or unresolved clarification remains. Before/after planning extension hooks are absent because .specify/extensions.yml is not present. Actual branch is TriAnalytica-dev-2; setup-plan's BRANCH value names the feature rather than switching Git branches. No production code, runtime dependency, raw export, or task list was changed by this plan.
