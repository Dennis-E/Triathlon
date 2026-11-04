# Validation Guide: Apple Health Import

This guide describes acceptance after implementation. The planning command does not create an importer, install libraries, or prove large-export support. Refer to [contract](contracts/apple-health-import.md), [data model](data-model.md), and [research](research.md) rather than treating proposed entry points as already implemented.

## Prerequisites

- Repository root on Node 22/24 with root dependencies installed. Record actual Node/browser versions and hardware during implementation acceptance.
- Add the exact root test dependencies chosen in research.md during implementation; retain the existing CDN/no-build runtime pattern and package-manager convention.
- Use a plain static server: `python -m http.server 8000`, then open `http://localhost:8000`. Choose another free port when 8000 is occupied. Do not use the shared file:// page to assess worker capability.
- Version-controlled fixtures must be synthetic. The supplied personal archive and its structural inventory remain only under the already ignored private-data directory. Never include recordings/readings/coordinates or identifying metadata in acceptance screenshots or public logs.

## 1. Normalization And Streaming Tests

After adding the proposed focused suite:

```powershell
npm test -- --runInBand __tests__/apple-health-import.test.js
```

Require the suite to exist and contain tests; the repository uses passWithNoTests, so command success alone is not proof of a new feature test. Use real small synthetic ZIPs with pinned libraries as well as injected failure cases. Generate large synthetic streams lazily; do not store giant fixtures or construct a full XML string before testing streaming.

Expected coverage:

- Running/cycling/swimming normalize; walking, hiking, strength and unknown sports do not. Unsupported sports with valid distance summaries still remain excluded.
- Exact field conversions, unit-bearing metadata, summary precedence and no double addition of legacy totals; unknown units and invalid numerics are diagnosed. Explicit zero differs from absent distance/duration/ascent.
- Empty or invalid primary export, wrong root, multiple primaries, case variants, nested root, CRC failure and incomplete XML fail before commit. A corrupt clinical/optional route file cannot invalidate usable main workouts.
- UTF-8 multibyte and XML tags/entities/DTD declarations split at every relevant chunk boundary; unsafe external/entity declarations and excessive depth/tokens/output are rejected without network resolution.
- Primary XML is read incrementally; text sink does not retain irrelevant records. Resource guards reject oversized directory reads before allocation and count actual decompressed output.
- Exact duplicate, incomplete identity, conflicting source ID, repeated shared route and distinct overlapping workout cases follow the identity contract. Without a trusted source-scoped ID, test every mandatory sourceName/sportRaw/start/end/duration/unit field missing or invalid; optional-field absence does not prevent deduplication, but missing/invalid/measured-zero markers and differing optional content remain distinct. Invalid core timestamps reject the workout instead of manufacturing an incomplete activity.
- Heart-rate/steps provenance, duplicate/conflict detection, pause windows, half-open endpoints, competing devices, partial interval coverage and mixed estimator types follow the documented reducers. No heart/step source match means null, not an invented value. Power efforts require unique point samples with no gap over five seconds; derived avgWatts additionally requires every active-window boundary covered within five seconds. Partial series may produce only shorter qualified efforts, not a workout average, and power effort distance fields stay null.
- Valid missing-distance activities can still support count-based views. Average power plus a qualifying complete series retains the source average and produces valid efforts even when all scalar summaries exist; average-only produces no efforts; series-only and gapped/ambiguous cases follow independent scalar/series eligibility. Generic titles, device labels and clinical files enable neither word cloud, equipment nor gallery.

## 2. Timezone And Route Geometry

```powershell
$previousTZ = $env:TZ
$env:TZ = 'UTC'
npm test -- --runInBand __tests__/apple-health-import.test.js __tests__/workout-time-utils.test.js
$env:TZ = 'Europe/Berlin'
npm test -- --runInBand __tests__/apple-health-import.test.js __tests__/workout-time-utils.test.js
$env:TZ = $previousTZ
npm test -- --runInBand __tests__/heatmap-utils.test.js __tests__/dashboard-heatmap.test.js
```

Use a try/finally around TZ changes in automation. Expected: same true instant and recorded local day/hour across viewer zones; correct midnight, DST and Monday grouping; non-Apple activities unchanged. GPX segment/file breaks create no bridge, invalid points break paths, repeated subpaths count one activity visit, distinct activities sharing geometry count separate visits, and Swim identity survives synthetic route import.

## 3. Dashboard, Replacement And Export

```powershell
npm test -- --runInBand __tests__/dashboard-import.test.js __tests__/visualization-availability.test.js __tests__/tab-navigation.test.js
npm test -- --runInBand __tests__/dashboard-export-download.test.js __tests__/dashboard-media.test.js
npm test -- --runInBand __tests__/analysis-counter.test.js __tests__/import-experience.test.js __tests__/index-script-syntax.test.js __tests__/zip-importer.test.js
```

Test actual importer output against all 13 rows of the readiness contract, including absence, invalid and zero cases. Add source replacement tests with nonoverlapping dates, real date controls initialized before replacement, active gear/media tabs, selected sports and a pending export capture. Do not manually reinitialize sliders after replacement to hide a defect.

Verify a slow Apple import superseded by a new personal/sample import cannot commit or publish progress; a newer failed import does not reactivate the old operation. Main-file failure and unsupported-only results preserve the existing dashboard. A committed render warning still counts once; a preparation failure counts zero times. Confirm old media leases and stale generated exports release only their own resources.

## 4. Browser Workflow

1. On desktop and mobile viewports, locate the Apple action within two actions from the landing page, open the export guide, cancel the picker, retry and select a synthetic original ZIP. Confirm existing provider options remain usable and labels do not incorrectly say Strava.
2. Confirm Worker/CDN loading over HTTP, normal progress, safe dependency/capability failure, and responsive navigation. Instrument heartbeat timestamps without capturing health values.
3. Import a rich synthetic source, then sparse Apple data, then another source. Check all available/hidden tabs, arrow/keyboard order, active-tab fallback, date bounds, count/measure controls, routes, media and no-visualizations behavior.
4. Open an image preview, begin another capture, then replace the source. Neither the old preview nor an awaited old capture may publish/export into the new dataset. A failed pre-commit replacement preserves the valid old dataset and its exports.
5. Exercise the local image-preview and PNG download action for every available existing visualization. Verify exported content matches the current Apple dataset, not stale canvases. Test missing-route/media/power cases without forcing hidden views on.
6. Observe requests during import with synthetic data. CDN libraries, preexisting map resources and the existing metadata-only counter may request network resources; no raw file, XML, clinical readings, source identifiers or coordinates may be transmitted by import code.

## 5. Large-Export Acceptance

- Generate the three repeatable lazy synthetic archives before attaching measurement tooling; reuse each file for the warm-up and three measured imports. The generator streams both XML chunks and compressed ZIP output and writes only under ignored private-data:

```powershell
node scripts/benchmark-apple-health.js --records=1000000 --workouts=2000 --output=private-data/apple-health-1m.zip
node scripts/benchmark-apple-health.js --records=2500000 --workouts=2000 --output=private-data/apple-health-2_5m.zip
node scripts/benchmark-apple-health.js --records=4500000 --workouts=2000 --output=private-data/apple-health-4_5m.zip
node scripts/benchmark-apple-health.js --measure --cdp-url=http://127.0.0.1:9222 --url=http://localhost:8000/index.html --repetitions=3 --sample-interval-ms=200 --report=private-data/apple-health-memory.json
```

- Record generator-reported estimated uncompressed XML bytes and ZIP bytes; independently verify the third workload actually meets its required uncompressed-size class. If it is below 3 GiB, do not claim it represents SC-005's >=3-GB reference export; use the supplied private export for that separate gate.
- Start a dedicated Chrome/Edge with a new private-data-only profile and `--headless=new --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=<private-data-profile>`; confirm the CDP endpoint is loopback-only, and prevent corporate/system proxies from routing localhost to an external server. The measurer creates a fresh same-origin page, uses a real CDP mouse action and intercepted native file chooser for each archive, attaches to its worker, writes the full sample report only to private-data, and closes the temporary browser page. Keep the static app server available for all runs.
- Inspect the script's JSON result: each workload must include the warm-up and all three repetitions, observed worker-target/sample counts, page/worker `usedSize`, backing-store and embedder-heap components, baseline/peak deltas, sampling gaps and progress gaps. Do not edit the report to turn `UNVERIFIED` into `PASS`.
- First use lazy synthetic archives with exactly 1,000,000, 2,500,000 and 4,500,000 irrelevant records and identical workouts, relevant measurements and routes. The harness must not materialize the whole source. For each workload discard one warm-up run, then record three measured repetitions using fresh page/worker state, the same browser build/hardware, foreground visibility and identical initial dataset. Do not force garbage collection during a measured run.
- Serve over HTTP(S), bring the browser tab to the foreground, and record its state/version and host hardware. From a CDP/DevTools trace attach to the page and dedicated-worker runtimes before each run. Sample `Runtime.getHeapUsage` for both targets every <=250 ms and record `usedSize + backingStorageSize` plus target/session identity and timestamps; do not rely on `performance.memory` from the page alone. If this browser does not expose worker runtime/backing-storage measurements or has gaps >250 ms, the memory gate is unverified, not passed. Keep the final worker observation before termination and continue sampling the main target through result hydration/render/cleanup. Do not force garbage collection.
- Memory metric: combined live JavaScript heap plus backing-store/ArrayBuffer bytes across the app main thread and every importer worker, with transferred buffers counted once under their current owner. Record each target's baseline and peak totals and the measured categories. A missing context/allocation category or sampling gap >250 ms means unverified, not passed.
- Observation window: from immediately before starting each import through worker termination and completed result hydration/render/cleanup. Subtract the pre-import combined baseline from each sampled combined total and take the maximum delta as that repetition's peak. For each workload use the largest peak among its three repetitions. Pass the fixed-result memory comparison only when largest-workload worst peak minus smallest-workload worst peak is <=64 MiB (64 * 1024 * 1024 bytes); retain intermediate-workload measurements as evidence too. Independently require progress gaps <=5 seconds, unchanged expected counts and responsive UI. These are future acceptance thresholds, not already measured results.
- Then select the explicitly supplied private archive locally. Record browser/OS/hardware, compressed/decompressed size class, elapsed time, peak/steady memory evidence, heartbeat gap and aggregate outcome only in a local private acceptance note. Use the private structural inventory to reconcile supported candidates, duplicate/conflict decisions, partial quantities and route failures; do not assume candidate count equals deduplicated output.
- Acceptance must cover >=2,000 source workouts, >=4.5 million health records and >=3 GB uncompressed archive contents without a crash or manual extraction. Secondary clinical XML must remain unopened by the importer. Counters and resource accounting must distinguish archive size from actual extracted bytes across two passes.
- Exercise an actual-budget failure and cancellation/supersession during extraction; old dashboard remains usable, workers terminate, readers close, and retry works. Do not lower limits merely to bypass the required large-file class.
- Inspect the resulting equipment/word-cloud/gallery absence and route/power readiness against the actual data, not a source-label allowlist. Optional sample enrichment may legitimately remain unavailable; record aggregate reasons instead of assuming all pulse/step records map.

## 6. Final Gates

Run the full root suite after focused checks because shared time/heatmap/export behavior is touched, then `git diff --check`. API tests are not required when services/api remains unchanged. Confirm raw archive and inventory are still ignored with `git check-ignore -- "private-data/Apple Export.zip" "private-data/apple-health-data-inventory.md"`.

No release claim until synthetic and private large-file checks, all 13 readiness rows, source replacement, navigation, local share/download, and no-health-upload evidence pass. No branch creation or commit is part of this guide.