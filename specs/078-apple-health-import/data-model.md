# Data Model: Apple Health Import

## 1. Normalized Activity

The existing activity object remains the dashboard contract. Date values are hydrated to actual Date instances before commit. No raw HealthData records or clinical attachments enter the activity array.

This version-controlled model and the [import contract](contracts/apple-health-import.md) define normative mappings/readiness under [spec.md](spec.md). The ignored private inventory is observational sample evidence only and cannot introduce or override rules; implementation and synthetic tests must not require access to it.

| Field | Type / units | Apple mapping and validation |
| --- | --- | --- |
| id | string | `ah-` plus deterministic SHA-256 identity digest; see identity rules below |
| sportRaw | string | Original workoutActivityType |
| sport | Run / Bike / Swim | Explicit Running / Cycling / Swimming only; all other enums skipped |
| startTime | Date | True instant from strictly parsed startDate with explicit offset |
| date | Date | Browser-local midnight calendar carrier for the recorded source-local day |
| monday | Date | Monday calendar carrier for date; never shift the source date via UTC conversion |
| distance | finite number, km | Compatible distance summary sum first, otherwise legacy totalDistance plus totalDistanceUnit; km, m, mi supported explicitly |
| distanceAvailable | boolean | True only for a valid finite nonnegative source distance; missing distance uses legacy numeric sentinel 0 with false |
| duration | finite number, seconds | Recorded duration plus durationUnit: s/sec, min, h/hr; never replace with elapsed time or subtract pauses twice |
| durationAvailable | boolean | True only for a valid finite nonnegative active duration; missing uses 0 with false |
| avgHeartRate | number / null, beats/min | Positive compatible summary average or an unambiguous derived estimate |
| avgWatts | number / null, W | Bike-only positive compatible power average; no calories-to-watts conversion |
| avgCadence | number / null, counts/min | Compatible sport-specific cadence; derived Run cadence uses steps/min, not strides/min |
| totalSteps | positive number / null | Run-only complete attributable step total; swim strokes excluded |
| elevationGain | finite nonnegative number / null, m | HKElevationAscended with m, cm or ft conversion; no raw-altitude substitution |
| equipment | string | Empty unless an explicitly supported genuine gear field exists; no source/device substitution |
| name | string | Empty or generic Activity fallback without source title; no generated sport/device labels |
| sourceLocalStart | optional object | Apple-only year, month (1-12), day, hour (0-23), minute, second, offsetMinutes |

The new optional sourceLocalStart is additive. `getGroupIndex(startTime, granularity, sourceLocalStart)` uses the validated source components when present and retains its two-argument behavior otherwise. Source-local components must be calendar-valid and their offset-derived instant must match `startTime` within one second; invalid or inconsistent optional components fall back to the existing `startTime` calendar grouping without changing the absolute instant. Dataset sorting uses date and deterministic tie-breaks; sample association and identity use true instants. Unknown units are unavailable with diagnostics; malformed core start/end timestamps or end before start invalidate that workout. An unparseable optional quantity does not discard a valid workout.

For supported future exports, direct metric summaries are allowlisted by exact identifier and statistic kind: HeartRate average in count/min; CyclingPower average in W; CyclingCadence average in count/min; StepCount sum in count for Run. Direct running cadence must have an explicit compatible source unit/semantics before use. Unknown metadata cannot silently become a title or gear field. This sample's absence of such summaries is not filled by fabricated placeholders.

## 2. Identity And Duplicate Groups

Identity evidence is transient and includes sourceName, device when supplied, original sport, exact start/end instants, recorded duration/units, summaries, stable sync/external identifiers, events and normalized route references. Creation timestamps and export timestamps are not identity.

- Explicit external/sync IDs are scoped to their source. Canonically equal copies count once.
- Conflicting payloads under an explicit ID remain separate conflict-qualified IDs with a counted diagnostic; retain all distinct complete fingerprints.
- With no trusted source-scoped ID, complete fingerprint evidence requires a nonempty trimmed sourceName, original sportRaw, valid exact start/end instants with end >= start, and a finite nonnegative recorded duration with a supported explicit durationUnit. All required fields must be present and valid before equal canonical fingerprints can identify duplicates. Missing/invalid mandatory identity fields disable fingerprint suppression; stable per-content ordinal IDs preserve incomplete candidates instead of silently dropping them. Invalid core timestamps still invalidate the workout under section 1 rather than creating an activity solely to preserve a duplicate group.
- Device details, optional summaries, events and normalized route references all participate in canonical comparison, including explicit typed missing/invalid markers. Their absence alone does not make required identity evidence incomplete. Do not equate missing, invalid and measured zero, or discard differing optional content before identity comparison. An identifier without a nonempty source scope is not a trusted source-scoped ID.
- Candidate ordering and canonicalization are deterministic. Reimport of identical archive bytes produces identical identities, counts, and totals. Shared GPX is not proof of duplicate activity.
- Use a tested structured canonical serializer and Web Crypto SHA-256, with injected hashing in unit tests; do not rely on object-key insertion order or a short collision-prone hash.

## 3. Candidate Workout And Associated Measurement

The first pass retains only bounded supported candidate workouts: absolute interval, optional device/source provenance, direct summaries, pause/resume boundaries, normalized route references and identity evidence. Unsupported workout counts are aggregate. Index finalized workout intervals by sport/source/device for the second pass; samples need not be sorted in the export.

| Associated measurement field | Meaning |
| --- | --- |
| metric | Allowlisted heartRate / steps / cadence / cyclingPower |
| startMs, endMs | Parsed absolute interval; equal values denote a point sample |
| sourceKey, deviceKey | Exact source and compatible device identity; internal only |
| value, unit | Strict finite numeric value in a known unit |
| sampleIdentity | Explicit sample sync identity or complete canonical record fingerprint |
| attribution | unique candidate / ambiguous / excluded |

Workouts with direct summaries do not need corresponding scalar-average reducers, but may still need timed power samples for personal bests. Maintain independent needsScalarEnrichment and needsTimedPowerSeries decisions. The first pass records whether compatible power-record types exist without retaining the samples. A Bike candidate plus observed compatible power records requires second-pass attribution for timed-power eligibility even when avgWatts and all other scalar summaries already exist. Scalar summary precedence never suppresses that series collection. Fully contained samples from one compatible device stream may be reduced according to [research.md](research.md). Boundary-spanning samples, conflicting duplicates, unexplained pauses, competing streams or multiple candidate workouts make the affected derived metric unavailable; they never produce prorated or double-counted values. Point samples use half-open active windows `[start, end)`. Intervals must fit entirely inside one active window; non-overlapping interval coverage is checked before totals are accepted. Absence of data is not a measured zero.

A power-only derived avgWatts is emitted only when positive point samples cover every active window, begin/end within 5 seconds of each window boundary, and adjacent samples are at most 5 seconds apart; source summary avgWatts remains valid independently. Power best-effort evaluation uses positive, exact-source, unique-device, unambiguous point samples with no gap over 5 seconds, then applies the existing per-duration coverage threshold. A short dense subset may establish only its qualifying shorter efforts, never a full-workout average. Apple Health does not provide power-sample distance in this contract: internal distance placeholders MUST NOT escape into `fitBestEffortsByActivityId`; resulting `startKm` and `endKm` are null. A gap over 5 seconds disables timed efforts rather than being interpolated.

Required regression cases: average power plus a qualifying complete series retains the source avgWatts and produces valid power efforts; average-only input produces no efforts; complete series without a summary may supply both a valid derived average and efforts; ambiguous or gapped series does not invent efforts.

Attribution and reducers are bounded by contract limits. Retain only candidate-related samples necessary for duplicate/overlap/coverage validation. Count unrelated records without keeping their values. Raw beat/ECG/sleep/body data is discarded, not returned in a hidden side channel.

## 4. Route Track

Main-thread auxiliary contract:

```text
gpsTracksByActivityId[activityId] = {
  sport: Run | Bike | Swim,
  points: [[latitude, longitude], ...],
  segments: [ [[latitude, longitude], ...], ... ]  (optional)
}
```

`points` preserves existing callers and bounds calculations; segments is authoritative for connected geometry when present. Flattened points must never be treated as connected across segment boundaries. Legacy points-only tracks are unchanged. Coordinates must be finite and within latitude [-90,90] and longitude [-180,180]; invalid points break a subpath instead of joining valid points across missing geometry. A renderable subpath needs at least two valid distinct points.

Resolve only explicit FileReference paths under the chosen export root. Normalize slash direction and the export-relative leading separator; reject parent traversal, URL schemes, drive prefixes, NUL, collisions and references outside the root. Preserve separate GPX trkseg boundaries and separate referenced files. Parse bounded GPX strings with the existing regex strategy; no DOMParser. Repeated references within the same activity contribute once. Different workouts sharing a route remain distinct activity visits.

`buildRouteSegments` processes each subpath independently, then unions corridor matches per activity. Segment visit frequency is the number of unique activities, not the number of GPX segments or duplicate references. Shared-array optimizations must key the connected geometry, not only flattened points. Add a disconnected-route case to availability, heatmap geometry, frequency, and swim tests.

## 5. Import Result And Diagnostics

Importer result contains normalized activities, gpsTracksByActivityId, fitBestEffortsByActivityId, and diagnostics. mediaLibrary is absent unless the importer has actually constructed a supported readable library; initial scope constructs none. fitBestEffortsByActivityId stays empty without valid complete cycling power series; compatible series use existing `{ powerEfforts: [...] }` semantics.

Diagnostics contain only bounded counters: importedCount, duplicateCount, unsupportedBySport, invalidWorkoutCount, identityConflictCount, unavailableByMetricAndReason, skippedRouteCount, ignoredRecordTypes, and resource/capability error codes. Source enum names may be reported; arbitrary source names, filenames of health attachments, raw XML text, identifiers, dates, readings and coordinates must not enter status strings or console logs. Cap unknown-category labels and aggregate overflow as otherUnknown.

Dataset adapter returns `kind: tri-activities-v1`, sourceLabel `Apple Health ZIP import`, importedAt, importedFileCount 1, importedSourceFiles containing only the locally selected file name, rawCsvData [], activities, importExperienceStatistics, both auxiliary maps, and aggregate diagnostics. The selected filename remains local and is not sent to analytics.

## 6. State Transitions And Ownership

```text
idle -> selected -> loadingDependencies -> readingWorkouts -> normalizing
     -> enrichingMeasurements -> readingRoutes -> prepared -> committed
any pre-commit state -> failed | cancelled | superseded
committed -> rendered | renderWarning
```

The second pass is skipped only when both needsScalarEnrichment and needsTimedPowerSeries are false for every candidate. A terminal failed/cancelled/superseded operation cannot later commit. A newer import generation owns all progress and final messages. Workers and ZIP readers are closed in finally blocks; transferred coordinate buffers have one owner. Prepared no-supported-workouts is a pre-commit error.

Commit uses the existing applyImportedDataset boundary after preparation. Invalidate old previews/captures, switch all dataset references, set the operation committed, clear previous auxiliary stores and media, reset real filter state and date bounds, and refresh availability/navigation. A post-commit rendering error yields a recoverable render warning, not false rollback. Counter recording remains exactly once per committed personal operation. Old export capture results cannot publish into a newer dataset revision.