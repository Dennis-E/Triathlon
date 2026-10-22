# Research: Consistent and Scalable Local Processing

**Date**: 2026-10-21
**Scope**: Read-only research of current import, query, detail and dashboard owners. No browser performance or real-device claims are made.

## R1 - One normalization implementation

**Decision**: Add a pure dual-target activity contract/normalizer and retain existing entry points as delegating compatibility wrappers. Browser import and CommonJS tests must call the same implementation. Source adapters identify evidence-backed format profiles; they do not normalize measures independently.

**Evidence**: [production processData](../../src/dashboard-import.js#L315) and [test-helper processData](../../src/dashboard-utils.js#L178) are different implementations. Production treats one Distance column as kilometers; the helper treats it as meters. Their distance-column lookup also mishandles column index zero. Existing [processing tests](../../__tests__/processing.test.js#L78) encode helper behavior rather than proving a source convention.

**Rationale**: Correctness must precede migrating all views; a worker must not become a third normalization implementation.

**Alternatives considered**: Retaining both implementations with shared tests still permits drift. Changing only test expectations would conceal an unresolved source-format question.

## R2 - Evidence-backed units and value states

**Decision**: Canonical distance is kilometers; duration and timestamps use seconds and epoch milliseconds respectively. Preserve valid/missing/invalid value states and explicit reasons. Duplicate Distance/Distanz columns keep the first-kilometers/second-meters rule. A single unqualified column has no default unit. Unproven profiles remain unsupported for that measure, without rejecting otherwise usable activity fields.

**Evidence**: [extractor contract](../../scripts/relevant-export-extractor.js#L6) and its synthetic fixtures establish duplicate-column order but not a universal single-column unit. [TrainingPeaks FIT decoding](../../src/zip-importer.js#L997) explicitly requests meters; [session normalization](../../src/zip-importer.js#L713) converts total_distance to kilometers. parseFloat-based processing accepts numeric prefixes and does not preserve all invalid states.

**Rationale**: No inspected evidence justifies selecting either contradictory single-column interpretation. Lack of source evidence is resolved by conservative unavailability, not a guessed convention. Documented precision intervals determine agreement of duplicate values; no arbitrary percentage tolerance is introduced.

**Alternatives considered**: Canonical meters would require broader current-view adaptation. Guessing from magnitude or language silently corrupts histories. Treating invalid values as numeric zero corrupts sums and availability.

## R3 - Time, sport and identity

**Decision**: Preserve reviewed supported sport aliases in one registry, mapping only recognized values to Run/Bike/Swim. Store source instant separately from the activity-local calendar date. Resolve explicit source offsets first, then documented source conventions, otherwise require a confirmed IANA import timezone. Reject ambiguous DST instants unless an offset disambiguates them. Use namespaced source identities, exact fallback identities and deterministic conflict quarantine.

**Evidence**: [dashboard date parsing](../../src/dashboard-core.js#L31) uses device-local dates while [detail timestamp parsing](../../src/zip-importer.js#L214) treats some offsetless strings as UTC. Strava summary IDs currently come from row[0], unlike named-ID detail lookup. [TrainingPeaks identity](../../src/zip-importer.js#L702) rounds distance/duration and can merge distinct sessions. Unknown Strava sports can reach [All cards](../../src/dashboard-core.js#L437), unlike TrainingPeaks skips.

**Rationale**: Separate calendar selection from instant-based recording ownership. FIT timer time is not automatically moving time. FIT timestamps alone do not prove an athlete-local timezone.

**Alternatives considered**: Browser Date string parsing, rounded fingerprints and first-wins conflict handling fail the specified boundary and duplicate cases. A new timezone library is not required: strict parsing plus Intl timezone conversion with round-trip and ambiguity checks can satisfy the finite supported formats; test DST folds/gaps explicitly.

## R4 - Preserve recording ownership and source failure policies

**Decision**: Keep ZIP/decode mechanics and source-specific recording ownership outside the pure normalizer. Strava isolates corrupt detail files; corrupt/absent required CSV or unreadable ZIP is still fatal. TrainingPeaks FIT/GZIP failure rejects the whole candidate, while optional GPX failure remains a reported detail omission. Standalone Strava FIT uses its whole recording; shared FIT retains only uniquely owned samples. TrainingPeaks retains FIT-session segmentation.

**Evidence**: [combined FIT extraction](../../src/zip-importer.js#L530), [TrainingPeaks import](../../src/zip-importer.js#L830), [062 ownership contract](../062-restore-swim-heatmap/contracts/import-heatmap.md), and [import commit boundary](../../src/dashboard-import.js#L76).

**Rationale**: A common activity contract does not imply identical source failure semantics. Existing single-file FIT parsing for GPS and power must not regress.

**Alternatives considered**: Universal per-file partial success changes TrainingPeaks behavior. Universal atomic failure discards otherwise valid Strava data. Summary-time clipping of standalone files recreates 062.

## R5 - Query ownership, indexes and bounded reuse

**Decision**: A worker-owned ActivityStore is the single canonical history owner. It maintains sorted date positions and sport/equipment/capability indexes, returns row selections or compact view models, coalesces in-flight requests and uses byte-limited LRU caches. Dataset generation, filter version and calculation version are mandatory cache inputs. Global and local filters remain explicit operands.

**Evidence**: [timeframe selection](../../src/dashboard-core.js#L216) repeatedly scans/copies dates; [day aggregation](../../src/dashboard-core.js#L291) linearly searches buckets; [calendar](../../src/training-calendar-utils.js#L145) repeatedly scans years; [PB](../../src/dashboard-power-pb.js#L51) repeats projections and sorting. Current global state aliases are not themselves deep history copies.

**Rationale**: Share expensive work without an unbounded cache or a duplicate history per view. Stable canonical ordering and Map-based buckets keep aggregation deterministic.

**Alternatives considered**: A permanent full-history main-thread mirror doubles ownership. Independent per-view indexes/normalizers preserve inconsistent semantics. Unbounded memoization fails the retention requirement.

## R6 - Dedicated worker and transactional dataset lifecycle

**Decision**: Use a classic Dedicated Worker with shared pure modules loaded via importScripts and browser/CommonJS/worker bridges. Stage one import candidate separately from the active dataset. On success atomically install the candidate, reset dataset-bound filters, invalidate pending UI requests and dispose the old worker/charts. On failure retain active data and filters. Termination cancels synchronous parser work that cannot yield.

**Evidence**: Current dependencies are PapaParse 5.4.1, JSZip 3.10.1, dynamically imported fit-file-parser 1.10.0 and DecompressionStream. The app has no bundler. [heatmap rendering](../../src/dashboard-heatmap.js#L351) can resume after asynchronous loading without a dataset guard; [Workout-Time filters](../../src/dashboard-workout-time.js#L114) can retain previous bounds.

**Rationale**: Long synchronous parser calls cannot be made responsive by main-thread chunking alone. Messages must carry generation and request identities; post-await UI and export work needs the same guards. Active-plus-candidate transient memory counts toward the acceptance budget.

**Alternatives considered**: Cooperative main-thread scheduling cannot interrupt an indivisible FIT parse. Module workers require unnecessary changes to classic loading. SharedArrayBuffer adds isolation requirements without a current need.

**Implementation proof gate**: Before migrating production import, decode a real generated FIT and FIT.GZ inside this classic worker using pinned production dependencies. Verify dynamic ESM import, CORS/MIME/CSP behavior and retry after loader failure on both target browsers. If CDN worker loading fails, use an appropriately licensed pinned browser distribution without changing public module APIs or adding a build step. Any dependency replacement requires a reviewed compatibility proof; do not silently fall back to a blocking import and claim the latency gate passed.

## R7 - Cheap availability, lazy models and disposal

**Decision**: Compute a compact capability summary while ingesting. Availability checks use these facts and lightweight predicates, never full builders. Create only the opened view model; retained models and charts have explicit byte bounds and disposal. Remove retained dataset object identities in favor of primitive generation IDs.

**Evidence**: [availability](../../src/visualization-availability.js#L81) calls calendar, lifetime, equipment, route and other builders; [dataset application](../../src/dashboard-import.js#L97) eagerly renders several tabs. [heatmap viewport](../../src/dashboard-heatmap.js#L337) and [wordcloud source](../../src/dashboard-wordcloud.js#L267) can retain previous history references. The heatmap requires a drawable route, not merely a GPS flag.

**Rationale**: Cheap capability facts must be equivalent to meaningful-output rules, not looser approximations. Export may explicitly request the current view model but must not eagerly initialize other tabs.

**Alternatives considered**: A boolean any-GPS flag incorrectly exposes one-point heatmaps. Eager prewarming at 10x view count fails the unopened-view requirement.

## R8 - Details, power and route fidelity

**Decision**: Hold source File/Blob handles only in session memory; decode one detail entry at a time, release parser objects, retain compact derived data and byte-budgeted route buffers. Keep reconstruction references for evicted data. Represent route breaks explicitly. Preserve existing heatmap matching order and counting semantics; do not increase simplification to satisfy memory targets.

**Evidence**: [current route simplification](../../src/zip-importer.js#L418) uses 3 m RDP then a >2,000-point stride fallback, so it does not provide an unconditional 3 m error bound. [heatmap matching](../../src/heatmap-utils.js#L112) uses 30 m sampling/matching, 90 m continuity and 30 degree heading tolerance. Visit count is distinct activities; low-zoom colorCount is not a summed count. GPX flattening currently loses segment boundaries. [power fallback](../../src/power-pb-utils.js#L134) can be quadratic for decimal samples.

**Rationale**: Detail-data growth is not the same as summary growth. Reconstruction must remain possible without persistent storage. Optimize decimal power window traversal only with identical independent numeric expectations, not sample rounding.

**Alternatives considered**: Retaining all decoded FIT objects increases memory with raw samples. Uniform extra point thinning changes scientific meaning. Arbitrary parallel route merging can change deterministic matching.

## R9 - End-to-end proof and measurement honesty

**Decision**: Pre-generate valid synthetic FIT/FIT.GZ/GPX/ZIP files with deterministic seeds and independent oracles. Use Jest for pure/contracts/lifecycle slices and a separate browser harness for real file selection, real decoders, progress, interactions and memory recording. Device measurements are release acceptance evidence, not an output of this planning command.

**Evidence**: [root package](../../package.json) has Jest but no browser automation or FIT encoder. Existing [power benchmark](../../scripts/benchmark-power-pb.js) and [browser performance page](../../docs/test-power-pb-performance.html) are insufficient full-import proof. Worker memory is not reliably represented by performance.memory; user-agent memory measurement requires availability and isolation checks.

**Rationale**: Preserve the proposed 50,000-summary / 7.2-million-sample challenge, including decompression and rendering, rather than substituting parser mocks. Fix performance boundaries and measurement limitations before running acceptance. Benchmark tools remain dev-only and do not become a production build system.

**Alternatives considered**: Desktop throttling is useful diagnostics but not real-mobile evidence. Heap-only measurements or sampled process PSS without attribution cannot prove total tab memory. Existing injected-parser tests remain useful correctness tests, not scale evidence.

**Implementation proof gate**: Validate worker/native memory attribution on an isolated browser session for both devices; use whole-browser process-lifetime resident high-water totals as a conservative upper bound when exact tab accounting is unavailable. Never subtract an uncertain baseline or present a sampled maximum as an exact peak. If neither complete attribution nor a conservative upper bound can be obtained, the memory gate remains unverified, not passed. See [validation contract](contracts/validation.md).

## Resolution Status

All design questions have explicit decisions and alternatives. Missing source conventions resolve to unavailable measures or required timezone confirmation, not invented defaults. Worker/CDN compatibility and instrumented device performance remain implementation proof gates, not unresolved choices or claimed successful experiments.