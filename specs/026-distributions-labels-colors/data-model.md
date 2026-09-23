# Data Model: Distribution Labels and Color Schemes

This feature changes presentation state and derived display values only. Imported activity records, persistence, and source data schemas remain unchanged.

## Distribution View State

Represents the current in-memory selections for the Distributions tab.

| Field | Type | Allowed values | Rules |
|---|---|---|---|
| `metric` | string | `length`, `duration`, `pace`, `elevation`, `power` | Existing metric selection; does not change activity data. |
| `sport` | string | `All`, `Run`, `Bike`, `Swim` | `All` enables combined line comparisons and the explicit combined-histogram N/A state. |
| `displayMode` | string | `line`, `histogram` | Existing display mode. |
| `colorScheme` | string | `fire`, `monochrome-blue` | Defaults to `fire`; retained for the current page session. |
| `dateRange` | date-index pair | Existing date slider range | Changing it re-renders using the active color scheme. |

## Distribution Bucket

A derived, display-ready grouping of qualifying activity values.

| Field | Type | Rules |
|---|---|---|
| `rangeStart` | number | Numeric lower boundary; may be negative infinity for an underflow bucket. |
| `rangeEnd` | number | Numeric upper boundary; may be positive infinity for an overflow bucket. |
| `label` | string | Human-readable bucket text with metric-specific formatting. Length overflow uses `50+` in the specified All Sports + Line presentation. |
| `count` | integer | Number of qualifying activities in the bucket; must not change when color scheme changes. |
| `isOverflow` | boolean | Identifies an open-ended upper bucket. |
| `isUnderflow` | boolean | Existing Pace-only lower outlier bucket behavior remains unchanged by this feature. |

## Distribution Axis Label

Derived label metadata for the x-axis.

| Metric/context | Required title | Tick/bucket display |
|---|---|---|
| Length | `Length (km)` | Kilometer values; no redundant unit requirement on every tick. |
| Duration | `Duration (h:m)` or equivalent hours/minutes title | Whole hours and minutes such as `1h 30m`. |
| Elevation gain | `Elevation gain (m)` | Meter values. |
| Power | `Power (W)` | Watt values. |
| Pace + Run | `Pace (min/km)` | Numeric time labels without repeated unit. |
| Pace + Swim | `Pace (min/100m)` | Numeric time labels without repeated unit. |
| Pace + Bike | `Pace (km/h)` | Whole-number speed labels without unnecessary decimal points. |
| Pace + All Sports | Mixed-unit Pace title | Must disclose mixed units and must not claim one sport's unit applies to all values. |

## Color Scheme

Named palette selection used by all distribution bars, points, and relevant series cues.

| Value | User label | Visual meaning |
|---|---|---|
| `fire` | `On fire` | Existing yellow-to-orange-to-red gradient. |
| `monochrome-blue` | `Monochrome blue` | Ordered blue shades with sufficient distinction between bucket positions. |

Color scheme transitions affect only visual colors. They do not mutate bucket boundaries, labels, counts, filters, or N/A state.

## N/A State

A derived display state for unsupported or unavailable views.

- **All Sports + Histogram**: always N/A for each distribution metric.
- **Any selected sport with no qualifying values**: N/A with metric context.
- **Existing unsupported combinations**: preserve existing N/A behavior, including Elevation gain + Swim.
- Rendering N/A must remove any previous chart instance from view and must not leave stale chart data visible.
