# UI Contract: Distributions Visual Polish

This extends the contracts in `specs/018-activity-distributions/contracts/distributions-ui.md`
and `specs/019-distributions-refinements/contracts/distributions-refinements-ui.md`.
Only the changed/added contract points are described here.

## Initial tab state

- On the Distributions tab's first render in a session, the sport filter MUST be
  "All Sports" and the display mode MUST be "Line" (per-sport lines visible). Once the
  user changes either control, subsequent re-renders MUST honor the user's choice; the
  default is never re-applied automatically afterward.

## Fire color scheme

- Every bar (Histogram mode) and every point (Line mode, single/combined/per-sport)
  MUST be colored along a yellow → red gradient, where the slowest/shortest end of the
  chart's effective axis order is yellow and the fastest/longest end is red.
- In "All Sports" + Line mode, each per-sport line's stroke color (legend-distinguishing
  color) MUST remain unchanged from `019`'s per-sport convention; only each line's
  *points* additionally carry the fire gradient.

## Duration bucket boundaries

- Regular bucket boundaries for the Duration metric MUST be chosen from a fixed
  minutes/hours-based step table (5, 10, 15, 30 min; 1, 2, 3, 6, 12, 24 h), never an
  arbitrary number of minutes and seconds.

## Pace axis and labels

- The Pace metric's x-axis title MUST include the applicable unit exactly once:
  `"Pace (min/km)"` for Run, `"Pace (min/100m)"` for Swim, `"Pace (km/h)"` for Bike, or
  a plain `"Pace"` title when the sport filter is "All Sports".
- Pace bucket/tick labels MUST NOT repeat the unit text (e.g. `"5:30-6:00"`, not
  `"5:30 min/km-6:00 min/km"`).

## Pace underflow bucket and axis order

- The Pace metric's bucket computation MUST support one leading "smaller than
  [boundary]" underflow bucket when low-end IQR outliers exist, regardless of sport
  filter. No other metric (Length, Duration, Elevation gain, Power) ever produces an
  underflow bucket.
- When the sport filter is exactly "Run" or "Swim" (single sport, Pace metric), the
  x-axis MUST be reversed so the fastest (numerically smallest) values render on the
  same "fast"/red end used by every other metric's "long/fast" direction.
- When the sport filter is "All Sports" (Pace metric, per-sport lines), the x-axis
  MUST keep its existing (unreversed) shared orientation from `019` — reversal is not
  applied in this case, since Bike's naturally-ascending orientation cannot share one
  linear axis with a reversed Run/Swim orientation.

## Swim + Elevation gain

- Selecting the Elevation gain metric with the sport filter set to "Swim" MUST show an
  explicit "N/A" indicator instead of a chart, regardless of whether any Swim activity
  has elevation data.
- Selecting Elevation gain with "All Sports" + Line mode MUST omit Swim from the
  per-sport lines entirely (Run and Bike render normally if they have qualifying data).

## Non-goals for this contract

- No change to the metric set, sport filter values, time-horizon control, or export
  button introduced by `018`/`019`.
- No user-facing control for choosing the fire gradient's exact colors, the Duration
  step table, or the underflow-bucket threshold — all are computed automatically per
  the rules above.
