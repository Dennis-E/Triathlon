# Data Model: Import-Screen Polish

## Import Progress State

Represents the visible state of the import modal.

| Field | Type | Rules |
|---|---|---|
| `percent` | number | Displayed as a bounded percentage from 0 to 100. |
| `stage` | string | Stable overall stage text; detailed current activity is shown in the black detail box. |
| `isError` | boolean | Error state stops preview rotation and preserves the error detail. |
| `isComplete` | boolean | Completion stops preview rotation before the modal closes. |

## Prepared Visualization Preview

Represents one product visualization shown while import processing is active.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Identifies an existing TriAnalytica visualization preview. |
| `label` | string | Accessible, human-readable description of the visualization. |
| `asset` | existing markup/image reference | Must represent an existing TriAnalytica dashboard visualization, not a generic placeholder. |
| `message` | string | Short accompanying import message; rotation must not replace the factual progress detail. |

Preview state rotates only while import processing is active. It is independent of imported activity data and has no effect on import results.

## FIT Activity Session

Represents one imported activity/session derived from a FIT source file.

| Field | Type | Rules |
|---|---|---|
| `activityId` | string | Unique key used by the existing `gpsTracksByActivityId` map. |
| `sport` | `Run \| Bike \| Swim \| null` | Reuses existing sport normalization; unknown sports are not silently reclassified. |
| `startTime` | timestamp | Inclusive lower boundary for selecting FIT records. |
| `endTime` | timestamp | Inclusive upper boundary for selecting FIT records; must not precede `startTime`. |
| `sourceFilename` | string | FIT/GPX source associated with the activity. |

## GPS Track Entry

Represents the existing stored/displayed shape for one activity's GPS data.

```text
{ activityId: string, sport: string|null, points: [[latitude, longitude], ...] }
```

Rules:

- Create exactly one entry only when the activity's selected record range contains at least one GPS point.
- For a multisport FIT source, points are selected by the activity's own session time range.
- Never reuse the complete source record list for multiple child activities.
- Apply the existing simplification after segmentation so a point cannot migrate across session boundaries.
- The number of GPS-track entries equals the number of imported activities with GPS points.

## Relationships and State Transitions

```text
Import started
  -> progress active + preview rotation active
  -> FIT source parsed
  -> sessions resolved and records segmented
  -> one GPS Track Entry per eligible activity
  -> import complete or error
  -> preview rotation stopped
```
