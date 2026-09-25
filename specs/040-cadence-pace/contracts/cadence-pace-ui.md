# Contract: Cadence versus Pace UI

## Tab contract

The visualization is registered as `cadencePace` in the shared tab navigation.
The tab button, panel, keyboard navigation, `openDashboardTab` mapping, and render
dispatch use this exact key. The button uses normal tab semantics:

- `role="tab"`, `aria-controls="vizPanelCadencePace"`, and a matching panel
  `role="tabpanel"` with `aria-labelledby="vizTabCadencePace"`.
- The selected tab has `aria-selected="true"` and `tabindex="0"`; all other tabs
  have `aria-selected="false"` and `tabindex="-1"`.
- Arrow keys and Tab/Shift+Tab follow the shared tab order.

## Sports contract

The sport selector contains only sports with at least one qualifying cadence point,
in the stable order Run, Bike, Swim. The first available sport becomes selected after
an import. It has no `All Sports` option because cadence and comparison units differ
between sports.

| Selected sport | Point y-axis | Point x-axis | Detail label |
|----------------|--------------|--------------|--------------|
| Run | Average step cadence | Pace | Total steps only when supplied |
| Bike | Average pedal cadence | Speed | No step metric |
| Swim | Average swim rhythm | Pace | No unsupported stroke claim |

## Chart and detail contract

- One qualifying activity creates exactly one bubble point.
- Points are grouped by year using the existing chart color and trend-line convention.
- A point detail identifies the activity, date, cadence, sport-specific pace or speed,
  distance, and duration.
- A Run point with `totalSteps` adds `Total steps`; a point without it omits that row.
- Invalid source values do not produce a bubble with a zero axis value.

## Empty-state contract

When no qualifying cadence points exist after import, the panel displays an explanatory
empty state. If a sport has no qualifying points, it is absent from the selector. The
empty state explains that cadence and a valid pace/speed measurement must both have
been recorded by the athlete's device and included in the export.

## Data boundary contract

The tab receives normalized activity data already held in browser memory. It sends no
activity rows, coordinates, cadence values, or derived points to another service.