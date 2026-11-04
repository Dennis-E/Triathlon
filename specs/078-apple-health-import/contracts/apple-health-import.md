# Contract: Apple Health Import

## Rule Authority

[spec.md](../spec.md) defines requirements; this version-controlled contract and [data-model.md](../data-model.md) define the normative readiness, field, identity and attribution rules beneath it. The ignored private inventory is sample evidence only, must not override these rules, and is not required by runtime or synthetic tests. Conflicts must be corrected in version-controlled artifacts rather than silently resolved through private-file edits.

## Public Entry And Archive Recognition

The landing page adds an Apple Health action alongside current import sources. It opens a single-file `.zip` picker (no multiple attribute), links to an Apple export guide, and uses the existing import-progress UI. Cancelling the picker leaves the current dataset untouched. Existing visual style, lucide icons, previews and provider actions remain intact.

Find exactly one regular primary file whose basename case-insensitively equals export.xml and whose parsed root is HealthData. Exclude export_cda.xml, macOS resource forks and directories. Nested containing folders and filename capitalization are allowed. Multiple potential primary exports are an explicit ambiguous-export error, not an arbitrary first match. Never extract files to disk.

Core XML workout elements, compatible statistics, metadata, events, and route references are parsed structurally by SAX. Unrelated records are skipped without materialization. Unknown categories do not invalidate otherwise usable workouts; syntax errors, unsafe XML/archive structure or a bad main-entry signature are fatal before commit. Invalid optional GPX entries produce a route diagnostic only.

## Reusable Importer Interface

Proposed module export and browser/worker namespace: `appleHealthImporter.importAppleHealthZip(file, reportProgress, dependencies)` returns a Promise of the result in [data-model.md](../data-model.md). `dependencies` injects ZIP, SAX, decoder, hashing, abort signal, clock, yield callback and limits for tests. The function itself has no DOM, dashboard globals, analytics calls, user-file logging, or service dependencies. Normalization helpers live in appleHealthUtils with CommonJS and browser/worker bridges.

`executeAppleHealthZipImport(file, dependencies)` in the dashboard owner follows the existing TrainingPeaks orchestration pattern: prepare, reject empty supported history, check generation, adapt dataset, apply, and record once. Its injected importFile/applyDataset/recordAnalysis/reportProgress/onDatasetPrepared seams permit VM tests without a live worker or document.

## Identity And Second-Pass Decisions

Fingerprint suppression without a trusted source-scoped ID requires nonempty trimmed sourceName, sportRaw, valid exact start/end instants with end >= start, and finite nonnegative recorded duration in a supported explicit durationUnit. Compare optional device, summary, event and route content with typed missing/invalid markers; absence of optional content alone is not incomplete identity. Missing/invalid required identity evidence disables fingerprint suppression, while invalid core timestamps still invalidate that workout. Explicit IDs need a nonempty source scope and conflicting payloads remain distinct. Test complete equal copies, each missing/invalid required field, optional missing versus measured zero, differing optional content, conflicting IDs and indistinguishable incomplete candidates.

Maintain independent needsScalarEnrichment and needsTimedPowerSeries decisions. First-pass presence of compatible power records plus a Bike candidate requires second-pass attribution for timed-power eligibility even with a source avgWatts or complete scalar summaries. Skip the pass only if both needs are false for every candidate. A source average overrides only a derived scalar average, never series collection or best-effort evaluation. Power PB samples must be exact-source and unique-device attributed, unique, point samples, and have no adjacent time gap over 5 seconds; then the existing per-duration coverage threshold decides which efforts qualify. A source avgWatts is retained unchanged. Derive avgWatts from samples only if all active windows have positive samples within 5 seconds of both boundaries and no internal gap over 5 seconds. Partial dense series may yield shorter duration efforts but never the workout average. Apple Health power records have no sample-distance field; emit null `startKm`/`endKm`, never estimated distances or calculator placeholders. Required tests cover average plus dense effort series, average plus a completely covering series, average-only, fully covered series-only, partial dense series, absent series and gapped/ambiguous series. Apply existing provenance and effort coverage before emitting.

## Worker Protocol

One worker per import operation. File is structured-cloned, never transferred as an ArrayBuffer. Every message carries the parent generation and is ignored if no longer current.

| Direction / type | Payload | Rule |
| --- | --- | --- |
| UI -> start | generation, file | Only one original ZIP; worker loads pinned dependencies and begins |
| UI -> cancel | generation | Abort active reader; UI may terminate immediately if it is blocked |
| Worker -> progress | generation, phase, percent, processedBytes, totalBytes, processedWorkouts | Bounded aggregate metadata only; percent is monotonic, 100 only when prepared |
| Worker -> complete | generation, result | Fully validated wire result, no raw health XML or sample arrays |
| Worker -> error | generation, code, safeMessage, diagnostics | Enumerated safe message, no parser snippet or personal filename |

Phases: loadingDependencies, readingWorkouts, normalizing, enrichingMeasurements, readingRoutes, finalizing. Use weighted monotonic phase ranges; byte counts identify whether they refer to compressed input or decompressed XML. Send approximately one heartbeat per second, including long normalization/route phases; yield the worker event loop between bounded processing slices. Dependency-load heartbeat comes from the main-thread wrapper until the worker reports ready. No interval polling of a giant synchronous parser call is accepted as evidence of responsiveness.

Wire activities carry start epoch milliseconds, sourceLocalStart, source-local day components, normalized scalars, and IDs. The main-thread adapter reconstructs/validates actual Date fields and week grouping. Routes use transferable Float64Array coordinate buffers plus Uint32Array subpath offsets and activity IDs; validate bounds and hydrate the legacy array representation before commit. Transfer buffers rather than duplicating large coordinate object graphs. Terminate the completed worker before expanding main-thread arrays; release wire buffers afterward.

Worker runtime loads the exact native zip.js and SAX URLs in research.md, then reusable local modules. Configure zip.js without nested workers. Reusable modules attach to globalThis/self and to window when available; CommonJS remains supported. `index.html` loads any main-thread helper before dashboard-import.js, retaining all existing relative script ordering. Plain HTTP(S) hosting is required; unsupported Worker/Streams/decoder capability or CDN load failure yields a safe retry message, not a whole-file fallback.

Inject the existing `extractGpxTrackpoints` helper from src/zip-importer.js. It is a CommonJS export and a classic-script function declaration; the worker may import that local script solely for its pure GPX helper without invoking JSZip extraction or DOM-dependent loaders. Split the bounded GPX input into explicit track segments before invoking the helper, and preserve invalid-point breaks in the adapter rather than silently joining rejected coordinates. Do not copy TrainingPeaks time-based route matching. Any reused power helper must be explicitly available through the injected worker namespace, not assumed to exist on window inside a Worker; verify the classic-worker smoke test for those dependencies.

## Resource And Safety Limits

Initial centralized defaults are tunable in tests, not arbitrary per-call production overrides. These allow the required large-export class. Check metadata before extraction and actual counters during extraction; metadata alone is not trusted.

| Resource | Initial default / enforcement |
| --- | --- |
| Selected file | At most 8 GiB; reject before reading |
| Central directory | 32 MiB maximum; bounded reader rejects a larger directory read before allocating |
| Entry count / path | 100,000 entries; 1,024 UTF-8 bytes per normalized path; duplicates/collisions rejected |
| Main XML | 8 GiB actual decompressed bytes per pass |
| Total extraction | 24 GiB actual bytes across both passes and optional routes |
| Input / text slices | 64 KiB configured ZIP reads and maximum parser feed slices; use stream backpressure |
| XML shape | Depth 64, at most 128 attributes/element, 64 KiB bounded token/DOCTYPE/attribute buffers; no entity declarations or external identifiers |
| Candidate workouts | 100,000 maximum, checked before retaining next candidate |
| Candidate-related sample retention | 50,000 samples per workout/metric and 2,000,000 across all reducers; excess disables affected optional derivation with a counted diagnostic and releases its samples |
| GPX entry | 32 MiB decoded bytes; larger optional route skipped with reason |
| Route output | 500,000 points per activity and 2,000,000 points across result; exceeding a route budget drops affected optional route, never silently truncates geometry |
| Wire result | Conservative byte estimate capped at 128 MiB before posting, including strings, scalars and transferred buffers; oversize result fails before commit |
| Unknown diagnostic labels | 128 bounded category labels, remaining categories aggregated |

Chunk size is not a guarantee of decoder output size; split/check output immediately and test malicious expansion behavior. Any guard discovered to run only after an unbounded allocation must be moved to the bounded reader/sink before release. Close readers and abort sinks on every exit. Keep ZIP signature checking enabled with the pinned API's checkSignature option. Reject encrypted/unsupported entries and unsafe main archive paths with a safe explicit error.

No external resource resolver, fetch of XML-provided URLs, dynamic entity map, raw XML logging, or parser-error continuation is permitted. A bounded DTD declaration scanner distinguishes Apple's safe inline ELEMENT/ATTLIST declarations from ENTITY, parameter-entity and external subset declarations, including chunk boundaries and quoted/comment content.

## Memory Acceptance Procedure

Use the [quickstart procedure](../quickstart.md) with three fixed-size workloads (1,000,000 / 2,500,000 / 4,500,000 irrelevant records), identical relevant results and three measured repetitions after warm-up. Combined main-thread/worker memory includes live JavaScript heaps and backing-store/ArrayBuffer allocations, without double-counting transferred buffers. Measure from pre-import baseline through worker termination and result hydration/cleanup. Largest-workload worst peak minus smallest-workload worst peak must be <=64 MiB. Record intermediate-size results too; missing worker/backing-store evidence or sampling gaps over 250 ms means unverified, not passed. The <=5-second progress-gap gate remains independent. These are acceptance thresholds, not performance results or permission to weaken resource limits.

## Error And Diagnostic Codes

Fatal codes: UNSUPPORTED_CAPABILITY, DEPENDENCY_LOAD_FAILED, INVALID_ARCHIVE, AMBIGUOUS_EXPORT, MISSING_EXPORT, INVALID_XML, UNSUPPORTED_ENCODING, UNSAFE_XML, RESOURCE_LIMIT, NO_SUPPORTED_WORKOUTS, CANCELLED. Optional codes include INVALID_WORKOUT, UNSUPPORTED_SPORT, UNKNOWN_UNIT, IDENTITY_CONFLICT, AMBIGUOUS_SAMPLE, INCOMPLETE_SAMPLE_COVERAGE, SAMPLE_LIMIT, INVALID_ROUTE, MISSING_ROUTE, ROUTE_LIMIT.

Fatal pre-commit errors preserve the old dataset, available tabs and usable old exports. Superseded operations do not display errors or increment the counter. Optional failures are summarized at completion without dumping source data. Existing UI receives plain safe text and lucide status icons; do not place raw errors in HTML.

## Visualization Eligibility And Export Contract

Always compute eligibility from normalized results through the current getVisualizationAvailability utility, never from the provider label. Preserve current renderer thresholds and missing-value semantics.

| Existing tab ID | Evidence needed / Apple rule |
| --- | --- |
| totalDistance | Valid dated supported activity with positive available distance |
| paceMetrics | Plausible distance/duration performance and at least one usable metric; distance can support the view without pulse/cadence |
| equipment | Actual labeled gear and aggregatable distance; empty for the supplied export class |
| equipmentTimeline | Actual gear, valid date/distance, renderable timeline |
| personalBests | Existing eligible distance/duration performance or valid timed cycling power efforts; average power alone insufficient |
| heatmap | At least one real connected route segment associated with an imported supported activity |
| distributions | At least one usable supported distribution metric, not a missing-value sentinel |
| workoutTime | Valid start context and supported activity count; distance/duration measures preserve per-field availability |
| trainingCalendar | At least one valid supported dated activity |
| wordcloud | Meaningful real source title words, not generated fallback labels |
| pieCharts | Valid supported sport count; other measures require available quantities |
| lifetimeStatistics | At least one valid supported activity in summary output |
| mediaGallery | Readable supported media library, never GPX/ECG/clinical XML |

For every view, test present, absent, invalid and explicit-zero cases through an actual synthetic Apple import. Missing quantities must not become zeros through Number(null), fallback coercion or ignored availability flags. Amend a utility only where a focused test proves it violates this contract; preserve legitimate zero observations and all other providers' valid behavior.

After successful commit, recompute available tabs, preserve their IDs/order, reset active navigation to an available tab or no-visualizations state, and exclude hidden tabs from pointer/keyboard/arrow traversal. Date/sport filter emptiness within an available view retains current behavior. No new tab is introduced.

At commit, close the old export preview and invalidate captures against the current dataset revision. getTabExportTarget must refuse tabs outside the current available set even if old chart/DOM flags survive. Check revision after each awaited preparation, rendering, image decode and preview-publication boundary. Dispose stale generated URLs/resources exactly once; retain independently leased old-media export resources until their owner finishes. A failed pre-commit import must not unnecessarily destroy the old valid preview.

## Commit And Counter Invariants

Prepare completely before applyImportedDataset. Use beginImportOperation/current-generation checks and discard stale worker results before hydrating/committing where possible. Update the source status label explicitly for Apple, not the current non-TrainingPeaks Strava fallback. Reset selectedSportFilter through setSportFilter rather than changing only button styling; initialize nonoverlapping replacement date bounds and existing per-view controls.

One committed personal import triggers recordImportOperation exactly once, including a subsequent render warning; failed, cancelled, superseded, unsupported-only and sample imports trigger none. Preserve existing analysis-counter request structure with no workout body or source filename. No services/api changes are part of this design.