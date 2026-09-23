# Quickstart: Distribution Histogram Axis Units

## Prerequisites

- Node.js and npm installed.
- Repository root is `C:\dev\Triathlon`.
- A browser and synthetic or supplied local activity data spanning multiple buckets for Run, Bike, and Swim where applicable.
- Personal exports remain local and are not committed.

## Automated validation

Run the focused distribution tests:

```powershell
npm test -- --runInBand __tests__/distribution-utils.test.js __tests__/index-script-syntax.test.js
```

Expected result: boundary formatting, metric-unit formatting, category-axis mapping, and N/A contract tests pass.

Run the complete root suite:

```powershell
npm test -- --runInBand
```

## Manual browser validation

1. Start the static server:

   ```powershell
   python -m http.server 8000
   ```

2. Open `http://localhost:8000`, import data with enough values to produce multiple distribution buckets, and open **Distributions**.
3. Select **Histogram** and inspect each metric:
   - Length: ticks are km boundaries.
   - Elevation gain for Run and Bike: ticks are meter boundaries matching the bucket values.
   - Duration: ticks are readable time values, not indices.
   - Run/Swim Pace: ticks are `min:ss` values.
   - Bike/All Sports Pace: ticks are `km/h` values.
   - Bike Power: ticks are watt values.
4. Confirm no Histogram x-axis shows an unexplained sequence such as `0, 1, 2, 3` and no regular tick shows a full range such as `50-100`.
5. Confirm open-ended buckets remain understandable (`50+`, `< value`, or `> value`).
6. Change metric, sport, color scheme, and date range; confirm the axis updates to the current unit and does not retain labels from the previous chart.
7. Select an empty or unsupported combination; confirm the existing N/A state is shown without a misleading numeric axis.
8. Compare activity totals and bucket counts before and after changing only the axis presentation; they must remain unchanged.

See [contracts/distributions-ui.md](contracts/distributions-ui.md) for the exact visible behavior and [data-model.md](data-model.md) for boundary formatting rules.
