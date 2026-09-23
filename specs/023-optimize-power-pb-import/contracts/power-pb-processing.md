# Contract: Power PB Processing

## Compatibility guarantees

The following existing APIs retain their names, arguments, and return shapes:

```text
calculateRollingPowerEfforts(records, targetSeconds, coverageThreshold = 0.8)
  -> [] | [PowerPersonalBest]

buildFitPowerEfforts(records)
  -> PowerPersonalBest[]

extractGpsAndPowerFromZip(zip, csvText, activitySportById, reportProgress?, fitDeps?)
  -> Promise<{ gpsTracksByActivityId, fitBestEffortsByActivityId }>
```

Existing CommonJS exports and browser globals remain available. Invalid arguments keep
returning empty results rather than throwing from the rolling-power utility.

## Batch calculation

A new pure helper may be added for the import path:

```text
calculatePowerEffortsForDurations(records, durations, coverageThreshold = 0.8)
  -> PowerPersonalBest[]
```

Contract rules:

- Input is normalized/prepared once per call.
- When called with already-normalized rolling records, preparation performs a stable
  time sort but does not collapse duplicate timestamps. Raw FIT deduplication remains
  the responsibility of the existing FIT normalization step before this helper.
- Output follows `durations` order and omits durations without a qualifying effort.
- Every returned object uses the existing `PowerPersonalBest` fields.
- Supplying the existing `POWER_DURATIONS` produces the same ordered output as invoking
  `calculateRollingPowerEfforts` once for each duration and taking its first result.
- No usable power produces `[]` without duration sweeps.

The exact helper name can follow local naming during implementation, but the existing
single-duration API must remain intact.

The automated linear-scaling contract applies to standard FIT records with positive
integer watt samples. Positive non-integer public-helper inputs retain exact existing
accumulation and tie behavior even when that requires the compatibility path.

## Window semantics

For a start record at time `s` and duration `d`, the candidate includes every prepared
record whose time is within the inclusive interval `[s, s + d]`. The end metadata comes
from the final included record.

Coverage is:

$$
\min\left(1, \frac{endSec-startSec}{targetSeconds}\right)
\times
\frac{validPowerCount}{windowRecordCount}
$$

The candidate qualifies when coverage is greater than or equal to the threshold and at
least one valid power value exists. Average power uses valid values only. A new best is
selected with strict `>` comparison; equal values preserve the earlier candidate.

## Optional instrumentation

The existing optional `fitDeps` object may accept:

```text
now: () -> monotonic milliseconds
onTiming: (ImportPhaseTiming) -> void
```

Both are optional. When absent, import results and progress behavior are unchanged.
When supplied, `onTiming` receives at most one timing event per processed activity.
Callback failure must not corrupt calculated import results; tests define whether it is
ignored or isolated consistently with other optional reporting callbacks.

Timing phases are non-overlapping for a FIT activity:

1. `parseMs`: ZIP read, optional gunzip, parser loading, FIT parse.
2. `gpsMs`: coordinate extraction and track simplification.
3. `powerMs`: bike-only power normalization and all-duration effort calculation.

No raw record values or coordinates are emitted.

## Progress and failure behavior

- Existing progress payloads remain `{ percent, stage }` and percentages never decrease.
- Timing data is not added to progress payloads.
- Missing, corrupt, or unreadable activity files are skipped without aborting subsequent
  activities.
- GPS output for FIT/GPX files and all non-bike behavior remain unchanged.
