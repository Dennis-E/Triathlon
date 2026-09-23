# Data Model: Distribution Histogram Axis Units

This feature changes only derived Histogram axis presentation. Imported activities, bucket membership, and counts remain unchanged.

## Distribution Bucket

| Field | Type | Rules |
|---|---|---|
| `rangeStart` | number | Numeric lower boundary in the selected metric's native value. |
| `rangeEnd` | number | Numeric upper boundary; may be infinite for open-ended buckets. |
| `label` | string | Descriptive bucket range or open-ended text, useful for context/tooltips but not used as a full-range axis tick. |
| `count` | integer | Number of qualifying activities; unchanged by axis formatting. |
| `isUnderflow` | boolean | Identifies a lower open-ended bucket. |
| `isOverflow` | boolean | Identifies an upper open-ended bucket. |

## Histogram Axis Tick

A visible label derived from one bucket boundary.

| Metric/context | Display unit and format |
|---|---|
| Length | Kilometer boundary, such as `0`, `5`, or `10`. |
| Elevation gain | Meter boundary, such as `0`, `20`, or `40`. |
| Duration | Existing readable time boundary, such as `10m` or `1h 30m`. |
| Run/Swim Pace | Existing time-based `min:ss` boundary. |
| Bike Pace | Speed boundary in `km/h`. |
| All Sports Pace | Shared `km/h` boundary. |
| Bike Power | Watt boundary, such as `100`, `150`, or `200`. |

Tick labels are de-duplicated after display rounding. Open-ended buckets retain explicit labels such as `50+`, `< 5:00`, or `> 200`.

## Histogram View State

The selected metric, sport, color scheme, date range, and display mode remain existing in-memory controls. Axis formatting must respond to the current state on every render and must not retain labels from a previous selection.

## N/A State

For an empty or unsupported distribution selection, the existing explicit N/A state takes precedence and no index-based or stale axis is displayed.
