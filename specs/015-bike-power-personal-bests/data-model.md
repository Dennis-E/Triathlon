# Data Model: Bike Power Personal Bests

## Existing Activity

The existing imported activity remains the source record and is not replaced.

| Field | Type | Rules |
|---|---|---|
| `id` | string or null | Used to associate an activity with its FIT file when available. |
| `date` | Date | Required for chronological progression and display. |
| `sport` | `Run` \| `Bike` \| `Swim` | Only `Bike` activities can produce bike power records. |
| `name` | string | Display context; fallback label is allowed when absent. |
| `duration` | positive number | Existing activity duration in seconds. |
| `avgWatts` | finite number or null | Whole-activity average power from supported CSV headers; values must be greater than zero to be usable. |

## Normalized Power Record

An optional record derived from a FIT activity file before PB aggregation.

| Field | Type | Rules |
|---|---|---|
| `tSec` | finite number | Monotonically increasing timestamp in seconds after normalization. |
| `distKm` | finite number | Non-decreasing distance in kilometers. |
| `power` | finite number or null | Instantaneous power in watts; null or non-positive values do not qualify for an effort. |

Records with invalid timestamps or distance are discarded. Equal timestamps are deduplicated using the existing import semantics, retaining the greatest distance and latest finite power value.

## Bike Power Observation

| Field | Type | Rules |
|---|---|---|
| `source` | `activity-average` \| `fit-rolling` | Determines the label and allowed PB category. |
| `watts` | positive finite number | Rounded only for display; calculations retain the source value. |
| `date` | Date | Copied from the source activity. |
| `activityId` | string or null | Traceability when available. |
| `activityName` | string | Display fallback is `Activity`. |
| `targetSeconds` | positive number or null | Required for `fit-rolling`; null for activity average. |
| `intervalStartSec` / `intervalEndSec` | finite number or null | Optional FIT window context. |
| `intervalStartKm` / `intervalEndKm` | finite number or null | Optional distance context for a FIT window. |

## Bike Power Personal Best

A chronological record emitted only when an observation exceeds the prior best in its category. The activity-average category therefore contains successive all-time highs, not every activity observation.

| Field | Type | Rules |
|---|---|---|
| `category` | `activity-average` \| `5m` \| `10m` \| `20m` \| `60m` | Activity average and duration categories never share a progression. |
| `watts` | positive finite number | Higher is better. |
| `date` | Date | Used for ordering and display. |
| `activityName` | string | Identifies the source activity where possible. |
| `source` | matching observation source | Must remain consistent with `category`. |
| `durationSeconds` | positive number or null | Set only for duration-specific categories. |

## Power Availability State

The Bike PB renderer derives one of these states from the imported activities:

- `none`: no usable bike power observations or duration efforts.
- `average-only`: at least one activity-average observation, no duration effort.
- `duration-only`: at least one duration effort, no activity-average observation.
- `average-and-duration`: both sources exist.

The state controls whether the power section is hidden, rendered with average records, rendered with duration records, or rendered with both. It must never create a record from a missing source.
