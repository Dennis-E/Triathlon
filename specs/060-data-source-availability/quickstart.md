# Quickstart: Validate Visualization Availability

## Prerequisites

- Node.js and the root npm dependencies installed.
- Use synthetic activity and auxiliary-data objects in tests. Do not depend on personal Strava or TrainingPeaks exports.

## Focused Test Commands

Run the tab and import tests first:

```powershell
npm test -- --runInBand __tests__/tab-navigation.test.js __tests__/dashboard-import.test.js __tests__/index-script-syntax.test.js
```

Then run the focused tests for readiness signals that changed, for example:

```powershell
npm test -- --runInBand __tests__/dashboard-core.test.js __tests__/visualization-availability.test.js __tests__/dashboard-scatter-years.test.js __tests__/dashboard-equipment.test.js __tests__/power-pb-utils.test.js __tests__/heatmap-utils.test.js __tests__/distribution-utils.test.js __tests__/workout-time-utils.test.js __tests__/training-calendar-utils.test.js __tests__/wordcloud-utils.test.js __tests__/pie-chart-utils.test.js __tests__/lifetime-statistics-utils.test.js
```

Run the full root suite before completion:

```powershell
npm test
```

## Scenarios and Expected Results

1. **No equipment data**: Apply activities with no usable gear assignments. Equipment and equipment-timeline tabs and panels are hidden; views supported by the same activities remain visible.
2. **Partial source coverage**: Apply activities where only some contain a field required by a view. The view is available only if its view-specific model produces meaningful output; missing values are not filled or fabricated.
3. **Optional auxiliary data absent**: Apply ordinary activities without GPS tracks or FIT best efforts. Heatmap and power-best views are unavailable unless their models produce actual output; other supported views remain available.
4. **New import and data integrity**: Select a view, then import a dataset that no longer supports it. Availability is recomputed, the old panel is hidden, and the first available tab is selected. Verify the imported activity records and field values remain unchanged; only visualization presentation changes.
5. **Keyboard navigation**: With a subset of tabs available, left/right navigation skips hidden tabs, wraps among visible tabs, and keeps ARIA selection and focus valid.
6. **No views available**: Apply a dataset that produces no meaningful output for any visualization. No visualization panel is active; the stable empty dashboard state is shown and non-visualization navigation remains usable.
7. **Source parity**: Run representative Strava-shaped and TrainingPeaks-shaped normalized activities through the same readiness decisions; source labels do not change eligibility when the usable model data is equivalent.

Expected outcome: Every displayed visualization has meaningful renderable data, every unavailable visualization is absent from navigation and dashboard content, imported activity records remain unchanged, and a new import cannot leave stale selected content. Existing Share/Export behavior remains unchanged.
