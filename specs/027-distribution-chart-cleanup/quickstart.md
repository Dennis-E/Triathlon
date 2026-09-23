# Quickstart: Distribution Chart Cleanup

## Prerequisites

- Node.js and npm installed.
- Repository root is `C:\dev\Triathlon`.
- A browser and a local Strava export or synthetic Run, Bike, and Swim activity data.
- Personal exports remain local and are not committed.

## Automated validation

Run the focused tests:

```powershell
npm test -- --runInBand __tests__/distribution-utils.test.js __tests__/index-script-syntax.test.js
```

Expected result: utility conversion/formatting tests and dashboard contract tests pass.

Run the full root suite:

```powershell
npm test -- --runInBand
```

## Manual browser validation

1. Start the static server:

   ```powershell
   python -m http.server 8000
   ```

2. Open `http://localhost:8000`, import data containing Run, Bike, and Swim activities, and open **Distributions**.
3. For Length, Elevation gain, Duration, Power, and sport-specific Pace, select Histogram and verify:
   - x-axis ticks show single boundaries rather than `start-end` ranges;
   - Length, Elevation gain, and Power units appear in axis titles only;
   - Run/Bike Elevation ticks match meter bucket boundaries;
   - Bike Power ticks match watt bucket boundaries;
   - overflow labels remain understandable.
4. Select Line mode for a single sport and All Sports. Verify:
   - smoothed lines and shaded areas remain visible;
   - no circular point markers are visible;
   - the legend marker fill matches the corresponding line color.
5. Select All Sports + Pace and verify the axis title is `Pace (km/h)`, with Run, Swim, and Bike represented on the shared speed scale and no `mixed units` text.
6. Select `Monochrome blue` and verify every histogram bar uses the same medium-dark blue. In Line mode verify the line and shaded area use the same treatment.
7. Change metric, sport, mode, and date range and confirm counts and data remain stable apart from the intended unit conversion for All Sports Pace.
8. Select an empty or unsupported combination and verify the existing N/A state replaces the prior chart.

Refer to [contracts/distributions-ui.md](contracts/distributions-ui.md) for the exact UI contract and [data-model.md](data-model.md) for conversion and tick rules.
