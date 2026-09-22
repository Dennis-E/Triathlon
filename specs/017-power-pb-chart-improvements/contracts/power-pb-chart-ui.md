# UI Contract: Power PB Chart Improvements

This extends the `016-bike-power-pb-refinement` Watt-section contract. Section
placement, duration-card labels, no-data/limited-data states, and the preservation of
Run/Swim/other Bike sections are unchanged and still apply.

## All-time profile: tooltip

- Every plotted point in the all-time profile is hoverable via a per-point hit-area.
- On hover, the shared floating PB tooltip appears showing: duration label, watt value
  (with visible `W` unit), date, and source activity name for that point.
- Moving the mouse directly from one point to another updates the tooltip content
  without leaving stale data visible.
- Moving the mouse off all points hides the tooltip.

## All-time profile: y-axis

- The y-axis shows a label with the exact watt value of the highest plotted point,
  positioned at/near that point's height.
- The y-axis shows a label with the exact watt value of the lowest plotted point,
  positioned at/near that point's height, replacing the previous fixed `0` baseline.
- If all points share the same watt value, only one label is shown for that value (no
  duplicate identical labels).

## All-time profile: x-axis

- The shortest available duration's point always shows its duration label on the
  x-axis.
- Every available duration of 5 minutes (300 seconds) or longer shows its duration
  label on the x-axis.
- Available durations that are shorter than 5 minutes and are not the shortest
  available duration do not show an x-axis label, but their point and connecting line
  segment remain plotted and remain reachable via hover tooltip.

## Duration tiles: chart layout

- Each rendered duration tile (5s, 30s, 1m, 2m, 5m, 10m, 20m, 60m — whichever have
  qualifying data) shows an inline chart of that duration's PB history over time,
  using the same axis rendering, current-best callout, and hover-tooltip pattern as
  the other Personal Bests tiles (e.g. Longest, Elevation).
- A duration with exactly one qualifying PB still renders via this chart layout, as a
  single marker, instead of the previous static "Current best" text summary.
- The existing "view in full screen" (maximize) button and its detail chart remain
  present and functionally unchanged on every duration tile.

## Preservation and privacy

- These changes do not alter which efforts qualify as PBs, the profile's highest-value
  selection per duration, or any other Personal Bests section.
- All tooltip/axis/chart data continues to originate from the already-local imported
  dataset; nothing new is sent to a server.
