# UI Contract: Heatmap Viewport Across Sport Filters

## User-visible behavior

- The heatmap initially frames routes using the existing automatic bounds fit when the
  current imported dataset first has a non-empty GPS route result.
- Changing among All Sports, Run, Bike, and Swim changes the displayed routes, frequencies,
  and legend without changing the current map center or zoom.
- Selecting a sport with no GPS-backed routes continues to show the existing empty state;
  it does not discard the current map view. Returning to a sport with routes restores those
  routes in the retained view.
- Reopening the heatmap tab for the same imported dataset does not automatically reframe the
  map.
- A newly imported dataset receives the existing initial bounds fit on its first subsequent
  non-empty heatmap render.

## State and rendering requirements

- The existing Leaflet map instance remains the source of truth for center and zoom.
- Route-layer segments and frequency legend remain refreshed for each filter selection.
- No matching routes keep the existing empty-state, hidden-map, and cleared-legend behavior.
- A pending initial fit is not consumed while there are no usable route bounds.
- Showing a previously hidden map may invalidate its rendered size, but this must not pan or
  otherwise reset its geographic center.

## Accessibility and compatibility

- Existing filter buttons, active-state cues, map controls, legend, and empty-state text remain
  available and unchanged.
- The behavior works with the existing static browser app and loaded Leaflet version; no new
  network service, permission, or user setting is introduced.

## Verification contract

- Automated coverage verifies initial fit, repeated renders for one dataset, empty-to-populated
  filter transitions, route refresh, and a replacement dataset's next initial fit.
- Manual browser validation confirms actual center and zoom remain unchanged through populated
  and empty filter transitions and through leaving/reopening the Heatmap tab.