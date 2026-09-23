# Data Model: Optimized Bike Power PB Import

This feature adds no persisted data. The model describes transient records and
measurements used while importing or validating synthetic activities.

## Raw FIT Record

Existing parser output consumed by normalization.

| Field | Type | Rules |
|---|---|---|
| `timestamp` | `Date` | Required for power-window participation |
| `distance` | number | Finite meters; must not move backward after normalization |
| `power` | unknown | Normalized to a positive finite number or `null` |
| `position_lat` | number/null | Existing GPS input; unchanged by this feature |
| `position_long` | number/null | Existing GPS input; unchanged by this feature |

## Prepared Power Record

Canonical in-memory point used by the rolling calculation.

| Field | Type | Rules |
|---|---|---|
| `tSec` | number | Finite seconds, ascending |
| `distKm` | number | Finite kilometers, non-decreasing |
| `power` | number/null | Positive finite power or `null` |

### Validation and normalization

- Invalid timestamps or distances are omitted.
- Backward time or distance points are omitted according to existing behavior.
- Raw FIT normalization keeps its existing duplicate behavior: the accepted point for
  that timestamp carries the latest accepted distance/power values.
- Preparation inside the public rolling helper does not deduplicate already-normalized
  inputs; same-timestamp records remain in stable input order to preserve its current
  window membership and averaging behavior.
- Missing, empty, zero, negative, non-numeric, and non-finite power becomes `null`.
- Preparation records `usablePowerCount` and whether every usable value is a safe
  integer, which selects the fast or exact-compatibility calculation path.

## Power Duration

One immutable target from the existing duration set.

| Field | Type | Rules |
|---|---|---|
| `label` | string | Existing display label |
| `seconds` | positive number | One of 5, 30, 60, 120, 300, 600, 1200, 3600 |

## Candidate Power Window

A transient inclusive interval beginning at one prepared record.

| Field | Type | Derivation |
|---|---|---|
| `startIndex` | integer | Current candidate record |
| `endIndex` | integer | Last record with `tSec <= start.tSec + targetSeconds` |
| `windowCount` | integer | Inclusive record count |
| `validCount` | integer | Records whose power is not `null` |
| `powerSum` | number | Sum of valid power in established record order |
| `observedSpan` | number | `end.tSec - start.tSec` |
| `coverage` | number | `min(1, observedSpan / targetSeconds) * (validCount / windowCount)` |

A candidate qualifies only when it contains at least two records, has at least one
valid power value, and coverage is at least the supplied threshold (default 0.8).

## Power Personal Best

Existing output entity; zero or one is returned per requested duration.

| Field | Type | Rules |
|---|---|---|
| `targetSeconds` | number | Requested duration |
| `avgPower` | number | `powerSum / validCount` |
| `startSec` | number | Start record time |
| `endSec` | number | End record time |
| `startKm` | number | Start record distance |
| `endKm` | number | End record distance |

The candidate replaces the current best only when `avgPower` is strictly greater, so
the earliest qualifying candidate wins an exact tie.

## Import Phase Timing

Optional validation-only event emitted after an activity is processed.

| Field | Type | Rules |
|---|---|---|
| `activityId` | string | Existing activity identifier |
| `sourceType` | `fit`/`gpx` | File type being processed |
| `recordCount` | non-negative integer | Parsed FIT count; zero for GPX |
| `parseMs` | non-negative number | Read, decompression, and parse duration |
| `gpsMs` | non-negative number | GPS extraction and simplification duration |
| `powerMs` | non-negative number | Bike power preparation and all-duration calculation |

Timing events contain no coordinates, power samples, names, or source-file contents.

## Relationships and lifecycle

1. One activity file produces zero or more raw FIT records.
2. Raw records are prepared once into ordered power records.
3. The same prepared collection is evaluated against all eight power durations.
4. Each duration produces zero or one personal best.
5. The import attaches the resulting effort list to the activity and discards transient
   candidate windows and preparation metadata.
6. Optional phase timing is reported and not persisted by the import module.
