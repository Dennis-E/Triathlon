# Quickstart: Export Context Cleanup

## Prerequisites

- Node.js and npm for the root Jest suite.
- A browser for visual preview and download validation.
- Use synthetic activity data; do not rely on private exports or repository fixtures.

## Automated Validation

Run the focused export tests from the repository root:

```powershell
npm test -- --runInBand __tests__/export-utils.test.js __tests__/dashboard-export-download.test.js
```

Run the inline markup/script contract test if export wiring or capture markup changes:

```powershell
npm test -- --runInBand __tests__/index-script-syntax.test.js
```

Expected results: export output contains no filter/context labels or reserved context space; outer frame cleanup is confined to the captured clone; meaningful legends and titles remain; no-data and preview/download behavior remain intact.

## Manual Browser Validation

1. Start the static app from the repository root:

   ```powershell
   python -m http.server 8000
   ```

2. Load or generate synthetic activities in the browser and create exports for Distance, Pace vs, Run 5 km Personal Best, GPS Heatmap, Pie Charts, and at least one other dashboard visualization.
3. Inspect each preview and corresponding downloaded PNG. Confirm that:
   - both are 1080 x 1080 and visually match;
   - no filter summary, option list, `Sport: All Sports`, `Colour Scheme`, or redundant `Metric: Time` line appears;
   - the outer frame around each visualization is absent without changing the live dashboard's frame;
   - titles, results, axes, data marks, and meaningful legends remain readable and unclipped;
   - removed filter/context regions do not leave blank space;
   - the dashboard's active filters and displayed chart data remain unchanged after export.
4. Repeat with a no-data selection and confirm the existing no-data behavior remains, without generating a blank filter area or stale preview.

Export processing must not send activity data or generated images to a server. Existing application requests such as CDN assets or map tiles are not a claim of export-data transfer.