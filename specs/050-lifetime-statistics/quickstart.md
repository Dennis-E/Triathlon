# Quickstart: Lifetime Statistics

## Automated validation

From the repository root, run the focused Jest suites:

```powershell
npx jest __tests__/lifetime-statistics-utils.test.js __tests__/lifetime-statistics-dashboard.test.js __tests__/dashboard-import.test.js __tests__/processing.test.js __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js __tests__/export-utils.test.js
```

Then run the complete root suite:

```powershell
npm test
```

The aggregate tests use synthetic normalized activity objects. Import/parser tests verify availability metadata for absent, invalid, zero, and positive distance/time values while asserting that current numeric fields remain unchanged.

## Performance validation

From the repository root, run the standalone synthetic-data benchmark:

```powershell
node scripts/benchmark-lifetime-statistics.js
```

Expected: median aggregation time is under 1 second for 5,000 activities. This benchmark is run separately from Jest so machine-dependent timing does not make the unit suite flaky.

## Manual browser validation

1. From the repository root, run `python -m http.server` and open `http://localhost:8000`.
2. Import a synthetic Strava-style CSV with valid dates, supported and unknown sports, repeated bike gear, multiple rows on one date, positive values, a real zero, and missing/invalid distance, time and elevation values. Use the established duplicate-distance columns and units.
3. Open **Lifetime Statistics** from the dashboard tab bar.
   - Confirm total workout count counts all accepted activity records, even when one or more metrics are absent.
   - Confirm overall distance, moving time and elevation use valid recorded values and expose partial/unavailable status accurately.
   - Confirm unknown sports contribute valid values to overall totals but do not create a supported-sport row.
   - Confirm per-sport totals, active days, longest-distance activity, longest-duration activity, distinct Run gear (shoes) count, and distinct Bike gear count match the synthetic input; confirm no equipment names are shown.
   - Confirm multiple activities on one local date count as one active day and a valid zero is not shown as missing.
   - For the usability check, ask five people unfamiliar with this view to find total distance, moving time, and workout count without assistance; at least four must find all three within 30 seconds of opening the tab.
4. Repeat with no imported data and with an import where optional values are absent; check the empty state and per-metric unavailable messages.
5. At narrow and wide viewport sizes, verify cards wrap without horizontal scrolling and tab controls remain keyboard-operable with ArrowLeft/ArrowRight.
6. With data loaded, use Share/Export; check the local preview contains the visible totals, sport breakdown and milestones and that download works. With no data, verify the standard no-data behavior.
7. Confirm the feature adds no requests that transmit activity data; existing application requests remain unchanged.

Example synthetic expected results for four processed activities: 4 workouts; 55 km total from three valid distances; 12,600 seconds total moving time; 300 m recorded elevation with an incomplete-data note when one of four activities lacks elevation; three unique local activity days when two workouts share a date; shoe and bike totals based on distinct non-empty, non-placeholder gear labels. A 40 km Bike activity with 7,200 seconds is the longest by both distance and moving time. Adjust expected values to match the exact fixture used in tests.

See [data-model.md](data-model.md), [lifetime-statistics-utils.md](contracts/lifetime-statistics-utils.md), and [ui-contract.md](contracts/ui-contract.md) for field, calculation and UI details. Never use private personal exports as test fixtures.
