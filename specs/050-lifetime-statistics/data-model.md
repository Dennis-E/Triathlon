# Data Model: Lifetime Statistics

All output is calculated from the current in-memory `processedActivities` dataset. The feature adds no persisted entities.

## Activity (existing input, read-only during aggregation)

| Field | Type | Use and validation |
|---|---|---|
| `id` | string or number | Optional activity identifier; not used to deduplicate records. |
| `name` | string | Display label for a longest-activity milestone; use a neutral fallback if missing. |
| `sport` | `'Run' \| 'Bike' \| 'Swim' \| null` | Normalized sport. `null` remains unknown; it is included in overall totals but not assigned to a sport row. |
| `date` | valid local `Date` | Local calendar date for active-day uniqueness and milestone context. Rows with invalid dates are already excluded by import. |
| `distance` | number (km) | Existing numeric value; valid for this feature only when finite, non-negative and `distanceAvailable !== false`. |
| `distanceAvailable` | boolean (new, additive) | True only when the raw source distance is present and parses as a finite, non-negative value. Numeric `0` is valid. |
| `duration` | number (seconds) | Existing moving-time value; valid for this feature only when finite, non-negative and `durationAvailable !== false`. |
| `durationAvailable` | boolean (new, additive) | True only when raw moving time is present and parses as a finite, non-negative value. Numeric `0` is valid. |
| `elevationGain` | number (meters) or `null` | Valid when finite and non-negative; `null` or invalid values mean unavailable. |
| `equipment` | string | Used only for Bike activities; trim before counting. Ignore blank and known placeholder values. |

The importer continues to expose the existing numeric `distance` and `duration` fields with their current defaults and units for other visualizations. Availability flags carry source completeness without changing those consumers.

## MetricResult (computed)

| Field | Type | Meaning |
|---|---|---|
| `value` | non-negative number or `null` | Sum of valid recorded values; `null` when no activity has a usable value. |
| `availableCount` | non-negative integer | Number of activities with a valid value for this metric. |
| `activityCount` | non-negative integer | Number of activities in the aggregate scope. |
| `status` | `'complete' \| 'partial' \| 'unavailable'` | Complete if all scoped activities have usable values; partial if some do; unavailable if none do. An empty scope is unavailable. |

A value of `0` with `status: 'complete'` represents a genuine recorded zero. A `null` value with `status: 'unavailable'` is displayed as unavailable, never as zero.

## SportSummary (computed)

| Field | Type | Meaning |
|---|---|---|
| `sport` | `'Run' \| 'Bike' \| 'Swim'` | Only supported normalized sports are represented. |
| `workoutCount` | non-negative integer | All processed activities in this sport, whether or not optional measurements exist. |
| `distance` | `MetricResult` | Distance total and completeness within the sport. |
| `movingTime` | `MetricResult` | Moving-time total and completeness within the sport. |

Only sports represented in the imported data need a visible row. Unknown sports do not create an “Other” sport row.

## LifetimeSummary (computed)

| Field | Type | Meaning |
|---|---|---|
| `workoutCount` | non-negative integer | `processedActivities.length`; includes supported and unknown sports and activities missing distance or moving time. |
| `distance` | `MetricResult` | Total distance across all processed activities. |
| `movingTime` | `MetricResult` | Total moving time across all processed activities. |
| `elevationGain` | `MetricResult` | Total recorded elevation gain across all processed activities. |
| `activeDayCount` | non-negative integer | Number of unique local calendar date keys among processed activities. |
| `sportSummaries` | `SportSummary[]` | Per-supported-sport workout count, distance and moving time. |
| `longestByDistance` | `ActivityMilestone \| null` | Activity with the greatest valid distance; null when none has a valid distance. |
| `longestByMovingTime` | `ActivityMilestone \| null` | Activity with the greatest valid moving time; null when none has a valid moving time. |
| `equipmentCounts` | `{ shoes: number, bikes: number }` | Number of distinct trimmed, non-placeholder gear labels from Run activities and Bike activities respectively. Individual labels are not returned or displayed. |

## ActivityMilestone (computed)

| Field | Type | Meaning |
|---|---|---|
| `name` | string | Activity name or neutral fallback. |
| `date` | valid local `Date` | Imported activity date. |
| `value` | non-negative number | Distance in km or moving time in seconds according to the milestone. |
| `sport` | supported sport or `null` | Preserves the activity's normalized sport without inventing a category. |

Ties are resolved deterministically by retaining the earliest activity in the existing chronological activity ordering.

## State and validation rules

- Aggregates are recomputed from current imported data on render; no summary is retained across reloads.
- Overall activity count includes every processed activity even if measurements are unavailable; import continues to discard rows with invalid required dates.
- Overall measurement totals include valid values from all sports, including unknown sport values. Sport breakdowns include only `Run`, `Bike` and `Swim`.
- Valid distance, moving time and elevation values must be finite and at least zero. Negative and non-finite values are unavailable for this feature.
- An optional metric is complete when its `availableCount` equals its scope's `activityCount`, partial when the count is between zero and the full count, and unavailable when zero.
- Active days use the local calendar date, not UTC date conversion; multiple activities on one local date count once.
- Equipment labels are counted separately for `sport === 'Run'` (shoes used) and `sport === 'Bike'` (bikes used). Empty strings and case-insensitive sentinels `-`, `none`, `unknown`, and `n/a` are ignored. Distinct matching is performed on trimmed text without fuzzy matching, and the resulting labels themselves are not displayed.
- Country data is not part of this model or output.
