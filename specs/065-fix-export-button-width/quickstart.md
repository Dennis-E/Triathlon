# Quickstart: Verify Export Button Width

**Prerequisites**: Root npm dependencies installed; use a browser with DevTools responsive viewport controls. No build step is required.

## Automated regression checks

From the repository root:

```powershell
npm test -- --runInBand __tests__/index-script-syntax.test.js __tests__/pie-charts-dashboard.test.js __tests__/wordcloud-dashboard.test.js __tests__/dashboard-export-download.test.js
```

Expected: all eleven standard visualization export actions retain their mappings and use the shared layout class; existing visualization wiring, preview and download tests pass.

## Browser layout check

Start the static app:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`, import a local supported export, and use the responsive viewport controls at 320, 375, 640, 768, 1024 and 1440 CSS px. For each applicable visualization header:

1. Confirm the export button remains content-sized rather than filling its header row.
2. In a stacked header, confirm it stays at the content edge and does not leave a full-row button background to its right.
3. Confirm same-action buttons have matching dimensions at the same viewport width.
4. Confirm text and both icons remain visible, with no horizontal page overflow.
5. Inspect widths around the existing 640 px and 768 px transitions; ensure header order, vertical alignment in row mode, filters and palette remain unchanged.
6. Activate representative exports from a compact and a wide viewport. Confirm the expected visualization still opens in preview and downloads without changed image content.

Static Jest checks do not calculate rendered CSS geometry. Record the viewport sizes and any exceptions from the manual browser check separately; do not report the manual layout criteria as automated test coverage.

## Observed Results (2026-10-22)

- The focused Jest command above passed: 4 suites, 99 tests. The new shared-class/style assertion was observed failing before the implementation and passing afterward.
- A real browser rendered all eleven standard actions at each viewport. Width spread among the eleven buttons was 0 CSS px at every tested size. Buttons measured 216.8 px at 320 px (bounded by the available content width) and 222.9 px at 375, 640, 768, 1024 and 1440 px.
- At every tested width, document scroll width equaled viewport client width. At 320 px the label wraps onto two lines; the label and both brand icons remain visible. Stacked 320/375 px headers align buttons to the content edge. A 640 px Wordcloud header retained its existing row layout without overlap.
- A synthetic activity was passed through the production CSV normalizer and dashboard renderer. The actual Total Distance export action produced a loaded 1080 x 1080 PNG preview.
- The integrated browser exposes its native Save Picker, which prevented Playwright from capturing the resulting download event. Download behavior was covered by the passing `dashboard-export-download.test.js` suite in the focused command; no claim is made that a manual file save was observed.
- Python was unavailable on the Windows host, so the visual check used a temporary Node static server with correct MIME types. The server was not added to the repository. Its localhost origin also caused the separate analysis-counter API request to be blocked by CORS; this did not affect local workout processing or export rendering.
