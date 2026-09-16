# Quickstart: Validate the Route-Based Heatmap

This guide validates the feature end-to-end without needing a real Strava export, by using
synthetic GPS track data injected directly into the existing dashboard state.

## Prerequisites

- Repo checked out on branch `001-route-line-heatmap`.
- No new dependencies to install; Leaflet keeps loading from its existing CDN URL.

## 1. Run the automated unit tests

```powershell
npm test -- heatmap-utils
```

Expected: all tests in `__tests__/heatmap-utils.test.js` pass, including new cases for
`snapToGridCell`, `buildRouteSegments`, and `computeRouteSegmentStyle` (see
[data-model.md](./data-model.md) for signatures).

## 2. Serve the app locally

```powershell
python -m http.server
```

Open `http://localhost:8000` in a browser.

## 3. Manually validate route-line rendering (P1 — User Story 1 & 2)

1. Import any Strava export ZIP that contains GPS-tracked activities (or use the browser
   console to call the existing import/demo data path if available).
2. Open the **Heatmap** dashboard card, then the Heatmap visualization tab.
3. **Expected**: the map shows line-shaped routes following streets/paths — no soft, round,
   blurred blobs.
4. If your data includes a street ridden/run many times and another ridden/run once,
   **expected**: the frequent street renders visibly thicker/more prominent, and the
   once-traveled street is still clearly visible against the base map (not near-invisible).

## 4. Manually validate world-zoom visibility (P2 — User Story 3)

1. With activities concentrated in one home region plus at least one activity in a distant
   city (e.g. import a dataset that includes a one-off race in another country, or splice in
   a synthetic distant GPS track for testing).
2. Zoom the map fully out to a world view.
3. **Expected**: the distant city's route is still visibly rendered as a small but
   perceptible line, not reduced to nothing.
4. Zoom into the distant city.
5. **Expected**: the individual route lines for that one visit remain visible and consistent
   with what was shown at world zoom.

## 5. Validate sport filter recomputation (FR-006 / SC-004)

1. With multiple sports imported, switch between **All Sports / Run / Bike / Swim**.
2. **Expected**: displayed routes and their thickness update to match the selected sport's
   data only; no routes from a previously selected sport remain visible.

## 6. Validate the dashboard preview card

1. Return to the main dashboard (without opening the Heatmap tab).
2. **Expected**: the Heatmap card's small preview map now shows synthetic demo route lines
   (varying thickness) instead of heat blobs, consistent with the full view (see
   [research.md](./research.md) Decision 4).

## 7. Regression check

```powershell
npm test
```

Expected: full root Jest suite passes (no regressions in other dashboard tabs/utilities).
