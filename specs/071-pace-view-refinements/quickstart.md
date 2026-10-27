# Quickstart: Pace-Ansichten verfeinern

## Prerequisites

- Node.js and the repository's installed npm dependencies.
- A local Strava export with Pace-vs-Metrics data in multiple years for the browser checks. The export stays local to the browser.

## Automated checks

From the repository root, run the focused year-state and page-syntax tests:

```powershell
npm test -- --runInBand __tests__/dashboard-scatter-years.test.js __tests__/index-script-syntax.test.js
```

Expected result: both suites pass. The year-state suite verifies that known disabled years survive sport, metric, date-range, and empty-data transitions and that a new import resets the selection.

## Browser checks

1. Start the static app with `python -m http.server 8000` and open `http://localhost:8000`.
2. Import a local export that contains qualified Pace-vs-Metrics activities from multiple years.
3. Open "Pace vs ..." at viewport widths of 1024, 768, and 390 CSS pixels. At 1024 and 768 pixels, verify that year and trend-line controls are to the chart's right. At 390 pixels, verify that they stack below without clipping or overlap.
4. At each width, verify that the chart retains its existing height and that all year labels and the trend-line control remain readable.
5. Uncheck two years, change sport and metric, then return to the original selections. Verify that known year states persist; verify that a newly available year is enabled and a year absent in an intermediate view retains its state when it returns.
6. Import a different dataset and verify that the year selection resets for the new import.

Expected result: the custom legend remains readable beside the chart at medium and wider widths, stacks cleanly on narrow screens, and does not change the existing Pace-vs-Metrics selection behavior.
