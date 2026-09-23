# Data Model: Distribution Chart Cleanup

This feature changes derived visualization values and presentation state. Imported activity records remain unchanged.

## Distribution Metric Value

A numeric value used for filtering and bucket construction.

| Context | Source meaning | Display unit | Validation |
|---|---|---|---|
| Length | Activity distance | km | Positive finite distance. |
| Duration | Activity duration | seconds internally, hours/minutes displayed | Positive finite duration. |
| Elevation gain | Activity elevation gain | m | Finite non-negative elevation. |
| Power | Bike average power | W | Positive finite power. |
| Single-sport Pace | Existing sport-specific metric | Run `min/km`, Swim `min/100m`, Bike `km/h` | Existing sport-specific validation remains. |
| All Sports Pace | Activity speed derived from distance and duration | km/h | Positive finite distance and duration; invalid conversions are excluded. |

## All Sports Pace Conversion

For an activity with distance in kilometers and duration in seconds:

`speedKmH = distanceKm / (durationSeconds / 3600)`

- Run and Swim activities are converted to `km/h` for All Sports Pace.
- Bike activities already use the same `km/h` representation.
- The original activity distance and duration are not mutated.
- Values that are non-finite, zero, or negative are excluded.

## Distribution Bucket

| Field | Type | Rules |
|---|---|---|
| `rangeStart` | number | Numeric lower boundary; may be negative infinity for an underflow bucket. |
| `rangeEnd` | number | Numeric upper boundary; may be positive infinity for an overflow bucket. |
| `label` | string | Descriptive range or open-ended text used for tooltips/context. |
| `count` | integer | Number of qualifying activities; unchanged by display formatting. |
| `isOverflow` | boolean | Identifies an open-ended upper bucket. |
| `isUnderflow` | boolean | Identifies an open-ended lower bucket. |

## Histogram Boundary Tick

A derived x-axis label separate from `Distribution Bucket.label`.

- Regular buckets contribute their numeric boundary values.
- Duplicate rounded boundaries are emitted once.
- Underflow and overflow buckets retain readable open-ended labels.
- Units are not appended to ticks when the axis title already names the unit.
- Tick labels never display a full range such as `50-100`.

## Line Visual State

- `borderColor`: selected line color.
- `backgroundColor`: selected shaded-area color.
- `fill`: enabled for the single-series distribution line where currently supported.
- `pointRadius`: zero so no bullets are visible.
- `pointHoverRadius`: zero or equivalent no-visible-marker behavior.

## Color Scheme

- `fire`: existing ordered fire palette for histogram bars and line/fill treatment.
- `monochrome-blue`: one medium-dark blue for histogram bars and the primary line/fill treatment.
- All Sports line datasets may use distinct sport stroke colors where required for series identification, but legend fills must match their corresponding strokes.
