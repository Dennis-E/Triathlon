# Distributions UI Contract

## Histogram Axes

- Histogram x-axis ticks show individual numeric bucket boundaries, not range labels.
- Length uses kilometer boundaries and the title `Length (km)`.
- Elevation gain uses meter boundaries and the title `Elevation gain (m)`.
- Power uses watt boundaries and the title `Power (W)`.
- Duration uses its existing hours/minutes display and does not repeat units on every tick.
- Pace uses the applicable title unit and unit-free individual ticks.
- Open-ended buckets use an understandable boundary label such as `50+` or `> 200`.
- Repeated rounded boundaries appear only once.

## Line Charts

- All line datasets render as smoothed lines without visible point markers.
- The active color scheme applies to line strokes and shaded areas.
- The line and fill remain visible for single-series charts and per-sport charts.

## Legends

When a legend is visible, each filled circular marker matches the stroke color of its corresponding line dataset. A generic yellow marker for differently colored lines is invalid.

## All Sports Pace

- The axis title is exactly `Pace (km/h)`.
- Run and Swim activities are converted to km/h from distance and duration before shared filtering and bucket construction.
- Bike activities use their existing km/h speed.
- The UI does not display `mixed units`, `min/km`, or `min/100m` in the All Sports Pace view.

## Color Schemes

- `On fire`: existing fire treatment remains available.
- `Monochrome blue` Histogram: all bars use one medium-dark blue.
- `Monochrome blue` Line: line and shaded area use the medium-dark blue treatment; point-marker colors are irrelevant because markers are hidden.
