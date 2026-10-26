# Quickstart: Aggregation-Aware Distance Labels

## Prerequisites

- Node.js and npm installed at the repository root.
- A local Strava or TrainingPeaks export containing activities across multiple days, weeks, months, and years; synthetic activity data may be used for automated tests.

## Automated Validation

Run the focused dashboard tests:

```powershell
npm test -- --runInBand __tests__/dashboard-core.test.js
```

Run the browser-script syntax regression check:

```powershell
npm test -- --runInBand __tests__/index-script-syntax.test.js
```

Expected outcomes: each aggregation produces its mapped chart title, average label/unit/value, and peak label/value/period; averages equal the filtered total divided by visible bucket count; peaks match the largest bucket after sport and timeframe filtering; total-volume and chart-bucket behavior remain unchanged.

## Browser Validation

1. Start the static app with `python -m http.server 8000` and open `http://localhost:8000`.
2. Import a dataset with activities spread across multiple daily, weekly, monthly, and yearly buckets.
3. In the Distance visualization, select Daily, Weekly, Monthly, and Yearly in turn. Confirm the title, average label/unit, and peak label/period match [the UI contract](contracts/total-distance-labels.md).
4. For each aggregation, compare the displayed average with total volume divided by visible bucket count; compare the peak value and period with the largest chart bucket. Repeat with All Sports and each individual sport.
5. Change the timeframe and confirm average and peak use only visible buckets. Switch aggregations repeatedly and confirm no prior label, unit, value, or peak period remains.
6. Confirm Total Volume, Weekly Average, chart buckets, empty-state behavior, and export behavior remain unchanged.