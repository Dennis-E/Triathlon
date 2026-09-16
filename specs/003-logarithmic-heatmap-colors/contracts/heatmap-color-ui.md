# UI Contract: Heatmap Frequency Colors

## Scope

This contract covers the browser-visible heatmap colors and scale guide. It introduces no
network, persistence, CLI, or service API.

## Route Rendering

- Each rendered route stroke uses its existing weight and opacity behavior.
- Full-detail strokes derive color from their route segment `count`.
- Low-zoom strokes derive color from `colorCount`, the highest real route frequency in the
  aggregate, while their weight and opacity continue to use aggregated `count`.
- The scale domain is the complete current sport-filter result and remains stable during pan
  and zoom.
- The dashboard preview uses the same scale and palette rules as the full heatmap.

## Legend States

### Varied frequencies

- Display a compact, non-interactive overlay at the lower-left of the map.
- Show the light-blue to dark-blue to red progression.
- Label the minimum frequency, first extreme whole-number frequency, and maximum frequency.
- The accessible label MUST state those values and that red denotes extreme frequency.

### One or more equal frequencies

- Show one light-blue swatch and the shared visit count.
- Do not show a red endpoint or imply a low-to-high range.
- The accessible label MUST state that all displayed routes have the same frequency.

### Empty or error

- Hide the legend when no segments match the selected sport or when the map library fails.
- Preserve the existing empty/error message as the only map-state message.

## Update Contract

- Import completion and every All Sports / Run / Bike / Swim selection update map colors and
  legend values from the same newly derived scale.
- No color or legend value from the previous filter may remain after the update.
- Pan and zoom must not alter the scale or legend values.

## Layout and Accessibility

- The overlay must not cover Leaflet attribution or map controls.
- It must remain readable without resizing or overflowing the map wrapper at supported mobile
  and desktop widths.
- Text plus existing line thickness provides meaning beyond hue alone.
- The legend is informational and does not receive keyboard focus.
