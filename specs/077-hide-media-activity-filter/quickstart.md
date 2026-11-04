# Quickstart: Hide Media Activity Filter

## Prerequisites

- Node.js dependencies are installed at the repository root.
- For browser verification, the app is served from the repository root with the existing static server.
- Use synthetic test fixtures; no private Strava export is required.

## Focused Automated Checks

Run the Media dashboard, export, and markup checks:

```powershell
npm test -- --runInBand __tests__/dashboard-media.test.js __tests__/dashboard-export-download.test.js __tests__/index-script-syntax.test.js
```

Expected result: all three suites pass. Tests confirm Activity, route-inclusion, pin, and per-item selection controls are absent; Year/Sport filtering and direct media preview still work; collages follow active filters; routes and redundant export-ready status are omitted.

## Browser Check

1. Start the static app with `python -m http.server` and open `http://localhost:8000`.
2. Import a local Strava export that contains readable media, then open the Media visualization.
3. Confirm only Year and Sport filters appear; change each and verify results update.
4. Confirm media cards have no pin or Select controls. Open a linked medium and confirm its activity details and available route navigation remain accessible.
5. Confirm an unassigned medium remains visible and marked as unassigned.
6. Apply Year/Sport filters, create a collage, and confirm it contains all matching readable media without manual per-item selection.
7. Create a recap or collage and confirm the existing preview opens, its image contains no route drawing, and the redundant "ready for local preview" status does not appear.
8. Verify Activity, route-inclusion, pin, and per-item Select controls are absent in populated and empty-result states.
