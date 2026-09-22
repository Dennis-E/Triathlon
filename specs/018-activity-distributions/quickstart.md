# Quickstart: Activity Distributions Visualization

## Prerequisites

- Local checkout on branch `018-activity-distributions`.
- Node.js installed (for running the Jest suite).
- A modern browser for manual verification.

## Setup

```powershell
npm install
npm test
```

## Manual validation (static app)

1. Serve the app from the repo root:

   ```powershell
   python -m http.server
   ```

2. Open `http://localhost:8000` in a browser.
3. Import or load a dataset that includes Run, Bike, and Swim activities (some with
   power data, some without) — see [docs/IMPORT_FEATURE.md](../../docs/IMPORT_FEATURE.md).
4. Open the new **Distributions** tab.
5. **Metric switching (User Story 1)**: Select each of Length, Duration, Pace,
   Elevation gain, and Power in turn. Confirm the chart re-renders with metric-specific
   axis labels and bucket ranges each time. Select Power with a dataset that has no
   power-capable activities and confirm the empty-state message appears instead of a
   blank/broken chart.
6. **Time horizon + sport filter (User Story 2)**: Narrow the date range using the
   dual-range control and confirm the chart recalculates to only the activities in that
   range. Reset to the full range and confirm the full dataset reappears. Switch the
   sport filter between All/Run/Bike/Swim and confirm the distribution updates
   accordingly; for Pace with sport = All, confirm activities from multiple sports
   appear combined on one chart (matching "Heartrate vs Pace" behavior).
7. **Display mode toggle (User Story 3)**: With any metric selected, toggle between
   "Histogram" and "Line". Confirm both modes reflect the same underlying bucket
   boundaries and counts (i.e., visually consistent shape, just bars vs. smoothed
   line). Change the metric, sport, or date range while in "Line" mode and confirm it
   stays in "Line" mode with updated data.
8. **Export**: Use the tab's export control and confirm it produces a shareable image
   consistent with other visualization tabs' export behavior.

## Automated validation

```powershell
npm test -- distribution-utils
npm test -- tab-navigation
npm test -- index-script-syntax
```

Expected: all three suites pass, covering bucket/filter computation
(`distribution-utils.test.js`), tab registration (`tab-navigation.test.js`), and the
inline Distributions script contract (`index-script-syntax.test.js`).

## Reference

- UI contract: [contracts/distributions-ui.md](contracts/distributions-ui.md)
- Data model: [data-model.md](data-model.md)
- Design decisions: [research.md](research.md)
