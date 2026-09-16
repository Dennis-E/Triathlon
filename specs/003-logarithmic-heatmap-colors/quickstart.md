# Quickstart: Validate Logarithmic Heatmap Colors

## Prerequisites

- A modern browser
- Python 3 for the static server
- Node.js and npm for Jest validation
- Synthetic GPS data or a local Strava export containing repeated and one-off routes

Do not commit personal export data or add it under `test-data/`.

## 1. Run focused automated tests

From the repository root:

```powershell
npm test -- --runTestsByPath __tests__/heatmap-utils.test.js
npm test -- --runTestsByPath __tests__/index-script-syntax.test.js
```

Expected results:

- Counts `1`, `10`, `100`, and `1000` normalize to `0`, approximately `0.333`,
  approximately `0.667`, and `1`.
- Colors progress light blue to darker blue, with red introduced only above normalized `0.9`.
- Equal/single-value data stays light blue and never becomes red.
- Invalid values do not affect valid scale bounds.
- Low-zoom aggregation keeps summed `count` and maximum source `colorCount` separately.
- Existing heatmap aggregation, styling, culling, and visibility tests continue to pass.

Then run the complete root suite:

```powershell
npm test
```

## 2. Start the static app

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`, import the local validation dataset, and open the Heatmap tab.

## 3. Validate the varied logarithmic scale

Use data containing known route frequencies of `1`, `10`, `100`, approximately `502`, and
`1000` visits.

Expected results:

- The one-visit route is clearly visible in light blue against the map.
- `10` and `100` are successively darker blue and remain distinguishable.
- Approximately `502` is at the dark-blue extreme boundary; only values above it acquire red.
- `1000` reaches the red endpoint.
- The legend shows minimum `1`, extreme start `502`, and maximum `1000`.
- Existing line thickness still increases independently with frequency.

## 4. Validate stable map navigation

Pan across multiple regions and zoom from world level into street level, including crossing
the existing low-zoom threshold.

Expected results:

- A route keeps the same color while panning and at detailed zoom levels.
- Low-zoom areas do not become red merely because many nearby segments were aggregated.
- A genuinely extreme route remains represented as extreme at low zoom.
- Isolated one-off routes remain visible at world zoom.
- Navigation remains as responsive as before the color feature.

## 5. Validate sport filters and legend updates

Select All Sports, Run, Bike, and Swim using data where a shared route has different counts
per sport.

Expected results:

- Every selection recolors routes from that filter's complete frequency range.
- The legend values update with the route colors.
- No stale route color or legend value remains from the previous filter.
- A sport with no matching GPS routes shows the existing empty state and no legend.

## 6. Validate constant and error states

Use one dataset containing a single route, then one containing several equally frequent
routes. Separately, simulate an unavailable map library/network failure.

Expected results:

- Single and equal-frequency routes are all light blue.
- The legend shows one blue swatch and one shared value, with no red range.
- A load failure shows the existing map error message and hides the legend.

## 7. Validate responsive presentation

At representative mobile and desktop widths, inspect the full map and dashboard preview.

Expected results:

- Colors follow the same progression in preview and full map.
- The legend does not overlap map controls or Leaflet attribution.
- Labels fit without clipping or changing map dimensions.
- Light blue, dark blue, and red remain distinguishable on representative streets, water,
  parks, and dense-label areas of the base map.