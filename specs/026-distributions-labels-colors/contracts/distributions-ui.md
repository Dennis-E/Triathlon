# Distributions UI Contract

This contract defines the user-facing behavior for the Distributions controls and chart. It is a static-browser UI contract, not a network API.

## Controls

The Distributions controls expose the existing metric, sport, and display-mode selectors plus one color-scheme selector:

- `On fire` is the default selected option.
- `Monochrome blue` is the second option.
- Selecting an option immediately re-renders the current chart.
- The selected option remains active when metric, sport, display mode, or date range changes during the current page session.

## Chart States

1. **Renderable single-sport distribution**: show the selected chart with labels and units from the axis-label contract.
2. **All Sports + Line**: show the existing per-sport line comparison, including `50+` for the Length upper open-ended category when present.
3. **All Sports + Histogram**: hide the chart and show an explicit `N/A` state; this remains true even when the imported data currently contains only one sport.
4. **No qualifying data**: hide the chart and show an explicit metric-specific `N/A` state; never show stale content from a previous selection.

## Legend Contract

Whenever the chart displays a legend, each series entry uses a filled circular point marker. A line-only marker is not permitted.

## Axis Contract

- Length title: `Length (km)`.
- Elevation gain title: `Elevation gain (m)`.
- Power title: `Power (W)`.
- Duration labels: hours and minutes, such as `1h 30m`, with no raw seconds or decimal-hour values.
- Run Pace title: `Pace (min/km)`.
- Swim Pace title: `Pace (min/100m)`.
- Bike Pace title: `Pace (km/h)`; tick labels use whole-number speed values.
- All Sports Pace title: explicitly indicates mixed units and does not present one sport's unit as universal.
- Pace tick and bucket labels do not repeat the Pace unit.

## Color Contract

Both palettes apply consistently to bars, points, and relevant series cues:

- `On fire`: existing yellow-to-orange-to-red ordering.
- `Monochrome blue`: ordered blue shades.

Switching palettes must not alter data, counts, bucket boundaries, labels, filter state, or N/A behavior.
