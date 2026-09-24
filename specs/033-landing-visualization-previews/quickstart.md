# Quickstart Validation: Landing Visualization Previews

## Prerequisites

- Node.js and npm installed.
- Repository dependencies installed with `npm install`.
- The local preparation ZIP exists at `private-data/export_39173135.zip` and remains
  outside the published asset tree.

## Local asset preparation

1. Start the static app with `python -m http.server`.
2. Open the app locally and import the private ZIP through the existing Strava ingest
   flow.
3. Open each dashboard visualization and capture a representative screenshot for
   Total Distance, Heartrate vs Pace, Equipment, Equipment Timeline, Personal Bests,
   Heatmap, Distributions, and Workout Time.
4. Remove or generalize personal names, exact dates where identifying, equipment names,
   account details, and exact route geometry; crop captures to the visualization area.
5. Review all eight images for plausible values, readable labels, and privacy approval.
6. Copy only approved derived assets into `assets/previews/`; do not copy the ZIP or
   raw extracted files.

## Automated validation

From the repository root, run:

```powershell
npm test -- --runInBand __tests__/preview-assets.test.js __tests__/index-script-syntax.test.js
npm test
```

Expected result: all eight visualization keys and public asset references are present,
the private ZIP is not referenced by the landing page, and existing dashboard syntax
tests remain green.

## Browser validation

Open `http://localhost:8000/` at desktop and 390px mobile widths without importing a
file and verify:

1. All eight preview cards are visible through the landing-page preview area.
2. Workout Time and Distributions have clear titles and realistic screenshot content.
3. Cards have no horizontal overflow, clipped labels, or overlapping text.
4. Selecting a card preserves the existing import-required guidance before data is
   available.
5. The page still renders preview assets when `private-data/export_39173135.zip` is
   not present on the visitor's device.