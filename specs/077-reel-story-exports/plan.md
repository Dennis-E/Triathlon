# Implementation Plan: Reel / Story Export Layouts

**Branch**: Git remains on `main`; Spec Kit feature context is `077-reel-story-exports`.
**Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

**Input**: [Feature specification](spec.md) and [complete export inventory](export-inventory.md), including the clarified Chrome/Edge desktop acceptance boundary.

## Summary

Add `story` at 1080 x 1920 alongside existing `square` and `portrait` keys and dimensions. Replace fixed landscape capture assumptions with measured, family-specific export layouts rendered from immutable selection snapshots. Keep the existing local PNG preview/download experience, but guard asynchronous work with session and composition revisions so only the latest complete image series can become downloadable.

The feature includes all 13 registered targets, every Personal Best detail definition and power profile, media annual recap/collage, and continuation pages. Future exporters must register the same contracts and enter the acceptance matrix. No new dashboard tab, backend, bundler, dependency, video encoder, or direct-post integration is needed.

## Technical Context

**Language/Version**: Existing modern browser JavaScript, HTML and CSS; CommonJS for reusable utilities and Jest; classic scripts for dashboard orchestration.

**Primary Dependencies**: Reuse the app's existing CDN-loaded Chart.js, html2canvas, Leaflet/map rendering, WordCloud, Lucide, and native Canvas/PNG/browser download facilities. Preserve existing library versions and loading paths; no new runtime dependency.

**Storage**: Browser memory only for captured models, image resources, and prepared PNG blobs; local files for downloads. No personal data persistence or upload is added.

**Testing**: Root Jest 30 in the existing Node environment, VM/injected document and canvas mocks, deterministic deferred promises, actual downloaded PNG inspection in current stable desktop Chrome and Edge, and the specified athlete review. No API-suite changes.

**Target Platform**: Static browser app served by a plain HTTP server; Chrome and Edge desktop are binding browser gates. Test narrow desktop-browser viewports and exported-file readability at 360-pixel width; mobile end-to-end export is not a gate.

**Project Type**: Existing static browser analytics application with separately scoped CLI and API components, both untouched.

**Performance Goals**: Do not add a new unapproved latency SLA. Keep controls responsive between page renders, prepare only the requested format, avoid pre-rendering all formats, and prevent memory growth after close/retry. Record render duration and peak live pages during dense acceptance runs as diagnostic evidence, not invented success thresholds.

**Constraints**: Exactly 1080 x 1920 for story; safe content rectangle `(72,240)-(960,1560)`; essential text at least 36 source pixels and contrast at least 4.5:1; no layout-induced clipping or occlusion; coherent frozen filters; no tooltips/inspection callouts; local processing and existing save/cancel/fallback semantics preserved.

**Scale/Scope**: 13 target keys plus all configured PB detail definitions and two generated media variants. Large histories use measured continuation pages where appropriate; no ten-year slicing or accidental per-format data loss. Existing disclosed top-ranking/media-selection limits may remain. Full dense/sparse, three-format, two-caption-state acceptance coverage is required.

## Constitution Check

*Pre-research evaluation and post-design re-evaluation both pass. These are design compliance checks, not claims that implementation tests have run.*

| Principle / Gate | Before research | After design | Evidence / implementation obligation |
| --- | --- | --- | --- |
| I. Static browser-first | PASS | PASS | Reuse existing scripts/CDN libraries and local Canvas/PNG; plain server still sufficient. |
| II. Dual-target utilities | PASS | PASS | Pure geometry, format, text and pagination helpers remain in `src/export-utils.js` with CommonJS and browser bridge; DOM work remains in dashboard owners. |
| III. Narrow verification | PASS | PASS | Existing export, producer, script-syntax and tab-navigation tests are extended/run per touched slice; actual files receive browser review. |
| Tab/navigation consistency | PASS | PASS | Preserve IDs/order, verify constants, markup and dispatch; no new tab or artificial navigation rename. |
| Export coverage | PASS | PASS | Registry parity test covers all 13 keys; PB definitions and media generators extend the review matrix, including future exporters. |
| IV. Parsing semantics | PASS | PASS | No parser, CSV/GPX unit, supported-sport or import changes; reuse processed data. |
| V. Privacy/network boundaries | PASS | PASS | Allowlisted models exclude incidental activity titles; captured map/media choices remain explicit; no export upload service. |
| Dependency/public API boundaries | PASS | PASS | Root only; preserve existing globals/helper entrypoints and add compatible optional arguments or new adapter methods. |

No constitution exception is required. Human athlete review and full PNG review remain release gates, not tasks that a passing Jest suite can waive.

## Project Structure

### Documentation (this feature)

```text
specs/077-reel-story-exports/
  spec.md
  export-inventory.md
  checklists/requirements.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
    export-contracts.md
  tasks.md                  (later /speckit-tasks output; not generated here)
```

### Source Code (repository root)

```text
index.html                              format control and contained preview
src/export-utils.js                     pure formats, measured geometry, pagination, validation
src/dashboard-export.js                 session/revision ownership, composition, family dispatch, saving
src/dashboard-tooltips.js               reusable isolated Chart.js capture without selection overlays
src/dashboard-core.js                   distance selection adapter
src/dashboard-scatter.js                frozen scatter data/visibility/encodings
src/dashboard-equipment.js              ranking/timeline adapters
src/dashboard-power-pb.js               detail and overview record models
src/dashboard-heatmap.js                isolated selected map capture
src/dashboard-distributions.js          selected distribution result adapter
src/dashboard-workout-time.js           selected temporal-pattern result adapter
src/dashboard-training-calendar.js      calendar date/scale/coverage adapter
src/dashboard-wordcloud.js              frozen word weights and isolated tall render
src/dashboard-pie-charts.js             frozen slices and export legend/label renderer
src/dashboard-lifetime-statistics.js    summary adapter and vertical export markup
src/dashboard-media.js                  prepared media model, layout and resource ownership
__tests__/export-utils.test.js
__tests__/dashboard-export-download.test.js
__tests__/dashboard-media.test.js
__tests__/...existing owner tests        extend rather than duplicate suites
```

**Structure Decision**: Extend existing owners and helpers; no new production source file is planned. Keep DOM orchestration local, and add pure family layout planning to the existing export utility rather than a generic chart abstraction. Existing tab/navigation and script-order files are verification surfaces, not mandatory edit surfaces. Update user-facing export documentation in README during implementation.

## Phase 0: Research Decisions

[research.md](research.md) resolves the implementation questions using the current source, not a replacement architecture. Selected decisions: frozen owner-provided models, family-aware layout plans, independent resource leases, immutable option revisions, exact prepared-image saves, no pinned social callouts, and exhaustive real-file review. No research clarification remains unresolved.

## Phase 1: Design

### Shared composition and lifecycle

1. Reconcile capture targets, display/filename mappings, available export actions and adapter registry. Include registered PB overview without adding a new UI action. Missing renderer/format coverage is an error, not a silent screenshot fallback.
2. Before the first asynchronous boundary, capture allowlisted data and options into an `ExportSelectionSnapshot`; use epoch milliseconds for temporal records and local date keys for calendar days. Never use live DOM text as the authoritative metric/period or JSON-convert Dates then expect `instanceof Date`.
3. Measure real text and reserve headline/context, provenance/attribution, one optional caption, complete legend, and branding within the format's content area. Story uses only the 888 x 1320 safe rectangle for essential content. Derive family bounds and page capacity from the remaining space. Keep square/portrait dimensions and keys, with measured reflow and the same readability requirement.
4. Render with final source-image typography; never scale a 36-pixel label below 36 pixels. Reuse Chart.js for charts, existing map/wordcloud engines, PB SVG construction, and export-specific DOM markup where suitable. `html2canvas` captures prepared export content, not an unchanged desktop-shaped layout.
5. Session creation/close changes `sessionId`; each format/caption request captures a new `compositionRevision` and immutable options. Compute all pages into a local candidate series, validate PNG header and decoded dimensions, then publish atomically only if session/revision still match. No intermediate old or partial series is downloadable.
6. Ready-page selection is synchronous, increases `viewRevision`, and changes the approved image. Recomposition disables page navigation and download, resetting to page 1 on successful new pagination. Close invalidates work synchronously; stale success/error/finally cannot mutate a new session.
7. Download captures the approved image, blob, filename, page and PB opening token before awaiting the picker. A started save remains bound to those bytes, even if a later preview changes. Save completion affects UI only if its originating approval remains current. Derive enablement from readiness plus the active-save lock.
8. Every capture/render request owns its temporary resources; stable media sources remain available until no pending renderer consumes them. Logical invalidation is immediate, physical release waits for active consumers. Release is idempotent and exception-safe; an old finalizer cannot release a newer session's resources.
9. Retry uses the same captured selection and selectionId. If the snapshot or its required sources are unavailable, explain the failure and keep download blocked; only an explicit new export request starts a new sessionId/selectionId using current dashboard data. No retry path may silently recapture a changed dataset or filter selection.

### Family implementation matrix

| Target / variant | Owner and design | Essential preservation / dense strategy |
| --- | --- | --- |
| `totalDistance` | Extend `getTotalDistanceExportData` and `drawDistanceExportChart`; remove arbitrary last-ten-year slicing. | Full selected periods, stacks, aggregation and partial dates; chronological pages share value scale and clearly state interval scope. |
| `paceMetrics` | Freeze owner data, visible years/trends, point-size normalization and axes; rerender an isolated Chart.js chart at planned dimensions. | Reverse pace versus speed, observations and legends retained. Keep a meaningful plot aspect rather than stretching a bitmap; no point-dropping pagination. Extra height can separate legend/context from plotting. |
| `equipment` | Reuse ranking data; measured rows put long names above bar/value when needed. | Metric-aware copy, ties, actual order and units; disclose any retained Top N of M scope. |
| `equipmentTimeline` | Freeze date epochs, mode and per-item activities; measured rows and continuation pages. | Draw actual activity markers in activity mode, not usage spans; shared time extent, accurate gaps and dates. |
| `personalBests` | Add overview model collection from existing record producers; separate detail chronology and power-profile layout branches. | Every configured distance, longest/elevation definition, power duration and profile; full record models, duration axes/source fields, no incidental titles or false improvement claims. Overview groups records vertically over pages. |
| `heatmap` | Freeze selected projected viewport, palette/frequency meaning and route layer; capture an isolated export surface after its tiles/layers are ready. | Preserve selected geographic extent and proportions. A differently shaped image cannot also retain identical zoom and fill; retain the selected extent, with a proportional map window and useful surrounding context rather than cropping or enlarging extent. |
| `distributions` | Expose computed selected bins/series and frozen chart options; rerender with measured labels/legend. | Keep current bin edges, frequencies, special bins and visible series; no new binning or aggregation for format. |
| `workoutTime` | Expose current built dataset and view semantics; family-specific bar/group geometry. | Preserve count/time/distance, null versus zero and granularity; year mode is a monthly pattern, not a chronology of calendar years. Split only meaningful groups with common scales if needed. |
| `trainingCalendar` | Reuse day/date utilities; render vertical month blocks with measured year/month continuation pages. | Preserve weekday/leap-year alignment, coverage, metric/intensity scale and palette. Do not retain 53 unreadably narrow columns or recompute scale per export page. |
| `wordcloud` | Expose included terms/counts/weight function and render isolated tall wordcloud canvases. | Preserve included term set and global relative weighting. Confirm all terms placed; if necessary use explicit subset pages with common weighting, not silent engine shrink/drop. Do not invoke a global stop that cancels dashboard rendering. |
| `pieCharts` | Freeze `currentPieResult`; parameterize isolated chart and percentage plugin; put full legend below circular chart. | Preserve existing slices/Other grouping and measure; legend continuations repeat the full chart with unchanged denominator and clear legend scope. |
| `lifetimeStatistics` | Expose aggregated summary/country status; extend existing export-only markup into vertical KPI/milestone groups. | Retain currently exported fields, missing status and units; allow group continuation, do not add the omitted sport table or private activity titles. |
| `mediaGallery` annual/collage | Store the prepared variant, selected readable assets, order, filters, route choice and source lease; render annual chronology or collage grid vertically. | Preserve the same selected set after every option change, disclose N of M and existing limit, retain video stills and route opt-in; paginate rather than shrink all media into tiny thumbnails. |

### Data and UI contracts

[data-model.md](data-model.md) defines selection, geometry, series, revision, approval and resource records and transitions. [contracts/export-contracts.md](contracts/export-contracts.md) defines the backward-compatible owner boundary, new `story` key, UI/state rules, family semantics, source isolation, privacy and future-export registration. No external API endpoints are added.

### Verification and delivery order

Implement in testable slices: pure format/geometry planning; coherent owner models and isolated renders; revision-safe preview/save orchestration; family composition and continuation; full inventory/browser review. Define focused tests before or alongside each slice, and run them immediately after that slice. Do not complete only the three existing specialized drawers and declare full coverage.

Before image review, setup task T002 must prepare browser-importable synthetic files under `__tests__/fixtures/reel-story-exports/`, with deterministic regeneration/import recipes in its README and expected values, filters, units, dates, scales, selected-media scope and provenance in `expected-values.json`. Prove every recipe can be imported, cover all variants and sparse/dense cases, and map each review-matrix case to its fixture and reference values. Missing or non-importable fixtures block preliminary and final browser-image reviews; Node-only mocks do not satisfy this gate. These are future implementation artifacts, not files claimed to exist during planning.

- Pure checks: dimensions, safe-area containment, measured text, contrast, pagination completeness, semantic scales, caption removal, provenance and registry parity; layout-induced occlusion is forbidden, but naturally coincident data marks must retain their true positions and values.
- Owner checks: frozen filters/visibility, no fallback all-time metadata, no mutation of dashboard, date/units and dense/sparse family rules.
- VM checks: adversarial completion order, pending download lock even on direct handler calls, page approval, close/reopen, stale errors, save cancellation and exact-byte binding, independent media leases, retry retaining its original selectionId after dataset/filter changes, and blocked unavailable snapshots until an explicit new export creates fresh session/selection identities.
- Compatibility checks: unchanged tab IDs/order/dispatch, classic-script globals and load order, existing square/portrait and PB/save-flow regression tests.
- Browser/release checks: actual files in Chrome and Edge, all target/detail/generated variants, sparse/dense, all formats, humour on/off, full-resolution and 360-pixel-wide whole-image review, provenance/privacy and first/middle/last continuation pages. Five-athlete SC-007 evaluation remains a separate human gate.

Runnable commands and evidence rules are in [quickstart.md](quickstart.md). A new source helper is unnecessary; if later implementation discovers one is unavoidable, document its responsibility and script-order contract instead of adding it speculatively.

## Complexity Tracking

No constitution violations or justified exceptions. Complexity is limited to existing family boundaries, measured pure planning, and the minimum session/revision ownership needed for asynchronous correctness.
