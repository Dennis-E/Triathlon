# UI Contract: Distributions Chart Refinements

This extends the contract in `specs/018-activity-distributions/contracts/distributions-ui.md`.
Only the changed/added contract points are described here; everything else from that
contract (tab/control IDs, empty-state behavior, export wiring) is unchanged.

## Power (Watt) metric

- The Power metric selector, chart, and count MUST only ever reflect Bike activities,
  regardless of the sport filter's value. Selecting "Run" or "Swim" while "Power" is
  active MUST show the existing empty-state message (per `018`'s FR-008), never a
  chart with zero-value bars/points.

## Per-sport lines ("All Sports" + "Line" mode)

- When `sport === 'All'` and display mode is `'line'`, the chart MUST render one
  `type: 'line'` Chart.js dataset per sport with ≥1 qualifying activity (up to three:
  Run, Bike, Swim), each with a distinct `borderColor` and a `label` equal to the
  sport name, so Chart.js's legend distinguishes them.
- All per-sport line datasets MUST use the same bucket midpoints (`x` values) as the
  combined dataset — i.e. the same regular+overflow bucket boundaries — so the lines
  are aligned on one shared x-axis.
- When `sport !== 'All'` or display mode is `'histogram'`, rendering is unchanged from
  `018-activity-distributions` (single line or combined bars).

## Axis and bucket-label formatting

- Duration: labels/ticks show whole minutes (`"12m"`) below 60 minutes, or combined
  hours/minutes (`"1h 30m"`) at 60 minutes or more. Never raw seconds or decimal
  minutes.
- Pace: labels/ticks show `mm:ss` plus the existing sport-specific unit from `018`
  (`"5:30 min/km"` for Run, `"1:45 min/100m"` for Swim); Bike's speed value remains a
  decimal `km/h` value (not a pace, so not shown as `mm:ss`).
- Elevation gain: labels/ticks show whole meters (`"120 m"`), no decimals.
- Length: labels/ticks show whole or one-decimal kilometers (`"12 km"` / `"12.5 km"`),
  never long decimal numbers.
- Power: labels/ticks show whole watts (`"210 W"`), unchanged from `018`.
- The same formatting rules apply identically in Histogram and Line modes (bucket bar
  labels and line-point/tooltip labels use the same formatter).

## Bucket boundaries and overflow bucket

- Regular bucket boundaries MUST be "nice" round numbers appropriate to the metric's
  unit (e.g. whole/half kilometers, whole minutes, round meter steps), not arbitrary
  fractions of the observed min/max range.
- When qualifying values include any value above `Q3 + 1.5 × IQR` (computed over the
  qualifying values), those values MUST be grouped into exactly one trailing bucket
  labeled `"> [last regular boundary]"` (formatted per the metric's own unit rule
  above), instead of stretching the regular buckets to include them.
- When no qualifying value exceeds that threshold, no overflow bucket is created.

## Non-goals for this contract

- No change to the metric set, sport filter, time-horizon control, display-mode
  toggle, or export button introduced by `018-activity-distributions`.
- No manual/user-facing control for the outlier threshold or bucket step size — both
  are computed automatically per the rules above.
