# Quickstart: Validate Heatmap Zoom Preservation

This guide validates that sport filters replace route data without moving the user's current
map view, while preserving initial framing for a newly imported dataset.

## Prerequisites

- Repo checked out on `058-heatmap-zoom-preservation`.
- Root dependencies installed (`npm install` if needed).
- A local Strava or TrainingPeaks ZIP with GPS-backed Run and Bike activities, preferably
  including a sport with no GPS routes. Use only a local export; do not add personal exports
  to version control. Alternatively, use the repository's established synthetic dashboard
  test setup.
- Internet access for the existing Leaflet CDN and OpenStreetMap tiles.

## 1. Run focused automated checks

```powershell
npm test -- --runInBand __tests__/dashboard-heatmap.test.js __tests__/heatmap-utils.test.js __tests__/index-script-syntax.test.js
```

Expected: dashboard lifecycle cases, heatmap utility tests, and classic-script syntax checks
pass. The focused dashboard cases must cover first fit, subsequent same-dataset renders,
empty-result transitions, and a new dataset.

## 2. Start the static app

```powershell
python -m http.server
```

Open `http://localhost:8000`, then import a suitable local export and open the Heatmap tab.

## 3. Verify initial fit and retained view

1. Let the initial **All** filter render and note that the existing route-bounds initial fit
   occurs.
2. Pan to a recognizable area and choose a non-default zoom, such as a city or street view.
3. Record the visible center and zoom using Leaflet's existing map controls or browser
   developer tools.
4. Switch between **All**, **Run**, and **Bike**, including switching directly between
   individual sports.
5. Expected: routes and frequency legend update for each selection, while the center and zoom
   remain unchanged; no route from a previous filter remains visible.
6. Reopen another visualization tab and then return to **Heatmap**.
7. Expected: the same center and zoom remain for the same imported dataset.

## 4. Verify empty-filter recovery

1. At the same non-default center and zoom, select a sport with no GPS-backed routes.
2. Expected: the existing empty state appears and the legend is cleared; the map view is not
   discarded.
3. Select a sport with GPS-backed routes again.
4. Expected: its routes appear within the same center and zoom without an automatic fit.

## 5. Verify dataset replacement

1. Import a different local dataset with routes in a geographically different area.
2. Open the Heatmap tab after the import completes.
3. Expected: the replacement dataset's first non-empty heatmap render uses the existing
   initial route-bounds fit once.
4. Pan and zoom again, then change filters and revisit the tab.
5. Expected: the new user-selected view remains stable for subsequent renders on this dataset.

## 6. Regression check

```powershell
npm test -- --runInBand
```

Expected: the root Jest suite passes with no heatmap utility, route rendering, import, or
inline-script syntax regressions.