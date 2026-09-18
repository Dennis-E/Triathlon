# Quickstart: Enhanced Visualization Export

## Prerequisites

- Node.js and npm installed for the Jest checks.
- A local checkout of the repository.
- A synthetic or explicitly supplied Strava export ZIP; do not use personal exports in version control.

## Automated validation

From the repository root:

```powershell
npm test -- --runInBand __tests__/export-utils.test.js __tests__/index-script-syntax.test.js
npm test -- --runInBand
```

Expected results:

- export helpers pass for tabs, filters, legends, assets, PB tile targets, and filenames;
- inline JavaScript parses successfully;
- markup tests find `Export for ...`, both platform logos, local brand assets, and PB tile export wiring;
- the complete root test suite passes.

## Browser smoke validation

1. Start the static app: `python -m http.server 8000`.
2. Open `http://localhost:8000/index.html`.
3. Import a synthetic Strava ZIP or use an explicitly supplied local export.
4. Open each visualization tab and confirm the export control wording and two logos.
5. Apply a non-default filter, export, and confirm the preview contains the separate headline, selected visualization, filter summary, applicable legend, TriAnalytica logo, QR code, and domain.
6. Open Personal Bests and activate export on two different data-bearing detail tiles. Confirm each preview contains only the selected tile and has a distinct filename.
7. Confirm an empty/no-data tab or tile shows a no-data message and does not create a blank preview.
8. Download one preview, reopen it locally, and verify the image remains square, readable, and contains no overlapping required regions.
9. Close the preview and repeat an export to verify no stale image or state is reused.

## Asset failure check

Temporarily make one required asset unavailable in a local development copy. Trigger export and confirm the app shows a clear failure message and does not offer a broken downloaded image. Restore the asset afterward.

See [data-model.md](data-model.md) for target/state rules and [contracts/export-ui.md](contracts/export-ui.md) for the user-visible contract.
