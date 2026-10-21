# Implementation Plan: Consistent and Scalable Local Processing

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)
**Input**: `specs/063-scale-local-processing/spec.md`
**Setup note**: setup-plan reports `063-scale-local-processing` as BRANCH because it resolves the active feature identifier. The existing Git branch remains `TriAnalytica-dev-2`; no branch was created.

## Summary

Replace divergent import normalization with one versioned activity contract, then introduce a worker-owned canonical ActivityStore, shared indexed queries and bounded lazy view models. Preserve source-specific failure and recording-ownership rules, current visualizations and local exports. Prove correctness independently before measuring real ZIP/FIT browser workflows on desktop and weaker mobile hardware. No application code is implemented by this plan.

## Technical Context

**Language/Version**: Modern browser JavaScript, classic scripts and CommonJS exports; existing Node/Jest test runtime. No transpilation or frontend build.
**Primary Dependencies**: Existing PapaParse 5.4.1, JSZip 3.10.1, fit-file-parser 1.10.0, native DecompressionStream, Intl and Dedicated Worker APIs; retain current chart/map/export libraries. A validated FIT encoder and browser automation may be introduced as dev-only tooling during implementation.
**Storage**: Session-memory File/Blob source handles, canonical summaries, compact details, indexes and byte-limited caches. No IndexedDB, localStorage workout persistence, uploads or new server store.
**Testing**: Root Jest in node with injected document/worker boundaries; real-browser file-selection and parser harness; independently generated FIT/GPX/ZIP fixtures; real desktop and Pixel 4a acceptance. Existing API suite only if API code changes, which is not planned.
**Target Platform**: Existing static web application on modern desktop and mobile Chromium supporting current import APIs. Record exact OS/browser versions on Intel Core i5-12400 / 16 GB and Pixel 4a / 6 GB. Capability failure is explicit, not a fake successful performance result.
**Project Type**: Static browser application with reusable dual-target utilities, classic DOM orchestration and a classic worker entry point.
**Performance Goals**: p95 summary filters <= 200 ms; p95 visible input response <= 100 ms; no UI blockade > 100 ms. Simple tabs p95 <= 500/1,000 ms, first detail view <= 5/10 s desktop/mobile. Combined 10x import <= 120/300 s and additional peak memory <= 1.5 GiB/512 MiB. These are proposed acceptance budgets, not observed results.
**Constraints**: All workout processing stays local; retain API privacy boundaries, standalone/shared FIT semantics, real parser behavior, route meaning and export flow. Old plus staged datasets and transfer copies count toward peak memory.
**Scale/Scope**: 5k/25k/50k summaries over 2016-2025; 100/500/1,000 two-hour FIT recordings, each 7,200 samples and route points; separate summary/detail and combined scaling; 10x registered-view extensibility without shipping new visualizations.

## Constitution Check

| Principle | Before research | After design | Evidence / obligation |
| --- | --- | --- | --- |
| I. Static Browser-First | PASS | PASS | Classic worker and scripts; no bundler, framework or compilation step. |
| II. Dual-Target Utilities | PASS | PASS | Pure contract/store/query utilities keep CommonJS and window bridges and add worker-safe globalThis exposure. DOM orchestration stays separate. |
| III. Narrow Verification | PASS | PASS | Existing focused Jest suites plus planned contract/lifecycle tests and browser proof; no runtime changes made in planning. Existing exports remain tested. |
| IV. Faithful Parsing | PASS | PASS | German/English headers, duplicate distances and reviewed sport aliases retained; regex GPX retained with explicit segment boundaries. No guessed single-column units. |
| V. Privacy Boundaries | PASS | PASS | No workout payload leaves browser, no persistence, no personal fixtures, analysis API unchanged. CDN/library requests remain disclosed. |
| Dependency Boundaries | PASS | PASS | Browser tooling is root dev-only; no services/api dependency reuse or CLI/runtime coupling. |

No constitutional exception is requested. No new visualization tab is added; all existing Share/Export behavior remains required. If tab wiring changes while adapters migrate, update tab IDs, markup/dispatch and navigation tests together.

## Project Structure

### Documentation (this feature)

```text
specs/063-scale-local-processing/
  spec.md
  checklists/requirements.md
  plan.md
  research.md
  data-model.md
  contracts/activity-data.md
  contracts/query-worker.md
  contracts/validation.md
  quickstart.md
```

tasks.md is deliberately deferred to /speckit-tasks.

### Source Code (repository root)

Planned additions are marked new; paths describe ownership, not generated implementation:

```text
index.html                         script order, scoped filters and quality status
src/
  activity-contract.js             new: profiles, value/time/sport/identity normalization
  activity-store.js                new: canonical ownership, indexes, bounded query reuse
  activity-query.js                new: selections and metric definitions
  activity-worker.js               new: classic worker import/query entry
  activity-client.js               new: request lifecycle and generation guards
  dashboard-utils.js               delegate legacy test-facing normalization
  zip-importer.js                  source adapters, ownership, DOM-free dependency loading
  dashboard-import.js              stage/commit import, quality report
  dashboard-state.js               dataset identity and explicit filter scopes
  dashboard-core.js                query-backed cards and metric adapters
  dashboard-tabs.js                lazy view lifecycle
  visualization-availability.js    capability-only predicates
  dashboard-*.js                  remaining view/export adapters and disposal
  heatmap-utils.js                 shared route work with preserved fidelity
  power-pb-utils.js                exact efficient decimal-sample path
__tests__/                        reuse existing relevant suites; focused core tests as needed
scripts/                          deterministic fixture generator and browser measurement harness
docs/IMPORT_FEATURE.md             updated contract, report and privacy explanation
```

**Structure Decision**: Keep the existing static/classic-script layout. Add only shared data/query and worker boundaries that remove demonstrated duplication. Do not create a parallel app, server or per-view stores. The separate CLI retains its existing contract and is not made a runtime dependency.

## Phase 0 - Research Decisions

[research.md](research.md) records nine decisions with current-code evidence and alternatives: shared normalization; explicit units/value states; calendar/identity rules; source failure ownership; indexed query ownership; worker transaction lifecycle; lazy availability; bounded details/route fidelity; real-workflow measurement.

No design clarification remains unresolved. Unsupported source evidence is handled conservatively by contract. Worker dependency compatibility and device instrumentation are explicit implementation proof gates; they are not represented as completed experiments.

## Phase 1 - Design and Contracts

- [data-model.md](data-model.md): entities, validation, indexes, retention and lifecycle transitions.
- [activity-data contract](contracts/activity-data.md): source profiles, strict measures, identities, dates, quality accounting and legacy adapter semantics.
- [query/worker contract](contracts/query-worker.md): filter algebra, metrics, ownership, requests, cancellation, cache keys and UI commit/export behavior.
- [validation contract](contracts/validation.md): independent oracles, fixed profiles, hardware budgets, instrumentation and release proof gates.
- [quickstart.md](quickstart.md): executable existing checks and manual end-to-end scenarios; future harness responsibilities are clearly distinguished from commands available today.

Post-design constitution review: PASS for architecture and scope. Runtime acceptance remains pending implementation; design PASS does not assert parser compatibility, numerical regression success or 10x performance.

## Implementation Sequence and Proof Gates

1. Establish failing regression cases for real production/helper divergence, unknown All inclusion, null/invalid measures, date/identity boundaries and independent oracle values. Implement shared normalization and delegating wrappers before migrating queries.
2. Prove pinned real FIT/FIT.GZ/ZIP parsing in a classic worker and memory instrumentation on both targets. A failed compatibility or instrumentation proof blocks the corresponding production/performance claim; no hidden fallback or relaxed profile.
3. Add canonical store, indexes, selection algebra and bounded reuse. Measure single queries; retain synchronous pure APIs for tests while orchestration becomes asynchronous through adapters.
4. Stage/commit candidate imports and quality reporting with generation guards, complete reset/dispose and source-specific failure policies. Include active-plus-candidate peak memory and long synchronous parser cancellation.
5. Migrate existing views incrementally to shared selections/metrics, beginning with summary cards and simple views, then detail-heavy PB/heatmap. Reuse focused suites after each slice; no per-view full-history snapshots. Preserve existing user-facing controls, meaningful availability and export results.
6. Eliminate eager model construction, repeated sorts and quadratic decimal power traversal only under independent numerical/route regression checks. Bound detail and model caches; release source handles on disposal.
7. Execute independent correctness fixtures, full real-parser browser matrices, 10x registry proof, 20 reimports/200 switches, existing export regressions and real-device budgets. Publish raw traces and limitations; unmet/unmeasurable gates remain open.

## Verification and Handoff

FR-001 through FR-009 map to the activity-data contract and Story 1; FR-010 through FR-013 map to query/worker lifecycle and Story 2; FR-014 through FR-016 map to resource/fidelity/privacy gates and Story 3. SC-001 through SC-007 are made operational in the validation contract.

Planning validation checks all required sections, local links, requirement coverage and unresolved placeholders. Application suites are required during implementation, not reported as run by this documentation-only command. Next phase: /speckit-tasks.
