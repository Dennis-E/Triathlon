# Quickstart: Validate Pinnable Tooltips and Export

This document records implementation evidence and the repeatable acceptance workflow. Shared tooltip tests and renderer integrations are implemented; existing suites remain the test homes for their renderer slices.

## Implementation Evidence

- 2026-10-28, T001: baseline export, export-utils, script-syntax and tab-navigation suites passed: 4 suites, 262 tests. Existing root configuration and ignore patterns verified; no dependency or service changes needed.
- Shared utility/controller tests cover immutable grouped content, pin/replace/dismiss, no expiry, invalid contexts, placement, all thirteen tab IDs and teardown. No-data export checks are parameterized for all thirteen views.
- Integrated-browser synthetic dataset: all thirteen adapters registered and each view successfully exported a pinned selection. Checked both equipment timeline modes and Personal Bests overview/detail. Used real pointer clicks, Playwright keyboard activation of native buttons/SVG targets and Chromium touch emulation for a hover-free tap.
- Responsive checks: 360 x 800 mobile and 1440 x 1000 desktop. The 80-row live-tooltip fixture stayed complete; the mobile export selected headline mode with the entire headline. Live overlay bounds were left 8, right 352, top 8, bottom 792 at 360 pixels. Full and compact preview screenshots were inspected, including actual Leaflet tiles/routes and selected-item association.
- Pixel checks: a no-pin export decoded as 1080 x 1080 with eleven distinct sampled visualization colors and no annotation. The browser download handoff used exactly the same PNG data URL as the preview, retaining the live pin. The integrated browser did not expose a Playwright download event; actual filesystem save completion remains browser-managed, as documented in the README.
- Replacement-import browser race with a real synthetic ZIP media library: live URLs revoked, old readers cleared, independently owned source still usable, original pinned image/context exported, owned URL revoked afterward, live pin cleared and zero staging nodes left. Unit tests additionally cover source acquisition from pending readers, cache eviction, errors, cancellation, idempotent cleanup and replacement-resource ownership.
- Browser verification found and fixed native-tooltip double capture and non-unit DPR scaling. Private Chart.js renders disable native tooltips without changing the live chart. A PNG load-event fallback handles a browser decode promise that remains pending after successful image loading; malformed PNG, load/decode error and empty-dimension checks remain covered.
- Privacy review: no network or persistent-storage calls in the new tooltip modules, no new service/package dependency, and synthetic media stays in local Blob URLs. Existing CDN, tile and analysis-counter traffic remains separate. The existing analysis-counter endpoint rejects localhost by CORS; no counter/service change was made.
- 2026-10-28, final gate: `npm test -- --runInBand` passed all 42 suites and 1003 tests. Editor diagnostics reported no errors; `git diff --check` passed. All 51 tasks are marked complete, with implementation evidence above and repeatable commands below. No API service, dependency, parser semantics, tab ID or tab order change was introduced.

## Prerequisites and Startup

Use the existing root Node/npm test toolchain and Python static server. Run from the repository root in PowerShell; install root dependencies with `npm install` only when needed. No API service, bundler, or real personal export is required.

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`. If occupied, choose another port. Use synthetic import data that populate all thirteen views, including routes, power records, equipment, word frequencies, statistics, and local media. Reuse synthetic test helpers; do not assume any private-data or test-data directory supplies public fixtures. Provide both grouped/long tooltips and explicit missing values.

## Focused Automated Checks

After the utility/orchestrator slice is implemented:

```powershell
npm test -- --runInBand __tests__/tooltip-selection-utils.test.js __tests__/dashboard-tooltips.test.js
```

After export integration:

```powershell
npm test -- --runInBand __tests__/export-utils.test.js __tests__/dashboard-export-download.test.js __tests__/index-script-syntax.test.js
```

For renderer and lifecycle changes, run only the touched existing suites first:

```powershell
npm test -- --runInBand __tests__/dashboard-core.test.js __tests__/dashboard-equipment.test.js __tests__/dashboard-scatter-years.test.js __tests__/dashboard-heatmap.test.js __tests__/wordcloud-dashboard.test.js __tests__/pie-charts-dashboard.test.js __tests__/lifetime-statistics-dashboard.test.js __tests__/dashboard-media.test.js __tests__/dashboard-import.test.js __tests__/tab-navigation.test.js
```

Calendar, workout-time, distribution and PB behavior must also be exercised through the shared adapter harness and extended existing syntax/export suites, with existing utility tests used when their pure logic is touched. Use fake timers for 30-second state stability; do not add real-time waits to Node tests. Once all slices pass, run the root regression gate:

```powershell
npm test -- --runInBand
git diff --check
```

Expected: all relevant assertions pass, no stale/duplicate tooltip listeners, no raw personal fixture changes. API tests are not required when the service is untouched.

## Browser Acceptance Matrix

Run the following workflow in every populated view listed in [research.md](research.md): total distance, pace metrics, equipment, equipment timeline (both modes), personal bests (overview and detail), heatmap, distributions, workout time, training calendar, word cloud, pie charts, lifetime statistics, and media gallery.

1. Reveal an unpinned tooltip; leave without selecting. It behaves as before and is absent from an export.
2. Reveal and click an item; move out of the visualization and across other items. The same complete content remains pinned for at least 30 seconds. Verify grouped rows, units, notes, sample membership, and unavailable values.
3. Select a different item, then select that same item again. Selection is replaced once, then released. Also verify the dismiss control and Escape.
4. Pin an item and activate Share/Export. Inspect preview and saved PNG: exactly one annotation, full content when it fits or the complete selected headline when compact presentation is needed, correct selected-item association, no pin/dismiss UI, no cropped text or branding overlap. Preview and saved image match; the live tooltip remains complete.
5. Repeat without a pin. No transient tooltip appears. Repeat export, cancel the preview/download, and force capture failure; unchanged live pins stay usable and no duplicate annotation accumulates.
6. Change sport, metric, range, aggregation, mode, series legend, excluded word, media filter or collage selection as applicable. The old pin clears before the new result. Verify tab switching, return to landing, replacement import and reload likewise leave no stale detail.
7. Resize while pinned; pan/zoom the heatmap. Content stays selected. Move its geographic item off-screen: display and export explicitly identify it as outside the current view, without a false pointer.
8. Inspect long labels and multi-row activity lists at 360- and 1440-pixel-wide viewports. All live content and dismissal stay accessible. Bounded samples use full content at the minimum font; deliberately oversized detail lists export successfully using the complete wrapped headline, with identical compact preview and download. Verify fallback to the item/group label for a title-free tooltip. Only a genuinely unrepresentable compact headline causes a fit failure, never a merely long detail list.

Repeat selection, replacement, dismissal and export using touch alone, then keyboard alone. Inspect focus visibility, selected state and accessible names. Confirm inspector arrows do not navigate tabs/filters, and Escape releases the PB pin before closing its dialog. Confirm media opening, collage selection and map dragging retain their primary behavior.

## Snapshot Race and Failure Checks

Use the existing export VM harness's deferred promises to pause assets/render work after the request is accepted. Change pin, filter, dataset, palette, map or wordcloud generation before resolving. The resulting image must use the original context and selection, or fail explicitly when that original render is unavailable; it must never use a later live result. Preview and download consume the same PNG. Verify resource cleanup and that a newer live pin is never overwritten by old cleanup.

In browser automation, intercept a known export-asset request for the equivalent race check without altering production network logic. Inspect actual downloaded PNG pixels as well as annotation text and bounds. Check nonblank chart/route content, tooltip-free no-pin captures, grouped information, off-screen identity, and absence of duplicate controls. Record screenshots at both viewport sizes and input modes; do not commit personal image data.

### Replacement Import with Actual Media Release

Run the existing owner suites after their source-lease coverage is implemented:

```powershell
npm test -- --runInBand __tests__/zip-importer.test.js __tests__/dashboard-import.test.js __tests__/dashboard-media.test.js __tests__/dashboard-export-download.test.js
```

1. Construct dataset A using the real synthetic ZIP media-library path. Mock URL creation/revocation with a URL-to-Blob validity registry; do not stub library.release to a no-op.
2. Request an image export with a pin and a displayed video thumbnail/fallback. Verify acquisition of the independent source lease before the first await, then hold asset/capture preparation pending.
3. Apply dataset B using applyImportedDataset. Assert A's live cache URLs were actually revoked and its asset readers cleared; A's request-owned sources must remain usable, including any independently captured reader still preparing a Blob.
4. Make the capture mock reject revoked URLs. Resolve preparation and assert the resulting PNG contains A's image, exact displayed thumbnail, selected detail and context, not B or a blank image. Preview and download must consume that same PNG.
5. On success, failure and cancellation, verify lease cleanup is idempotent and revokes each owned URL exactly once, with no revocation of B's URLs. Once A's PNG is ready, source cleanup must not break preview or download. Repeat with a source initially available only through a reader, not just already decoded pixels.

Repeat the delayed-export/replacement-import case in the browser with synthetic media. Ordinary import release must not itself cause an accepted export to fail or silently omit its media; unrelated unavailable-render failures still follow the existing explicit error path.

## Privacy and Exit Criteria

Inspect network activity during pinning and export: no new request carries tooltip or imported activity content. Existing CDN, map-tile and unrelated analysis-counter traffic is not a failure of local processing.

Completion requires all SC-001 through SC-006 checks in [spec.md](spec.md), the interaction/export contract in [contracts/tooltip-interaction-export.md](contracts/tooltip-interaction-export.md), and all focused/root regression gates above. Full-detail overflow must produce a readable compact headline export while preserving complete live detail; never silently omit the pinned tooltip entirely.