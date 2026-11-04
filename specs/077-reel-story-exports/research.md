# Research: Reel / Story Export Layouts

**Date**: 2026-11-03
**Inputs**: [spec.md](spec.md), [export-inventory.md](export-inventory.md), existing producers and export tests.
**Method**: Two bounded read-only source investigations: family/adapter coverage and asynchronous state/resource/test contracts. No runtime code was changed and no implementation/browser acceptance was performed in this phase.

## 1. Extend the existing local export stack

**Decision**: Keep format/geometry in `src/export-utils.js`, DOM orchestration/composition in `src/dashboard-export.js`, and visualization knowledge in its existing dashboard owner. Add no production module or dependency by default.

**Rationale**: The app already has 13 capture targets, specialized drawers, injected Chart.js capture, PB SVG, export-only lifetime/media markup, map capture and PNG save handling. These existing responsibilities are useful, but not a universal fixed layout.

**Alternatives considered**: New renderer framework or server-side export would increase integration/privacy complexity; one tall desktop screenshot would not meet FR-005. Merely adding a format constant misses hardcoded capture lists and page capacities.

**Evidence**: `EXPORT_CAPTURE_TARGET_IDS`, `drawSpecializedExportVisualization`, `drawExportComposition`, `getExportTargetPages`, `exportVisualizationTarget`; existing square/portrait entries in `EXPORT_FORMATS`.

## 2. Capture semantic models, not late live metadata

**Decision**: Owners expose allowlisted immutable export models. Existing adapter names remain available; add compatible methods/optional arguments for missing families. Include axes, visible series, actual period/units, aggregation, provenance and permitted disclosures. Use date epochs and local calendar date keys.

**Rationale**: Several targets currently infer context from button text or dataset-wide dates. JSON snapshotting turns timeline Dates into strings while its drawer expects Dates. PB detail metadata omits duration-axis/source fields needed for power profiles; overview must not reuse a randomly active detail.

**Alternatives considered**: Re-read dashboard state during every format change risks mixed snapshots. Serialize entire activity objects risks private title/location disclosure and unnecessary memory. DOM-only context is not authoritative data.

**Evidence**: `getExportPresentationData`, `getExportContext`, `getActivePbExportData`, `getTotalDistanceExportData`, `getEquipmentTimelineExportData`, `renderDistributionsChart`, `renderWorkoutTimeChart`, `currentPieResult`.

## 3. Measure within the safe area and render each family deliberately

**Decision**: Reserve actual text/legend/branding/provenance/caption geometry first, then select family geometry and page ranges. Story essential content fits 888 x 1320 source pixels at x=72..960, y=240..1560. Render essential text at final output size, minimum 36 pixels; shorter formats reflow instead of shrinking.

**Rationale**: Existing 48-pixel margins and 24/30-pixel text cannot establish the new phone contract. Fixed five/seven-row capacities, horizontal pie layout and fixed 960 x 500 chart captures waste story space. Final contain-fit can reduce even a correctly sized source label below the minimum.

**Alternatives considered**: One fixed chart rectangle ignores maps, calendars and summaries. Scaling a bitmap taller distorts data. A universal occupancy percentage penalizes truthful sparse maps or single-record charts; require family-specific visual justification instead.

## 4. Preserve semantics under reflow and continuation

**Decision**: Keep global value scales for comparative time/ranking continuations, the same calendar intensity meaning, unchanged pie denominators, and wordcloud weight normalization. Keep scatter observations and trend semantics in one plot; use height for its context/legend rather than point-dropping pages. Remove silent distance history truncation.

**Rationale**: Timeline activity mode currently needs genuine activity-marker drawing. Calendar colour meaning can differ between dashboard and export; resolve from the selected semantic model, not a convenient export-wide recalculation. Workout Time year mode describes a monthly pattern, not separate calendar-year bars.

**Alternatives considered**: Per-page rescaling, new distribution bins, pie percentage renormalization and silent word placement failure change the message. Preserve deliberate existing source-level Other/top subsets only with scope disclosure.

**Evidence**: `drawDistanceExportChart`, `drawEquipmentTimeline`, `getTrainingCalendarExportData`, `buildWorkoutTimeDataset`, `piePercentageLabelPlugin`, wordcloud `updateCloud` and placement readiness.

## 5. Treat maps and media as independently owned resources

**Decision**: Preserve the selected projected map extent in a proportional map window and wait for isolated capture assets. Freeze prepared media selection before awaiting rendering; retain independent decoded sources or leases until all consumers finish. Close invalidates publication immediately but does not revoke sources still in use.

**Rationale**: A different map aspect cannot simultaneously keep exact bounds, exact zoom and fill all pixels. Preserve geographic story rather than silently refit to all routes. Existing media-source leases already defend import/session replacement races and should be reused.

**Alternatives considered**: Resize the live map or read current gallery selection during recompose mutates or mixes user state. Immediate URL revocation on invalidation can corrupt in-flight renders. Unlimited retention leaks memory.

**Evidence**: `getHeatmapExportData`, `captureAtExportSize`, `createMediaExport`, `acquireMediaExportCapture`, `createMediaExportCapture`, ZIP media source leases.

## 6. Publish only the latest fully prepared revision

**Decision**: Use session, composition and view identities in the existing orchestrator. Read options once per revision, prepare a candidate series locally, check current identity before publication/error/UI mutation, and publish atomically. During pending work block direct download and old-page navigation.

**Rationale**: Current `composeCurrentExportImages` reads mutable global options while awaiting page preparation and has no stale-publication guard. Close clears globals but does not invalidate in-flight work. A ready image must identify the approved current request, not merely be the last nonempty blob.

**Alternatives considered**: Disable only visible buttons leaves direct calls and delayed completion unsafe. Debounce does not establish correctness. Abort alone is unreliable for canvas/image work; identity checks are the correctness boundary even where cancellation is available.

## 7. Save exactly the approved bytes

**Decision**: Preserve the existing save-attempt image binding, picker cancellation, write-error handling and explained fallback. Extend approval checks and completion guards, and validate both PNG and decoded dimensions against the requested format. Save filename/page/PB opening are captured before awaiting.

**Rationale**: `downloadExportedImage` already captures `image` and writes `image.blob`; replacing this with re-render-on-download would break parity. Its unconditional final button enablement must be derived from current state instead.

**Alternatives considered**: Download current mutable state after a delayed picker can save a different page. Rejecting a valid already-started save because a newer preview exists would surprise users; keep its bytes but prevent old completion from altering the new view.

## 8. Use existing tests and separate image evidence from mocks

**Decision**: Extend export utility/VM and existing producer/media suites. Gate promises explicitly to test adversarial ordering; assert outside callbacks production catches. Complete actual-file review in both current stable Chrome and Edge, plus SC-007's five-athlete review. No mobile end-to-end browser gate.

**Rationale**: Node Jest lacks real layout/rendering. Existing `deferredValue`, `createDownloadRuntime`, PNG-byte and media URL-validity helpers fit the state/resource tests; a reused 1 x 1 PNG cannot prove 1080 x 1920 output or visual quality.

**Alternatives considered**: Introducing jsdom or a new test framework is unnecessary for current logic tests. Passing canvas-call mocks or screenshots of the modal alone is not image acceptance. Performance measurements are diagnostic because the spec supplies no latency SLA.

**Evidence**: `__tests__/dashboard-export-download.test.js`, `__tests__/export-utils.test.js`, `__tests__/dashboard-media.test.js`, `__tests__/index-script-syntax.test.js`, `__tests__/tab-navigation.test.js`.

## Research Closure

All design unknowns are resolved for Phase 1. Remaining work is implementation and real validation, not unresolved product clarification. The browser decision, all 33 functional requirements, and all seven success criteria remain unchanged.