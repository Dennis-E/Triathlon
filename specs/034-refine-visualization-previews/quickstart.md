# Quickstart Validation: Refine Visualization Previews

## Prerequisites

- Node.js and npm installed.
- Repository dependencies installed with `npm install`.
- The private local export is available for preparation only.

## Capture workflow

1. Start `python -m http.server` and import the local export through the existing
   dashboard flow.
2. Capture Heartrate vs Pace with Run selected and the focused 2021-2026 range.
3. Capture Equipment with Bikes selected and readable/generalized labels.
4. Capture Equipment Timeline with Bikes and Activities selected.
5. Open a visible 50 km Personal Best tile/detail view and capture it.
6. Capture a privacy-reviewed Rheinland-area Heatmap view.
7. Capture Distributions and Workout Time with enough chart height to include x-axis
   labels and units.
8. Replace the seven affected files under `assets/previews/` and update the asset
   review plus `capture-states.md`.

## Automated validation

```powershell
npm test -- --runInBand __tests__/preview-assets.test.js __tests__/index-script-syntax.test.js
npm test
```

Expected result: public asset paths and card contracts remain valid, all corrected
assets exist, and the complete root suite passes.

## Browser validation

At desktop and 390px mobile widths, open `http://localhost:8000/` and verify:

1. Each corrected preview is visibly populated.
2. Equipment and Timeline show Bikes-only content; Timeline shows Activities bars.
3. Personal Bests shows a visible 50 km card.
4. Heatmap shows Rheinland context without exact identifying routes.
5. Distributions and Workout Time show x-axis labels inside the image.
6. No card has clipped labels, black empty content, or horizontal overflow.