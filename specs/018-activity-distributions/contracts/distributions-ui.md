# UI Contract: Distributions Tab

This documents the observable contract for the new "Distributions" visualization tab —
the DOM/element IDs, control behaviors, and rendering guarantees that tests and future
changes should treat as the stable interface, matching how other visualization tabs
(e.g., "Heartrate vs Pace") are documented implicitly through their markup/IDs.

## Tab registration

- Tab key: `distributions`
- Button ID: `vizTabDistributions`
- Panel ID: `vizPanelDistributions`
- Registered in `src/tab-navigation.js`'s `TAB_ORDER`, `TAB_BUTTON_IDS`, `TAB_PANEL_IDS`,
  after `heatmap` (end of the existing tab order).
- Navigable via `setVisualizationTab('distributions')`, keyboard tab navigation
  (`handleVisualizationTabKeydown`), and the existing next/prev tab helpers.

## Controls

| Control | Element(s) | Behavior |
|---|---|---|
| Metric selector | Button group: Length / Duration / Pace / Elevation gain / Power | Exactly one active at a time; selecting one re-renders the chart for that metric using current sport/date/display-mode state |
| Sport filter | Reuses existing All/Run/Bike/Swim button-group pattern | Changing sport recomputes buckets and re-renders |
| Time horizon | Reuses the "Heartrate vs Pace" dual-range date control pattern (`scatterDateStart`/`scatterDateEnd`-equivalent inputs scoped to this tab) | Changing either handle recomputes buckets and re-renders; label shows the effective range |
| Display mode | Button group: Histogram / Line | Toggling re-renders the same computed buckets as bars (`type: 'bar'`) or as a smoothed line (`type: 'line'`, monotone interpolation) without recomputing buckets |
| Export | Existing `exportVisualizationTab('distributions')` wiring | Produces a shareable image consistent with other tabs' export behavior (FR-011) |

## Chart contract

- Canvas ID: `distributionsChart` (inside a wrapper `distributionsChartWrapper`, matching the `<metric>ChartWrapper` naming convention used elsewhere, e.g. `heartratePaceChartWrapper`).
- Empty state element: `distributionsEmptyState`, hidden by default, shown (and canvas
  hidden) whenever the computed `Distribution dataset.activityCount === 0`.
- X-axis: bucket ranges for the selected metric, labeled with the metric's unit.
- Y-axis: activity count per bucket.
- Histogram mode: one bar per bucket.
- Line mode: one point per bucket midpoint, connected with monotone interpolation,
  same bucket boundaries as histogram mode.

## Non-goals for this contract

- No manual bucket-width configuration control (FR-010 — automatic only).
- No multi-metric overlay (only one metric visualized at a time, per FR-002).
- No persistence of selected metric/filters/display mode across page reloads beyond
  whatever mechanism (if any) already persists other tabs' filter state.
