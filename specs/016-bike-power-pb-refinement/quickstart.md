# Quickstart: Bike Power PB Refinement

## Prerequisites

- Repository checked out on branch `016-bike-power-pb-refinement`.
- Node.js/npm available from the repository root.
- Serve the static app with `python -m http.server`.
- Use synthetic or explicitly supplied local FIT/CSV data; do not add personal exports.

## Automated validation

Run the focused tests:

```powershell
npm test -- power-pb-utils zip-importer index-script-syntax
```

Expected outcomes:

- The activity-average power progression is absent from the Personal Bests contract.
- Duration definitions include `5s`, `30s`, `1m`, `2m`, `5m`, `10m`, `20m`, and `60m`.
- Rolling efforts retain the 80% finite positive-power coverage rule.
- Average CSV watts do not create duration PBs or profile points.
- All-time profile helpers return at most one highest point per available duration,
  sorted by duration, and omit missing durations without interpolation.
- The Bike Watt section is asserted below Longest, omits unavailable duration cards,
  and exposes Duration/Power axes.
- The browser contract verifies that `createActivityAveragePowerRecords()` is no
   longer called by Personal Bests and that duration definitions come from
   `window.powerPbUtils.POWER_DURATIONS`.

Then run the complete root suite:

```powershell
npm test
```

## Manual browser validation

1. Start the app with `python -m http.server` and open `http://localhost:8000`.
2. Import a synthetic or explicitly supplied dataset with qualifying Bike FIT power
   efforts for at least 5s, 30s, 1m, 2m, 5m, 10m, 20m, and 60m.
3. Open **Personal Bests** and inspect the Bike column.
4. **Expected**: Bike distance, elevation, and Longest sections remain in place, then
   a separate `Watt` section appears below Longest.
5. **Expected**: There is no `Activity-average power progression` card or equivalent
   activity-average PB section.
6. **Expected**: Duration cards show the eight supported labels, values in `W`, and
   source activity/date details.
7. Inspect the all-time profile.
8. **Expected**: duration is on the x-axis, watts/power is on the y-axis, and each
   available duration contributes at most one highest-value point.
9. Repeat with partial data containing only two or three durations.
10. **Expected**: missing duration cards are omitted, the available points connect directly,
    and no estimated points appear.
11. Repeat with only one or zero qualifying duration.
12. **Expected**: the profile shows a limited-data or no-data state rather than a
    misleading complete curve.
13. Verify Run/Swim and non-power Bike PB sections.
14. **Expected**: existing non-power behavior remains unchanged.

## Focused selectors and known limitations

- Utility coverage: `__tests__/power-pb-utils.test.js`.
- FIT import coverage: `__tests__/zip-importer.test.js`.
- Dashboard markup/runtime contract: `__tests__/index-script-syntax.test.js`.
- The browser smoke test requires a local or explicitly supplied FIT dataset with
   record sampling dense enough to represent the requested duration; sparse data
   legitimately omits short durations.

## References

- [Feature specification](spec.md)
- [Research decisions](research.md)
- [Data model](data-model.md)
- [UI contract](contracts/watt-pb-ui.md)
