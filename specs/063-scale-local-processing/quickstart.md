# Quickstart: Validate Local Processing Changes

**Status**: Implementation validation guide. The application changes and benchmark harness are not created by this planning phase.
**References**: [model](data-model.md), [data rules](contracts/activity-data.md), [query lifecycle](contracts/query-worker.md), [measurement protocol](contracts/validation.md).

## Prerequisites

- Existing Node/npm project dependencies installed at repository root; run `npm ci` when a lockfile is present, otherwise `npm install`.
- Python available for the existing static-file server.
- Physical reference desktop and Pixel 4a, with OS/browser versions recorded.
- Synthetic inputs only; no personal exports committed or required.
- During implementation, provide the deterministic real FIT/GPX/ZIP generator and browser-run harness described in the validation contract. Do not claim the following existing Jest commands perform those full-browser runs.

## Existing Executable Regression Checks

From repository root, first run the narrow test matching the current slice:

```powershell
npm test -- --runInBand processing parsing dashboard-import zip-importer
npm test -- --runInBand dashboard-core visualization-availability tab-navigation
npm test -- --runInBand dashboard-heatmap heatmap-utils power-pb-utils
npm test -- --runInBand dashboard-export-download export-utils index-script-syntax
```

Add shared-contract/store/query/protocol tests in existing suitable suites or focused new core suites when those modules are implemented. Ensure production and CommonJS wrappers receive the identical fixtures; expected results must be hand-calculated or independently generated. Existing contradictory single-distance tests must be updated only after the explicit source-profile policy is tested.

After all view adapters are migrated, run `npm test -- --runInBand` as the broader regression gate. No API code changes are planned; root tests cannot stand in for API tests if that scope later changes.

Existing `npm run benchmark:power-pb` and `node scripts/benchmark-lifetime-statistics.js` are useful diagnostics only, not 10x acceptance.

## Start the Existing Application

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`; use another port if occupied. No bundler/build command is needed. Serve generated local fixtures separately as needed, never upload them to a remote fixture service. A custom instrumentation server may be needed for isolated memory APIs; retain an unmodified static-server compatibility run.

## Correctness and Quality Walkthrough

1. Import the small A-E oracle fixture from the validation contract via Strava ZIP and equivalent TrainingPeaks sessions. Confirm admitted IDs, All/sport counts, valid-zero sums and duration-kind labels, not just similar-looking charts.
2. Repeat proven single/double Distance and Distanz cases at column index zero. Confirm ambiguous units and conflicting duplicates show clear report reasons rather than guessed totals.
3. Exercise missing/invalid/negative measures, unknown sport and missing/ambiguous timezone. Confirm required timezone confirmation is explicit and browser timezone changes do not move date-filter results.
4. Import overlaps, exact duplicates and same-ID conflicts in reversed archive order. Confirm stable identity dispositions and separate summary/detail report populations.
5. Use valid and corrupt Strava neighboring recordings; good summaries remain usable with incomplete detail coverage. Repeat TrainingPeaks fatal FIT/GZIP corruption; the old dataset and its filters must remain unchanged. Optional GPX failures are omissions, not invented full routes.
6. Combine date/sport with equipment and availability through supported controls or the test query boundary. Confirm global/local scope intersection, empty selection behavior and metric contribution counts from the contract.

## Lifecycle, Availability and Export Walkthrough

1. Import dataset A, set local and global filters and open heatmap/PB/wordcloud/Workout-Time. Start an asynchronous detail or export operation.
2. Begin dataset B with disjoint IDs; cancel or fail it and verify A remains active. Retry successfully; confirm all B filters/options are fresh and no A result, viewport identity, source handle or pending capture survives.
3. Issue rapid filter changes and out-of-order replies. Only the latest request for the current dataset may draw. Observe progress during long real parsing; cancellation must terminate an unresponsive candidate worker without losing A.
4. Count full builders during capability checks and unopened tabs: zero. Exercise missing-power, one-point GPS, no-data views and navigation fallback without constructing all models.
5. For each existing visualization, use the local Share/Export preview and download. Verify the displayed dataset/filter snapshot, no-data behavior and generated image. Reimport during capture must cancel stale export, not mix histories.
6. Exercise reference routes and decimal power samples against independent expectations; do not accept changed route meaning or rounded power as a performance fix.

## Real 1x/5x/10x Acceptance

Follow the validation contract exactly. The future harness must expose generation, file-input selection, timeline/latency tracing, memory attribution, builder/ownership counters and machine-readable result manifests. Its actual runnable commands must be documented when implemented; no nonexistent command is presented here as available.

1. Generate seeded files before timing, validate FIT headers/CRC independently and freeze hashes, per-source expectations, route distribution and expanded sizes.
2. Prove worker CDN/parser compatibility and memory measurement coverage on both devices before marking scale results valid.
3. Run S1/S5/S10, D1/D5/D10 and combined 1x/5x/10x on both sources and devices. Record at least five imports and 100 uncached/repeated actions per combination, with nearest-rank p95 categories separated.
4. Run the tenfold view-registry ownership test and the 20-reimport/200-switch retention sequence; include active-plus-candidate memory peaks.
5. Compare complete ZIP-to-first-usable-paint time, reaction/result latency, maximum UI blockades, memory and exact filter/report outputs with the contract. Publish failed or unmeasured items explicitly.

Expected success means every specified gate has traceable evidence. This planning command does not run these scenarios or assert that the 10x budgets are attainable today.