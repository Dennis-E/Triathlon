# Contract: `src/pie-chart-utils.js`

Dual-target module: `module.exports` for Jest and `window.pieChartUtils` for the browser. Depends on `distribution-utils.js` (`require` in Node, `window.distributionUtils` in browser). Pure functions only; no DOM access.

## Constants

- `PIE_DIMENSIONS`: `['sport', 'duration', 'pace', 'equipment', 'length', 'power']`
- `PIE_MEASURES`: `['count', 'time', 'distance']`
- `PIE_MAX_SLICES`: `8`

## Functions

### `computePieSlices(activities, options) → PieChartResult`

- `options`: `{ dimension, measure, sport = 'All', colorScheme = 'fire', maxSlices = 8 }`
- Returns `{ slices, total, activityCount, excludedCount }` as defined in [data-model.md](../data-model.md).
- Unknown `dimension`/`measure` or non-array input → empty result (no throw).

### `getPieSliceColors(count, scheme) → string[]`

- Returns `count` hex colors sampled evenly along the scheme gradient (`'fire'` or `'monochrome-blue'`); `count === 1` → middle color.

### `formatPieMeasureValue(measure, value) → string`

- `count` → `"12 activities"` (`"1 activity"`); `time` → `"5h 20m"` / `"45m"`; `distance` → `"123.4 km"`.

## Change to `src/distribution-utils.js`

- Additionally export `findBucketIndexForValue` in both the CommonJS and `window.distributionUtils` bridges. No existing signature changes.
