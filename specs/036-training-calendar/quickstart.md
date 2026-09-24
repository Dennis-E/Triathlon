# Quickstart: Training Calendar View

## Prerequisites

- Node.js and npm installed.
- Repository dependencies installed with `npm install`.
- A local Strava CSV export or synthetic activity data; raw personal exports stay local.

## Automated validation

From the repository root:

```powershell
npm test -- training-calendar tab-navigation index-script-syntax
```

Expected result: calendar aggregation tests pass, tab registration tests pass, and the static HTML contains the required script order, tab markup, controls, and renderer dispatch.

## Manual validation

1. Serve the repository:

   ```powershell
   python -m http.server
   ```

2. Open `http://localhost:8000`.
3. Import a dataset containing activities from at least two years, multiple sports, and at least one activity with an unsupported sport.
4. Open **Training Calendar**.
5. Confirm the latest available year opens with a Monday-first full-year grid, month labels, weekday labels, empty cells, and an intensity legend.
6. Select a day with multiple activities. Confirm date, activity count, sports, duration, and distance appear; missing metrics are omitted rather than fabricated.
7. Switch years and confirm the grid contains only the selected year's activities.
8. Select `Run`, `Bike`, `Swim`, and `Other` when available. Confirm the grid, intensity levels, details, and empty state update.
9. Use keyboard focus to reach day cells and verify details are available without hover.
10. Resize to a narrow viewport. Confirm the grid can scroll horizontally while dates and day controls remain aligned and usable.

## Expected outcomes

- A dataset with no qualifying activities for a selected year still shows all calendar days and a clear empty-state message.
- Daily intensity uses duration first, distance second, and activity count third.
- Unsupported sports appear only as `Other`, never as a silently changed supported sport.
