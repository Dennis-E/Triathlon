# UI Contract: Heatmap Color Scheme

## Scheme Selector

- The existing heatmap toolbar exposes one clearly labelled `Color scheme` selector.
- It offers exactly four values: `Blue to Red`, `Yellow to Red`, `Blue`, and `Black + Fire`.
- `Blue to Red` is selected by default to preserve current behavior.
- Selection remains active when the user changes the sport filter or redraws the map during
  the current page session; it resets to the default after a page reload.
- The control is operable by pointer, keyboard, and assistive technology.

## Rendering Behavior

- A selection immediately updates route colors and the frequency guide without changing
  route geometry, frequency counts, or activity detail behavior.
- `Black + Fire` darkens the existing map presentation and uses a contrasting fire-colored
  route ramp. The route canvas, legend, tooltip, and controls are not darkened by the tile
  treatment.
- The other three schemes retain the standard map presentation and change only the route
  frequency colors.
- Sport changes retain the selected scheme and use frequencies for the currently selected
  sport.
- Constant-frequency views use one color from the active scheme. Empty views preserve the
  current no-GPS state and hide misleading frequency values.

## Frequency Guide

- The visible guide uses the active scheme's color ramp and continues to identify low,
  midpoint, and high route frequency.
- Its accessible text must describe the same low-to-high semantics as its visible gradient.
- The constant-frequency swatch must also match the active scheme.

## Export

- The existing Heatmap Share/Export action remains discoverable and operational.
- Export image capture includes the currently selected scheme and map presentation.
- Export metadata identifies the selected scheme and current sport filter.
- No additional tab, export action, account, or external API is introduced.