# Quickstart Validation: Workout Time Measures

This is the implementation validation guide. Planning creates the design artifacts, not the new controls or passing acceptance evidence.

## Prerequisites And Startup

- Use existing root Node/npm dependencies; npm install only if needed. No new library, build command, backend service, or test framework is required.
- Use only synthetic activity histories and explicitly supplied local input; do not commit personal exports or screenshots of private activity data.
- Serve the app from the repository root with Python:

```powershell
python -m http.server 8000
```

Open http://localhost:8000. If occupied, choose a free port; an already-running static app may be reused. No API service startup is needed.

## Focused Automated Checks

Run the relevant existing suite immediately after each touched implementation slice:

```powershell
npm test -- --runInBand --runTestsByPath __tests__/workout-time-utils.test.js
npm test -- --runInBand --runTestsByPath __tests__/dashboard-core.test.js __tests__/index-script-syntax.test.js
npm test -- --runInBand --runTestsByPath __tests__/dashboard-tooltips.test.js __tests__/tooltip-selection-utils.test.js
npm test -- --runInBand --runTestsByPath __tests__/dashboard-export-download.test.js __tests__/tab-navigation.test.js __tests__/visualization-availability.test.js
```

Extend current Node-compatible VM/fake-document/chart harnesses. Keep utility tests pure, and use actual compositor/capture assertions for export behavior rather than only testing a mocked image result. API tests are outside this frontend-only feature unless API code is changed, which this plan does not authorize.

Expected data shapes, UI IDs, keyboard order, and inspection hooks are defined in [contracts/workout-time-measures.md](contracts/workout-time-measures.md) and [data-model.md](data-model.md).

## Exact Reference Data

Prepare three eligible same-day workouts in the day view:

| Start | Duration | Distance |
|-------|----------|----------|
| 06:15 | 1800 seconds, available | 5 km, available |
| 07:30 | 2700 seconds, available | 10 km, available |
| 07:45 | numeric placeholder 0 with durationAvailable false | 2 km, available |

The 06:00-07:59 field must show 3 workouts, 1.25 hours on the duration axis with 1h 15m detail and 2-of-3 duration coverage, or 17 km. Add records across weekdays, day/month boundaries, all sports, and a long workout crossing midnight. It must contribute its complete measure once at its start time.

Verify all 48 grouping/sport/measure combinations and inclusive date-range subsets against hand-calculated totals. Include available zeros both with true flags and absent flags, false-flag placeholders, missing/negative/non-finite values, mixed coverage, duration >24h, and fractional distances summed before display rounding.

## Desktop And Mobile Interaction

At 1440 px and 360 px viewport widths:

1. Open a fresh page session and Workout Time. Verify Workout number is selected and count results match the prior view.
2. Select Duration and Distance with one activation each. Verify active/pressed state, axis units, tooltip value/coverage, and unchanged grouping/sport/date settings.
3. Change grouping/sport/date range, visit another tab, return, and replace the imported history. Confirm measure retention within the page; reload and confirm count default.
4. Repeat with pointer, native touch/emulation, and keyboard. Validate focus, Enter/Space activation, granularity -> sport -> measure -> start -> end cycling, wraparound, and end.min following start after insertion of measure. Text/native input editing must retain existing boundaries.
5. Inspect and pin a measured-zero field, unavailable nonempty field, and empty field by category, including keyboard traversal. All details must remain truthful and anchors finite, without an epsilon or false positive bar.
6. Switch measure while pinned: old detail clears before the new result. Verify replace/toggle/Escape/dismiss still work.
7. Check empty history, all-unavailable duration/distance, partial coverage, and valid all-zero history. Only empty/all-unavailable blocks a populated export; all controls remain available and no stale chart survives.
8. Capture screenshots proving readable controls/units and no new horizontal page overflow. Existing tab IDs/order and unrelated chart interactions must remain unchanged.

## Export Validation

For count, duration, and distance, verify preview/download of a populated chart both with and without a pin. Check selected units, field identity, full-or-headline bubble, correct tail, readable detail, and no leaked controls. Export a measured-zero field and confirm zero remains legitimate.

Delay capture preparation, request an export, then switch the live measure or replace data. Verify the prepared image retains the original chart, labels, units, content, and selected-field anchor. Completion/cancellation/failure must not restore an obsolete live measure or pin. Preview/download must share the same prepared PNG and request resources must be released.

Attempt exports of empty and all-unavailable measures: no misleading populated PNG may appear. Switch back to Workout number and verify inspection/export recover normally. Do not treat successful browser handoff alone as proof that an OS file finished saving; record browser-tool limitations honestly.

## Performance Gate

Use 10,000 eligible synthetic activities with known values and broad start-time distribution. Choose a populated grouping/sport/date range and warm initial rendering once. Cycle count -> duration -> distance for 20 measured activations without changing other filters or reimporting.

Measure from activation until the correct chart and labels are visibly rendered, including animation if enabled. Verify values as part of completion, not merely a setter return or aggregator duration. Record all 20 samples, passing count, viewport, actual Chart.js version, browser/version, machine/CPU, dataset recipe, and animation configuration. At least 19 of 20 must complete within 1000 ms. Keep aggregation linear and field count fixed; do not change the acceptance threshold to conceal a failure.

## Completion Evidence

Record exact commands/results, 48-case reference checks, three-measure live/export results, zero/null-field interactions, delayed export isolation, screenshots for both viewports, and the 20 performance samples against SC-001 through SC-006. Keep generated evidence local/ignored when appropriate. Planning alone did not execute these checks; the implementation evidence below records their subsequent results.

## Recorded Implementation Results: 2026-10-29

### Setup And Automated Tests

- Baseline: eight focused suites passed, 312 tests. Existing packages and Node-environment VM/fake-document/chart harnesses were reused; no dependencies, runtime modules, build stage, or parser changes were introduced.
- Final affected regression command: eight suites passed, 378 tests, zero failures:

```powershell
npm test -- --runInBand --runTestsByPath __tests__/workout-time-utils.test.js __tests__/dashboard-core.test.js __tests__/index-script-syntax.test.js __tests__/dashboard-tooltips.test.js __tests__/tooltip-selection-utils.test.js __tests__/dashboard-export-download.test.js __tests__/tab-navigation.test.js __tests__/visualization-availability.test.js
```

- All 48 grouping/sport/measure reference cases passed, including explicit unknown-sport preservation in All, start-time-only whole-workout assignment, missing timestamps, source availability flags, null/zero/partial distinctions, >24h duration, and unrounded raw sums.
- Recorded duration still uses the existing duration seconds and durationAvailable semantics; recorded distance still uses kilometers and distanceAvailable. Group keys/order, count, activityCount, copied dates, and old utility signatures remain compatible.
- Existing root .gitignore covers node_modules, dist/build, coverage, environment files, logs, and private-data; the separate API Docker ignore file already covers its artifacts. No additional publishing/linter/formatter/Terraform/Helm setup was needed.
- Tab ID/order, existing control IDs, script order, dispatch, and workoutTimeChartWrapper mapping were verified without renaming. One narrow shared click-handler exception in src/dashboard-tabs.js prevents invalidating a pin when the already-active Workout Time measure is clicked; the setter alone cannot intercept that earlier capture-phase event. Other filter handling is unchanged.
- The private Workout Time renderer now renders at its actual 960 x 500 capture size and preserves those pixels, preventing the old narrow-mobile bitmap from being stretched. Tests cover private-scale anchors, no downsampling, and unchanged live canvas dimensions.
- services/api and source parsers were unchanged; API tests were not run. Checklist quality markers were not modified.

### Browser Environment

- Static app: http://localhost:8014, using only six synthetic reference activities and an independently generated 10,000-activity performance history.
- Browser: integrated Chromium 150.0.7871.250 / Electron 43.7.7 on Windows 10.0.26200; Chart.js 4.6.1.
- Machine: Intel Core i7-13850HX, 28 logical CPUs, 32 GB RAM; Node v24.19.0.
- Viewports: 1440 x 1000 and 360 x 800. Native touch was exercised through Chromium touch emulation. A separate DPR 2 run used a roughly 256.8 logical-pixel / 513 physical-pixel live canvas and retained the same export anchor as DPR 1.
- The integrated browser may suspend animation frames in a hidden tab. Checks used CDP foreground/focus emulation with document.visibilityState = visible; no production timing workaround was added.

### Functional And Export Outcomes

| Check | Result |
|-------|--------|
| Fresh page defaults to Workout number | PASS |
| Reference field: 3 workouts, 1.25 h / 1h 15m, 17 km | PASS |
| Existing grouping/sport/date settings retained | PASS |
| Measure retained across tab visits and replacement dataset; reset on reload | PASS |
| Exactly one active/pressed choice; pointer, Enter/Space, finite-filter ArrowDown | PASS |
| Active-measure No-op click retains existing pin | PASS |
| Native touch selects an unavailable field truthfully | PASS |
| All 12 daily fields reachable by keyboard with finite anchors, pin/toggle/Escape | PASS |
| Empty fields, measured zeros, partial and unavailable fields distinguished | PASS |
| All-unavailable measure blocks export but keeps the tab/selector available | PASS |
| Valid all-zero duration history renders and exports | PASS |
| Empty history blocks export; normal data recovers | PASS |
| Three measures x pinned/unpinned x desktop/mobile: 12 native PNGs | PASS |
| Mobile and desktop private-chart field anchors agree after export-size rendering | PASS |
| 100-note live detail exports compactly without changing full live content | PASS |
| Delayed Duration export remains Duration after the live view switches to Distance | PASS |
| Measure changes clear the obsolete pin before the new result | PASS |
| Download anchor receives exactly the prepared preview PNG, closes preview, preserves live measure | PASS |
| Mobile selector introduces no horizontal page overflow | PASS |

The partial reference tooltip identifies Available for 2 of 3 workouts. Unavailable fields say Not available and No usable duration values, not 0s. Valid measured-zero fields show 0s without an unavailable note. Empty fields identify No activities.

### Performance Gate (SC-005)

One warm count render was followed by 20 actual button activations cycling Duration -> Distance -> Workout number with fixed Day/All/date filters. The generated history had 10,000 valid workouts across 28 July dates, 24 start hours, all three sports, duration 1800 + (index % 60) * 30 seconds, and distance 5 + index % 20 kilometers. Every rendered chart sum was verified against its reference total.

Timing started before activation and ended after Chart.js afterRender plus two animation frames. The configured chart animation is 250 ms; the existing inspection-plugin registration also performs its normal update('none'). The check measured actual application behavior and did not disable animation specially for the benchmark.

Samples in milliseconds, in activation order:

```text
76.1, 66.4, 66.9, 66.7, 66.0, 67.0, 66.5, 67.0, 66.9, 65.9,
67.0, 66.0, 66.9, 66.7, 66.9, 66.8, 66.4, 66.5, 67.0, 67.6
```

Result: 20/20 <= 1000 ms, maximum 76.1 ms; required threshold 19/20. Aggregation uses one activity loop plus a fixed-size field reduction, with at most 31 chart fields; no reimport or second action was required.

### Image Evidence And Limitations

- Native PNG byte files remain local in ignored private-data: `075-desktop-{count,duration,distance}-{plain,pinned}.png` and corresponding `075-mobile-...` files. Additional original PNGs are `075-unavailable-field.png`, `075-zero-field.png`, `075-compact.png`, `075-delayed-duration.png`, `075-all-zero.png`, and `075-dpr2.png`.
- All 18 original PNGs passed 1080 x 1080 dimension and nonblank-content checks with at least 1,000 non-background pixels below the header. Representative original files were visually inspected for complete axes/units, correctly pointed bubbles, and readable full/compact details. Initial screenshots of the integrated image viewer were clipped by that viewer; the evidence files above were replaced with original PNG bytes, not those screenshots.
- A temporary loopback-only receiver saved synthetic PNG bytes for inspection. It is not application code, a new product endpoint, or an activity-data upload and is stopped after validation.
- The browser download handoff used the exact prepared PNG. OS-level save completion cannot be confirmed by this integrated browser and was not claimed; native handoff, cancellation/failure, repeated downloads, and resource isolation are covered by the existing focused tests.
- The existing aggregate analysis counter can log a CORS warning on a local origin. It was not changed and did not receive synthetic workout fields through this feature.