# Correctness, Scale and Measurement Contract

**Status**: Acceptance protocol for implementation. No measurements have been performed by planning.
**References**: [spec outcomes](../spec.md), [research limitations](../research.md)

## Independent Correctness Oracle

Author expected activity IDs, value states, quality dispositions, sums and filter results independently of production normalization/query code. Do not obtain expected values by running the code under test. Small hand-calculated cases supplement deterministic large-profile formulas. Hash expected manifests and generated input files; persist no personal fixtures.

Example summary fixture (explicit kilometer profile and resolved calendar dates):

| ID | Local date | Sport | Equipment | Distance | Duration kind/value | GPS |
| --- | --- | --- | --- | --- | --- | --- |
| A | 2020-12-31 | Run | shoe-1 | valid 10 km | moving 3,600 s | none |
| B | 2021-01-01 | Bike | bike-1 | valid 20 km | moving 1,800 s | drawable |
| C | 2021-01-01 | Run | missing | valid 0 km | moving 0 s | none |
| D | 2021-01-01 | Swim | missing | invalid negative | missing | unknown |
| E | 2021-01-01 | unknown sport | missing | 50 km input | 100 s input | none |

Expected: All admits A-D (4 activities), distance sum 30 km / 3 contributors, moving sum 5,400 s / 3 contributors. Jan 1 admits B/C/D (3), distance 20 km / 2 contributors and moving 1,800 s / 2 contributors. Jan 1 AND Run yields C with a true zero sum and no eligible pace/speed pair. Bike AND bike-1 AND drawable GPS yields only B. Run with only Jan 1 cannot inherit A's duration. E is skipped, never counted in All. Add exact duplicate A to increase duplicateRows by one, not totals; conflicting same-ID A variants quarantine their entire group.

Additional mandatory cases: German/English headers; distance at index zero; single proven meter/kilometer and unproven columns; duplicate distance agreement/conflict/missing partner; whitespace/locale decimals; numeric zero; empty/NaN/Infinity/negative/numeric-prefix errors; timer versus moving/elapsed; reordered ID columns; exact/fallback/conflicting duplicates across archives; timezones, leap days, DST gaps/folds and year boundaries; zero-result combined filters; source-specific partial/fatal imports; shared/standalone FIT ownership; explicit route breaks; ambiguous GPX ownership; new dataset with disjoint IDs; stale async query/render/export responses; cancellation and unavailable view fallback.

Run identical calendar cases under multiple host timezones. Independently expected local dates remain fixed. Count builder invocations and full-history copies to prove availability/lazy ownership rather than inferring them from elapsed time.

## Reproducible Synthetic Profiles

Fixed seed `630021`, generator/profile version 1. Integer IDs are unique and stable; time range is 2016-01-01 through 2025-12-31 (3,653 days). Baseline summaries use 60 % Run, 30 % Bike, 10 % Swim and 100 named equipment IDs. Cycle distances 1-50 km and durations distance * 300 seconds; distribute dates deterministically over all 3,653 days, with explicitly declared offsets/zones. Freeze the iteration/assignment algorithm and independently computed per-day/sport manifests before measuring.

| Axis | 1x | 5x | 10x |
| --- | --- | --- | --- |
| S: summaries, no details | 5,000 | 25,000 | 50,000 |
| D: FIT sessions at fixed 5,000 summaries | 100 | 500 | 1,000 |
| Samples per session | 7,200 | 7,200 | 7,200 |
| FIT samples / GPS points | 720,000 | 3,600,000 | 7,200,000 |
| Combined challenge | S1+D1 | S5+D5 | S10+D10 |

Two-hour recording windows contain samples at seconds 0 through 7,199, with session elapsed duration 7,200 s; do not accidentally generate 7,201 samples. FIT/GPX routes use 70 % repeated corridors, 20 % disjoint regions and 10 % novel routes, applied by activity count with exact quotas. Define repeated corridor coordinates, disjoint region bounds and novel-route generator in the manifest; no latitude/longitude randomness without a seed. Detail activities use 20 % Run, 70 % Bike, 10 % Swim and unique sessions/start windows to avoid unintended source deduplication.

S axis varies summaries only; D axis varies details only with its summary population fixed. Combined runs vary both. Run each through supported Strava and TrainingPeaks workflows: CSV summaries for Strava; real one-session minimal FIT entries for summary-only TrainingPeaks and full-record FIT entries for detail activities. In the latter, any nonzero session-summary parser overhead remains part of the measured workflow. Associated GPX variants must not double-count activity or route totals.

Freeze a clean capacity profile and separate fault/partial-coverage variants, including 5 % missing optional measures, 2 % invalid optional measures, 5 % absent details and corrupt/ambiguous neighbors. Publish exact modified IDs and expected report counts. Never silently replace clean 10x routes with missing data to reduce work. TrainingPeaks corrupt-FIT variants are expected rejection cases, not successful capacity runs.

Files are generated before timing using a validated FIT encoder with proper header, message definitions, session/record fields and CRC, plus actual GZIP and ZIP. Verify generated files with an independent decoder or validator; the production parser remains the decoder exercised during timed import. Record file bytes, compressed/expanded sizes, hashes, seed and tool versions. Keep large generated files local/ignored; commit only small synthetic fixtures and manifests.

## Hardware, Timing and Latency Budgets

Use Intel Core i5-12400 / 16 GB desktop and physical Pixel 4a / 6 GB mobile, pinned OS/browser versions, power mode, thermal state and foreground page. Desktop throttling does not substitute for mobile. Record background applications, dependency-cache state and network failures. Pin dependency versions; separate cold dependency-load diagnostics from warm-dependency workout throughput, without dropping file/decompression/parser work.

| Measurement | Desktop | Mobile |
| --- | --- | --- |
| Summary filter end-to-end p95 | <= 200 ms | <= 200 ms |
| Visible input reaction p95 | <= 100 ms | <= 100 ms |
| Maximum main-thread blockade | <= 100 ms | <= 100 ms |
| Simple tab result p95 | <= 500 ms | <= 1,000 ms |
| First detail tab result | <= 5 s | <= 10 s |
| Combined 10x import, each run | <= 120 s | <= 300 s |
| Additional attributable peak memory | <= 1.5 GiB | <= 512 MiB |

Import start is the file-input change event after selection; finish is the first painted usable active view with report and current capabilities. Include ZIP expansion, real parsing, normalization, indexing, worker handoff and rendering. Record phase timings as diagnostics, never as replacements for total time. Include candidate-plus-active history on reimport.

Filter/tab latency starts at dispatched input and ends at the paint containing correct results. Immediate selected/progress feedback is measured separately from result arrival. Use nearest-rank p95, at least 100 recorded actions per device/profile/source combination and separate uncached first queries, repeated queries and detail models. Do not dilute slow first queries by pooling them with cache hits. Run at least five imports per combination; record all durations and worst import, not only the mean. Also execute combined 1x and 5x, not just 10x.

Capture main-thread tasks and render gaps throughout import and queries, including worker setup and message deserialization; a progress animation alone is not responsiveness proof. Report long tasks and input-to-paint traces. Progress must update at least once per second when foreground work exceeds one second, with real counters or explicit indeterminate phase.

## Memory and Retention Evidence

Memory includes main/worker JS, ZIP buffers, decoded FIT objects, route arrays, charts/canvas/native resources, caches and active-plus-candidate transient allocation. JS heap alone does not meet this definition. Validate browser memory instrumentation before the main benchmark; record supported APIs, attribution, permissions, precision and collection overhead.

Preferred evidence uses complete browser memory attribution with worker/native coverage. If unavailable, a fresh isolated browser process tree dedicated to this page can supply a conservative bound using summed process-lifetime resident high-water measurements, including workers/renderer/GPU/utility processes without subtracting baseline. Passing an overinclusive total below the additional-memory limit is sufficient; exceeding it is inconclusive about exact attribution, not a pass. Missing processes, permissions or high-water coverage leave the memory requirement unverified. Sampled PSS/RSS and performance.memory may supplement diagnosis but cannot by themselves certify peak or total coverage. Cross-origin-isolated instrumentation must separately prove it does not break production CDN/map resources or change the import path.

For retention, warm the current dataset/view and record a stable baseline. Perform 20 successful replacements with disjoint IDs, interleaved with 200 deterministic filter/tab switches and selected cancellation/failure attempts. At consistent quiescent checkpoints, compare retained ownership and attributable memory with baseline. Final growth must be <= max(10 % baseline, 32 MiB); no monotonic retained-history/cache growth is allowed even within a noisy memory threshold. Check source-handle, worker, chart and cache counts directly. GC-forced diagnostic runs must be labeled and cannot replace normal-lifecycle responsiveness measurements.

## Tenfold View Extensibility and Route Fidelity

Register ten times the current view count using lightweight test descriptors around representative summary/detail capabilities. Do not ship these as new product views. Verify unopened builder count zero, canonical history owner count one, byte ceilings unchanged and identical equivalent query reuse. This harness may stub view registration but never substitute parser mocks in import scale runs.

Use independently specified routes with revisits, parallel corridors, crossings, missing GPS, breaks, shared recordings and swims. Compare selected activity IDs, route segment ownership, distinct visit counts and low-zoom count/color semantics. Record geometric error before and after simplification. Existing 3 m RDP plus point-cap stride is not an unconditional 3 m guarantee; no extra point thinning is permitted to conceal failed budgets. Preserve regression expectations or explicitly propose a specification change before accepting altered meaning.

## Acceptance Evidence and Blocking Gates

1. Shared normalizer tests, source-policy and exact aggregation oracles pass.
2. Real generated FIT/FIT.GZ parser works inside the pinned classic-worker dependency graph on both target browsers; retry and cancellation are exercised.
3. All source/profile/device matrices have complete real-browser traces and unmodified population sizes.
4. Complete attributable memory or a conservative complete bound meets the limits; unavailable instruments do not count as success.
5. 20 replacements/200 switches, lazy model counters, tenfold registry, route fidelity and current Share/Export regressions pass.

Publish raw run manifest, environment, results, percentiles, worst cases, quality counts, trace paths and explicit failed/unverified gates. No isolated microbenchmark or mocked parser result can mark 10x acceptance complete. These gates are pending implementation, not failed constitutional design gates.