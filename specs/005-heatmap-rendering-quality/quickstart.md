# Quickstart: Validate Heatmap Rendering Quality

This guide validates the frequency-on-top draw order fix and the smoother, curve-preserving
GPS track rendering using the same manual-interaction style as
`specs/002-heatmap-performance-scale/quickstart.md` and
`specs/004-heatmap-frequency-details/quickstart.md`.

## Prerequisites

- Repo checked out on branch `005-heatmap-rendering-quality`.
- A local Strava bulk export ZIP containing several activities on the same or overlapping
  roads, including at least one long, winding cycling activity previously reported as "not
  smooth" (see [TODO.md](../../TODO.md)). Use your own local export — do not add real
  exports to version control (`AGENTS.md`, constitution principle V).
- Root dependencies installed (`npm install` at repo root, if not already).

## 1. Run automated tests

```powershell
npm test
```

Expect all suites to pass, including:

- `__tests__/zip-importer.test.js` — `simplifyTrackPoints()` shape/endpoint preservation,
  tolerance behavior, and safety-maximum fallback.
- `__tests__/heatmap-utils.test.js` — draw-order sort (ascending count, lexical tie-break)
  and fixed style-constant behavior.
- `__tests__/index-script-syntax.test.js` — inline script syntax guard still passes after
  `index.html` changes.

## 2. Serve the app locally

```powershell
python -m http.server
```

Open `http://localhost:8000` in a browser.

## 3. Validate frequency-on-top draw order

1. Import a ZIP export containing multiple activities that share a road segment with
   different visit frequencies (e.g., a commute route ridden many times, crossed once by a
   different route).
2. Open the **Heatmap** tab. Zoom into the shared road position.
3. Confirm the road position shows the color for the *highest* visit count at that position
   (toward red end of the scale), not a lower-frequency color.
4. Pan and zoom the map several times. Confirm the same road position keeps showing the
   higher-frequency color after every redraw.
5. Switch the sport filter (e.g., `All` → `Bike` → `All`) and re-check the same position.

## 4. Validate re-import order independence

1. Re-import the same ZIP (or reload the page and re-import).
2. Confirm the shared road position from step 3 above still shows the same higher-frequency
   color as before — the visual result must not depend on activity processing order.

## 5. Validate smoother track rendering

1. Identify the long/winding cycling activity from Prerequisites.
2. In the Heatmap tab, zoom into a section with sharp turns or curves for that activity's
   route.
3. Confirm the drawn line visibly follows the curve/turn shape, rather than cutting across it
   with a long straight segment.
4. Compare against the previous behavior (e.g., a screenshot or memory of the "before" state
   described in [TODO.md](../../TODO.md): "bike activities are not smooth enough").

## 6. Validate single-channel frequency encoding

1. At a normal zoom level, locate two nearby but distinct parallel roads with different
   visit frequencies.
2. Confirm both are drawn at the same, visually consistent line thickness and are not merged
   or visually blended together.
3. Confirm you can rank at least three routes of clearly different visit frequency from
   least to most traveled using color alone.
4. Locate a single, rarely traveled, isolated route and confirm it remains clearly visible
   (same thickness/opacity as every other route, not a faint hairline).

## 7. Validate performance baseline is preserved

1. Import a large dataset (at or near the `specs/002-heatmap-performance-scale` baseline
   scale, e.g., thousands of activities) if available.
2. Pan and zoom around the world view and a dense local area.
3. Confirm navigation remains smooth, with no new perceptible multi-frame freeze introduced
   by the draw-order sort or track simplification.

## Expected outcome

All root suites must pass, including existing parsing, import, route visibility, performance,
color-scale, frequency/tooltip, and inline-script-syntax tests, plus the new simplification
and draw-order tests. Manual checks in steps 3–7 confirm the corrected visual behavior with
no regression to existing Heatmap tab functionality.
