# Quickstart: Validate Export Refinements

## Prerequisites

- Node.js and npm installed for Jest checks.
- A browser available to inspect the static app.
- A local Strava export ZIP or synthetic imported data for dashboard content.

## Automated Checks

From the repository root:

```powershell
npm test -- --runInBand
```

Expected results:

- `src/export-utils.js` tests pass for the canonical domain, aspect-ratio fit behavior, export target metadata, and asset contracts.
- `__tests__/index-script-syntax.test.js` passes for export control labels, popup placement, local asset behavior, and composition structure.
- No API test or service dependency is required because the feature remains in the root static app.

## Browser Validation

Start the static server:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/index.html`, import a Strava export, and check:

1. Open each supported visualization tab and confirm the control reads `Export for Insta / Strava`; confirm the Strava icon is clearly legible.
2. Activate an export and inspect the preview. Verify the domain is `https://dennis-e.github.io/Triathlon/`, the TriAnalytica logo is not horizontally squeezed, and no Strava or Instagram logo appears in the image.
3. Inspect the available filter/view picture. Verify its labels and selected states match the current dashboard controls.
4. Download the image and verify it matches the preview and still contains no platform logos.
5. Repeat at a narrow viewport. Confirm the export control, available-control picture, headline, logo, filters, legend, domain, and QR code do not overlap or become unreadable.
6. Open Personal Bests. Confirm the overview has no export button. Expand one data-bearing PB tile and verify the popup contains exactly one export button that exports that detail. Close it and confirm the button disappears.
7. Expand a different PB tile and repeat to verify the exported title and content follow the currently active detail.
8. Exercise a no-data state and verify no blank export preview is produced.

## References

- [Export UI contract](contracts/export-ui.md)
- [Data model](data-model.md)
- [Feature specification](spec.md)
