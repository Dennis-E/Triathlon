# Quickstart: Export Layout Polish

## Prerequisites

- Node.js/npm for the root Jest tests.
- A browser and Python for static local serving.
- Synthetic or user-supplied activity data covering multiple years and the relevant visualization types. Do not use personal exports as committed test fixtures.

## Focused Automated Checks

From the repository root, run the focused tests that cover the modified surface:

```powershell
npm test -- --runInBand --runTestsByPath __tests__/export-utils.test.js __tests__/dashboard-export-download.test.js __tests__/dashboard-scatter-years.test.js __tests__/pie-charts-dashboard.test.js __tests__/lifetime-statistics-dashboard.test.js __tests__/dashboard-heatmap.test.js __tests__/dashboard-core.test.js __tests__/distribution-utils.test.js __tests__/workout-time-utils.test.js
```

Add the existing distance, distribution, workout-time, or PB test files when implementation touches their chart-specific behavior. Expected result: focused tests pass, year legend labels/colors match the visible bubble datasets, and export-specific transforms leave dashboard state unchanged.

## Browser Validation

Start the app from the repository root:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/index.html`, load representative data, and inspect:

1. Export a visualization with filter context. Confirm the branded header is followed by visible whitespace, then the filter summary, then the visualization; confirm no overlap with controls or legend.
2. Export Pace vs. with multiple years and hide one year before export. Confirm only visible years appear in the legend and each color matches its bubbles.
3. Export Distance, Distributions, and Workout Time. Confirm Distance uses at least 85% of available plot width and height where its aspect ratio permits; confirm Distributions and Workout Time use at least 85% of plot width. Axes and labels remain visible.
4. Export a heatmap. Confirm plus/minus controls are absent from the image, the complete route uses the available map area, and the live map's dimensions, center, zoom, and working zoom controls are restored after capture.
5. Open and export a PB detail such as Run 5 km. Confirm the chart uses at least 85% of its limiting content dimension without clipping, stretching, or changing the selected result.
6. Export Pie Charts. Confirm the activity-count headline is absent, the chart is larger, legend text is at least 18px, and the dashboard summary remains visible outside the export.
7. Export Lifetime Statistics. Confirm KPI labels are at least 16px and section headings at least 18px, remain unclipped, and stay associated with their values.
8. Compare preview and downloaded PNG for representative types. Confirm they show the same layout and that export does not change dashboard selections or values.
9. Before exporting, open the browser's Network panel and clear its log. Export a visualization and download its PNG. Confirm that no activity data or generated image is sent in any request. Distinguish any independent existing analysis-counter request from export traffic; it is only a failure if it contains activity data or the generated image.