# Quickstart: Validate Heatmap Frequency and Activity Details

## Prerequisites

- Node.js and npm
- A modern desktop browser
- A static HTTP server
- Synthetic GPS/activity fixtures for automated checks
- Optionally, an explicitly supplied local Strava export for large-scale manual validation

Never commit personal export data or use `test-data/` as a source of real user fixtures.

## 1. Run focused automated tests

```powershell
npm test -- --runTestsByPath __tests__/heatmap-utils.test.js
npm test -- --runTestsByPath __tests__/index-script-syntax.test.js
```

Expected results:

- `1`, `10`, `100`, and `1000` occupy evenly spaced logarithmic positions.
- Colors span `#60A5FA` through midpoint `#9E6690` to `#DC2626` without a 90% color stop.
- The legend model reports minimum, geometric midpoint, and maximum.
- 30-meter matching, direction reversal, continuity, crossing, and loop cases pass.
- Detail and low-zoom `count` equal distinct `activityIds.length`.
- Screen-index hit tests resolve nearby strokes deterministically.
- Tooltip sampling returns ten unique items with injected deterministic randomness.
- Run/Bike/Swim units and missing-value fallbacks are correct.

## 2. Start the static app

Use the repository's standard server where Python is available:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`, import a local validation dataset, and open Heatmap.

## 3. Validate full-range color semantics

Use known route frequencies `1`, `10`, `100`, and `1000`.

Expected results:

- Minimum is light blue and maximum is red.
- Counts `10` and `100` progress visibly through blue-red midpoint colors.
- A count at the geometric midpoint receives the midpoint color.
- Legend labels read Low, Mid, High and contain the current minimum, geometric midpoint, and
  maximum.
- Pan and zoom do not alter route colors or legend values.

## 4. Validate 30-meter route matching

Use synthetic recordings containing:

- Repeated forward and reverse paths offset by 0, 20, and 30 meters.
- One comparable path offset by 31 meters.
- A perpendicular crossing.
- A briefly parallel path that later diverges.
- One activity that loops over the same corridor repeatedly.

Expected results:

- Corresponding 0-30 meter paths match for at least 95% of comparable route portions.
- The 31-meter path stays distinct.
- Crossing and brief adjacency do not merge.
- Reverse traversal matches.
- The looping activity appears once in each segment's `activityIds`.
- Every detail count equals its distinct ID-array length.

## 5. Validate activity tooltips

Hover routes with 1, 10, 11, and many contributing activities.

Expected results:

- Totals up to ten list all activities.
- Totals above ten show ten unique rows and `Random 10 of X activities`.
- Moving within one route does not change the sample; leaving and re-entering may change it.
- Each row shows name, date, sport, distance in sport-specific units, and duration.
- Missing metadata uses neutral fallbacks and unresolved IDs produce an availability note.
- Tooltip closes on pointer leave, filter change, pan, and zoom.

## 6. Validate low zoom and filters

Cross the existing low-zoom threshold and switch through All Sports, Run, Bike, and Swim.

Expected results:

- Low-zoom membership is a distinct union with no duplicate activity IDs.
- Tooltips describe the aggregate's available activities without invented entries.
- Detail-route color frequency is not inflated by geographic aggregation.
- Each filter clears stale color, legend, hit-index, and tooltip state.
- Isolated routes remain visible at world zoom.

## 7. Validate interaction performance and layout

Use a dataset of at least 3,000 activities or approximately 221,000 detail segments.

Expected results:

- Pan and zoom remain responsive with one Canvas route layer.
- Hover tooltip appears within 250 milliseconds.
- Rapid pointer movement does not scan all route segments or flicker samples.
- Tooltip remains fully inside the map on desktop edges and does not overlap controls or
  attribution incoherently.
- At mobile width, touch pan/zoom works unchanged and no hover overlay blocks gestures.

## 8. Run the complete regression suite

```powershell
npm test
```

All root suites must pass, including existing parsing, import, route visibility, performance,
sport-filter, and tab-navigation checks.