# Quickstart: Distribution Labels and Color Schemes

## Prerequisites

- Node.js and npm installed.
- Repository root is `C:\dev\Triathlon`.
- A browser that can load the static app.
- A local Strava export or synthetic activity data containing Run, Bike, and Swim records. Keep personal exports local and out of version control.

## Automated validation

Run the focused distribution tests:

```powershell
npm test -- --runInBand __tests__/distribution-utils.test.js __tests__/index-script-syntax.test.js
```

Expected result: all distribution utility and inline-script contract tests pass, including color schemes, axis units, Bike Pace formatting, `50+`, All Sports Histogram N/A handling, and point-style legends.

Run the complete root suite before implementation is considered complete:

```powershell
npm test -- --runInBand
```

## Manual browser validation

1. Start the static server from the repository root:

   ```powershell
   python -m http.server 8000
   ```

2. Open `http://localhost:8000` and import a dataset with at least Run, Bike, and Swim activities.
3. Open **Distributions** and verify the color selector defaults to **On fire**.
4. Select **Monochrome blue** and confirm bars, points, line points, and legend cues change to blue shades. Change metric, sport, mode, and date range; confirm the selection remains active.
5. With **All Sports** selected, verify **Line** mode renders per-sport lines and the Length upper open-ended category reads `50+` when present.
6. With **All Sports** and **Histogram** selected, verify the chart is hidden and the empty state clearly says `N/A`. Select Run, Bike, or Swim and verify a qualifying single-sport histogram renders.
7. Check axis titles and labels:
   - Length: `Length (km)`
   - Duration: hours and minutes such as `1h 30m`
   - Elevation gain: `Elevation gain (m)`
   - Power: `Power (W)`
   - Pace: the applicable sport unit appears once in the axis title; Bike tick labels have no unnecessary decimal point.
8. Verify every visible legend uses a filled circular marker and no line-only marker.
9. Select a metric or sport with no qualifying data and confirm `N/A` replaces the previous chart rather than leaving stale content visible.

The required UI behavior is summarized in [contracts/distributions-ui.md](contracts/distributions-ui.md), and derived state rules are in [data-model.md](data-model.md).
