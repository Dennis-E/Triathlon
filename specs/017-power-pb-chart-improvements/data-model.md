# Data Model: Power PB Chart Improvements

This feature adds display-oriented fields to the existing entities defined in
`016-bike-power-pb-refinement`'s data model; it does not change qualification rules,
duration categories, or PB computation.

## All-Time Power Profile Point (extended)

Existing fields (`durationSeconds`, `durationLabel`, `watts`, `record`) are unchanged.
Adds:

| Field | Type | Rules |
|---|---|---|
| `showLabel` | boolean | `true` when this point is the shortest available duration in the profile, or when `durationSeconds >= 300`; `false` otherwise. Purely presentational — does not affect plotting or tooltip availability. |

## All-Time Power Profile (extended)

The ordered set of All-Time Power Profile Points, as before. Adds two derived,
read-only values consumed by the y-axis:

| Field | Type | Rules |
|---|---|---|
| `maxWatts` | positive finite number | The highest `watts` among the profile's points. |
| `minWatts` | positive finite number | The lowest `watts` among the profile's points. Equal to `maxWatts` when only one point exists or all points share the same value. |

## Duration Power Tile Chart (new view-level concept)

Not a persisted entity — a rendering shape describing how one duration's PB history is
displayed, reusing the existing timeline-chart pattern:

| Field | Type | Rules |
|---|---|---|
| `durationLabel` | string | From the matching Duration Power Category. |
| `points` | ordered list of Duration Power Personal Best | Chronological successive-best records for this duration (same records already computed for the detail view / profile's `best` value). |
| `color` | string | Existing `PB_SPORT_COLOR.Bike` value, matching all other Bike tiles. |

Rendering rules:

- One or more points: render axes, a trend line/point markers over time, a
  current-best callout on the latest point, and per-point hover tooltips — identical in
  structure to `renderRecordCard`'s chart.
- Exactly one point: render the same chart layout with a single marker (no line
  segment), consistent with how a single-record tile would look for other PB
  categories.
- Zero points: the tile is omitted entirely (unchanged from existing behavior — a
  duration with no qualifying effort already produces no tile).

## Unaffected entities

Duration Power Category, Duration Power Effort, Duration Power Personal Best, and Watt
Section State are unchanged from `016-bike-power-pb-refinement`'s data model; this
feature only adds presentational fields/behavior layered on top of them.
