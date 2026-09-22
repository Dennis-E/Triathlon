# Data Model: Distributions Visual Polish

This extends the data model from `018-activity-distributions` and
`019-distributions-refinements` (Metric selection, Time horizon, Sport filter,
Display mode, Distribution bucket, Overflow bucket, Per-sport line series). Only
new/changed entities and fields are described here.

## Changed entities

### Display mode (extended from `018`)

| Field | Type | Notes |
|---|---|---|
| initial value | `'histogram'` \| `'line'` | **Changed**: the Distributions tab's state now initializes to `'line'` (was `'histogram'`); still user-changeable thereafter with no reset behavior. |

### Distribution bucket (extended from `019`)

| Field | Type | Notes |
|---|---|---|
| `label` | string | **Changed for Pace only**: no longer includes the unit suffix (e.g. `"5:30-6:00"` instead of `"5:30 min/km-6:00 min/km"`); all other metrics' labels are unchanged. |
| `isUnderflow` | boolean | **New**. `true` for the single leading bucket (Pace metric only) that collects IQR lower-fence outliers; `false`/absent otherwise. Mirrors the existing `isOverflow` field. |
| `colorPosition` | number (0-1) | **New, derived at render time, not stored on the bucket object itself**. Normalized position along the chart's effective (possibly reversed) axis order, used to compute each bucket/point's fire-gradient color. |

### Distribution dataset (extended from `019`)

| Field | Type | Notes |
|---|---|---|
| `buckets` | `DistributionBucket[]` | Now may include at most one leading bucket with `isUnderflow: true` (Pace metric only), in addition to the existing optional trailing `isOverflow` bucket. |
| `axisReversed` | boolean | **New**. `true` when the current metric/sport combination uses the reversed axis order (Pace metric, single-sport Run or Swim selection); `false` otherwise (including "All Sports" Pace, per the shared-axis constraint documented in research.md). |

## New entities

### Fire color scale

A pure mapping from normalized chart position to a display color.

| Field | Type | Notes |
|---|---|---|
| `position` | number (0-1) | 0 = slowest/shortest end of the chart's effective axis order; 1 = fastest/longest end. |
| `color` | string (hex) | Interpolated color along the yellow → orange → red stop sequence. |

### Duration nice-step table

A fixed, ordered list of candidate bucket step sizes used only for the Duration
metric.

| Step (seconds) | Step (human) |
|---|---|
| 300 | 5 minutes |
| 600 | 10 minutes |
| 900 | 15 minutes |
| 1800 | 30 minutes |
| 3600 | 1 hour |
| 7200 | 2 hours |
| 10800 | 3 hours |
| 21600 | 6 hours |
| 43200 | 12 hours |
| 86400 | 24 hours |

### Underflow bucket (Pace only)

| Field | Type | Notes |
|---|---|---|
| `rangeStart` | number | `-Infinity` (mirrors the existing overflow bucket's `rangeEnd: Infinity`). |
| `rangeEnd` | number | The first regular bucket's `rangeStart` (the lower fence boundary). |
| `label` | string | `"< [formatted boundary]"`. |
| `count` | number | Number of qualifying Pace values below the lower fence. |
| `isUnderflow` | boolean | `true`. |

## Validation / derivation rules

- **FR-001/FR-002**: The Distributions tab's `selectedDistributionsSportFilter` and `selectedDistributionsDisplayMode` state variables initialize to `'All'` and `'line'` respectively; no other code path resets them.
- **FR-003/FR-004**: Every rendered bar or point's color is computed via the fire color scale based on its bucket's position along the chart's *effective* (possibly reversed) axis order; per-sport line stroke colors (`PB_SPORT_COLOR`) are unaffected and continue to distinguish sports in "All Sports" + Line mode.
- **FR-005**: Duration bucket boundaries are computed using the Duration nice-step table instead of the generic nice-step algorithm; all other metrics are unaffected.
- **FR-006**: Pace bucket labels omit the unit suffix; the axis title includes the unit exactly once, per the currently selected single sport (or a unit-less "Pace" title for "All Sports").
- **FR-007**: The underflow bucket is computed only for `metricKey === 'pace'`, using the same IQR methodology as the existing overflow bucket, mirrored to the lower fence; it is independent of the sport filter (single-sport or "All Sports" Pace values may all produce an underflow bucket).
- **FR-008**: `axisReversed` is `true` only when `metricKey === 'pace'` and the sport filter is exactly `'Run'` or `'Swim'` (not `'All'`, not `'Bike'`, since Bike's km/h is already correctly oriented and needs no reversal).
- **FR-009/FR-010**: When `metricKey === 'elevation'` and the sport filter is `'Swim'`, no bucket computation occurs for that render; an explicit N/A indicator is shown instead. When `metricKey === 'elevation'` and the sport filter is `'All'` in Line mode, the per-sport grouping excludes `'Swim'` entirely (Run/Bike still render normally).
