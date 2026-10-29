# Quickstart Validation: Pinned Tooltip Callouts

This guide describes implementation acceptance checks. Recorded implementation results are listed below; planning alone did not imply these checks had passed.

## Prerequisites

- Use the repository root with its existing Node/npm dependencies installed; run npm install only if needed.
- Python is available for the existing static server. No bundler, API service, new dependency, or build step is required.
- Use synthetic activity/chart/media data or explicitly supplied local input. Do not commit raw exports, private data, or screenshots containing personal activity details.

## Focused Automated Checks

Run the relevant existing suite immediately after each implementation slice:

```powershell
npm test -- --runInBand --runTestsByPath __tests__/lifetime-statistics-dashboard.test.js
npm test -- --runInBand --runTestsByPath __tests__/export-utils.test.js
npm test -- --runInBand --runTestsByPath __tests__/dashboard-export-download.test.js
npm test -- --runInBand --runTestsByPath __tests__/dashboard-tooltips.test.js __tests__/tooltip-selection-utils.test.js __tests__/tab-navigation.test.js
```

Extend the existing owner-specific heatmap/media/calendar/wordcloud/pie/PB tests only for changed projection behavior. Keep Node-compatible injected-document/VM harnesses; do not add jsdom merely for this feature.

Expected results: Lifetime has no separate pin symbols but supports item activation and selected-state transitions; geometry finds bounded placements or the documented compact/failure result; real composition draws one bubble; all 13 IDs/mappings and immutable export resources remain correct. See [the test contract](contracts/pinned-callouts.md) for precise assertions.

## Browser Startup

```powershell
python -m http.server 8000
```

Open http://localhost:8000. If that port is in use, serve on a different available port. Use the existing local import/demo workflow with non-private representative data for the required views; do not assume test-data contains fixtures.

## Lifetime Interaction

At both 360 px and 1440 px viewport widths:

1. Open Lifetime Statistics with populated data. Verify zero separate Pin data symbols and no empty placeholder buttons.
2. Click a statistic and move away for at least 30 seconds; verify the detail remains selected. Select another statistic, then the same statistic again, and verify replace/toggle behavior.
3. Repeat with touch input and with keyboard focus plus Enter/Space. Space must not scroll the page or toggle twice. Verify old targets lose their selected state and Escape/dismiss restores focus only to a still-connected target.
4. Exercise sport rows without breaking table semantics. Change filters or imported data and verify no stale selection or focus state survives.
5. Open empty Lifetime Statistics. Verify no fabricated selectable items or orphan pin controls and unchanged no-data export behavior.

## Export Acceptance Matrix

Use the [capture coverage table](contracts/pinned-callouts.md) to cover every one of the 13 views and the PB-detail variant. For each, pin a real item, activate Share/Export, inspect preview, and download the PNG.

- Confirm exactly one rounded outlined speech bubble, with a tapered tail to the selected item when visible; confirm no full-width bottom annotation strip or pin/dismiss glyphs.
- Compare preview and download: identical detail, fallback, placement, and selected-item association at native image size.
- Test central, edge, and corner anchors and obtain at least two different bubble-side placements where space permits. Confirm body/tail remain inside the image, avoid the selected anchor and protected title/legend/branding, and text has no clipping.
- Test short detail and long multi-row detail. Full text is retained where it fits; otherwise the complete wrapped headline is retained without changing the full live tooltip. Test a case where full text fits dimensionally but cannot be placed without overlap.
- Test an off-screen heatmap item, an excluded Lifetime sport row, an omitted collage item, and a word absent from the rendered cloud. Each must identify its selection and absence truthfully without a false tail.
- Test nested chart offsets, different device-pixel ratios, export-resized pies, and resized map captures. Verify the tip against the actual selected pixels, not the live screen coordinates.
- Repeat export without a pin; confirm no transient tooltip, unchanged visualization fit, branding, format, and no-data behavior.
- Change or dismiss the live selection while export preparation is pending. The prepared PNG must retain request-time content. Complete, cancel, and fail exports and verify no unintended change to the live pin and no accumulating snapshots or media resources.

Capture and inspect synthetic-data screenshots of both the live interaction and generated PNG at desktop/mobile sizes. Programmatic geometry and canvas drawing assertions complement visual inspection; neither replaces the other.

## Completion Evidence

Record focused test commands/results, the full target/variant matrix, screenshot locations, viewport sizes, and any failures against SC-001 through SC-006 in the implementation handoff. No new tab IDs, analytical values, import semantics, or network transmissions should appear. Data shapes and lifecycle rules are defined in [data-model.md](data-model.md).

## Recorded Results: 2026-10-29

### Setup And Automated Verification

- T001 baseline: all six initial focused suites passed, 248 tests. Existing dependencies were reused; no packages, build stage, or runtime service were added to the app.
- T002 baseline: all 13 tab IDs/order, markup/dispatch, capture mappings, and the PB-detail target were retained. Export selection and request-owned pixel/media resources are acquired before asynchronous preparation.
- Existing root .gitignore covers node_modules, dist/build, coverage, logs, environment files, and private-data. The separate API Docker ignore file already covers its runtime outputs; no publishing, formatter, linter, Terraform, or Helm setup was introduced.
- Final affected regression command: 17 suites passed, 537 tests, zero failures:

```powershell
npm test -- --runInBand --runTestsByPath __tests__/lifetime-statistics-dashboard.test.js __tests__/export-utils.test.js __tests__/dashboard-export-download.test.js __tests__/dashboard-tooltips.test.js __tests__/tooltip-selection-utils.test.js __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js __tests__/dashboard-heatmap.test.js __tests__/dashboard-media.test.js __tests__/wordcloud-dashboard.test.js __tests__/pie-charts-dashboard.test.js __tests__/training-calendar-utils.test.js __tests__/heartrate-pace-visualization.test.js __tests__/dashboard-equipment.test.js __tests__/dashboard-core.test.js __tests__/dashboard-scatter-years.test.js __tests__/visualization-availability.test.js
```

API tests were not run because services/api and its dependencies were not changed. Editor diagnostics reported no errors in the changed browser modules. The shared Chart.js snapshot implements the Pie projection contract; dashboard-pie-charts.js did not need an artificial edit.

### Browser Target Matrix

Chromium validation used 90 synthetic activities, synthetic GPS points, and three generated bitmap media assets. Interaction viewports were 1440 x 1000 and 360 x 800. Each listed export produced a native 1080 x 1080 PNG with the selected bubble.

| Target / Variant | Desktop | Mobile |
|------------------|---------|--------|
| totalDistance | PASS | PASS |
| paceMetrics | PASS | PASS |
| equipment | PASS | PASS |
| equipmentTimeline | PASS | PASS |
| personalBests | PASS | PASS |
| heatmap | PASS | PASS |
| distributions | PASS | PASS |
| workoutTime | PASS | PASS |
| trainingCalendar | PASS | PASS |
| wordcloud | PASS | PASS |
| pieCharts | PASS | PASS |
| lifetimeStatistics | PASS | PASS |
| mediaGallery | PASS | PASS |
| PB detail | PASS | PASS |

### Outcomes And Edge Cases

- SC-001: zero Lifetime pin-symbol controls; direct pointer click, native emulated touch, Enter, selection replacement, toggle/dismiss, and Escape passed. Old targets lose their pressed state. A real pinned selection remained present after 180 seconds and pointer movement; the deterministic 30-second test also passed. Empty data produced zero targets/pins and the existing no-data export message. Mobile page width did not overflow.
- SC-002/SC-003: all target/variant exports succeeded. Native images were inspected for real rounded outlined speech bubbles and correct item association. Side/edge/corner and protected-region geometry tests passed. Three actual Pie selections retained the internal legend protection and used right/above placements; each evaluated four side candidates.
- SC-004: long content exported successfully while all 120 notes remained available in the live tooltip. Excluded Lifetime sport rows, an unchecked Wordcloud word, an image omitted from the collage, and a map point outside the current view all produced truthful notes without a false tail. Impossible readable fits are covered by explicit RangeError tests.
- SC-005: all 13 targets plus PB detail passed at both viewport widths. A real DPR 2 Distance export passed with a 512-pixel physical canvas, 256-pixel logical width, and the same normalized anchor as DPR 1.
- SC-006: a deliberately delayed export retained Total distance while the live user selection changed to Workouts. No-pin export omitted the bubble. Tests cover repeated exports, cancellation/failure, one prepared PNG shared by preview/download, release-on-failure, and independent media resources. Call counters and a throwing activity-collection proxy verify no extra callout-driven chart render, composition, or activity scan.

### Local Evidence And Environment Notes

- Native PNGs are kept only in the ignored private-data directory: `074-<target>-desktop.png`, `074-<target>-mobile.png`, `074-pbDetail-<viewport>.png`, and special-case files for omitted items, compact detail, no pin, protected Pie selections, and DPR 2.
- Pixel checks passed for 37 native 1080 x 1080 PNGs: each had at least 1,000 non-background content pixels below the header. The additional DPR 2 export also succeeded. `074-export-contact-sheet.png` summarizes the 37-image set; individual native files were used to inspect text and tails.
- The Download control executed the browser fallback handoff and closed its preview. The integrated browser did not expose a Playwright download event, so OS-level file completion was not asserted. Native prepared PNG bytes were saved through a temporary loopback-only test receiver for inspection; preview/download byte identity and error/cancellation paths were additionally verified in Jest. This receiver is not application code or a new product service.
- The existing aggregate analysis counter reports a CORS warning for the local validation origin. This unrelated service behavior was not changed. No imported personal files or activity details were sent to that service.
- No changes to tab contracts, analytical values, import/parsing semantics, API behavior, or production network boundaries were introduced. Checklist quality markers were left unchanged.