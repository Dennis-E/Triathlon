# Data Model: Unified Pace versus Metrics

## Existing activity inputs

The feature reuses normalized activity fields without new import columns.

| Field | Type | Use |
|-------|------|-----|
| `sport` | `Run` / `Bike` / `Swim` | Required selected-sport match. |
| `date` | Date | Date range and `year` derivation. |
| `distance` | positive number or zero | Pace/speed calculation and Distance y metric in kilometers. |
| `duration` | positive number or zero | Pace/speed calculation and bubble radius. |
| `avgHeartRate` | number or null | Heart rate y metric in bpm. |
| `avgCadence` | number or null | Cadence y metric with sport-specific label. |
| `elevationGain` | number or null | Elevation y metric in meters. |
| `totalSteps` | number or null | Optional Run cadence detail only. |

## Metric filter

| Key | Point y value | Unit | Qualification |
|-----|---------------|------|---------------|
| `heartRate` | `avgHeartRate` | bpm | Finite and greater than zero. |
| `cadence` | `avgCadence` | sport-specific | Finite and greater than zero. |
| `elevationGain` | `elevationGain` | m | Finite and greater than zero. |
| `distance` | `distance` | km | Finite and greater than zero. |

## PaceMetricPoint

| Field | Type | Rule |
|-------|------|------|
| `x` | number | Valid performance value for the selected sport: Run pace, Bike speed, or Swim pace. |
| `y` | number | Valid value for the active metric. |
| `metric` | metric key | Matches the active Metric filter. |
| `metricType` | string | `pace_run`, `speed_bike`, or `pace_swim`. |
| `sport` | selected sport | Exactly `Run`, `Bike`, or `Swim`; never `All`. |
| `date`, `year`, `name`, `distance`, `duration` | existing activity data | Tooltip, grouping, and bubble size. |
| `totalSteps` | number or null | Present only when `metric` is cadence and sport is Run. |

An activity yields a point only if its selected sport matches, it is inside the active
date range, both its y metric and performance value are finite and positive, and it
uses a supported normalized sport. Failed activities never produce zero-valued points.

## Visibility state

| State | Meaning |
|-------|---------|
| `selectedSport` | Exactly one of Run, Bike, or Swim. |
| `selectedMetric` | Exactly one metric filter key. |
| `enabledYears` | Set of visible point years; pruned to current years, new years enabled. |
| `showTrendLines` | Boolean; affects lines only, never visible bubbles. |

## State transitions

```text
Import or filter change -> derive qualifying PaceMetricPoints
  -> no points: explanatory empty state
  -> points: synchronize years -> render bubbles -> render eligible trend lines
```