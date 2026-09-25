# Quickstart: Unified Pace versus Metrics Validation

## Prerequisites

- Run commands from the repository root.
- Use synthetic data or a private Strava export; do not commit personal exports.
- Serve the app with `python -m http.server` and open `http://localhost:8000`.

## Focused automated validation

```powershell
npm test -- --runInBand __tests__/processing.test.js __tests__/scatter-utils.test.js __tests__/heartrate-pace-visualization.test.js __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js __tests__/export-utils.test.js __tests__/preview-assets.test.js __tests__/legal-footer.test.js
```

Expected results:

- The generic point model selects only valid Heart rate, Cadence, Elevation gain, or
  Distance values for exactly one selected sport.
- The point model preserves cadence labels and Run-only total steps.
- The tab, preview, export key, capture target, filename, and control context use
  `paceMetrics`; no removed tab key remains in active UI wiring.
- A year with one point has a visible bubble but no regression dataset.
- German and English cadence, elevation, and distance fields remain normalized without changing the established duplicate-distance semantics.

## Manual browser validation

1. Import synthetic activities for Run, Bike, and Swim across at least two years with
   heart rate, cadence, elevation gain, and distance values.
2. Open Pace vs .... Confirm the sport control has Run, Bike, and Swim only; it must
   not offer All Sports.
3. For each sport, select every metric. Confirm axis label, x-axis unit, tooltip
   measurement label, and point count match the active combination.
4. Under Cadence, confirm Run uses step cadence with optional Total steps, Bike uses
   pedal cadence without steps, and Swim uses neutral swim rhythm without a stroke claim.
5. Disable one year. Confirm only its bubbles and trend line disappear. Toggle Trend
   lines off and confirm bubbles remain visible.
6. Use a filter combination without qualifying points. Confirm the canvas hides and the
   explanatory empty state appears within one second.
7. Export a populated Pace vs ... view. Confirm the export identifies Sport, Metric, and
   Date range, then check browser console has no `ReferenceError` or duplicate declaration.
8. Conduct and record a moderated usability check: at least 95 % of participants must
   select one of the four metrics and read a related point within 15 seconds after import.

## Regression checks

```powershell
npm test -- --runInBand
```

Then confirm all remaining dashboard tabs activate after an import and the original
Heartrate vs Pace and Cadence vs Pace buttons are no longer present.