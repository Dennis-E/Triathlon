# Quickstart: Validate Equipment Pace Colors

This guide describes validation after implementation. Planning does not establish that these application behaviors already pass.

## Prerequisites

- Root dependencies installed with `npm install` if absent; use the repository's existing Node/Jest tooling.
- A browser with developer tools and Python available for the documented static server. No bundler, API service, private export, or new package is required.
- Synthetic equipment activities only. For each shoe/bike item, use one valid 10 km activity: shoe durations 3600, 3000, 2400 seconds produce 6:00, 5:00, 4:00 min/km; bike durations 1800, 1440, 1200 seconds produce 20, 25, 30 km/h. Use the existing Equipment test fixture shape and import schema; do not commit personal files.
- Use [data-model.md](data-model.md) for range rules and [contracts/equipment-pace-colors.md](contracts/equipment-pace-colors.md) for exact UI/rendering expectations.

## Focused Automated Validation

From the repository root, run each relevant command after the corresponding implementation slice:

```powershell
npm test -- --runInBand __tests__/equipment-utils.test.js
npm test -- --runInBand __tests__/dashboard-equipment.test.js
npm test -- --runInBand __tests__/distribution-utils.test.js __tests__/index-script-syntax.test.js __tests__/tab-navigation.test.js
npm test -- --runInBand __tests__/dashboard-export-download.test.js
```

Expected outcomes:

- Utility tests prove finite positive bounds, single/equal/empty/invalid cases, tightly clustered values, and unchanged input order/normalization.
- Equipment VM/Chart tests verify selector state/visibility, palette switching, actual shared gradient coordinates/stops, draw/resize lifecycle, safe fallback, and unchanged data/labels.
- Wiring tests preserve classic script syntax, existing navigation IDs/dispatch, and existing palette semantics.
- Export tests exercise Equipment capture and the existing preview/download pipeline with both schemes and retain no-data behavior.

Extend existing test files rather than introducing a parallel harness. Run the applicable narrow test immediately after each code edit; do not defer all checks until the feature is complete.

## Browser Startup

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`. If port 8000 is occupied by an unrelated server, use an available port such as 8001 and adjust the URL. Load synthetic fixture data through the established import flow; controlled fixture injection may supplement rendering tests but does not replace one import-to-export pass.

## Acceptance Walkthrough

1. Open Equipment, choose Pace and Shoes. Confirm the familiar Color scheme selector and default On fire. Verify all original equipment names, values, order, and relative-speed bar lengths remain intact.
2. With the three-shoe fixture, verify the slowest endpoint is yellow, the middle endpoint intermediate, and the fastest endpoint red. Sample interior bar pixels away from rounded edges, text, and antialiasing: the fast bar stays yellow through the slowest position and progresses afterward. The two longer bars have the same color at a common x position.
3. Repeat with Bikes: 20 km/h is yellow, 25 intermediate, 30 red. Verify a distinct narrow range, such as 29.9-30 km/h, still uses the full logical color range; respect the pixel-resolution limit documented in the contract.
4. Select Monochrome blue. All eligible bars become the existing blue without changing bar geometry or values. Switch Shoes/Bikes, to another metric, away from the tab and back: the choice remains retained. All keeps its original type colors; inapplicable views hide the selector and omit it from the active-filter summary.
5. Exercise one item, identical values, equal ties within a varied range, invalid values, and no valid rows. Confirm yellow for degenerate fire comparisons, no invented data, and the existing empty state. Changing the displayed set must refresh the range.
6. At 375 px and 1280 px viewport widths, use keyboard focus and arrow keys to operate the native selector. Check screenshots for overlap, clipping, readable values, and unchanged navigation. Resize while fire is active and confirm the gradient follows the new scale geometry.
7. Immediately after choosing each scheme, invoke Equipment Share/Export. Inspect the preview and downloaded PNG: both match chart colors, retain fire progression when selected, and show readable names/values. Check interior image pixels as well as the original canvas; mocked export completion alone does not satisfy this check.
8. With 100 synthetic equipment items, measure from selecting a scheme to the next settled rendered frame. Record browser/version, device, viewport, item count, and measured time; each supported switch must complete within one second on that same reference device.

## Completion Evidence

Record focused test outcomes, desktop/mobile screenshots, original-canvas and exported-image pixel checks, preview/download results, and the timing measurement. SC-001 through SC-006 must all be covered. No production/private files or personal screenshots belong in committed fixtures. API tests are unnecessary because the API surface is unchanged.

### Implementation Log (2026-10-26)

- T001: Existing root dependencies available; Node-environment Jest baseline passed all 199 tests in the six scoped suites (11.547 s). No baseline failures. Existing gitignore covers dependencies, build outputs, environment files, logs, coverage, and private data; no new tooling-specific ignore file is needed for this static, non-published app.
- T002-T003: Synthetic fixture cases and observable chart/gradient harness added; Equipment suite passed 7/7 before production changes.
- T004-T007: New selector/state tests first failed for the absent control, then passed with the familiar native select and local retained state (90 tests across Equipment and syntax suites).
- T008: Keyboard selection exercised at 1280x900 and 375x900. Blue/fire changed correctly; the mobile control stayed inside the viewport without horizontal overflow. Native select was closed before final screenshots.
- T009-T012: Range/drawing tests first failed for the absent helper and solid fills; helper passed 34 tests, then integrated range/rendering passed 47 tests. Shared gradient geometry, resize, invalid/empty data, single/equal values, close distinct bounds, palette isolation, and input/bar invariants covered.
- T013: Actual desktop shoe pixels were slowest yellow `[253,224,71]`, middle endpoint `[250,139,33]`, fastest endpoint near red `[220,39,37]`. The longer bars shared `[251,169,46]` at the same x position. Mobile bikes likewise produced yellow/intermediate/red endpoints. Equal/single bars were exactly yellow. Close 29.9/30 bounds were retained; physical sampling observes the contract's subpixel/rounded-edge limit. Resize, no-overflow, and screenshot checks performed at both widths.
- T014-T017: Equipment capture/preview/download and no-data regression tests added; expected Pace-animation failure fixed only for Pace. Equipment/export/syntax/navigation passed 138 tests. Existing capture target, palette helpers, script order, tab IDs, filenames, and global export wait unchanged.
- T018: The real `importCsvText` flow parsed six synthetic Strava-format CSV rows, including duplicate Distance columns, into the expected 10 km activities and durations (shoes 3600/3000/2400 s; bikes 1800/1440/1200 s). Existing dashboard navigation then opened Equipment. Both schemes exported through real html2canvas/composition at desktop/mobile widths into 1080x1080 PNGs; preview screenshots retained readable equipment names and pace values.
- Export pixel evidence: desktop Fire preview contained 161593 yellow, 14822 orange, and 4443 red interior pixels; desktop blue contained 190509 exact `#2563EB` pixels. Mobile Fire contained 21915 yellow and 577 red pixels; mobile blue contained 25967 exact blue pixels. Counts are evidence of nonblank intended palettes, not reference-image thresholds.
- Download boundary: the real Download button produced the existing `trianalytica-equipment-*.png` filename and a PNG anchor payload byte-identical to the preview for both schemes and both widths. The integrated browser did not emit a Playwright download event or leave an observable file in the usual Downloads folder. OS-level file delivery is not claimed; the emitted PNG payload and existing save-picker/anchor behavior are covered, including existing picker tests. No production download code was changed.
- All/non-Pace/tab-return checks: All summary omitted Colour scheme and retained original type colors; other metrics hid the selector; returning through Equipment Timeline retained blue. Invalid-only Pace showed the established empty state and blocked export with "Nothing to export for this selection yet."
- T021: Windows reference session: VS Code 1.140.0 / Electron 43.7.3 / Chromium 150.0.7871.250; Node v24.19.0; 28 reported logical processors; viewport 1280x900; DPR approximately 1. With 100 synthetic shoes, selection through two animation frames took 36.5 ms for Fire and 38.1 ms for blue, below the one-second target.
- Existing environmental warning: the analysis counter's remote CORS request fails from localhost; it does not block this local Equipment flow and was not changed. Local source-script cache was bypassed in the test browser to avoid stale utilities after edits.
- T019-T020: Equipment documentation updated. Final focused regression passed all 218 tests in six suites (1.157 s); `git diff --check` and editor diagnostics passed. No API tests required; no API changes made.
- T022: FR-001/002/003/010/012 covered by selector tests plus keyboard/responsive checks; FR-004 through FR-009 by range/drawing tests and real pixels; FR-011 by mixed/other-metric/tab-return checks; FR-013 by real captures, matching emitted PNG payloads, and export regression. SC-001 measured above; SC-002/003 verified by the performance comparisons; SC-004 by data/geometry and compatibility checks; SC-005 at both required widths; SC-006 verified at preview/emitted-PNG level with the OS-file-delivery boundary explicitly retained above. No feature implementation blocker remains. Static app URL: `http://localhost:8000`.