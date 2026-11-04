# Quickstart: Validate Reel / Story Exports

This guide validates the eventual implementation. The planning command does not implement the feature, generate acceptance images, certify browsers, or complete the human review.

## Prerequisites

- Node.js/npm for the existing root Jest suite and Python for a static server.
- Current stable Chrome and Edge on desktop; record their exact versions and OS during acceptance.
- Synthetic training datasets that exercise every [inventory entry](export-inventory.md), including sparse/dense cases, all configured PB definitions, route geometry and readable photo/video-still media. Setup task T002 must provide browser-importable files under `__tests__/fixtures/reel-story-exports/`, regeneration/import recipes in that directory's README, and `expected-values.json` mapping fixture identities and selected cases to expected values/units/dates/scales, media/route scope and provenance. Existing sample training data can seed review but must be supplemented where it lacks a variant. Import every recipe and map every review case to these references before T033/T058/T059; missing, non-importable or unmapped fixtures block image review. Node-only mocks are not sufficient. These files are to be supplied during implementation, not presumed present now.
- Keep fixture imports and generated review artifacts local; do not commit personal files or upload athlete images for review. No API service or frontend build is required.

## 1. Focused Automated Checks

From the repository root:

```powershell
Set-Location C:\dev\Triathlon
npm test -- --runInBand --runTestsByPath __tests__/export-utils.test.js __tests__/dashboard-export-download.test.js
```

Expected after implementation: all tests pass, including story dimensions, final safe-area geometry/text, caption allocation, format/page planning, synthetic notices, true PNG-dimension validation, immutable snapshots and stale-request prevention. Extend current tests first; passing the unmodified baseline suite does not prove this feature works.

For resource ownership and gallery continuation:

```powershell
npm test -- --runInBand --runTestsByPath __tests__/dashboard-media.test.js __tests__/media-utils.test.js
```

Expected: no revoked source is consumed, independent exports survive gallery/dataset changes, close/stale/error releases only its own resources exactly once, annual/collage preserve selected assets and route settings, and videos remain still images.

Run the narrow owner tests for each changed family immediately after changing it. Existing relevant suites include:

```powershell
npm test -- --runInBand --runTestsByPath __tests__/dashboard-core.test.js __tests__/dashboard-equipment.test.js __tests__/dashboard-scatter-years.test.js __tests__/heartrate-pace-visualization.test.js __tests__/power-pb-utils.test.js
npm test -- --runInBand --runTestsByPath __tests__/dashboard-heatmap.test.js __tests__/distribution-utils.test.js __tests__/workout-time-utils.test.js __tests__/training-calendar-utils.test.js
npm test -- --runInBand --runTestsByPath __tests__/wordcloud-dashboard.test.js __tests__/pie-charts-dashboard.test.js __tests__/lifetime-statistics-dashboard.test.js
```

Expected: selected values/filters/units and chart semantics are preserved; sparse/dense export cases and applicable new adapter tests pass. Reuse adjacent suites or the existing export VM harness for uncovered orchestration rather than creating duplicate test files by default.

Verify unchanged integration contracts:

```powershell
npm test -- --runInBand --runTestsByPath __tests__/index-script-syntax.test.js __tests__/tab-navigation.test.js __tests__/dashboard-tooltips.test.js __tests__/tooltip-selection-utils.test.js
```

Check tab constants/IDs, markup, dispatch and `openDashboardTab` together without renaming them. Preserve the existing [classic-script load-order contract](../022-modularize-inline-script/contracts/script-load-order.md); any added owner API must exist when the exporter invokes it. Verify browser globals actually load, since Node module isolation cannot detect all classic-script name collisions. Dashboard tooltips still work, but social exports contain none.

## 2. Run the Static App

```powershell
python -m http.server 8000
```

Open `http://localhost:8000` in each acceptance browser. If port 8000 is occupied, choose a free port, for example `python -m http.server 8001`, and record the URL. Import only synthetic or explicitly authorized local data. Use the existing sample-data flow where appropriate, and verify its synthetic flag survives every export.

Expected controls: Square · 1:1, Feed portrait · 4:5 and Reel / Story · 9:16; humour off by default. Choose story and verify complete, contained preview; download a PNG and inspect its native size as 1080 x 1920. Do not treat an image tag's CSS dimensions as file dimensions.

## 3. Build the Full Export Review Matrix

Create a local review manifest, with one result row for each browser x target/variant x applicable sparse/dense case x format x caption state. Record at least:

```text
browser/version, OS, targetKey, variantKey, dataset/fixture identity,
filters, period, metric/units, aggregation, visible series/mode,
density, format, humour, page index/count, expected subset/total,
preview revision, PNG file reference, intrinsic width/height,
native-resolution result, 360px-wide result, safe-area result,
data/privacy/provenance result, parity result, reviewer, defects, status
```

This is the actual full-inventory visual-review matrix, not a second specification-quality checklist. Do not pre-mark rows as passed. Source variant discovery from the current target registry, PB distance definitions, longest/elevation records, power-duration definitions/profile, and both media generators. If source constants change, expand the matrix rather than keep stale counts.

The registered PB overview has no visible export button: exercise it through the existing export entrypoint in a local browser harness and record it as registry coverage, not a newly added user action. All existing detail export actions must still work normally.

For every reachable variant, include sparse and dense inputs, all three formats and humour on/off. A genuinely inapplicable density case needs a recorded reason. Cover every available metric/sport/aggregation/group/mode across the set without requiring the full cross-product of unrelated filters. Calendar/timeline/other continuation cases include first, middle where present, and last pages; verify all required content across the series.

## 4. Inspect the Actual Downloaded Files

For each matrix row:

1. Decode the PNG file and verify native dimensions: square 1080 x 1080, portrait 1080 x 1350, story 1080 x 1920. Compare with the exact ready preview/page using decoded pixels or a whole-image visual comparison with display scaling only.
2. Inspect at full resolution, then display the entire file at 360 pixels wide: 360 x 360, 360 x 450, or 360 x 640. No zoom/crop may conceal fit problems.
3. For story, inspect against a source-coordinate overlay marking x=72..960 and y=240..1560. Also simulate obstructing UI outside that area. Keep overlay tooling separate from the delivered image. Other formats get their own contained-layout check, not story's vertical bounds.
4. Check minimum effective essential text size, actual-background contrast, clear reading order, all values/units/labels, complete legend, caption, synthetic notice, attribution and branding. Flag layout-induced overlaps or clipping. Verify natural coincident data is not changed to resolve label placement.
5. Record a concrete family-specific improvement from the taller composition. Reject a landscape screenshot sitting on tall blank background, stretched chart, tiny dense content, or inflated sparse marks.
6. Compare known values and settings with the original selected visualization, including partial dates, pace direction, timeline marker/span mode, map extent, bins, calendar intensity, PB source/duration axis, word weights, pie denominator and media selection/route opt-in.
7. Verify humour on gives one relevant line and off removes its slot. Synthetic provenance and required attribution must appear on every page. Check PB/lifetime copy and generic metadata for unintended activity titles, and maps/media for new precise disclosures.

Use actual PNGs as evidence; modal screenshots, mock canvas calls and file headers without decoded content are insufficient. Dense/sparse image evidence and sign-off are required in both Chrome and Edge; software automation for one browser does not certify the other.

## 5. Verify Revision, Failure and Save Behaviour

Use deterministic deferred promises in the VM tests, then exercise equivalent delayed real-browser operations where feasible:

- Request format A -> B -> C; finish C -> B -> A. Only C may publish; each series uses one coherent set of options.
- Toggle caption while rendering and attempt old-page navigation/download. No picker/anchor may start for pending/obsolete images, even through a direct handler call.
- Change format so page count changes. Ready series resets to page 1; navigation and filenames identify the correct page and total without omissions.
- Close during capture/decode, then open a new export. Complete/reject old work; it must not reopen, hide, clear errors or release resources belonging to the new session.
- Change dashboard filters or replace the dataset while a snapshot is rendering. Its output remains coherent; a newly requested export uses the new selection. Active media leases remain valid until their consumers complete.
- Fail an export, change the dashboard dataset/filters, and retry. A usable snapshot must retain its original selectionId and data. If the original snapshot or sources are unavailable, show an explanation and keep download blocked without recapture. Explicitly request a new export and verify new sessionId/selectionId, the current selection, and no UI overwrite from the failed session.
- Delay a save at picker/write, then change format/page/session. The saved or fallback-downloaded bytes are exactly the originally approved image, and its completion does not close/advance/enable the newer preview incorrectly.
- Cancel picker; deny write permission; simulate asset/decode/render failure; retry. Retain existing cancellation/fallback warnings, no duplicate writes, no blank/partial series and no stale download approval.
- Repeat close/retry/format changes and confirm temporary charts, DOM, object URLs and canvases are released after active work finishes. Record dense-case render timings/resource observations without claiming an unapproved performance SLA.

Use the [data model](data-model.md) for valid transitions and [export contracts](contracts/export-contracts.md) for publication, save and cleanup invariants.

## 6. Human Review and Completion

Run SC-007 with at least five amateur endurance athletes. For each family, show a representative actual image at phone size for five seconds and record their subject, period, metric/unit and takeaway identification, followed by clarity/shareability ratings. At least four must identify the required information and at least four must rate both qualities at 4/5 or higher for that family. Do not invent results or substitute the implementer's opinion for participant responses.

Completion requires all focused tests, integration checks, full artifact matrix and human review to pass, with no missing/unreviewed variants, clipping, unsafe content, parity failure or unresolved defect. The existing requirements-quality checklist is not proof of implementation acceptance. If a browser, fixture, participant group or actual artifact is unavailable, record that gate as unverified/blocked rather than reduce scope or claim completion.