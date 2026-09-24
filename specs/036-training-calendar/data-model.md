# Data Model: Training Calendar View

## Source Activity

The feature consumes existing in-memory `processedActivities` records and does not mutate them.

| Field | Type | Rule |
|---|---|---|
| `date` | `Date` | Required for calendar placement; interpreted in the user's local timezone. Invalid dates are excluded from the calendar and counted by validation tests. |
| `sport` | string or null | `Run`, `Bike`, `Swim`, or another normalized value. Values outside the supported set are exposed as `Other` only in this view. |
| `duration` | number | Seconds; valid non-negative finite values contribute to duration totals. Missing or invalid values are unavailable, not zero. |
| `distance` | number | Kilometers after existing parser semantics; valid non-negative finite values contribute to distance totals. Missing or invalid values are unavailable, not zero. |

## Calendar Year

A selected year represented by:

- `year`: four-digit integer.
- `days`: every local calendar day in the year, ordered chronologically.
- `weeks`: Monday-first columns containing day cells and alignment placeholders.
- `availableSports`: sports present after mapping unsupported values to `Other`.
- `activityCount`: number of included source activities.

Validation: a year must be an integer; the generated day list must contain 365 or 366 real days depending on leap-year rules.

## Training Day

One record per local date:

| Field | Type | Rule |
|---|---|---|
| `dateKey` | `YYYY-MM-DD` string | Unique within a calendar year. |
| `date` | local `Date` | Represents the day, not an activity timestamp. |
| `activityCount` | non-negative integer | Count of all included activities on the day. |
| `durationSeconds` | non-negative number or null | Sum of valid durations; null when none is available. |
| `distanceKm` | non-negative number or null | Sum of valid distances; null when none is available. |
| `metricValue` | non-negative number | Duration sum when available, otherwise distance sum, otherwise activity count. |
| `metricKind` | `duration`, `distance`, or `count` | Identifies which fallback level produced `metricValue`. |
| `sports` | array of strings | Unique sorted values from `Run`, `Bike`, `Swim`, `Other`. |
| `bySport` | object | Per-sport count, duration and distance totals. |
| `intensityLevel` | integer 0 through 5 | Zero means no activity; 1 through 5 are relative levels for the current selection. |

Missing duration or distance is omitted from the corresponding summary, never displayed as a fabricated zero.

## Sport Filter

- `All`: includes all activities, including `Other` when present.
- `Run`, `Bike`, `Swim`, `Other`: includes only activities mapped to that view category.
- Only categories present in the selected dataset are shown as controls, alongside `All` when activities exist.

## State Transitions

1. Import or replace dataset: discover available years and sports; select the latest year and `All`.
2. Select year: rebuild day aggregates and intensity thresholds for that year.
3. Select sport: filter source activities, then rebuild aggregates and thresholds for the selected year.
4. Select day: expose the immutable Training Day details.
5. No qualifying activities: keep the full year grid but show an explicit empty-state message and level-zero cells.
