# Quickstart: Validate Swim Heatmap Recovery

This is the implementation acceptance guide. Results below distinguish executed checks from planned acceptance scenarios.

## Execution Evidence (2026-10-21)

- Setup: existing root dependencies and Jest Node environment are available; no install or new dependency is required. Existing ignore rules cover private-data, node_modules, coverage, dist/build, environment files and logs. No publishing, Docker, ESLint, Prettier, Terraform or Helm setup is introduced.
- Fresh pre-edit baseline: `npm test -- --runInBand __tests__/zip-importer.test.js __tests__/dashboard-heatmap.test.js` passed 2 suites / 49 tests. This is a new run, separate from the specification-stage baseline and synthetic reproduction.
- Helper-only validation: importer suite passed all 47 existing tests.
- US1 red evidence before the production fix: `npm test -- --runInBand __tests__/zip-importer.test.js` produced 7 intended failures / 47 passes. All six `retains a standalone Swim route despite ...` cases lost or truncated GPS; `preserves standalone Swim endpoints and the 2000-point cap with full summary fields` had no route. `npm test -- --runInBand __tests__/heatmap-utils.test.js __tests__/dashboard-heatmap.test.js` then produced 2 intended import-to-segment failures / 71 passes after correcting a test-only segment-ID deduplication expectation. Both `retains imported Swim segments across sport filters` cases lacked the Swim activity. These failures assert real missing geometry, not parser/mock exceptions; dashboard controls themselves already passed.
- US1 green evidence: the singleton-only correction passed all 54 importer tests; the separate heatmap-utils/dashboard-heatmap command passed all 73 tests. Real browser import on `http://127.0.0.1:8762` decoded all three standalone FIT points, produced seven Swim segments, and showed the map for All/Swim but not Bike/Run. At 1440x1000 the 1337x480 route canvas contained 1,085 nontransparent pixels; a screenshot showed the expected two-leg synthetic lake route.
- US2 red evidence before shared segmentation changes: importer suite produced 11 intended failures / 60 passes. Failing names cover `assigns records to exactly one shared owner` for overlap/adjacent endpoints, all seven `rejects the entire shared interval set` cases, `does not assign an untimed shared FIT file to the first activity`, and `omits ambiguous shared GPS points rather than leaking them across sports`. Run/Bike, Bike power, corrupt Strava isolation and standalone TrainingPeaks Swim compatibility cases already passed. The new export-utils/dashboard-export-download command passed 37 tests without changing export production code.
- US2 green evidence: all 71 importer tests passed immediately after the shared-selection correction. Final focused command `npm test -- --runInBand __tests__/zip-importer.test.js __tests__/heatmap-utils.test.js __tests__/dashboard-heatmap.test.js __tests__/dashboard-export-download.test.js __tests__/export-utils.test.js __tests__/index-script-syntax.test.js` passed 6 suites / 261 tests.
- Real browser decoding: `compressed.zip` retained all three Swim points using the actual gzip/JSZip/FIT stack. `shared.zip` produced three distinct three-point routes classified Swim/Bike/Run. `ambiguous.zip`, with all windows overlapping, produced no GPS tracks. `trainingpeaks.zip` produced the same three Swim points; its visible TrainingPeaks upload also opened a working Swim heatmap with seven segments.
- Desktop/mobile image checks: actual app imports and export actions were exercised at 1440x1000 and 390x844. The fresh mobile import fit all three points inside its map bounds; resizing an already zoomed desktop map intentionally preserves its viewport and is not a new initial fit. Both generated preview images decoded as 1080x1080 PNGs with Sport: Swim, and screenshots showed the expected complete two-leg route without overlaying text. The mobile first-fit canvas measured 287x480. Screenshots were inspected in the browser session, not added to the repository.
- **Remaining acceptance gap (T018)**: clicking Download executed the existing browser fallback and displayed its expected destination-limitation toast, but this integrated browser did not emit a Playwright download event and no new Heatmap PNG appeared in the standard Downloads folder. Native downloaded-file saving and inspection therefore remain unverified. The rendered PNG preview, export target/context, blob saving and browser fallback are covered by the focused tests and preview checks, but are not represented as proof of native filesystem delivery. Complete this one check in a regular browser by downloading the Swim preview and opening the saved PNG; no production export change is justified by this automation limitation.
- Local-only warnings: the existing remote analysis-counter API rejected the localhost origin via CORS; imports and maps still completed. Existing icon warnings were unrelated. No API policy or unrelated UI was changed.
- Scope review: production changes are limited to ownership selection and `segmentFitRecordsByActivity` in `src/zip-importer.js`; no public signature/global bridge, GPX parser, TrainingPeaks session/error behavior, simplification cap, script order, UI registration, network request, storage, API, CLI or project dependency was changed. `git diff --check` passed. Temporary encoder packages and generated synthetic data remain outside tracked project changes.

### Requirement Review

| Requirements / outcomes | Evidence / status |
|-------------------------|-------------------|
| FR-001, FR-006, SC-001, SC-004 | Six standalone timing/timestamp/locale/compression cases plus cap case went red, then green; real imports preserve expected points. |
| FR-002 | Real imported tracks pass All/Swim inclusion and Bike/Run exclusion; dashboard Swim/empty-state tests pass. |
| FR-003, SC-002 | Record-identity and combined-import shared-window tests went red, then green; actual shared/ambiguous FIT archives match expected ownership. |
| FR-004, SC-003 | Run/Bike route parity, Bike power, one-parse invariant, existing TrainingPeaks session and complete-failure tests pass; real TrainingPeaks upload renders Swim. |
| FR-005 | Empty/nonfinite/identical/single-point route tests, corrupt Strava neighbor isolation and unchanged TrainingPeaks complete rejection pass. |
| FR-007 | Import documentation explains observed root cause, coverage gap, shared-boundary limits and unconfirmed applicability to personal exports. |
| FR-008, SC-005 | Capture target/context, preview and save/fallback tests pass; actual desktop/mobile PNG previews show route. Native file delivery remains unverified under T018. |
| FR-009 | Synthetic data only; no new runtime dependency, persistence or network behavior. |

The implementation skill treats all files under `checklists/` as read-only reviewer gates. Accordingly, T023's evidence-to-requirements review is recorded here instead of editing `checklists/requirements.md`; its 16 checked items remain specification-quality status, not implementation sign-off. Full feature acceptance must not be claimed until T018's native-file check is completed.

Final execution status: 23 of 24 tasks completed; T018 remains unchecked solely for native downloaded-file saving/inspection. Editor diagnostics reported no errors in touched production code, tests and documentation. The temporary HTTP server was stopped after browser acceptance. No pre/post implementation hooks are configured. No commit or branch was created. The user's actual export remains unexamined; the regression and correction are demonstrated with synthetic data and the real browser decoder.
- Real fixtures: temporary tooling installed outside the repository using `npm install --prefix "$env:TEMP/trianalytica-062-tools" --no-save --ignore-scripts @garmin/fitsdk jszip fit-file-parser@1.10.0`. The ignored local generator `private-data/heatmap-062-fixtures.cjs` runs with `node private-data/heatmap-062-fixtures.cjs` and creates `standalone.zip`, `compressed.zip`, `shared.zip`, `ambiguous.zip`, `trainingpeaks.zip`, and `swim.fit` under `private-data/heatmap-062/`. Garmin Encoder writes FILE_ID, three timestamped RECORD locations per SESSION and normalized sport/session messages; JSZip and Node gzip package them. Standalone CSV starts at 12:00 while its real FIT runs 10:00-10:02 with a shorter 60-second moving duration. The actual fit-file-parser 1.10.0 successfully decoded all three expected points and a swimming session. All fixture coordinates are synthetic; none of these files is committed.

## Prerequisites

- From the repository root, use Node/npm compatible with the existing root package. Run `npm ci` if dependencies are not installed.
- Reuse synthetic data and helpers in the existing test files; do not require or commit a personal export.
- For the browser smoke check, Python and an actual synthetic supported FIT/ZIP fixture with a known outdoor-swim route are needed. Generate it locally during implementation or use an explicitly supplied local export; injected parser mocks alone cannot validate the real decoder.
- A browser network connection may be needed for existing CDN libraries and map tiles.

## 1. Establish Red/Green Regression Evidence

Extend the existing combined-import tests with complete summary headers, not just Activity ID and Filename. Cover a standalone swim with a two-hour summary mismatch, shorter moving duration, and valid GPS lacking timestamps. Use distinct, non-collinear points to avoid accidental simplification assumptions.

```powershell
npm test -- --runInBand __tests__/zip-importer.test.js
```

Before correction, at least one new test must fail because the swim route is absent or truncated. After correction, all importer tests must pass, including existing shared-session, bike-power, one-parse and TrainingPeaks complete-failure checks. Record both results rather than inferring red/green from a final green run.

Add shared-file cases for disjoint windows, overlaps, an exact shared endpoint, missing/invalid bounds, duplicate IDs, missing record timestamps, and no summary timing. Expected ownership follows [the contract](contracts/import-heatmap.md), not the old first-owner fallback.

## 2. Verify Route Selection and Compatibility

```powershell
npm test -- --runInBand __tests__/zip-importer.test.js __tests__/heatmap-utils.test.js __tests__/dashboard-heatmap.test.js
```

Expected: real extracted tracks produce swim segments for All/Swim only. Swim-only and mixed-sport datasets behave correctly; no-GPS and single-point histories show no route. Compressed/uncompressed singleton inputs, German/English summary headers, standalone Run/Bike and Bike power are covered. A corrupt Strava neighbor does not erase the valid swim; corrupt TrainingPeaks input still rejects its whole import.

## 3. Verify Existing Export and Script Contracts

```powershell
npm test -- --runInBand __tests__/dashboard-export-download.test.js __tests__/export-utils.test.js __tests__/index-script-syntax.test.js
```

Expected: existing target registration and download behavior pass; focused Swim-context and heatmap no-data checks use existing harnesses. No script-load or export-registration changes are necessary merely to recover import data.

## 4. Browser Acceptance

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`. If occupied, use another available port and the matching URL.

1. Import the synthetic Strava ZIP with a known standalone outdoor-swim FIT route and mismatched summary timing. Open the heatmap and confirm the expected route under All and Swim, but not under Bike/Run.
2. With Swim selected, use the existing Share/Export action. Inspect the local preview and downloaded PNG: the route must be visible, correctly framed and not replaced by a stale route from another sport.
3. Import a known-boundary multisport recording and verify that each sport has only its expected locations. With ambiguous boundaries, verify conservative omission rather than whole-file attribution.
4. Import the equivalent supported TrainingPeaks swim history separately. Verify visible Swim data and unchanged source-specific import behavior.
5. Repeat the key map/export checks at desktop and mobile viewport sizes. Record the actual fixture, viewports, screenshots and PNG inspection outcome without including personal data.

Stop the temporary server when validation is complete. Browser image inspection is a required delivery check; Jest mocks do not replace it. If no real synthetic FIT fixture can be produced, report the real-decoder/browser acceptance gap explicitly instead of claiming end-to-end success.

## Completion Evidence

- Regression fails before correction and passes afterward; focused compatibility commands pass.
- Ownership assertions match [data-model.md](data-model.md) and [contracts/import-heatmap.md](contracts/import-heatmap.md).
- Browser map and exported image show the recovered swim route.
- Existing import documentation explains the demonstrated trigger and test gap, the shared-boundary limitation, and the unconfirmed applicability to any unexamined personal export.
- No unrelated UI, dependency, API, network or storage changes.