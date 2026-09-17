# Quickstart: Validate True-Path Route Geometry Rendering

This guide validates that route lines follow the actual recorded GPS shape at detailed zoom
levels, using the same manual-interaction style as
`specs/005-heatmap-rendering-quality/quickstart.md`.

## Prerequisites

- Repo checked out on branch `006-true-route-geometry`.
- A local Strava bulk export ZIP containing at least one activity with a visibly curving
  route (a winding road, a switchback, a roundabout), and ideally a road traveled by multiple
  activities with different frequencies. Use your own local export — do not add real exports
  to version control (`AGENTS.md`, constitution principle V).
- Root dependencies installed (`npm install` at repo root, if not already).

## 1. Run automated tests

```powershell
npm test
```

Expect all suites to pass, including:

- `__tests__/heatmap-utils.test.js` — true-point-index mapping in `interpolateTrackProbes()`,
  and corridor true-path assembly in `buildRouteSegments()` (shape preservation, no invented
  points, one polyline per corridor).
- `__tests__/index-script-syntax.test.js` — inline script syntax guard still passes after
  `index.html` changes.

## 2. Serve the app locally

```powershell
python -m http.server
```

Open `http://localhost:8000` in a browser.

## 3. Validate true-path curve continuity

1. Import a ZIP export containing the curving activity from Prerequisites.
2. Open the **Heatmap** tab and zoom into the curving section at street level.
3. Confirm the drawn line visibly follows the curve continuously, without short straight
   facets meeting at visible angles that don't match the real road shape.
4. Zoom in further and back out a few times; confirm the line continues to look like a real
   route at every step, not just the zoom level first tested.

## 4. Validate frequency coloring still applies correctly

1. Locate (or import) a road segment traveled by multiple activities with a nearby,
   less-traveled curving road.
2. Confirm the frequently traveled curve is colored toward the high-frequency end of the
   scale along its whole visible curved length, and the less-traveled curve is colored
   toward the low-frequency end along its whole length.
3. Confirm color changes happen at natural points along a route (between corridors), not
   smoothly interpolated within a single corridor's polyline.

## 5. Validate unaffected existing behavior

1. Hover over several points along a true-path-rendered route; confirm the existing tooltip
   (`specs/004-heatmap-frequency-details`) still resolves the correct contributing
   activities.
2. Zoom out below the low-zoom aggregation threshold; confirm the existing coarser aggregated
   rendering is unchanged.
3. Switch the sport filter (e.g., `All` → `Bike` → `All`); confirm true-path rendering
   updates correctly and colors/order remain consistent with `specs/005-heatmap-rendering-quality`.
4. Confirm a single, rarely traveled, isolated route remains clearly visible.

## 6. Validate performance baseline is preserved

1. Import a large dataset (at or near the `specs/002-heatmap-performance-scale` baseline
   scale, e.g., thousands of activities) if available.
2. Pan and zoom around the world view and a dense local area.
3. Confirm navigation remains smooth, with no new perceptible multi-frame freeze introduced
   by true-path rendering.

## Expected outcome

All root suites must pass, including existing parsing, import, route visibility, performance,
color-scale, frequency/tooltip, rendering-quality, and inline-script-syntax tests, plus the
new true-path mapping and assembly tests. Manual checks in steps 3–6 confirm routes now
visually follow their real recorded shape at detailed zoom levels, with no regression to any
existing Heatmap tab functionality.
