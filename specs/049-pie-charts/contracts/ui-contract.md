# UI Contract: Pie Charts Tab

## Tab registration

| Item | Value |
|---|---|
| Tab key | `pieCharts` (appended to `TAB_ORDER` after `wordcloud`) |
| Button | `#vizTabPieCharts`, label "Pie Charts", `role="tab"`, `aria-controls="vizPanelPieCharts"`, click → `setVisualizationTab('pieCharts')`, keydown → `handleVisualizationTabKeydown(event, 'pieCharts')` |
| Panel | `#vizPanelPieCharts`, `role="tabpanel"`, `aria-labelledby="vizTabPieCharts"` |
| Render dispatch | `src/dashboard-tabs.js` calls `window.pieChartsDashboard.render()` when the tab opens |

## Controls (inside panel header)

| Group | Element IDs | Labels |
|---|---|---|
| Dimension | `pieDimensionBtnSport`, `pieDimensionBtnDuration`, `pieDimensionBtnPace`, `pieDimensionBtnEquipment`, `pieDimensionBtnLength`, `pieDimensionBtnPower` | Sport, Duration, Pace, Equipment, Length, Power (Watt) |
| Measure | `pieMeasureBtnCount`, `pieMeasureBtnTime`, `pieMeasureBtnDistance` | Activities, Time, Distance |
| Sport | `pieSportBtnAll`, `pieSportBtnRun`, `pieSportBtnBike`, `pieSportBtnSwim` | All Sports, Run, Bike, Swim |
| Colour scheme | `<select id="pieChartsColorScheme">` | `fire` "On fire" (selected), `monochrome-blue` "Monochrome blue" |
| Export | button → `exportVisualizationTab('pieCharts')` | "Export for Insta / Strava" + Instagram logo |

Active buttons use the shared active class (`bg-indigo-600 …`); global handlers: `setPieDimension(key)`, `setPieMeasure(key)`, `setPieSportFilter(sport)`, `setPieColorScheme(scheme)`.

## Display

- `#pieChartsCaptureArea`: export capture target containing summary, chart and legend.
  - `#pieChartsSummary`: e.g. "1,234 km · 210 activities" (activities without data for the dimension are not mentioned).
  - `<canvas id="pieChartsCanvas" role="img" aria-label="…">` — large: ~420 px on mobile, ~520 px on desktop, centered.
  - `#pieChartsLegend` (`<ul>`): one entry per slice: color swatch, label, value, percentage. Beside chart on `lg`, below on narrow viewports; no horizontal overflow.
- Tooltip (hover/tap): label, value with unit, activity count, percentage.
- In-slice percentage labels only for slices ≥ 5 %.
- `#pieChartsEmptyState` (`role="status"`): "No data available for this combination." shown when no slices; hides canvas/legend.

## Export integration (`src/dashboard-export.js`)

- `EXPORT_CAPTURE_TARGET_IDS.pieCharts = 'pieChartsCaptureArea'`
- `getExportableFlags().pieCharts = isEmptyStateHidden('pieChartsEmptyState')`
- `vizTabPieCharts` added to view IDs.
- Control groups and context: Dimension, Measure, Sport, Colour scheme.

## Landing page

- `#andMuchMoreTile` list: `<li>Pie charts</li>` inserted directly before `<li>…</li>`; existing bullets unchanged.

## Script order (`index.html`)

- `./src/pie-chart-utils.js` after `./src/distribution-utils.js` (head).
- `./src/dashboard-pie-charts.js` after `./src/dashboard-wordcloud.js`, before `./src/dashboard-export.js`.

## Privacy

- Uses only `processedActivities` in memory; no new network requests.
