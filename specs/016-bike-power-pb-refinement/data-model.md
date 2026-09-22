# Data Model: Bike Power PB Refinement

## Duration Power Category

A supported Bike interval definition.

| Field | Type | Rules |
|---|---|---|
| `label` | string | One of `5s`, `30s`, `1m`, `2m`, `5m`, `10m`, `20m`, `60m`; labels must distinguish seconds and minutes. |
| `seconds` | positive integer | One of 5, 30, 60, 120, 300, 600, 1200, 3600. |
| `tolerance` | fraction | Existing effort-window tolerance policy; must not cause average-watt substitution. |

## Duration Power Effort

A qualifying rolling effort derived from Bike FIT records.

| Field | Type | Rules |
|---|---|---|
| `targetSeconds` | positive integer | Matches one Duration Power Category. |
| `avgPower` | positive finite number | Average watts across valid samples in the accepted window. |
| `startSec` / `endSec` | finite number | `endSec` must be greater than `startSec`; observed coverage must meet at least 80% of target duration. |
| `startKm` / `endKm` | finite number | `endKm` must not be less than `startKm` when distance exists. |
| `source` | `fit-rolling` | Duration PBs must use FIT-derived efforts only. |
| `activityId` | string or null | Traceability to the source activity. |
| `activityName` | string | Display fallback is `Activity`. |
| `date` | Date | Required for chronological progression. |

Invalid timestamps, distances, missing/non-numeric/zero/negative power, and windows below the 80% valid-power coverage threshold are excluded.

## Duration Power Personal Best

The successive historical best records for one duration.

| Field | Type | Rules |
|---|---|---|
| `category` | `duration-power` | Never `activity-average`. |
| `durationLabel` | string | Copied from the matching category. |
| `durationSeconds` | positive integer | Identifies the duration. |
| `watts` | positive finite number | Higher is better; display may round only at the UI boundary. |
| `date` | Date | Chronological record date. |
| `activityName` | string | Source activity context. |
| `activityId` | string or null | Optional source identity. |
| `source` | `fit-rolling` | Must remain duration-specific. |
| `intervalStartSec` / `intervalEndSec` | finite number or null | Source-window context. |
| `intervalStartKm` / `intervalEndKm` | finite number or null | Source-distance context. |

## All-Time Power Profile Point

One point for the highest qualifying value in each available duration.

| Field | Type | Rules |
|---|---|---|
| `durationSeconds` | positive integer | Unique within the profile. |
| `durationLabel` | string | Display label for the x-axis and tooltip. |
| `watts` | positive finite number | Highest qualifying duration-specific value for this duration. |
| `record` | Duration Power Personal Best | Provides date and activity context. |

Profile points are sorted by `durationSeconds`. Missing durations are omitted and are
never estimated from another duration or from whole-activity average watts. A profile
with fewer than two points enters a limited-data state instead of drawing a misleading
trend.

## Watt Section State

- `none`: no qualifying duration-specific efforts; do not render an empty Watt chart.
- `partial`: one or more, but not all, supported durations have qualifying efforts;
  render available duration cards and the profile only when at least two points exist.
- `complete`: all eight supported durations have qualifying efforts.

Whole-activity `avgWatts` remains part of the existing activity entity for unrelated
activity details but is not an input to this state or to any profile point.
