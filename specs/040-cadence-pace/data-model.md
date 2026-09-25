# Data Model: Cadence versus Pace

## Activity extensions

The existing normalized activity gains these optional fields. They retain source
measurements and do not synthesize unavailable values.

| Field | Type | Source | Rules |
|-------|------|--------|-------|
| `avgCadence` | number or null | Average Cadence / Durchschnittliche Trittfrequenz | Must parse as a finite number greater than zero; otherwise `null`. Applies to Run, Bike, and Swim. |
| `totalSteps` | number or null | Total Steps / Schritte insgesamt | Must parse as a finite number greater than zero; otherwise `null`. Preserved only for Run activities. |

Existing activity fields remain authoritative: `sport`, `date`, `distance`, `duration`,
and `name` determine whether pace and a point can be calculated.

## Qualifying cadence activity

A qualifying activity meets all rules below:

1. Its normalized sport is exactly `Run`, `Bike`, or `Swim`.
2. Its `avgCadence` is finite and greater than zero.
3. Its existing sport-specific performance metric is valid:
   - Run: minutes per kilometer
   - Bike: kilometers per hour
   - Swim: minutes per 100 meters
4. It satisfies any active date and sport filters.

Activities that fail a rule do not yield a point and are never represented as zero.

## Cadence point

| Field | Type | Meaning |
|-------|------|---------|
| `x` | number | Sport-specific pace or speed from the existing performance-metric rules. |
| `y` | number | Activity average cadence. |
| `sport` | `Run` / `Bike` / `Swim` | Determines axis and detail labels. |
| `metricType` | string | `pace_run`, `speed_bike`, or `pace_swim`. |
| `date` | Date | Activity date for point details and year grouping. |
| `year` | number | Calendar year used for grouping and optional trend lines. |
| `name` | string | Activity name for the tooltip title. |
| `distance` | number | Distance in kilometers for tooltip context. |
| `duration` | number | Moving duration in seconds for tooltip context and bubble size. |
| `totalSteps` | number or null | Run-only optional detail value. |

## Sport presentation metadata

| Sport | Cadence label | Performance label | Total steps |
|-------|---------------|-------------------|-------------|
| Run | Average step cadence | Pace | Show when available |
| Bike | Average pedal cadence | Speed | Never show |
| Swim | Average swim rhythm | Pace | Never show |

## State transitions

```text
No import -> Imported activities -> Qualifying points calculated
                                      |                 |
                                      |                 +-> At least one sport available: render its chart
                                      |
                                      +-> No qualifying points: explain measurement-data empty state
```