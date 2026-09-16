# Data Model: Heatmap Frequency and Activity Details

## Matched Route Segment

A canonical, continuous route portion shared by one or more imported activities.

| Field | Type | Validation and meaning |
|-------|------|------------------------|
| `key` | string | Stable deterministic identity independent of travel direction |
| `coords` | pair of latitude/longitude pairs | Canonical geometry from the first deterministically ordered matching activity |
| `heading` | number | Undirected heading in $[0,180)$ degrees |
| `activityIds` | sorted string array | Distinct imported activity IDs only |
| `count` | positive integer | MUST equal `activityIds.length` |
| `color` | CSS color string | Ephemeral render value derived from `count` and active scale |

### Matching Rules

- Probe spacing is at most 30 meters.
- Candidate midpoint separation is at most 30 meters.
- Undirected heading difference is at most 30 degrees.
- Shared membership requires at least three consecutive corresponding probes, approximately
  90 meters of continuity; a reversed traversal may correspond.
- A single activity ID occurs at most once in `activityIds` for any segment.
- Candidate ties use deterministic ordering, so identical input produces identical output
  regardless of object insertion order.

## Frequency Scale

Derived from all valid matched segment counts in the active sport-filter result.

| Field | Type | Validation and meaning |
|-------|------|------------------------|
| `minCount` | positive integer | Lowest valid detail-segment count |
| `maxCount` | positive integer | Highest valid detail-segment count |
| `logMin` | number | Natural logarithm of `minCount` |
| `logMax` | number | Natural logarithm of `maxCount` |
| `midpointCount` | positive number | $e^{(logMin+logMax)/2}$ for a varied range |
| `hasRange` | boolean | True only when `maxCount > minCount` |

Normalized position is:

$$
t(c)=\operatorname{clamp}\left(\frac{\ln(c)-logMin}{logMax-logMin},0,1\right)
$$

Color is a direct RGB interpolation from `#60A5FA` at $t=0$ to `#DC2626` at $t=1$.
At $t=0.5$, the expected default color is `#9E6690`.

## Low-Zoom Route Aggregate

A render-only grouping of nearby detail segments below the existing zoom threshold.

| Field | Type | Validation and meaning |
|-------|------|------------------------|
| `key` | string | Existing coarse-grid identity |
| `coords` | pair of latitude/longitude pairs | Representative render geometry |
| `activityIds` | sorted string array | Union of all source segment IDs without duplicates |
| `count` | positive integer | MUST equal `activityIds.length`; drives weight and tooltip total |
| `colorCount` | positive integer | Maximum source detail-segment count; drives color without inventing route frequency |
| `color` | CSS color string | Cached from `colorCount` and the detail frequency scale |

## Activity Summary

A compact reference record built once per imported dataset.

| Field | Type | Validation and fallback |
|-------|------|-------------------------|
| `id` | string | Required lookup key; invalid/missing IDs are excluded from the index |
| `name` | string | `Unknown activity` when missing |
| `date` | date or null | `Unknown date` when invalid/missing |
| `sport` | `Run`, `Bike`, `Swim`, or null | `Unknown sport` when unsupported/missing |
| `distanceKm` | non-negative number or null | Existing normalized activity distance |
| `durationSeconds` | non-negative number or null | Existing elapsed duration |

Display rules:

- Run/Bike distance: kilometers.
- Swim distance: meters (`distanceKm * 1000`).
- Duration: `h:mm:ss` when at least one hour, otherwise `m:ss`.
- Invalid distance or duration: `--`.

## Activity Tooltip Model

Built when a new segment becomes the hover target and retained until that target closes.

| Field | Type | Validation and meaning |
|-------|------|------------------------|
| `segmentKey` | string | Hovered detail or low-zoom aggregate key |
| `totalCount` | integer | Total distinct IDs on the segment |
| `availableCount` | integer | IDs successfully resolved in the activity index |
| `sampled` | boolean | True only when more than ten resolved activities exist |
| `heading` | string | `Random 10 of X activities` when sampled; otherwise activity total text |
| `availabilityNote` | string or null | Explains unresolved IDs when `availableCount < totalCount` |
| `activities` | Activity Summary display array | At most ten, no duplicate IDs |

## Screen Segment Entry

Ephemeral record for one visible Canvas stroke.

| Field | Type | Validation and meaning |
|-------|------|------------------------|
| `key` | string | Segment identity and deterministic tie-breaker |
| `p1`, `p2` | pixel coordinate pairs | Final endpoints after minimum-length adjustment |
| `lineWidth` | positive number | Actual Canvas stroke width |
| `segment` | segment reference | Supplies count and activity membership |

Entries are inserted into every 32-pixel screen cell touched by their padded bounding box.
The index exists only for the current redraw and contains only visible strokes.

## State Transitions

1. **Import applied**: build the Activity Summary index once.
2. **Sport filter selected**: rebuild matched segments and frequency scale; clear tooltip.
3. **Canvas redraw**: draw visible detail/aggregate segments and rebuild screen hit index.
4. **New hover target**: hit-test the screen index, create one sampled tooltip model, and
   position the tooltip within map bounds.
5. **Pointer remains on target**: reposition only; do not resample.
6. **Pointer leaves/target changes/map starts moving**: clear current tooltip model.

## Pure Function Contracts

- `buildRouteSegments(gpsTracksByActivityId, options)`: accepts sport filter, 30-meter
  tolerance, probe spacing, continuity length, and heading tolerance; returns matched detail
  segments with activity membership.
- `computeRouteFrequencyScale(segments)`: returns scale bounds and `midpointCount` or `null`.
- `computeRouteSegmentColor(count, scale, options?)`: returns direct two-endpoint interpolation.
- `buildFrequencyScaleGuide(scale)`: returns hidden, constant, or min/mid/max range model.
- `buildLowZoomRouteSegments(segments, options?)`: unions membership and preserves
  `colorCount` semantics.
- `buildScreenSegmentIndex(entries, options?)`: returns a 32-pixel-cell spatial index.
- `hitTestScreenSegmentIndex(index, point, options?)`: returns the deterministic nearest
  segment or `null`.
- `buildActivitySummaryIndex(activities)`: returns activity ID to summary mappings.
- `sampleDistinct(values, limit, random)`: returns up to `limit` unique values without
  replacement.
- `buildActivityTooltipModel(activityIds, activityIndex, options?)`: returns the stable,
  display-ready tooltip model.
