# Data Model: Realistic Sample Training Data

## Sample Dataset

Represents the bundled, wholly fictional training history.

| Field | Meaning | Validation |
|---|---|---|
| `schemaVersion` | Payload structure version | Remains supported by the existing sample validator |
| `datasetId` | Identity of this sample revision | Non-empty; generation revision is incremented for the updated content |
| `synthetic`, `label`, `athlete` | Synthetic provenance and fictional athlete context | Must identify the payload as synthetic and the region as Silicon Valley |
| `years` | Represented training period | Fixed to 2021-2025 |
| `routes` | Named public route geometries | Route sport, geometry, distance, and provenance pass existing checks |
| `activities` | Fictional workouts | At least 1,500 unique valid activities, all three sports and all months represented in each year |
| `fitBestEffortsByActivityId` | Cycling best efforts keyed by activity ID | Every entry refers to a valid Bike activity and valid effort intervals |

## Sample Activity

A dated workout in the sample dataset. Existing fields include `id`, `sport`, `calendarDate`, `distance`, `duration`, optional measurements, `equipment`, `environment`, and optional `routeId`.

Relationships and validation:

- An activity belongs to exactly one supported sport: Run, Bike, or Swim.
- An activity may name an equipment item; blank equipment means no physical item is specified.
- An outdoor activity may refer to a route of the same sport. Indoor or pool activities have no route.
- Distance and duration remain positive and sport-appropriate; route-linked distance remains consistent with route geometry.
- Monthly distance has seasonal range: in each year the highest month is at least 15% above the lowest.
- At least one gap in 2023 spans 10 or more consecutive days without an activity.

## Equipment Item

Equipment is represented by the existing activity `equipment` name rather than a separate registry.

- Shoe names are categorized as Shoes when they contain a recognized shoe brand or an explicit shoe/shoes term.
- Other non-empty equipment names continue to use the existing Bikes classification convention.
- Sample records include road shoes, occasional trail shoes, road bikes, and an occasional mountain bike.
- Equipment summaries must show both shoes and bicycles. Occasional items remain associated with enough activities to appear in timelines and summaries.

## State and Lifecycle

The sample dataset is generated deterministically for maintainers, validated before publication, and loaded as one synthetic dataset by the existing app flow. It does not merge with personal imports, and this feature adds no new state transition or storage mechanism.
