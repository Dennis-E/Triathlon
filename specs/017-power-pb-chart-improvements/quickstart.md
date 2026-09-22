# Quickstart: Power PB Chart Improvements

## Prerequisites

- Repository checked out on branch `017-power-pb-chart-improvements`.
- Node.js/npm available from the repository root.
- Serve the static app with `python -m http.server`.
- Use synthetic or explicitly supplied local FIT/CSV data; do not add personal exports.

## Automated validation

Run the focused tests:

```powershell
npm test -- power-pb-utils index-script-syntax
```

Expected outcomes:

- `buildAllTimePowerProfile` (or a companion helper) exposes each point's label
  visibility (`showLabel`) plus the profile's `minWatts`/`maxWatts`, with the shortest
  duration and every duration `>= 300` seconds marked visible, and all other available
  durations marked hidden.
- With a single profile point, or all points sharing one watt value, `minWatts` equals
  `maxWatts` and no duplicate axis label is produced.
- The inline PB script contract confirms duration tiles are rendered using the shared
  timeline-chart helpers (axes, current-best callout, tooltip wiring) rather than the
  old static-text summary, including for a duration with exactly one qualifying PB.
- The all-time profile's rendering wires a hover handler per point that calls the
  shared tooltip functions with duration, watts, date, and activity context.

Then run the complete root suite:

```powershell
npm test
```

## Manual browser validation

1. Start the app with `python -m http.server` and open `http://localhost:8000`.
2. Import a synthetic or explicitly supplied dataset with qualifying Bike FIT power
   efforts across several durations (short and long) with more than one PB per
   duration where possible.
3. Open **Personal Bests** and inspect the Bike Watt section.
4. **Expected**: hovering any point on the all-time power profile shows a tooltip with
   duration, watts, date, and activity name; moving off the chart hides it.
5. **Expected**: the profile's y-axis shows the exact highest and lowest plotted watt
   values (not a fixed `0` baseline).
6. **Expected**: on the x-axis, only the shortest duration and durations of 5 minutes
   or longer show text labels; the in-between short durations still show their points
   and connecting line, just without a label.
7. Inspect an individual duration tile (e.g. 5s) with two or more PBs.
8. **Expected**: the tile shows an inline time-series chart (axes, trend line, current
   best callout) instead of a plain "Current best" line, and hovering a historical
   point shows the shared PB tooltip.
9. Inspect a duration tile with exactly one qualifying PB.
10. **Expected**: it still renders via the same chart layout, showing a single marker.
11. Click the maximize button on a duration tile.
12. **Expected**: the existing full-screen detail chart still opens and works as before.
13. Verify Run/Swim and other Bike PB sections (distance, elevation, Longest).
14. **Expected**: existing non-power behavior remains unchanged.
