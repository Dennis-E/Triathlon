# Quickstart: Validate Heatmap Navigation Performance at Scale

This guide validates the performance fix using the same manual-interaction style as
`specs/001-route-line-heatmap/quickstart.md`, extended with a large-dataset focus.

## Prerequisites

- Repo checked out on branch `002-heatmap-performance-scale`.
- No new dependencies to install.
- A large Strava export ZIP (2,500+ activities with GPS tracks) kept locally and **out of
  version control** — e.g., under `private-data/` (already `.gitignore`d), never referenced
  by a hardcoded path in the codebase. Import it manually via the app's "Strava Ingest"
  button.

## 1. Run the automated unit tests

```powershell
npm test -- heatmap-utils
```

Expected: all tests pass, including new cases for `segmentIntersectsBounds`,
`buildLowZoomRouteSegments`, and `computeMinVisibleSegmentLength`.

## 2. Serve the app locally

```powershell
python -m http.server
```

(or an equivalent static server — see AGENTS.md) and open `http://localhost:8000`.

## 3. Import a large dataset and open the Heatmap tab (User Story 1)

1. Click **Strava Ingest** and select a large export ZIP (2,500+ activities).
2. Once loaded, open the **Heatmap** tab.
3. **Expected**: the map becomes draggable/zoomable within a few seconds (SC-002), not
   noticeably longer than with a small dataset.
4. Drag the map around and zoom in/out repeatedly.
5. **Expected**: dragging feels continuous (no multi-second freeze mid-drag); zooming
   completes and the map accepts further input almost immediately (SC-001).

## 4. Confirm route-line guarantees still hold (User Story 2)

1. Identify (or recall from `specs/001-route-line-heatmap` testing) a frequently-traveled
   route segment and a once-traveled route segment in the imported data.
2. **Expected**: the frequent segment still renders visibly thicker/more prominent than the
   once-traveled one (SC-005).
3. Zoom all the way out to a world view.
4. **Expected**: a known geographically isolated single-visit activity (e.g., a trip to a
   distant city/country) is still visible, not dropped (SC-004).

## 5. Confirm sport filter responsiveness on the large dataset

1. Switch between **All Sports / Run / Bike / Swim**.
2. **Expected**: each switch updates the map within a similarly short, bounded time, without
   the page appearing frozen (SC-003).

## 6. Confirm no regression for small datasets (User Story 3)

1. Import (or switch to) a small dataset (tens of activities).
2. Repeat the pan/zoom interactions from step 3.
3. **Expected**: responsiveness feels at least as good as it did before this change (SC-006).

## 7. Regression check

```powershell
npm test
```

Expected: full root Jest suite passes (no regressions in other dashboard tabs/utilities).
