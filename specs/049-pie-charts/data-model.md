# Data Model: Pie Charts

All data is derived in browser memory from the existing `processedActivities` array; nothing is persisted.

## Activity (existing, read-only)

| Field | Type | Use |
|---|---|---|
| `sport` | `'Run' \| 'Bike' \| 'Swim' \| null` | Sport filter and Sport dimension; `null` is always excluded |
| `duration` | number (s) | Duration dimension; Time measure |
| `distance` | number (km) | Length dimension; Distance measure; pace computation |
| `avgWatts` | number \| null | Power dimension (Bike only) |
| `equipment` | string | Equipment dimension (`''` → "No equipment") |

## PieSelection (transient UI state)

| Field | Values | Default |
|---|---|---|
| `dimension` | `'sport' \| 'duration' \| 'pace' \| 'equipment' \| 'length' \| 'power'` | `'sport'` |
| `measure` | `'count' \| 'time' \| 'distance'` | `'count'` |
| `sport` | `'All' \| 'Run' \| 'Bike' \| 'Swim'` | `'All'` |
| `colorScheme` | `'fire' \| 'monochrome-blue'` | `'fire'` |

Session-scoped only; reset on reload.

## PieSlice (computed)

| Field | Type | Notes |
|---|---|---|
| `key` | string | Stable id (sport name, bucket index, equipment name, `'__other__'`) |
| `label` | string | Human-readable range/sport/equipment label, with units |
| `value` | number | Sum in active measure (count, seconds, km) |
| `activityCount` | integer | Activities contributing to the group |
| `percentage` | number | `value / total * 100` |
| `color` | hex string | From active scheme |
| `isOther` | boolean | True only for merged remainder slice |

## PieChartResult (computed)

| Field | Type | Notes |
|---|---|---|
| `slices` | `PieSlice[]` | ≤ 8 entries, ordered (see rules) |
| `total` | number | Sum of slice values |
| `activityCount` | integer | Activities included in the pie |
| `excludedCount` | integer | Sport-matching activities without a usable dimension value |

## Validation & ordering rules

1. Activities are first filtered by `sport` (All = Run/Bike/Swim only).
2. Activities without a finite dimension value are excluded and counted in `excludedCount` (e.g. no `avgWatts` for Power).
3. Slice value = count / Σ duration / Σ distance; non-positive durations/distances contribute 0.
4. Groups with `value <= 0` are dropped.
5. Ordering: Sport → Run, Bike, Swim; numeric → ascending range (underflow first, overflow last); Equipment → descending value, ties alphabetical, "Other" last.
6. Max 8 slices. Equipment: top 7 + "Other". Numeric dimensions: if bucketing yields > 8 non-empty buckets, recompute with a decreasing `targetBucketCount` (6 → 5 → 4 …) until ≤ 8; never merge non-adjacent ranges into "Other".
7. Empty result (`slices.length === 0`) → empty state; export blocked.
8. Percentages sum to 100 % ± rounding.
