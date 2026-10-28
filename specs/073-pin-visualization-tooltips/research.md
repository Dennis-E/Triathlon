# Research: Pin Visualization Tooltips and Include Them in Exports

## Phase 0 Gate

The initial constitution review passed before research: static delivery, dual-target utilities, scoped verification, unchanged parsing, and local activity-data handling are compatible with this feature. Research was split into read-only visualization-adapter and export-pipeline investigations. All technical unknowns below are resolved; no product clarification is required.

## 1. Shared State, Renderer-Specific Selection

**Decision**: Add `src/tooltip-selection-utils.js` for pure transitions, copied content, context validation, and placement; expose CommonJS and `window.tooltipSelectionUtils`. Add `src/dashboard-tooltips.js` for an injected-document-friendly HTML overlay and adapter registry. Preserve existing unpinned hover behavior, while suppressing transient detail presentation when a pin owns the view.

**Rationale**: Chart.js canvases, Leaflet route canvases, SVG personal bests, and DOM cards cannot share native tooltip persistence. A normalized content model supplies accessible pinned detail and exactly one export annotation without duplicating analytical calculations.

**Alternatives considered**: Separate pinned flags in every renderer duplicate lifecycle logic. Persisting native Chart.js tooltips alone excludes the other renderers and does not provide keyboard interaction or portable export detail. Scraping tooltip HTML loses truncated content and may copy controls.

## 2. Concrete Adapter Coverage

**Decision**: Implement and verify the following complete registry, retaining existing formatted content. References are repository-relative ownership anchors, not proposed replacements for existing modules.

| View | Existing owner and detail | Selection strategy / special case |
| --- | --- | --- |
| totalDistance | `src/dashboard-core.js`, `buildTrainingChart`; period, sports, distance, total footer | Chart.js hit and formatted tooltip model; legend visibility invalidates selection. |
| paceMetrics | `src/dashboard-scatter.js`, `renderPaceMetricsChart`; activity and metric details | Distinguish activity bubbles and regression tooltip targets. |
| equipment | `src/dashboard-equipment.js`, `renderEquipmentChart`; name and formatted metric | Use display values, never convert relative bar lengths into pace. |
| equipmentTimeline | `src/dashboard-equipment.js`, continuous and activity timeline renderers | Exclude spacer datasets; align hit areas with custom rectangles even when point radius is zero. |
| personalBests | `src/dashboard-power-pb.js`, overview/detail SVG renderers | Focusable SVG targets; preserve rank, estimated/source notes and unavailable values; support existing detail dialog. |
| heatmap | `src/dashboard-heatmap.js`, `RouteCanvasLayer`, `showHeatmapActivityTooltip` | Reuse screen-segment hit test, reject drag gestures; store geographic anchor and selected sample. |
| distributions | `src/dashboard-distributions.js`, `renderDistributionsChart` | Capture native formatted title and all grouped series; legend changes invalidate. |
| workoutTime | `src/dashboard-workout-time.js`, `renderWorkoutTimeChart` | Existing group labels and workout counts. |
| trainingCalendar | `src/dashboard-training-calendar.js`, cell buttons and tooltip | Date-key identity; reuse focusable buttons and complete activity list. |
| wordcloud | `src/dashboard-wordcloud.js`, `updateCloud` | Add word/count tooltip using Wordcloud2 hit callbacks and existing word list; count from ranked words, not shrink-to-fit callback weight. |
| pieCharts | `src/dashboard-pie-charts.js`, `renderPieCharts` | Reuse slice label, formatted measure, percentage and activity count; enhance legend selection accessibility. |
| lifetimeStatistics | `src/dashboard-lifetime-statistics.js`, `renderLifetimeStatistics` | Add item selection to KPI, sport row and milestone content; include coverage and missing-value notes. |
| mediaGallery | `src/dashboard-media.js`, `renderMediaGallery` | Separate per-item pin action from media opening and collage checkbox; use asset key and existing descriptive/activity information. |

**Rationale**: Word cloud, lifetime statistics, and media gallery currently lack data tooltips but are explicitly in scope. All thirteen views already have capture mappings in `src/dashboard-export.js`.

**Alternatives considered**: Exempting non-chart views violates FR-001. Replacing media opening with pinning violates FR-014.

## 3. Keyboard, Touch, and Context Ownership

**Decision**: Chart/canvas adapters provide a focusable inspection entry with a roving active item and an equivalent item description/activation surface. DOM and SVG targets use native activation where available. Arrow keys move the active inspection item; Enter/Space selects; Escape releases a pin before closing a containing detail dialog. Exclude inspection-owned events from dashboard arrow navigation. Touch selects by tap, never hover emulation.

**Rationale**: `src/dashboard-tabs.js` already handles arrows in capture phase, and the global Escape handler in `index.html` closes PB details. Both must explicitly respect inspection ownership. A captioned dismiss button and non-color pin marker make selected state perceivable.

**Decision**: Clear before commits that change data context using `advanceDashboardRevision`, `setVisualizationTab`, `goToLanding`, and `applyImportedDataset` plus explicit adapter invalidation for setters, legend toggles, word exclusions, and media filters/selection. Do not equate every redraw with a data change. Resize and map movement update anchor projection only.

**Alternatives considered**: Global outside-click dismissal breaks activation of Share/Export. Clearing on every render breaks resize and pan persistence. Dashboard revision alone misses some existing controls.

## 4. Request-Time Export Isolation

**Decision**: Before the first asynchronous boundary, copy target metadata deeply, context revision, palette, complete pinned model, geometry, and a private capture source. Copy DOM/SVG, dimensions, image sources, transforms, and canvas pixels explicitly; ordinary DOM cloning does not copy canvas pixels. Capture only that layout-capable private source and never hide/restore live pins.

**Rationale**: `exportVisualizationTarget` currently waits for chart settling (one animation frame plus 350 ms), assets, and html2canvas before capturing live content. Metadata alone cannot satisfy FR-008. The calendar's live hide/restore path can resurrect stale details and must be replaced with export-local exclusion.

**Decision**: Chart.js adapters synchronously snapshot plain chart data, presentation, dataset visibility and resolved formatting into a tooltip-disabled export recipe. Rebuild only into private canvases; do not retain callbacks dependent on live globals. Copy already tooltip-free canvas layers directly where valid. Bind pending Wordcloud rendering to the request's generation; if that generation has no recoverable source, fail rather than adopting a subsequent render. Leaflet captures current tile sources/transforms and route pixels; no new map service is introduced.

**Alternatives considered**: Bitmap copying alone can bake transient Chart.js tooltips into no-pin exports. Temporarily clearing the live chart tooltip risks visible changes and selection races. Waiting and then taking the latest render violates request-time identity.

## 5. Annotation Layout and Immutable Result

**Decision**: Extend existing `computeExportContentLayout` and `drawExportComposition` to reserve a measured annotation region inside the current 1080 x 1080 output. Wrap full content with a minimum 18-pixel export annotation font; protect title, filter context, legend, and branding. If full content cannot fit legibly, use a compact headline-only annotation, falling back to the existing item/group label when there is no title. Wrap the complete retained headline; fail for fit only when even that compact version cannot be rendered readably. Keep all original content in the live tooltip and request snapshot. Use a matching selected-item marker where visible. For off-screen map items or DOM items absent from specialized export summaries/collages, label the item explicitly without a false anchor.

**Rationale**: The user clarified on 2026-10-28 that oversized tooltips should be compacted, for example to their headline, rather than rejected solely because full detail is too long. This preserves existing output dimensions and selected-item identity while keeping complete detail in the live view. SC-003 requires successful headline fallback for long multi-row fixtures. Media collages currently select at most twelve readable assets and lifetime export omits the sport table, so anchor absence is a real case.

**Decision**: Freeze the request description deeply. Keep using `prepareExportImage` to decode/validate the one generated PNG and publish a single data URL/Blob for preview and download. Retain existing preview ownership, native picker, fallback, cancellation, and failure semantics. Clean up staging sources on every exit without writing old state back to live selection.

**Alternatives considered**: Shrinking arbitrarily long text defeats readability. Expanding image formats changes existing export behavior. Re-rendering on download breaks preview parity.

## 6. Dependencies, Wiring, and Verification

**Decision**: Reuse existing Chart.js (currently unversioned CDN URL), html2canvas 1.4.1, Wordcloud2 1.2.3, Leaflet 1.9.4 and Jest ^30.4.2; add no package or service dependency. Load the utility before `export-utils.js`, and the orchestrator immediately after `dashboard-state.js`, before `dashboard-core.js`. Update the script-order contract and exact-order tests in the implementation phase.

**Rationale**: The repository is a static classic-script app. Utility tests use CommonJS; DOM orchestration tests already use VM/injected stubs in Jest's Node environment. Browser checks are additionally required for canvas/tile pixels, touch and visual clipping.

**Alternatives considered**: A bundler, framework rewrite, new tooltip library, or backend annotations would add unrelated architecture and privacy risk. Pinning the existing Chart.js CDN version is separate dependency maintenance, not required by this plan.

**Verification decision**: Add only two shared focused test files for utility and orchestrator; extend existing renderer, export, lifecycle and script-wiring suites. Use deferred assets/render promises to mutate pin, filters, dataset and map after request time; assert original preview/download and unchanged live state. Cover all thirteen registry entries. Validate at 360- and 1440-pixel viewports with synthetic data, and inspect actual downloaded PNGs. No personal exports or raw activity files enter version control.

## 7. Replanning: Export-Owned Media Sources

**Decision**: Add an additive `acquireExportSources(assetKeys)` capability to the browser media library created by `extractMediaFromZip` in `src/zip-importer.js`. Acquire it synchronously before the export request's first await. It returns an independent source lease containing copied item metadata, retained ready Blob/pixel sources or captured reader functions/read promises, and idempotent cleanup. It must not depend on later `asset.readContent`, `library.getObjectUrl`, or the library's live URL cache. File reads may finish asynchronously, but their independent ownership must already exist when the request is accepted.

**Rationale**: The library currently creates temporary Blobs in `getObjectUrl`, keeps at most 48 live cached URLs, and revokes them on eviction/release. `release` also nulls asset readers; `applyImportedDataset` clears the gallery and calls it before installing replacement data. Assets expose a reader rather than a persistent Blob. Merely copying an old URL or adding an asynchronous getBlob call at capture time does not preserve FR-008. Capturing the existing reader closure before release retains access to the selected ZIP entry without delaying normal library release.

**Decision**: Create request-owned URLs from retained/resolved Blobs; never reuse live cache URLs as the private export source. Copy already decoded pixels synchronously where available. Keep each displayed video JPEG data URL or existing fallback as captured instead of regenerating its thumbnail from a released video URL. Release only this request's URLs/bitmaps/retained readers after PNG readiness, failure or cancellation; cleanup is idempotent and never revokes replacement-dataset resources. An import changes live selection but cannot release an accepted request's source lease.

**Alternatives considered**: Keeping the whole old library alive indefinitely prevents normal cache/resource cleanup. Copying URL strings cannot survive revocation. Reading `asset.readContent` after await fails after import release. Regenerating video thumbnails can change the request-time image. New permanent media storage or a new runtime dependency is unnecessary.

**Verification decision**: Extend existing ZIP importer, dashboard import, media, and export suites. Construct a real synthetic media library via `extractMediaFromZip`; mock only URL creation/revocation with a validity registry. Pause export, apply a replacement import through the existing import owner, and assert live URLs are revoked and old asset readers cleared while the request's own source remains usable. Make capture fail on a revoked source so the test cannot pass with a metadata-only clone. Resolve the request and verify original image/context/thumbnail and identical PNG preview/download. Repeat for success, failure and cancellation, checking exactly-once cleanup and no revocation of replacement resources.

## 8. Replanning: Governance and Story Dependencies

**Decision**: Apply constitution 1.1.1: verify all tab wiring and relevant tests for this behavior-only change, retaining existing IDs/order. Synchronize the Agent Guide with that rule; no tab is added or renamed. Both the pre-research and post-design gates use this version.

**Decision**: US3 lifecycle contract tests and independent reset work may start after their foundation/US1 prerequisites, but US3 completion and its export/no-data acceptance depend on US2. Show that dependency explicitly in the existing task graph while retaining the current 51 task IDs and their completion state.

**Rationale**: The approved governance clarification resolves C1 without artificial ID churn; the explicit export dependency resolves I1 without preventing early independent tests. Export-owned source acquisition and its release-race test resolve U1 at the design level. Implementation remains a later phase.

**Alternatives considered**: Hiding the dependency in prose leaves graph-based execution incomplete. Regenerating all tasks would create needless ID churn. Reopening unrelated architecture or changing the approved headline fallback is not required.