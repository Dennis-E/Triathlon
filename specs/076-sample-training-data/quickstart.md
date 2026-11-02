# Quickstart Validation: Silicon Valley Sample Training Data

This guide describes implementation acceptance checks. Completed portions and outstanding prerequisites are recorded below; commands for remaining artifacts are not claims that those artifacts already exist.

## Execution Status (2026-11-02)

- Technical implementation is complete: the exact landing button, recoverable sample loading, normal dashboard activation, five-year history, year/sport maps, source-labelled image exports, atomic source replacement, operation-bound counting and media ownership guards are present. No new tab, account, backend or build step was introduced.
- Public resources contain 1,600 activities and 923 GPS tracks across all 60 months of 2021-2025. Output is 1,355,270 bytes, seed 76, version 1. `node scripts/generate-sample-data.js --check` passes without writes or network access. The 23 sample-data tests include complete fixtures, negative invariants, equipment consumers, all eight power durations annually, all twelve non-media analyses, shared immutable route geometry and UTC/Los_Angeles/Berlin calendar hydration.
- Twelve real connected road/trail patterns and two synthetic repeated swimming courses were acquired through the official OSM API. Source way IDs, retrieval date, ODbL attribution/license links and the official Shadow Cliffs swimming information are in `sample-data/routes.json` and `sample-data/README.md`. All points of both swim courses were checked inside source lake polygon 43986029. These historical synthetic drills are not current safety/access guarantees or surveyed buoy courses.
- Final `npm test -- --runInBand`: all 43 suites / 1,174 tests passed in 43.035 seconds after every functional correction. All focused red/green slices also passed, and editor diagnostics reported no errors in the changed implementation files. No API code or dependencies changed.
- Browser acceptance used a separate static server at `http://127.0.0.1:8003/`. The original user session containing personal Strava data and export preview was not reloaded or modified. Mouse activation opened all twelve non-media tabs in about two seconds with no JavaScript page errors and no analysis-counter POST. Enter-key activation also passed. Mobile 390x844 and desktop 1440x900 screenshots verified entry, maps and actual PNG presentation; there was no page-level horizontal overflow.
- All 24 All-years/individual-year and All/Run/Bike/Swim map combinations were populated and returned matching export year/sport. Existing zoom behavior and navigation IDs/order are preserved. Segment counts were 2,075 All sports, 938 Run, 1,133 Bike and 4 Swim; their activity frequencies vary by year.
- Actual browser PNG capture succeeded for all twelve analytic views. Wordcloud capture was retried after layout readiness and the narrow-layout/usable-partial-state correction; it produced a source-labelled 1080x1080 PNG. Actual PB-detail capture and portrait recomposition produced source-labelled 1080x1080 and 1080x1350 images. Distance and PB portrait screenshots verified the synthetic line in the raster image. Full OSM attribution URL in sample map PNGs is covered by the canvas composition tests. The browser download command handed off and closed the preview; the integrated browser did not emit Playwright's download event, so final OS file persistence is not claimed.
- A browser source-replacement test used a purely synthetic personal CSV and a temporary local counter spy: after replacement exactly one 5 km activity remained, GPS and power dictionaries were empty, source identity was personal, and landing sample feedback was empty. Exactly one personal analysis was observed by the spy; restoring all 1,600 sample activities did not add another. A previously captured sample export target retained its synthetic identity. No production counter event was sent by this test.
- Delayed Strava/TrainingPeaks/CSV and sample tests cover stale results/progress/errors, failed newest requests, nested tokens, empty selections, old dialog timers, candidate media release and post-commit rendering-error counting. Media tests cover late gallery/collage completions, no new URLs after release and independent in-flight export leases.
- The pre-existing local-origin counter GET reports a CORS warning on port 8003. The counter failure is handled by the existing application; sample loading and local exports do not depend on it. No CORS bypass or API change was introduced.
- The only outstanding planned acceptance task is T049 / SC-006: five real first-time participants were not available. Automated browser walkthroughs are not presented as that study. The spec-quality checklist was not changed.

## Recorded Load Timing

SC-001 sample loading was measured with Chrome 150 / Electron 43.7.7 in VS Code 1.141.0 on Windows, with 20 Mbps downstream, 40 ms latency and HTTP cache disabled through Chrome DevTools Protocol. External libraries were already loaded; each trial fetched the sample resource and constructed a fresh dataset. Mobile refers to a 390x844 viewport, not a physical phone CPU. Earlier runs with stale cached scripts and unfinished instrumentation were discarded, not counted as passes.

| Viewport | Ten activation-to-dashboard measurements (ms) | <= 15 seconds |
|---|---|---|
| Desktop 1440x900 | 1296, 1529, 2916, 1590, 1495, 1434, 1415, 1390, 1379, 1369 | 10/10 |
| Mobile 390x844 | 1076, 1344, 1318, 1321, 1302, 1397, 1370, 1280, 1325, 1285 | 10/10 |

An initial fresh-page browser measurement reached a usable dashboard in 762 ms; its first asynchronous external country-resource initialization took approximately 64 seconds. This background initialization is not included in activation-to-usable-dashboard latency and does not block the twelve analytic tabs. Subsequent country resources are reused. The sample's computed country count is one.

## Prerequisites

- Node.js/npm for the existing root Jest suite and offline generator; Python only if using the local server command below.
- Install root dependencies with `npm install` if absent. Do not install API-service dependencies for this feature.
- Curated routes must pass the provenance/licensing/swimming-access gate in [sample-data-contract.md](contracts/sample-data-contract.md).
- Use only the committed synthetic data and synthetic personal-import test fixtures. No real exports or private-data folders are required.

## 1. Verify reproducible sample resources

From repository root:

```powershell
node scripts/generate-sample-data.js --check
npm test -- --runInBand __tests__/sample-data-utils.test.js
```

Expected: checked-in payload matches deterministic generation; required year/month/sport/equipment/route/PB invariants pass; no dangling associations or malformed fields; payload <= 4 MiB. Test local date/start-hour hydration under UTC, America/Los_Angeles, and Europe/Berlin using child-process timezone configuration. Include DST and year-boundary cases without changing the parent process timezone permanently.

Regenerate intentionally with `node scripts/generate-sample-data.js`, inspect the public output diff, and rerun `--check`. Keep licenses and source metadata alongside data. See [data-model.md](data-model.md) for units and counts.

## 2. Run focused integration regressions

Run the corresponding smallest suite immediately after each touched slice; this combined command is the final cross-boundary check:

```powershell
npm test -- --runInBand __tests__/sample-data-utils.test.js __tests__/dashboard-import.test.js __tests__/analysis-counter.test.js __tests__/dashboard-heatmap.test.js __tests__/export-utils.test.js __tests__/dashboard-export-download.test.js __tests__/dashboard-media.test.js __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js __tests__/visualization-availability.test.js
```

Expected: all relevant assertions pass. Extend existing suites rather than create parallel orchestration harnesses. Deferred-promise tests must exercise the race matrix in [demo-interaction-contract.md](contracts/demo-interaction-contract.md), including stale errors/timers, invalid resources, media ownership, PB reset, and counters. Observe callbacks first and assert afterward when production code intentionally catches callback exceptions.

## 3. Serve and open

If the existing app server is available, reuse it. Otherwise, from repository root:

```powershell
python -m http.server 8003
```

Open `http://127.0.0.1:8003/`. Use another free port if needed. No frontend build, API start, or generator run is required for visitors using the committed assets.

At desktop 1440x900 and mobile 390x844, load a fresh page and activate "Use exemplary data" using mouse/touch and keyboard. Confirm one activation opens the regular dashboard, no file dialog/account appears, controls do not overlap, and busy/error feedback is accessible. Check the console for classic-script syntax/global-collision errors.

## 4. Inspect views and real routes

- Compare 2021 and 2025 in distance, physiological/pace, equipment and timelines, cycling PB, distributions, workout-time, calendar, word cloud, pie charts, and lifetime statistics. Verify meaningful differences, rest days, and all sports/years.
- On the heatmap, test All years and every individual year with each sport. Inspect regional framing and neighborhood detail: continuous public corridors, frequency contrasts, no cross-land swims, no indoor/pool tracks, and no geographic jumps. Compare representative geometry against its recorded source and access evidence.
- Change year/sport rapidly while rendering; ensure old segments and hover counts never reappear. Check preserved zoom behavior and genuine empty combinations with synthetic test data.
- Confirm the media gallery follows the established no-media behavior, not a broken enabled tab.

## 5. Exercise failures and replacement

Use browser request interception or injected test dependencies to delay/fail the sample request and return malformed/unsupported data. Check retry and personal import remain possible and any previously committed history remains intact.

Test sample-to-personal and personal-to-sample replacement with small synthetic imports. Delay requests to cover both completion orders; verify stale progress/errors cannot override the latest selection and no activities, tracks, equipment, or PBs leak between datasets. Inspect counter requests: sample activation sends no completed-analysis increment, whereas each committed personal import retains its existing single increment. An initial counter read is allowed.

## 6. Export and media lifetime

Export every available sample visualization and PB detail using the existing preview/download flow. Inspect actual downloaded images, not just DOM labels. "Synthetic sample training data" must remain readable in every supported aspect ratio and presentation/humor mode, including recomposition. Heatmap capture context must match the selected year/sport.

Start a sample export, switch to personal data before capture finishes, and confirm the result remains synthetic. Repeat personal-to-sample with synthetic media fixtures: old export media stays usable until its capture completes, while the new dashboard has no stale gallery content or late URL creation. New personal exports must carry no sample label.

## 7. Measured acceptance

- SC-001: Run 10 cold sample loads for each recorded desktop/mobile setup at 20 Mbps with browser cache disabled. Record browser/device, throttling settings including latency, activation-to-populated-dashboard times, and failures. At least 9/10 trials per setup must complete within 15 seconds. Payload size alone does not establish compliance.
- SC-002 through SC-005: Retain data-audit results, representative desktop/mobile map screenshots, downloaded exports, and race/isolation test outcomes. Browser checks complement, rather than replace, geometry/source review.
- SC-006: Evaluate five first-time visitors. At least four must independently open examples, compare two years, explore the heatmap, and locate personal import within three minutes; all five must recognize synthetic data. Report this gate as unverified until real participants complete it; developer walkthroughs are not a substitute.

Do not publish private participant information or personal workouts with validation evidence. Update README/import documentation to describe the example entry, fixed sample years, synthetic identity, and public-resource network requests accurately.