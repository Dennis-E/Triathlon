# Data Model: Distributions Chart Refinements

This extends the data model from `018-activity-distributions` (Metric selection, Time
horizon, Sport filter, Display mode, Distribution bucket). Only new/changed entities
and fields are described here.

## Changed entities

### Activity (existing entity, field semantics changed)

| Field | Type | Notes |
|---|---|---|
| `avgWatts` | number \| null | **Changed**: now `null` for any activity whose resolved `sport` is not `'Bike'`, regardless of what the raw CSV column contained. Set once during CSV processing (`processData()` in both `index.html` and `src/dashboard-utils.js`), not filtered downstream. |

### Distribution bucket (extended from `018`)

| Field | Type | Notes |
|---|---|---|
| `rangeStart` | number | **Changed**: now a "nice number" boundary (from the `{1,2,5}×10^n` step sequence) instead of an arbitrary fraction of the min/max span. |
| `rangeEnd` | number | Same nice-number convention as `rangeStart`. |
| `label` | string | **Changed**: now produced via the metric-specific formatter (`formatMetricValue`) instead of a generic 2-decimal rounding. |
| `count` | number | Unchanged semantics. |
| `isOverflow` | boolean | **New**. `true` for the single final bucket that collects IQR-detected outliers; `false`/absent for all regular buckets. |

### Distribution dataset (extended from `018`)

| Field | Type | Notes |
|---|---|---|
| `buckets` | `DistributionBucket[]` | Now includes at most one trailing bucket with `isOverflow: true`. |
| `outlierThreshold` | number \| null | **New**. The computed `Q3 + 1.5 * IQR` upper fence used to decide the overflow bucket; `null` when there are too few values to compute quartiles or no values exceed the fence. |
| `perSport` | `{ [sport: string]: { buckets: DistributionBucket[], activityCount: number } }` \| null | **New**. Present only when sport filter is `'All'` and display mode is `'line'`; one entry per sport with ≥1 qualifying activity, each using the *same* `rangeStart`/`rangeEnd` boundaries as the combined `buckets` (only `count` differs per sport). `null` otherwise. |

## New entities

### Per-sport line series

Represents one sport's line in the "All Sports" + "Line" mode chart.

| Field | Type | Notes |
|---|---|---|
| `sport` | `'Run'` \| `'Bike'` \| `'Swim'` | Which sport this line represents. |
| `buckets` | `DistributionBucket[]` | Same `rangeStart`/`rangeEnd` boundaries as the combined dataset's `buckets`; only `count` is sport-specific. |
| `color` | string | A distinct display color per sport, consistent with existing sport color conventions elsewhere in the dashboard where applicable. |

### Outlier threshold computation (derived, per render)

| Field | Type | Notes |
|---|---|---|
| `q1` | number | First quartile of the qualifying values (linear-interpolation method). |
| `q3` | number | Third quartile of the qualifying values. |
| `iqr` | number | `q3 - q1`. |
| `upperFence` | number | `q3 + 1.5 * iqr`. Values above this are outliers per the clarified IQR rule. |

## Validation / derivation rules

- **FR-001/FR-002**: `getMetricValue(activity, 'power')` continues to read
  `activity.avgWatts`, but that field is now guaranteed `null` for non-Bike activities
  by `processData()`, so no additional filtering is needed in `distribution-utils.js`
  for correctness — it is a defense-in-depth data guarantee, not a display-layer patch.
- **FR-003**: `perSport` is only computed when `sport === 'All'` and
  `displayMode === 'line'`; it reuses the combined dataset's regular+overflow bucket
  boundaries so all lines share one x-axis.
- **FR-009/FR-010/FR-011**: Regular bucket boundaries are computed from `[min, upperFence]`
  (or `[min, max]` when `upperFence >= max`, i.e. no outliers) using the nice-number
  step algorithm; an overflow bucket is appended only when at least one qualifying
  value exceeds `upperFence`.
- **FR-005 through FR-008, FR-012**: All bucket `label`s and any axis/tooltip text use
  `formatMetricValue(metricKey, value, sport)` consistently in both display modes.
