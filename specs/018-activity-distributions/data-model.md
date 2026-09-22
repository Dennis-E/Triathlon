# Data Model: Activity Distributions Visualization

## Entities

### Metric selection

Represents which activity dimension is currently being analyzed.

| Field | Type | Notes |
|---|---|---|
| `key` | enum: `length` \| `duration` \| `pace` \| `elevation` \| `power` | Matches FR-002's five supported metrics |
| `label` | string | Display label ("Length", "Duration", "Pace", "Elevation gain", "Power (Watt)") |
| `unit` | string | Axis/unit label (km, min, pace/speed units per `getSportPerformanceMetric`, m, W) |
| `activityField` | string | Source field(s) on an activity used to derive the value (`distance`, `duration`, derived pace/speed, `elevationGain`, `avgWatts`) |

### Time horizon

Reuses the existing date-range concept from "Heartrate vs Pace" (`scatterDateStart`/`scatterDateEnd` pattern).

| Field | Type | Notes |
|---|---|---|
| `minDate` | Date \| null | Inclusive lower bound; `null` = no lower bound |
| `maxDate` | Date \| null | Inclusive upper bound; `null` = no upper bound |

### Sport filter

| Field | Type | Notes |
|---|---|---|
| `sport` | enum: `All` \| `Run` \| `Bike` \| `Swim` | Matches existing sport-filter convention used across the dashboard |

### Display mode

| Field | Type | Notes |
|---|---|---|
| `mode` | enum: `histogram` \| `line` | Controls whether buckets render as bars or as a smoothed line through bucket midpoints |

### Distribution bucket

Computed, not stored — derived fresh from the filtered activity set on every
metric/time-horizon/sport change.

| Field | Type | Notes |
|---|---|---|
| `rangeStart` | number | Inclusive lower bound of this bucket's value range |
| `rangeEnd` | number | Exclusive upper bound (inclusive for the last bucket) |
| `label` | string | Formatted range label for axis ticks/tooltips (e.g., "5-8 km") |
| `count` | number | Number of qualifying activities whose metric value falls in this range |

### Distribution dataset (derived, per render)

| Field | Type | Notes |
|---|---|---|
| `metric` | Metric selection | The metric this dataset was computed for |
| `filters` | `{ sport, minDate, maxDate }` | The filter combination applied |
| `buckets` | `DistributionBucket[]` | Ordered list of buckets spanning observed min/max |
| `activityCount` | number | Total qualifying activities (sum of bucket counts); used to detect the empty state (FR-008) |

## Validation / derivation rules

- **FR-003**: An activity qualifies for a metric only if it has a finite, valid value
  for that metric's `activityField` (e.g., `avgWatts` must be a finite positive number
  for Power; missing/invalid values silently exclude the activity from that metric's
  distribution — they are never coerced to zero).
- **FR-005a**: For the Pace metric, the qualifying value is whatever
  `getSportPerformanceMetric(activity)` returns for the activity's own sport
  (`pace_run`, `pace_swim`, or `speed_bike`); values from different sports are bucketed
  together on one shared axis, matching the existing "Heartrate vs Pace" precedent.
- **FR-010**: Bucket boundaries are recomputed whenever the qualifying value set
  changes (metric, time horizon, or sport filter change): take the min/max of the
  qualifying values and divide into a fixed target of 10-15 evenly-sized buckets (12 by
  default); if min equals max, produce a single bucket containing all qualifying
  activities.
- **FR-008**: If the qualifying value set is empty for the current
  metric/time-horizon/sport combination, no buckets are produced and the UI shows the
  empty-state message instead of a chart.

## State transitions

There is no persisted state; the "Distribution dataset" is purely a function of
`(processedActivities, metric, sport, minDate, maxDate)`. Changing `mode` (histogram vs.
line) re-renders the same computed `Distribution dataset` without recomputation.
