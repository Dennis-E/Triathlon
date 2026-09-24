# Quickstart: Workout Time Visualization

## Prerequisites

- Local checkout on branch `030-workout-time`.
- Node.js/npm installed for Jest.
- A modern browser and a synthetic or supplied Strava CSV containing valid activity start times.

## Setup

```powershell
npm install
npm test
```

## Manual validation

1. Serve the repository root:

   ```powershell
   python -m http.server
   ```

2. Open `http://localhost:8000` and import a dataset containing activities on different times of day, weekdays, dates of month, and months of year.
3. Open the **Workout Time** tab and verify Day view shows twelve fixed two-hour groups with counts.
4. Switch to Week view and verify groups are ordered Monday through Sunday.
5. Switch to Month view and verify activities from multiple months are aggregated under day numbers 1-31.
6. Switch to Year view and verify groups are ordered January through December.
7. Change All/Run/Bike/Swim and the existing date-range filter; verify counts update without losing the selected granularity.
8. Include an activity without a valid start time and verify it is excluded while valid activities remain visible.
9. Filter to a period/sport with no valid activities and verify the explicit empty state appears.
10. Export the tab and verify the image contains the selected granularity, labels, counts, and active filter context.

## Automated validation

```powershell
npm test -- workout-time-utils
npm test -- parsing
npm test -- processing
npm test -- tab-navigation
npm test -- index-script-syntax
npm test -- export-utils
```

Expected: all focused suites pass, covering timestamp parsing, normalized activity
fields, four-granularity grouping/filtering, tab registration, script loading, and
export metadata. Run the full `npm test` suite before implementation is considered
complete.

## References

- [UI contract](contracts/workout-time-ui.md)
- [Data model](data-model.md)
- [Design decisions](research.md)
