# Quickstart: Export Follow-up Fixes

## Prerequisites

- Node.js and npm installed.
- Static server available via Python.
- A local Strava ZIP export with at least one personal-best detail for PB testing.

## Automated Validation

From the repository root:

```powershell
npm test -- --runInBand --runTestsByPath __tests__/export-utils.test.js __tests__/index-script-syntax.test.js
npm test -- --runInBand
```

Expected results:

- Export control assertions confirm Strava icon, exact label, and Instagram icon order.
- Composition assertions confirm sequential metadata positioning and no fixed overlapping legend position.
- PB assertions confirm a stable wrapper target and retryable error state.
- Full root suite passes without changes to import or API behavior.

## Browser Validation

Start the static server:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/index.html`, import Strava data, and verify:

1. Inspect every visualization export control. Confirm the order is Strava icon, `Export for Insta / Strava`, Instagram icon.
2. Resize to a narrow viewport and confirm both icons and the full label remain visible.
3. Export a visualization without a legend and one with the heart-rate/pace legend. Confirm filters, control pills, and legend occupy separate rows with no overlap.
4. Use a long active filter summary or many controls and confirm the legend remains above the footer and QR code.
5. Open Personal Bests, expand a data-bearing detail, and activate the popup export button. Confirm a preview opens and the generic capture error does not appear.
6. Open a second PB detail and export again. Confirm the second title/chart is exported, not the first detail.
7. Trigger or observe a failed capture, then retry. Confirm the action is not stuck and a later attempt can run.
8. Confirm no Strava or Instagram icon appears inside the generated preview/download image.

## References

- [Export UI contract](contracts/export-ui.md)
- [Data model](data-model.md)
- [Feature specification](spec.md)
