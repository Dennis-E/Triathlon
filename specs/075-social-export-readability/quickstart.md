# Quickstart: Social Export Readability Refinements

## Prerequisites

- Node.js/npm dependencies installed in the repository.
- The static frontend available through `python -m http.server 8000`.
- A synthetic or explicitly supplied local dataset with Workout Time data, multiple calendar years, Run and Bike scatter points, and PB histories with both one and multiple records.

## Focused Automated Validation

```powershell
npm test -- --runInBand __tests__/dashboard-export-download.test.js __tests__/export-utils.test.js __tests__/dashboard-scatter-years.test.js __tests__/index-script-syntax.test.js __tests__/dashboard-core.test.js __tests__/wordcloud-dashboard.test.js
```

Result: PASS, 6 suites and 381 tests. Coverage verifies presentation metadata, export clone styles, PB single-/multi-record behavior, and preview/download parity.

## Full Validation

```powershell
npm test -- --runInBand
```

Result: PASS, 42 suites and 1,117 tests. `git diff --check` also passed; no editor errors were reported for the changed source or test files.

## Browser Visual Validation

Validated in Chromium on the static app with 51 synthetic activities across 2010-2026. Preview widths were 355-361 px; every PNG retained its native 1080 px width.

1. Workout Time Square and Portrait: PASS at 1080 x 1080 and 1080 x 1350. Axis titles remained visible; the live chart data, axis titles, and gray colors were identical before and after export.
2. Training Calendar: PASS with 17 years. Square produced 6 pages (3 years/page); Portrait produced 5 pages (4 years/page, last page shorter). Every year appeared once; export-only intensity levels used one min/max across all years and matching palette colors on every page. Headings were 30 px with high-contrast color and did not overlap at about 355 px.
3. Pace vs. Run/Bike in both formats: PASS. Run used `Pace (mm:ss /km)` and `Run. Heart rate vs. Pace. Size = Duration`; Bike used `Speed (km/h)` and `Bike. Heart rate vs. Speed. Size = Duration`.
4. PB with multiple records in both formats: PASS. The export showed `PB: Run 5 km`, `45:00`, `From 52:14 to 45:00 since 2024`, and separate official-race attribution. Clone labels were 36 px for axes/descriptions and 44 px for results; long event names wrapped. The live SVG text and PB data were unchanged.
5. PB with one record in both formats: PASS. `PB: Run 5 km` and the result/source remained; summary was null and no progress was implied.
6. Preview/download identity: PASS. Calendar page 1's downloaded anchor used the exact preview data URL, a numbered `page-1-of-6.png` filename, and valid PNG bytes.
7. Local export boundary: PASS. No fetch was issued during calendar export. The app separately attempts its analysis-counter request at startup; its CORS failure is unrelated to local export.

Use synthetic/local data only. Do not upload personal training files or exported images for validation.
