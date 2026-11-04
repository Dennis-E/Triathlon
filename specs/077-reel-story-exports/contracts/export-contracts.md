# Export Contracts

**Applies to**: All current and future TriAnalytica image exporters.
**References**: [spec.md](../spec.md), [data-model.md](../data-model.md), [export-inventory.md](../export-inventory.md).
**Interface type**: Browser UI and in-process module contracts; no HTTP API is introduced.

## 1. Format and UI Contract

| Key | Visible label | PNG dimensions |
| --- | --- | --- |
| square | Square · 1:1 | 1080 x 1080 |
| portrait | Feed portrait · 4:5 | 1080 x 1350 |
| story | Reel / Story · 9:16 | 1080 x 1920 |

Preserve `setExportFormat(format)`, `setExportHumorEnabled(enabled)`, `setExportSeriesPage(direction)`, `exportVisualizationTab(tabName)`, `exportActivePbDetail()`, preview close and download entrypoints. Add a story selector alongside existing square/portrait selectors; preserve existing IDs, introduce a distinct story control, and keep selected/pressed states accessible. Unsupported formats are explicit errors.

The initial format remains square; humour starts off. Controls remain keyboard operable with a labelled native caption checkbox and clearly communicated loading/error states. Pending generation disables download and page controls, including at the underlying handler boundary. The preview contains the entire image using intrinsic-ratio containment and bounded dimensions; controls must remain reachable at narrow desktop-browser viewports. No preview crop is allowed.

No tab is added, renamed or reordered. Keep tab IDs, tab-order constants, markup and dashboard dispatch consistent. Newly registered exporters require format/caption coverage and a release-review entry in the same change.

## 2. Owner Adapter Contract

Use a private `EXPORT_ADAPTERS` mapping in the existing export orchestrator to normalize current owner APIs; do not remove or rename their public methods. Each descriptor provides equivalent operations:

- `captureSelection`: synchronously copies the selected semantic data and privacy choices into a validated plain snapshot and acquires any independent resource ownership needed before asynchronous preparation. Owners may expose compatible new getters instead of a uniform public method name.
- `renderPage`: consumes only snapshot, frozen request options, measured page plan and request-owned resources; resolves an isolated canvas/image or export DOM capture at planned resolution. It does not read current filters, active detail models, mutable plugin data or gallery selection.
- Readiness and validation: report no-data/not-ready states, required units/axes/period metadata, family variants and supported formats. There is no generic contain-fit fallback for missing story support.
- Cleanup: destroy temporary chart/map/wordcloud/DOM resources after consumption; preserve session-owned reusable sources until all dependent requests finish. Error paths must be exception-safe.

Registry keys must match all 13 capture targets and export title/filename mappings. PB detail dispatch identifies every current record definition/profile; registered PB overview uses its own group snapshot. Media kind distinguishes annual from collage even though both enter `mediaGallery`. Tests derive current definitions from source constants instead of freezing a partial exemplar list.

`src/export-utils.js` stays DOM-free. Extend the existing format/layout helpers compatibly and add pure measured page planning, such as `planExportPages(snapshot, options, measurements)`, within its current CommonJS/browser bridge. Use injected text measurement. Existing callers of `computeSocialExportLayout` and format getters must continue to work.

For chart snapshots, extend existing isolated capture with frozen chart inputs and an explicit inspection-disabled path. No default parameter or callback may silently call live pinned selection or live data owners. Reuse Chart.js for supported charts rather than reimplementing chart rules.

## 3. Geometry, Semantics and Continuation Contract

- Story essential bounds are exactly x=72..960 and y=240..1560. Background may bleed; essential chart content, labels, units, legends, captions, provenance, attribution and branding may not.
- Measure real text before pagination. Source-image essential text is at least 36 pixels after all scaling; text contrast is at least 4.5:1. Caption off allocates zero caption height; on provides exactly one measured short line for every family/filter combination.
- Preserve existing data calculations, scales and relationships. Solve layout-induced collisions with spacing, text reflow, independent legend/context placement and appropriate continuation, not metric/axis alterations, missing points, inflated sparse marks or artificial insight copy. Natural overlap between faithfully positioned data marks is allowed and is not a layout failure; do not shift, alter or remove observations to separate those marks.
- Time-series continuations preserve full selection and common value scales. Timeline rows preserve global time extent and actual event/span mode. Sparse time content remains truthful; long histories do not silently lose years.
- Scatter preserves all selected observations, visibility, reverse pace, units, trends and size encoding in a meaningful plot aspect; dense points are not silently sampled away. Distribution bins are frozen; temporal pattern grouping remains the selected grouping.
- Calendar months may form vertical blocks and continuation pages; day/date positions, leap days, missing coverage and original intensity meaning remain explicit. Do not equate unavailable dates with confirmed inactivity.
- PB history and duration profile are separate axis modes, both with full data and relevant source attribution. Do not fabricate improvement summaries for profiles or one-record histories.
- Maps preserve the selected projected extent and proportions in an appropriate map region. Do not crop routes or expand the extent to fill story; reserve useful surrounding space for actual context/legend/attribution rather than a blank tall canvas.
- Wordcloud layout uses exactly the frozen included terms and global weighting. Account for all placements; any continuation identifies subset scope while retaining common weight normalization.
- Pie legend continuation repeats the complete circle and unchanged percentages, labels the legend subset/page, and covers all entries without silent aggregation.
- KPI summaries retain current export scope and missing-value meaning. Media continuations preserve frozen selected assets, chronological meaning and explicit route opt-in; existing top/media limits must be visibly scoped.
- Each continuation includes page order/scope, same format/options, branding, provenance and necessary scales/context. Ready series are complete and individually previewable/downloadable with distinguishable filenames. Reformatting recomputes page plans and starts at page 1.

## 4. Snapshot, Revision and Save Contract

The current request identity is `(sessionId, compositionRevision)`. The visible approval additionally identifies `(viewRevision, pageIndex)`. Capture immutable options before awaiting; recheck current ownership before publishing, showing errors, or changing UI after asynchronous work.

1. New session owns one snapshot and independent resources. Format/caption requests change composition revision synchronously, including while capture is pending; they do not recapture live dashboard state.
2. Clear download approval before work starts. A retained old image may not appear ready under new controls. Prepare and validate the entire candidate series locally; only the latest valid revision may publish atomically.
3. During recomposition old page navigation is unavailable. Ready-page changes are synchronous and update approval identity. A direct download invocation must still reject non-ready or mismatched approval.
4. Close invalidates the session synchronously. An old resolve, rejection or finalizer cannot reopen the modal, change a new session's error/state or release a new session's sources.
5. A new export captures current filters/dataset; an existing session remains a coherent snapshot. Do not retarget an in-flight export to whatever chart is now active.
6. Save binds approved image/blob/filename/page/PB opening before its first await and never rerenders the chart. A delayed picker or writer must still use those same bytes. New choices do not rewrite or cancel an already-authorized save implicitly.
7. Save completion clears only its own attempt lock; derive UI state from the current approval/readiness. Only the originating still-current approval can trigger existing close/advance/PB-dialog behaviour.

PNG preparation validates signature/header dimensions, decodability and decoded dimensions against the format. No partial series or nonmatching-sized mock image qualifies as a ready export.

## 5. Failure and Resource Contract

Current generation errors are visible and non-downloadable; obsolete errors are discarded. Retry must use the same captured selection and selectionId, never recapture live dashboard state. If that snapshot or its required sources are unavailable, explain the problem and keep download blocked; only an explicit new export request starts a new sessionId and selectionId using current data. No-data/not-ready feedback must not substitute old content. Cancelling save does not claim success or trigger a fallback download.

Preserve existing picker semantics: unavailable/failed picker uses an explained browser-default download; picker `AbortError` cancels; post-selection permission denial attempts writable abort and warns before an exact-image fallback; other write errors remain failures rather than silently double-saving. Tests retain existing behaviour and exact image bytes.

Media source leases are independent of active import/gallery lifetime. Release is idempotent and request-local; source disposal waits for active consumers, including those finishing after invalidation. Partial construction/preparation failures clean up acquired resources. A save's encoded blob survives source disposal. Map readiness and image decoding refer to isolated captured content, not a different live view.

## 6. Content and Privacy Contract

Build export snapshots/presentation from allowlisted fields. No incidental activity titles in PB/lifetime milestones, filenames in generic copy, new precise location labels, inspector content or pinned/hover overlays. Existing explicitly selected wordcloud terms, map content and opted-in media routes retain their intended scope without new disclosures.

Every synthetic-data image, including continuations, displays `Synthetic sample training data`. Preserve necessary map/source attribution inside the safe area at readable size. Headlines/context/captions must use actual selection facts; prefer neutral metric-specific titles over unsupported all-time, improvement, mileage or record claims.

Export processing remains local in the browser; this is not a no-network guarantee for the whole application. Existing CDN/map dependencies are unchanged. Review uses synthetic or explicitly authorized local fixtures, never committed personal exports or uploaded export images.

## 7. Requirement Traceability and Acceptance

| Specification | Contract / design evidence |
| --- | --- |
| FR-001, FR-003 | Complete owner registry, inventory parity, configured-detail/media variant discovery and mandatory future-review entries. |
| FR-002 | Format table, fixed PNG/header/decode dimensions and retained existing keys. |
| FR-004 through FR-010 | Measured reading order, safe bounds, final text/contrast, isolated family rendering and collision/continuation rules. |
| FR-011 through FR-022 | All 13 family paths in the plan and their semantic rules above; PB detail/overview and media kinds remain distinct. |
| FR-023 through FR-026 | Immutable allowlisted selection, factual copy, privacy choices and per-page provenance/attribution. |
| FR-027 | Universal one-line caption toggle, default off and zero reserved height when disabled. |
| FR-028 | Browser-only data/image processing and separate existing asset-network boundary. |
| FR-029 | Full-image preview and current stable Chrome/Edge desktop acceptance, narrow viewport and phone-file checks. |
| FR-030, FR-031 | Latest-revision approval, pending locks, exact prepared blob saves and guarded completion. |
| FR-032 | Complete ordered series, consistent context/scales/options, unique filenames and format-aware page reset. |
| FR-033 | Readiness, invalidation, retry, cleanup and no obsolete/partial image approval. |
| SC-001 through SC-006 | Automated model/state tests plus actual downloaded-file matrix in both desktop browsers. |
| SC-007 | Human athlete review in the quickstart; cannot be replaced by software assertions or skipped without changing the spec. |

Design-contract compliance is not release acceptance. Follow [quickstart.md](../quickstart.md) for executable checks and actual-file evidence; unfinished/failed/missing review cases remain release blockers.