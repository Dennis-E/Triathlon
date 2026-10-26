# Data Model: Countries Visited in Lifetime Statistics

## Activity Route

Represents one imported activity's available geographic track.

| Field | Type | Validation / Meaning |
|---|---|---|
| `activityId` | string | Key in `gpsTracksByActivityId`; associates the route with one imported activity. |
| `sport` | string or null | Existing normalized activity sport; not used to filter the all-time country count. |
| `points` | array of `[latitude, longitude]` pairs | At least one valid point is required to represent a location. Latitude must be finite and within -90..90; longitude must be finite and within -180..180. |

Invalid coordinate pairs are ignored. A track with no remaining valid points does not contribute to location coverage or the country set. A single valid point can identify one country; multiple points form the route LineString for intersection matching.

## Country Boundary

Represents one feature in the locally bundled Natural Earth Admin 0 dataset.

| Field | Type | Validation / Meaning |
|---|---|---|
| `countryId` | string | Stable dataset identifier taken from `ADM0_A3`; used for deduplication. |
| `name` | string | Country display name from the boundary feature, with a stable feature-name fallback. |
| `geometry` | Polygon or MultiPolygon | Country territory used for route intersection. |
| `bbox` | four-number extent | Optional preprocessing value used to skip impossible route/polygon comparisons. |

The dataset's default de facto Admin 0 classification is authoritative for this feature. The summary counts map features as supplied; subnational administrative areas are not independent countries.

## Country Count Summary

Derived in memory for the currently imported dataset; it is not persisted or attached to raw activity data.

| Field | Type | Validation / Meaning |
|---|---|---|
| `status` | `complete`, `partial`, or `unavailable` | Complete means every imported activity has a usable route; partial means at least one but not all activities do; unavailable means no usable route or required geographic resource is available. |
| `countryCount` | non-negative integer or null | Number of distinct `countryId` values intersected by usable routes. Null only when status is unavailable. |
| `countryNames` | sorted array of strings | Display names for each distinct country represented in `countryIds`; names are shown in the Lifetime Statistics tile and its export. |
| `trackedActivityCount` | non-negative integer | Imported activities with at least one valid route point. |
| `totalActivityCount` | non-negative integer | Number of activities in the current imported dataset used as the coverage denominator. |
| `countryIds` | set of strings | Internal distinct identifiers used to derive `countryCount`; country names are not required for the display. |

## Relationships and Lifecycle

- Each imported activity may have zero or one route entry in `gpsTracksByActivityId`.
- Each activity route may intersect zero or more country boundaries.
- Multiple activities and repeated crossings contribute the same `countryId` only once to the summary.
- Replacing the imported dataset invalidates and recomputes its summary. Changing chart aggregation, sport, or timeframe controls does not change it.
- Lifetime Statistics displays the count, country names, and neutral coverage text; the Distance view does not display the country count. Neither view displays route points or country-boundary geometry.