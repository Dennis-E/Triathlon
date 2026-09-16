# UI Contract: Heatmap Frequency and Activity Hover

## Frequency Color Contract

- The domain is the complete active sport-filter result and does not change during pan/zoom.
- The least-frequent route uses light blue; the most-frequent route uses red.
- The logarithmic midpoint uses the exact RGB midpoint between those endpoints.
- The legend is a continuous light-blue-to-red gradient labeled Low, Mid, and High with the
  current minimum, geometric midpoint, and maximum visit counts.
- A constant-frequency view shows one visible non-red swatch and one shared value.

## Hover Target Contract

- Hover targeting is active only on visible route strokes in the full Heatmap tab.
- The pointer does not need pixel-perfect placement; the target radius is at least 6 pixels.
- When strokes overlap, choose nearest stroke, then higher frequency, then lexical key.
- Pointer processing must not block or cancel map drag, wheel zoom, pinch zoom, or controls.
- The dashboard preview remains non-interactive and does not display activity tooltips.

## Tooltip Content Contract

### Up to ten available activities

- Show every distinct available contributing activity.
- Show the total activity count in the heading.
- Do not describe the list as random.

### More than ten available activities

- Show exactly ten distinct activities sampled without replacement.
- Heading text is exactly `Random 10 of X activities`, substituting the total distinct
  activity membership for `X`.
- The sample remains unchanged while the pointer stays on the same route.

### Missing activity metadata

- Show all resolvable entries up to the normal limit.
- State `Y of X activities available` when fewer records resolve than the segment membership.
- Never fabricate an activity entry for an unresolved ID.

### Activity row

- Name, date, and normalized sport are always represented, using neutral fallbacks.
- Run/Bike distance is shown in kilometers; Swim distance is shown in meters.
- Duration is shown in elapsed hours/minutes/seconds; unavailable numeric values show `--`.
- Imported text is rendered as text, never interpreted as markup.

## Tooltip Lifecycle Contract

- Open after the pointer resolves to a route and close when no route is targeted.
- Close immediately on map move/zoom start, filter change, dataset replacement, or layer
  removal.
- Position near the pointer but clamp fully within the map wrapper.
- Use `pointer-events: none`; the tooltip itself is not interactive or focusable.
- Tooltip and legend must not overlap map controls or Leaflet attribution incoherently.

## Privacy Contract

- All tooltip data comes from the currently imported in-memory dataset.
- Hovering must not make a network request or transmit activity identifiers/metadata.
