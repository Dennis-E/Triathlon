# Quickstart Validation: Dashboard Arrow Navigation

**Feature**: [spec.md](spec.md)
**Contracts**: [Keyboard](contracts/keyboard-navigation.md), [filter adapters](contracts/filter-adapters.md)

This guide describes acceptance checks to run during implementation. Planning alone does not make these cases pass.

## Prerequisites

- From repository root, use Node.js/npm with root development dependencies installed. Run `npm install` only when needed; no API dependencies or new browser library are required.
- Python is needed only to serve the static frontend. Use an existing local server if available; otherwise select an unused port.
- Use synthetic activities, not private exports or an assumed `test-data/` fixture. A browser fixture should populate the existing activity shape and enable the tabs needed by each scenario; keep fixture setup in existing test harnesses rather than adding product UI.
- Native popup checks require a desktop keyboard and actual Chromium, Firefox, and Safari environments. Record unavailable platforms as unverified, not passed.

## Focused Automated Checks

Run the narrowest changed slice first:

```powershell
npm test -- --runInBand __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js
```

Expected after implementation: traversal tests pass for 2-by-3 cycles, inverse moves, wraparound, manual changes, conditional domains, no-ops, and large Boolean domains. Wiring tests retain classic-script syntax/load order and verify one arrow owner rather than the old focus restriction.

Run existing owner tests when their adapters or render paths change:

```powershell
npm test -- --runInBand __tests__/dashboard-core.test.js __tests__/dashboard-equipment.test.js __tests__/dashboard-scatter-years.test.js __tests__/dashboard-heatmap.test.js __tests__/wordcloud-dashboard.test.js __tests__/pie-charts-dashboard.test.js
```

Expected: single transaction/render per action, dependency normalization, empty-result behavior, large multi-selection, and stale-map completion cases pass. Reuse VM mocks; the Jest environment is Node, not jsdom. When a changed owner has no dedicated existing harness, add its focused behavior case to the existing navigation/wiring VM tests rather than inventing a separate test framework.

After shared navigation and owner changes are complete, run the root regression suite:

```powershell
npm test -- --runInBand
```

No API tests or API startup are needed unless scope is explicitly expanded; this feature does not change the API.

## Start the Frontend

From repository root, when no server is available:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`. If port 8000 is occupied, use 8001 and the corresponding URL. Serve the existing HTML directly; there is no bundler or development compilation.

## Browser Acceptance Scenarios

### 1. Independent Axes and Focus

With synthetic activities imported, open Total Distance, select a filter, and press Down then Right without any click or Tab in between. The view changes once, then the next available dashboard opens immediately. Repeat from tab buttons, chart/content, finite choice buttons, closed palette selects, checkbox controls, and finite stepped ranges.

Press Left at the first available tab and Right at the last. Verify wrapping and that unavailable tabs are skipped. With one available dashboard, horizontal arrows do not flash success. On Personal Bests and Lifetime Statistics, Up/Down changes nothing and does not scroll, while Left/Right remains usable.

### 2. Complete Reversible Combinations

Use the synthetic 2-by-3 domain in the navigation test harness. Verify the exact sequence in the [keyboard contract](contracts/keyboard-navigation.md) from all six starts. Repeat in reverse, then test Down/Up and Up/Down pairs. In the real dashboard, manually choose a filter combination and confirm the next key continues from it.

For Total Distance, cross aggregation boundaries and verify the candidate timeframe is the canonical first/last valid suffix rather than a previously remembered timeframe. Test date ranges without allowing start after end. On Scatter, vary sport/metric/date selections and verify year selections are derived from the resulting domain.

### 3. Binary, Multi-Selection, and Empty Results

Use a small year/word set to inspect the full Boolean subset order and empty selection behavior. Use at least 100 word-selection dimensions in automated tests to confirm values above index 31 change correctly and no full power set is allocated. Change word count and verify current-domain reconciliation.

Use a valid filter combination containing no activities and confirm its existing empty state remains reachable. Confirm structural distribution exclusions are skipped separately and do not eliminate valid missing-data combinations. Verify filters on inactive tabs are unchanged by the active view action.

### 4. Native Controls and Input Exceptions

In each available target browser, test a closed palette select: Left/Right switches dashboards and Up/Down changes the complete view once. Open its native popup using mouse and keyboard; arrows now operate the popup without changing the underlying dashboard. Close with Escape, commit a changed value, commit the same value, and move focus away; workspace arrows must resume immediately after each close.

Verify text/contenteditable editing, a modal opened while focus is transitioning, and continuous numeric editing retain their own arrows. Check Tab/Shift+Tab in the tab bar and elsewhere against existing behavior. Modified arrows, composing input, and arrows outside the workspace must not trigger these shortcuts. Mark OS-popup cases requiring manual interaction explicitly.

### 5. Rendering, Scroll, and Feedback

Capture scroll position before Up/Down and after the resulting render; it must not change due to navigation or focus restoration. Replace a generated filter control during rendering and verify the next Right still works without refocusing manually.

In the VM heatmap harness, defer Leaflet loading, change the sport and then the dashboard, and resolve the old promise. Assert stale work cannot overwrite current output. Repeat alternating directions rapidly; accepted keydowns advance logical selections in order without duplicated actions or blocked horizontal input.

Cue availability must match actual actions from chart/filter focus. Successful changes flash only the matching direction within 250 ms and settle within 1.5 s. No-ops do not flash. Inspect desktop and mobile-sized layouts for cue overlap, and use existing Share/Export to confirm selected-view capture and download still work.

### 6. Timing Sample

Use 1,000 synthetic activities and a controlled case with no more than 100 valid combinations. After dependencies finish loading, record at least 40 arrow actions with timestamps from key dispatch to selected-dashboard or updated-view completion. At least 95% must complete within one second. Measure cues separately against their 250 ms/1.5 s limits. Report browser, dataset, warm/cold dependency status, and failures; do not substitute pure traversal timing for visible view completion.

## Completion Evidence

Record focused and root-suite results, browser/version coverage, all native-popup outcomes, exact combination/inverse results, async rejection checks, timing sample results, and export smoke results. Outstanding browser/platform checks remain explicit acceptance gaps. No live personal data or network analysis API changes are necessary.

### Implementation Session 2026-10-21

- Baseline: 111 navigation/wiring tests passed before application changes.
- Automated regression: all 36 root suites and 721 tests passed after adapter, dispatcher, cue, async, hidden-dialog, and keyboard-animation integration.
- Added coverage includes exact cycles from all six 2-by-3 starts, both inverse directions, candidate-dependent suffixes, valid empty results, constrained dates, 100 Boolean dimensions, 100 real word identities, one-render owner commits, Down then Right without refocusing, editing exclusions, no-op scroll suppression, provider failure atomicity, and feedback timers.
- Async owner cases first use explicitly simulated revisions. Workspace tests separately verify actual input-driven invalidation; tab/data revision integration is not assumed from the isolated owner tests.
- Editor diagnostics: no errors in the shared navigation, state, dispatcher, Heatmap, or Wordcloud modules.
- Browser URL: `http://localhost:8000/`, using the already running static server. The external Wordcloud CDN request blocked page parsing during initial checks. A browser-only request abort is being used to test remaining navigation and the existing dependency-unavailable fallback; this does not verify the real Wordcloud canvas renderer.
- Chromium interaction checks, visual checks, and warm visible-completion timing are recorded below. Firefox/Safari and the remaining external-dependency/export cases are not certified by those checks.
- Performance evidence must include cold first use separately from warmed interactions. A warmed sample alone does not establish SC-005; failed dependency loading must be reported rather than excluded without disclosure.

### Browser Results

- Environment: integrated Chromium 150.0.7871.250 / Electron 43.7.3 on Windows; existing static server on port 8000. All activity and GPS data used for validation were synthetic and stayed in browser memory.
- All 12 tab adapters registered without shared-global syntax errors. All 10 filtered tabs changed on Down and returned to the same canonical selection on Up; Heatmap was tested separately with synthetic GPS tracks.
- Real keyboard sequence from a sport filter: Down changed only the current timeframe, Right immediately selected the next available dashboard, and scroll position remained unchanged. Generated year-checkbox focus was restored to the workspace after control replacement; the next Right selected Equipment without an extra click.
- Native palette select: closed arrows navigated the complete view; Space-opened and mouse-opened popups owned arrows without switching the dashboard; Escape and committing the same value restored workspace ownership immediately. A subsequent Right worked in both cases.
- Text input: Right moved the caret from position 1 to 2 without changing the dashboard. An open export dialog prevented underlying navigation, including before dialog focus moved.
- Browser-discovered defect fixed and regression-tested: a dialog inside a hidden ancestor no longer suppresses workspace shortcuts.
- Heatmap: Down/Up preserved the original canonical sport selection, map center, and zoom 14. Right from the focused map selected Distributions without panning the hidden map.
- Cue timing observed with a MutationObserver: success feedback began after 8 ms and ended after 917 ms. No-op and stale-work feedback behavior is additionally covered by VM/fake-timer tests.
- Desktop screenshot at 1280x900 and mobile screenshot at 390x844 confirmed unchanged cue placement and readable controls; all four cue bounds remained inside the mobile viewport and document width stayed at 390 px.
- Existing Total Distance Share/Export produced a visible PNG preview with natural dimensions 1080x1080. The integrated browser did not emit a download event for the anchor-download smoke attempt, so actual saved-file behavior remains unverified. The existing download regression suite passes.
- Warm visible-completion sample: 1,000 synthetic activities, the existing 76 valid Total Distance combinations, 40 consecutive Down actions. Completion was observed after Chart.js afterRender and two animation frames, not merely after selection mutation. P95 was 34 ms, maximum 36 ms, and 40/40 actions completed below one second.
- Before the keyboard-only animation fix, the same visible-completion probe measured 1032/1033 ms because the existing Chart.js animation default is 1000 ms. Keyboard transactions now temporarily suppress animation; the default was verified restored to 1000 ms afterward. Manual filters retain their existing behavior.

### Remaining Acceptance Gaps

- T044: full chart/map/Wordcloud export smoke and actual saved-file verification are incomplete. The real Wordcloud CDN response blocked parsing in this environment and was aborted only in the test page; the native Wordcloud canvas and its image export were therefore not browser-certified. External map tiles also encountered failed/aborted requests during test navigation. No production CDN, tile, or API configuration was changed.
- T045: Firefox and Safari are not available in this Windows environment; their native popup and editing matrices require a separate browser run. The Chromium checks above are not a substitute.
- T046: the measured warm path passes, but cold external-dependency loading has no successful complete measurement. The Wordcloud request failure means SC-005 cannot be declared fully verified across cold first-use cases.
- The existing analysis-counter request reported a localhost CORS failure. This was outside the feature scope; counter/API code and network behavior were left unchanged.
- Root tests, editor diagnostics, script order, privacy/dependency boundaries, and all locally executable feature checks pass. The open acceptance gaps are deliberately left unchecked in tasks.md; no spec-quality checklist markers were modified.