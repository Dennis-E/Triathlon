# Contract: Pace versus Metrics UI

## Tab replacement contract

`paceMetrics` is the sole dashboard key for this feature. It replaces
`heartratePace` and `cadencePace` in tab order, button ID, panel ID, keyboard handling,
landing navigation, export metadata, and preview metadata.

- Button ID: `vizTabPaceMetrics`
- Panel ID: `vizPanelPaceMetrics`
- Button label: `Pace vs ...`
- The old Heart Rate vs Pace and Cadence vs Pace tab buttons and panels do not remain.

## Control contract

The panel contains these controls in this order:

1. Sport segmented control: Run, Bike, Swim. Exactly one is selected; All Sports is absent.
2. Metric segmented control: Heart rate, Cadence, Elevation gain, Distance. Exactly one is selected.
3. Existing dual date range control.
4. Year checkboxes for every year with qualifying points for the current filter state.
5. One Trend lines checkbox, checked initially.

Year checkboxes hide both a year’s bubbles and its eligible line. Trend lines hides
only line datasets. A year with one point is listed and controls its bubble, but has no
line dataset.

## Labels and details

| Metric | Axis/detail label |
|--------|-------------------|
| Heart rate | Average heart rate (bpm) |
| Cadence + Run | Average step cadence (spm); show Total steps when present |
| Cadence + Bike | Average pedal cadence (rpm); no steps |
| Cadence + Swim | Average swim rhythm; no stroke claim or steps |
| Elevation gain | Elevation gain (m) |
| Distance | Distance (km) |

The x-axis uses Run pace, Bike speed, or Swim pace according to the selected sport.

## Empty and export contract

When no point qualifies, the canvas is hidden and the empty state explains that the
chosen metric plus valid pace or speed must exist in the imported export. The replacement
tab remains exportable only when a chart with points is visible. Export metadata lists
the selected Sport, Metric, and Date range.

## Data boundary contract

The UI consumes only normalized activity values held in browser memory. It adds no
network calls and sends no points, metrics, or raw activity rows outside the browser.