# Quickstart: Social Export Infographics

## Prerequisites

- Node.js and npm installed.
- Repository dependencies installed (`npm install`) if not already present.
- Internet access for CDN libraries and OpenStreetMap tiles when validating a heatmap.

## Focused Automated Validation

Run the export/layout and capture suites from the repository root:

```powershell
npm test -- --runInBand __tests__/dashboard-export-download.test.js __tests__/export-utils.test.js __tests__/dashboard-heatmap.test.js __tests__/dashboard-equipment.test.js __tests__/dashboard-scatter-years.test.js
```

Expected: all selected Jest suites pass under the repository's Node test environment. Add or update tests for each touched metadata adapter and format/layout rule in the same suite that owns that behavior.

## Browser Validation

Start the static app from the repository root:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/`, import a synthetic or explicitly supplied local activity dataset, and inspect every export action (including PB detail). For each available view:

1. Export Square and Portrait; verify exact PNG dimensions and that the browser preview matches the downloaded image.
2. Change application window size without changing data; verify the selected format yields the same composition.
3. Check there are no controls, filter summaries, QR code, or generic export copy in the image. Verify logo/site footer, correct units/context, 48 px minimum safe area, typography sizes, contrast, clipping, and overlap.
4. For six specialized families, verify their ranking/timeline limits, YTD labels, PB milestone treatment, scatter labels/encodings, and heatmap requirements against FR-008–FR-013.
5. On a heatmap, pan and zoom to a recognizable route area, then export both formats. Confirm the selected geographic bounds are preserved, the live map is restored, and attribution remains visible. Verify the map reaches 65% of usable height when possible; if not, ensure it is not cropped or distorted to force that size.
6. Exercise no-data and failed-resource states. Confirm downloads are unavailable for missing data or failed required resources and the user receives a clear explanation.
7. Toggle the optional humor line. Confirm only that line changes, and confirm the factual export remains complete with humor off.
8. Display each output at 360 px wide and confirm the main statement and essential values are readable without zoom.

## Acceptance Evidence

 Record the view, format, output dimensions, preview/download comparison, and pass/fail for each currently exportable target.
| Current export target | Square 1080 × 1080 | Portrait 1080 × 1350 | Evidence/status |
|---|---|---|---|
| Total distance | Automated data/layout tests: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `dashboard-core.test.js`, `export-utils.test.js` |
| Pace vs. performance | Capture/series tests: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `dashboard-scatter-years.test.js`, `dashboard-export-download.test.js` |
| Equipment ranking | Adapter/layout tests: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `dashboard-equipment.test.js`, `dashboard-export-download.test.js` |
| Equipment timeline | Row-limit/series tests: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `dashboard-equipment.test.js`, `dashboard-export-download.test.js` |
| Personal bests | PB adapter/capture tests: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `dashboard-export-download.test.js` |
| Heatmap | Viewport/attribution tests: PASS; browser visual audit: PENDING | Bounds tests: PASS; browser visual audit: PENDING | `dashboard-heatmap.test.js`, `dashboard-export-download.test.js` |
| Distributions | Capture inventory: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `dashboard-export-download.test.js` |
| Workout time | Capture inventory: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `dashboard-export-download.test.js` |
| Training calendar | Capture inventory: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `dashboard-export-download.test.js` |
| Wordcloud | Capture/no-data tests: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `wordcloud-dashboard.test.js`, `dashboard-export-download.test.js` |
| Pie charts | Capture inventory: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `pie-charts-dashboard.test.js`, `dashboard-export-download.test.js` |
| Lifetime statistics | Capture inventory: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `lifetime-statistics-dashboard.test.js`, `dashboard-export-download.test.js` |
| Media gallery | Capture/download tests: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `dashboard-media.test.js`, `dashboard-export-download.test.js` |
| Personal-best detail | Target/capture tests: PASS; browser visual audit: PENDING | Canvas format helper: PASS; browser visual audit: PENDING | `dashboard-export-download.test.js` |

Automated cross-cutting status:

- Full root Jest suite (`npm test -- --runInBand`): PASS, 42 suites / 1,103 tests (2026-10-30).
- Browser export matrix: PASS for 12 data-bearing dashboard tabs in Square and Portrait (24 PNG previews at exact dimensions); Media Gallery correctly blocked with no media data.
- PB detail browser check: PASS in Square and Portrait with a synthetic Run 10 km record.
- Viewport determinism: PASS for Total Distance; the Square and Portrait PNG data-URL SHA-256 hashes matched between 1280 px and 360 px application viewports for unchanged data.
- Heatmap browser check: PASS; after setting a synthetic route viewport, Portrait export produced 1080 × 1350 and retained the same center, zoom, and four geographic bounds.
- Preview/download use the same prepared image: PASS in the export-download tests.
- Missing-data exports are blocked: PASS in the export-download tests.
- Brand-asset failure prevents a partial preview and supports a later retry: PASS in the export-download tests.
- Font readiness/failure prevents premature or partial capture: PASS in the export-download tests.
- Heatmap capture waits for visible tiles, rejects tile errors, and preserves the exact viewport: PASS in the heatmap tests.
- Full browser visual review of all 14 targets in both formats at 360 px: PENDING.

Human acceptance status:

- SC-006 five-person comprehension test: NOT RUN; five hobby-triathlete participants and recorded five-second responses are still required.
- SC-007 posting-intent rating: NOT RUN; collect ratings from the same five participants and report their median.
- Do not report these user-study outcomes as automated test results.
