# Quickstart: Compact Export Context

## Prerequisites

- Node.js and npm installed for the root Jest suite.
- A browser and the repository's static-app setup for manual preview checks.
- Use synthetic activity data; do not rely on private exports or repository fixtures.

## Automated Validation

Run the focused export tests from the repository root:

```powershell
npm test -- --runInBand __tests__/export-utils.test.js __tests__/dashboard-export-download.test.js
```

Run the inline markup/script contract test if export wiring or script loading changes:

```powershell
npm test -- --runInBand __tests__/index-script-syntax.test.js
```

Expected result: export geometry and active-context assertions pass; no-data behavior, preview/download flow, and selected visualization state remain intact.

## Manual Preview Checks

1. Start the static app from the repository root:

   ```powershell
   python -m http.server 8000
   ```

2. Import synthetic activities and export a Distance view configured for Run, yearly aggregation, and 2026.
3. Export representative filtered and unfiltered views, a visualization with a different aspect ratio, and a Personal Best detail tile.
4. Check the preview and downloaded PNG. Confirm that:
   - both remain 1080 x 1080 square images;
   - only active, relevant values appear as concise context;
   - alternate filter/view controls and unselected options are absent;
   - no blank context strip appears when no relevant values apply;
   - the chart uses the largest proportional fit, with at least 80% use of its limiting available dimension;
   - chart content is not clipped, stretched, or overlaid by context or legend text;
   - the dashboard's selected filters are unchanged after export.

The preview and downloaded image must match. Export rendering must remain local, with no transfer of activity data or generated image.
