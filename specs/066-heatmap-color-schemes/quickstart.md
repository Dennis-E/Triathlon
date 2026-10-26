# Quickstart: Heatmap Color Schemes

## Prerequisites

- Node.js and npm installed for the repository's Jest tests.
- A modern browser and local static server for the visual/export check.
- A local activity export with GPS routes in multiple sports and at least four route
  frequency levels. Keep personal exports local; do not add them to version control.

## Automated Validation

From the repository root, run the focused heatmap and integration suites:

```powershell
npm test -- --runTestsByPath __tests__/heatmap-utils.test.js __tests__/dashboard-heatmap.test.js __tests__/dashboard-export-download.test.js __tests__/index-script-syntax.test.js
```

Expected result: palette ramps remain ordered and distinguishable; Blue to Red retains its
existing output; scheme selection and sport changes retain consistent state; empty views
remain empty; keyboard and export metadata include the scheme; no stale scheme colors remain.

## Browser Validation

1. Start the static app from the repository root:

   ```powershell
   python -m http.server 8000
   ```

2. Open `http://localhost:8000`, import the local activity export, and open the GPS Heatmap.
3. Confirm the selector offers the four documented choices and defaults to Blue to Red.
4. Select each scheme and verify the frequency ordering and visible route geometry remain
   stable. Confirm the legend gradient and accessible description match the active scheme.
5. Pan and zoom the map to a non-default viewport, then switch among all four schemes.
   Verify the map center, zoom level, and route geometry remain unchanged.
6. Select Black + Fire. Verify only the map tiles darken, route colors and overlays remain
   bright, map labels/roads remain usable, and the normal map returns after selecting a
   different scheme.
7. Change among All Sports, Run, Bike, and Swim. Verify the selected scheme persists and
   colors update for the current sport's frequency scale.
8. Select a sport with no GPS routes, then change schemes. Verify the existing empty state
   remains and no frequency guide values are shown.
9. Export the heatmap with each scheme. Verify the PNG preview contains the active map and
   route colors, including the dark presentation for Black + Fire, and the export context
   names both the scheme and sport.

The export capture uses external map tiles, so explicitly verify that the dark tile
appearance survives in the PNG preview; a passing Jest mock alone does not prove browser
canvas behavior or tile CORS compatibility.