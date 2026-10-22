# Validation Guide: Reliable PNG Export Downloads

## Follow-up: Single Save Flow (2026-10-22)

The user reported a second save dialog after confirming the first. The native-picker/write-restriction recovery path could start an ordinary browser download after the initial dialog, prompting again. Download now uses one browser-managed anchor handoff directly, without calling `showSaveFilePicker` or creating a second write/retry path. This follow-up supersedes the native-picker, initial-directory hint and app-observed cancellation checks below; earlier results are historical implementation evidence. Browser preferences now control Downloads, prompting and filenames; browser-side cancellation after handoff is not observable by the app.

The regression first failed because the native picker was called. After the fix, the existing download suite verifies one anchor handoff and zero picker calls even when a picker is available, no repeated download from the cleared preview, PNG byte identity, handoff failure/retry, reentrant-click protection, fresh exports and PB opening/focus ownership. Updated focused validation: download, export-utils and script-syntax suites passed, 176 tests total. The actual user's OS dialog was not automated. User edits to tasks.md were left untouched.

These are future implementation acceptance checks, not tests already executed during planning. See [contracts/export-download.md](contracts/export-download.md) and [data-model.md](data-model.md).

## Prerequisites and Focused Checks

Use root dependencies (`npm install`), Node/npm and Python; synthetic or explicitly authorized local activity data for all 12 tab targets and PB detail. Do not assume private exports or `test-data/` provide fixtures. Use Windows 11 Photos and stable Edge/Chrome/Firefox. Native dialogs/Photos require manual checks when unavailable to automation; mark unperformed cases unverified.

From the repository root:

```powershell
npm test -- --runTestsByPath __tests__/dashboard-export-download.test.js
npm test -- --runTestsByPath __tests__/export-utils.test.js __tests__/index-script-syntax.test.js
```

Extend the existing VM harness before implementation for:

- Genuine small PNG instead of `hello`, matching Blob bytes and valid MIME/signature/dimensions; malformed base64/header/truncation and decode failure.
- Immediate picker, Downloads hint, existing filename/type, write-before-close and no closure before close resolves.
- Missing picker, picker cancellation/denial, create/write/close permission denial, one fallback and accurate current feedback.
- Storage/write-stage AbortError, no unsafe blanket fallback, best-effort abort, retry/stale-toast clearing.
- Deferred promises for double clicks/manual dismissal; stable bytes and no stale completion closing new previews.
- Standard/PB closure and focus, fresh later export, target/no-data behavior unchanged.

Keep assertions outside callbacks production catches. Add DOM/image mocks to existing tests, not jsdom/new frameworks. Mocks do not prove actual decoding, activation or platform policy.

## Browser Run

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`; if occupied use `8001` and matching URL. Use localhost/HTTPS for native selection; policy may still deny it. Planning does not start an extra server.

## Actual-File Matrix

For every tab target and PB detail exercise native saving in Edge/Chrome and ordinary downloading. Record browser/version, target/filters, route, actual destination, bytes, decoded dimensions, Photos result, feedback and closure timing. Include calendar, lifetime statistics, wordcloud and heatmap.

1. Preview/save: verify initial Downloads where honored, then another folder/name. Inspect the actual file, not mere existence/download notification.
2. Open in Windows Photos: non-empty PNG, complete 1080-square composition matching preview/branding/filters. Browser decode supplements but does not replace Photos.
3. Verify closure within one second after native completion and dashboard usability. PB export also closes its originating enlarged surface; unrelated dialogs remain.
4. Firefox/picker unavailable: one readable ordinary download, informational destination message, closure after handoff without disk-completion claim.
5. Export another target/filter: fresh preview and output, not previous content.

## Recovery and Failure

1. Cancel native picker: zero download, no success/error, preview retained and retry possible.
2. Reproduce actual write denial where possible. Separately inject a picker handle rejecting `createWritable()` with `NotAllowedError`, retaining actual prepared PNG/anchor downloading. Label injection as routing evidence, not proof of real policy reproduction.
3. Verify one fallback opening in Photos. Message says selected destination was not saved and browser controls new location; no contradictory final error. Leftover empty entry is not success and is not deleted automatically.
4. Simulate unrecovered write/close error and failed handoff: current error, retained preview, later retry. For safety-check rejection, genuine storage failure, unknown failure and write-stage AbortError, verify zero automatic fallback downloads; picker AbortError is silent cancellation. Cleanup failure must not mask original cause.
5. Double click while pending: one dialog/download. Dismiss while pending: bytes remain valid and completion cannot close subsequent preview. Start from PB detail opening A, dismiss A, open B and complete the old save/handoff: B and any newer preview must stay open with focus undisturbed. Repeat with B displaying the same PB record to verify per-opening rather than record-only identity.
6. Invalid preparation/no-data: no dialog/invalid download, selected visualization retained with recovery.
7. Inspect network activity scoped to export preparation/save/recovery: zero image/activity uploads. Existing CDN/API traffic outside this operation is not export upload.

## Evidence

Record pass/fail against FR/SC identifiers in [spec.md](spec.md). Keep personal data/downloaded exports out of version control. Explicitly list missing native-dialog, actual-policy, target/route, mobile or Photos evidence rather than inferring success from Jest/handoff.

## Implementation Evidence (2026-10-22)

- Baseline: download, export-utils and script-syntax suites passed (3 suites, 133 tests).
- PNG preparation milestone: 3 suites, 151 tests passed after the new cases first failed on missing validators. Electron/Chromium 150 on Windows decoded the actual 68-byte 1x1 PNG fixture using the production preparation helper and exposed the new utility browser bridge. This is not a Photos or native-dialog result.
- Python is unavailable on PATH. A temporary dependency-free Node static server serves `http://127.0.0.1:8000`; no application/server file was added. The local analysis-counter request is blocked by CORS, unrelated to local export preparation.
- Checklist gate: requirements.md 16/16 checked, no unchecked criteria; checklist unchanged.
- Git worktree: existing untracked feature documentation preserved; no pre-existing source changes.
- Existing Node ignore patterns cover dependencies, coverage, builds, environment files and logs. Static app has no frontend publishing/build requirement; no new ignore file is needed.
- PB details use `pbDetailOverlay`, `openPbDetail()` and `closePbDetail()`; the latter restores focus and clears the active model. Per-opening identity must therefore be captured before invoking cleanup.
- All 12 current tab capture targets and PB detail use the shared preview/download flow. Validation will use synthetic browser data, not private exports.

| Targets | Native save | Ordinary download | Photos | Timing / Privacy |
|---------|-------------|-------------------|--------|------------------|
| totalDistance, paceMetrics, equipment, equipmentTimeline | Not run | Not run | Not run | Not run |
| personalBests, heatmap, distributions, workoutTime | Not run | Not run | Not run | Not run |
| trainingCalendar, wordcloud, pieCharts, lifetimeStatistics | Not run | Not run | Not run | Not run |
| PB detail | Not run | Not run | Not run | Not run |

For completed browser cases, record browser/version, target/filter, route, destination, byte length, dimensions, FR/SC references, timing and pass/fail explicitly below. Injected policy errors are routing evidence only.

### Automated and Browser Results

- US1 preparation, US2 outcomes, US3 ownership/closure and US4 picker options passed their focused tests after the respective new cases first failed. Full preparation tests cover decode readiness, invalid PNG rejection, retained filters, regeneration and no-data behavior. PB tests execute the actual opening/closing functions with only chart rendering stubbed.
- Cross-target regression exposed a pre-existing missing Distributions title/filename registration in export utilities. Both entries were added so the existing capture target is accepted; all 12 tab targets plus PB detail now pass utility context/filename/no-data checks.
- Existing preview click/close/Escape wiring was inspected; no markup or event-binding change was required. The shared handler owns readiness, pending state and closure.
- Browser: VS Code integrated Electron 43.7.3 / Chromium 150.0.7871.250 on Windows. Input: four synthetic Run/Bike/Swim activities with titles, dates, distance, duration, equipment and heart rate; no private data.
- Real capture/composition/assets and browser image decoding were exercised below. Native writes used an injected in-memory handle, NOT an actual OS file dialog or completed disk save. Every successful image was 1080 by 1080 and had multiple colors in a 64-square pixel sample. No non-GET requests occurred during the capture matrix (FR-012/SC-007).

| Target | PNG bytes | Pixel colors | Injected write / owned closure | Elapsed ms |
|--------|-----------|--------------|--------------------------------|------------|
| totalDistance | 151742 | 452 | PASS | 9 |
| paceMetrics | 156281 | 456 | PASS | 7 |
| equipment | 110642 | 404 | PASS | 6 |
| equipmentTimeline | 116320 | 378 | PASS | 7 |
| personalBests | 84264 | 196 | PASS | 7 |
| distributions | 108865 | 290 | PASS | 7 |
| workoutTime | 136713 | 419 | PASS | 7 |
| trainingCalendar | 133719 | 368 | PASS | 7 |
| wordcloud | 98597 | 263 | PASS | 8 |
| pieCharts | 135025 | 471 | PASS | 7 |
| lifetimeStatistics | 135753 | 325 | PASS | 7 |
| PB Run 5km detail | 100609 | Not sampled | Denied write -> one browser handoff / closure PASS | 13 |
| heatmap | Not captured | Not sampled | No GPS input; capture not verified | Not measured |

- PB restriction routing: injected `createWritable()` NotAllowedError caused exactly one anchor click containing all 100609 PNG bytes and the expected PB filename. Both owned surfaces closed, focus returned to the originating button, and feedback explicitly said the selected destination was not saved. This proves routing/handoff, not actual disk persistence (FR-004/FR-007/FR-009, SC-002/SC-003).
- PB race: export A pending -> dismiss A -> open B -> prepare newer preview -> finish old save. Both a different PB record and the same record reopened retained their new identity, visible detail/preview and focus; Download became enabled after the old attempt settled (FR-007/FR-008/FR-010).
- Browser cancellation/failure/retry: picker AbortError returned cancelled with preview retained; write-stage AbortError returned failed with preview retained and zero automatic fallback clicks; successful retry closed owned surfaces and hid stale error feedback (FR-004/FR-005/FR-006/FR-009, SC-004/SC-006).
- Downloads option was confirmed on actual production handler calls alongside PNG type and suggested filename; an actual initial directory and user-selected alternative have NOT been verified (FR-002/FR-003, SC-005).

### Remaining Acceptance Gaps

- Integrated-browser anchor click closed the preview, but Playwright received no download event within 15 seconds and no matching synthetic test download appeared in the user's default Downloads folder. Actual ordinary-download bytes on disk and opening in Windows Photos therefore remain unverified, not passed.
- Real native save dialog, chosen alternative folder/name, actual permission-policy denial, stable standalone Edge/Chrome/Firefox and mobile are not verified. Injected handles/errors are explicitly not substitutes for these checks.
- Heatmap capture lacks a GPS-enabled synthetic dataset. Attempting the hidden/unavailable capture surface produced an existing zero-sized-canvas error, not a valid image. This case is not counted as a successful heatmap/no-data acceptance and is not diagnosed as part of the download fix.
- Keep T011, T018, T028 and T032 open until actual-file/Photos/dialog/full-matrix evidence is obtained. Development and mock/browser-routing checks do not establish complete feature acceptance.

### Final Development Status

- Final focused regression command: `npm test -- --runTestsByPath __tests__/dashboard-export-download.test.js __tests__/export-utils.test.js __tests__/index-script-syntax.test.js __tests__/dashboard-equipment.test.js __tests__/pie-charts-dashboard.test.js __tests__/wordcloud-dashboard.test.js`.
- Result: 6 suites passed, 205 tests passed. No new editor diagnostics in the three source modules or the two changed test files.
- 29 tasks are completed; T011, T018, T028 and T032 remain open for external/manual acceptance. Checklist markers were not changed.
- FR-001/SC-001: structure, decode and byte equality automated; eleven real tab captures and PB detail decoded in browser. Actual disk files/Photos and GPS heatmap are unverified.
- FR-002/FR-003/SC-005: immediate picker options, fresh handles and suggested names automated; real folder/name selection is unverified.
- FR-004/FR-005/FR-006/FR-009/SC-003/SC-004: phase-specific errors, quiet cancellation, single fallback, cleanup, retry and feedback automated and exercised with injected browser restrictions. Real policy denial/on-disk fallback remain unverified.
- FR-007/FR-008/FR-010/SC-002/SC-006: closure after commit/handoff, double-click guard, immutable bytes, opening ownership and stale-completion/focus races automated; actual PB/browser races and closure timing exercised successfully.
- FR-011: twelve tab/PB utility contracts and six directly relevant suites passed. Eleven real tab captures plus PB detail passed browser preparation; GPS-enabled heatmap/full cross-browser file matrix remains open.
- FR-012/SC-007: no upload path added; zero non-GET requests observed during the synthetic browser capture matrix.
- No constitution deviation, new dependency, new application file, build step, API-service change or import-parser change. No claim that the Windows unreadable-file report was reproduced or fully resolved by verified disk-file acceptance.