# Quickstart: Countries Visited in Lifetime Statistics

## Prerequisites

- Node.js and the repository's installed root dependencies.
- A local static HTTP server for the manual browser check.
- Synthetic activity/route data only; personal Strava exports are not required.

## Focused Automated Validation

From the repository root, run the focused Jest checks:

```powershell
npm test -- --runInBand --runTestsByPath __tests__/country-count-utils.test.js __tests__/dashboard-country-count.test.js __tests__/dashboard-export-download.test.js
```

Expected coverage includes:

- Same-country repeated routes count once; different-country routes count separately.
- A LineString crossing a country counts it even when no sampled coordinate is inside it.
- Invalid/no route data, one-point tracks, complete/partial coverage, and unavailable geometry are distinguished.
- Changing the imported dataset recomputes the summary; changing chart filters does not.
- The Lifetime Statistics export capture contains the same count, names, and coverage status as the visible tile; the Distance export has no country fields.

## Browser Smoke Check

1. Start the app with `python -m http.server 8000` and open `http://localhost:8000`.
2. Load a synthetic imported dataset with routes in two countries, a repeated route in one country, and at least one activity without route data.
3. Open Lifetime Statistics. Confirm the count is two, both country names appear in the Countries visited tile, and partial coverage is phrased neutrally (for example, "Based on 3 of 4 activities").
4. Open Distance and confirm no country count or country names appear there.
5. Change sport, aggregation, and timeframe selections in Distance. Confirm the all-time country summary shown in Lifetime Statistics remains unchanged.
6. Export Lifetime Statistics and confirm the preview includes the same count, country names, and coverage text.
7. Replace the imported dataset with one containing a route in a third country. Confirm the count and names update and the previous result is not retained.
8. Load a dataset with no usable locations. Confirm the country tile says unavailable instead of zero.

## Privacy Check

The country geometry is loaded from the app's local assets and route matching runs in the browser. Verify that no activity points, route files, or derived country identifiers are sent to a network service.