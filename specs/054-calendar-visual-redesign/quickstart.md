# Quickstart: Validate Training Calendar Visual Redesign

## Prerequisites

- Node.js and npm installed with root project dependencies available.
- A browser and the repository's existing static serving workflow.
- Synthetic or explicitly supplied local activity data covering several years, leap year, mixed sports, and active/inactive days. Do not commit personal exports.

## Focused automated checks

From the repository root, run:

```powershell
npm test -- --runInBand __tests__/training-calendar-utils.test.js __tests__/index-script-syntax.test.js __tests__/export-utils.test.js
```

Expected: Jest passes the calendar model/color assertions, static markup/script checks, and existing export target/metadata checks.

**Baseline (before implementation, 2026-10-13)**: Passed — 3 suites, 111 tests.

**Layout browser check (2026-10-13)**: Synthetic 2024–2026 data confirmed newest-first sections, 7 CSS grid rows, 53 matching week/month columns in 2026, 12 month labels, synchronized month-header/day-grid horizontal scrolling at 390px viewport width, and the legend as the final child of `trainingCalendarYears`.

**Final focused tests (2026-10-13)**: Passed — 3 suites, 115 tests (`training-calendar-utils`, `index-script-syntax`, `export-utils`).

**Export browser check (2026-10-13)**: The existing Training Calendar export action produced an image preview for synthetic 2024–2026 data (1080 × 1080 composition); the capture contained the multi-year capture subtree and legend. The cloned scroll regions were expanded to their full week width before capture, while the live view remained scrollable.

## Browser validation

1. Start the static app from the repository root:

   ```powershell
   python -m http.server 8000
   ```

2. Open `http://localhost:8000` and load a local synthetic dataset spanning at least two years, including one leap year, active days across all palette levels, and a long inactive interval.
3. Open the Training Calendar visualization. Confirm the activity summary and palette/sport controls sit above the calendars; year blocks appear newest first.
4. Inspect each year: the weeks advance left to right, seven day rows are consistent, and month labels align with the columns. On a narrow viewport, horizontally scroll the year grid and confirm its month header stays aligned with the days.
5. Compare a zero-activity day against the dark cell background. It should remain just detectable and much less prominent than the lowest active level. Check all three palettes; active colors and the shared inactive swatch should remain distinct. Use keyboard Tab to verify focus remains visible on inactive day buttons and that day details remain available.
6. Scroll past the final year and confirm the compact Less-to-More legend appears below the grids and explains zero plus the increasing palette levels.
7. Use the existing calendar export action. In the local preview, confirm year order, legend, selected palette and sport filter, and no floating day tooltip. Verify no horizontally clipped weeks; if clipping occurs, record it for an export-capture adjustment.
8. Change sport filter so a formerly active day becomes inactive. Confirm its date position and keyboard accessibility remain, and its cell immediately uses the subdued zero-activity state.

Expected: the refreshed layout preserves all calendar interactions and the existing local image preview/download path without adding network handling for personal activity data.

## Related artifacts

- Requirements: [spec.md](spec.md)
- Decisions and alternatives: [research.md](research.md)
- Derived model and layout invariants: [data-model.md](data-model.md)
- Source/test map and project gates: [plan.md](plan.md)
