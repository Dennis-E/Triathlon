# Data Model: Workout Time Visualization

## Normalized activity timestamp

An imported activity retains both the existing calendar date and its start timestamp.

| Field | Type | Rules |
|---|---|---|
| `date` | `Date` | Existing calendar date used by dashboard date-range filters and sorting. |
| `startTime` | `Date` or `null` | Parsed from the original Activity Date/Aktivitätsdatum value; includes time when valid, otherwise null. |
| `sport` | `Run` \| `Bike` \| `Swim` | Existing strict sport normalization is unchanged. |
| `id` | string/number | Existing activity identity; not changed by this feature. |

Validation:

- German and English timestamp formats must preserve an available hour/minute/second.
- Invalid or missing timestamps become `startTime: null` and do not fail the activity import.
- `date` remains available even when `startTime` is null where existing parsing can determine the calendar date.
- No timezone conversion is introduced; grouping uses the local time represented by the imported timestamp.

## Filter state

The renderer consumes the existing dashboard filter state rather than persisting a
second copy.

| Field | Type | Rules |
|---|---|---|
| `sport` | `All` \| `Run` \| `Bike` \| `Swim` | Applied before grouping. |
| `minDate` | `Date` or `null` | Inclusive calendar-date lower bound. |
| `maxDate` | `Date` or `null` | Inclusive upper bound through the end of that calendar day. |
| `granularity` | `day` \| `week` \| `month` \| `year` | Exactly one active view. |

## Time group

A derived, ordered output record used by the chart.

| Field | Type | Rules |
|---|---|---|
| `key` | string | Stable group key such as `day-06`, `week-mon`, `month-15`, or `year-january`. |
| `label` | string | User-facing interval/day/month label. |
| `count` | number | Number of filtered activities with valid start times assigned to the group. Non-negative integer. |
| `order` | number | Fixed calendar/time order used for chart labels. |

Group definitions:

- `day`: 12 two-hour intervals covering the complete 24-hour day.
- `week`: Monday through Sunday.
- `month`: day numbers 1 through 31 aggregated across the selected date range.
- `year`: January through December aggregated across the selected date range.

## Workout Time dataset

A derived render model, recalculated when activities, sport/date filters, or granularity
change.

| Field | Type | Rules |
|---|---|---|
| `granularity` | enum | Matches the active control. |
| `groups` | `TimeGroup[]` | Ordered and complete for the selected granularity, including zero-count groups where needed to show gaps. |
| `activityCount` | number | Sum of all group counts; zero triggers the explicit empty state. |
| `filters` | filter state | Snapshot used for rendering/export context. |

There is no persisted state transition or remote entity. Changing the display
granularity recalculates the derived dataset; changing chart presentation/export state
does not alter source activities.
