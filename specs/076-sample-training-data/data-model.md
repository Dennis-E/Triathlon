# Data Model: Silicon Valley Sample Training Data

## Public payload

`sample-data/silicon-valley-training.json` is a UTF-8 JSON object with:

| Field | Type / meaning |
|---|---|
| `schemaVersion` | Integer `1`; reject unsupported versions. |
| `datasetId` | Stable versioned string such as `silicon-valley-triathlete-v1`. |
| `synthetic` | Boolean `true`, required. |
| `label` | `Synthetic sample training data`. |
| `athlete` | Fictional display name, region `Silicon Valley`, sport profile `triathlon`; no contact details or private addresses. |
| `years` | Ordered unique integers `[2021, 2022, 2023, 2024, 2025]`. |
| `generation` | Fixed seed and generator version; no generation-time timestamp that defeats reproducibility. |
| `routes` | Route-pattern dictionary keyed by stable pattern ID. |
| `activities` | Array of serialized sample activities. |
| `fitBestEffortsByActivityId` | Cycling effort dictionary keyed by activity ID. |

The curated `sample-data/routes.json` is the generator input. The public payload embeds the geometry/provenance needed at runtime so one required fetch yields a complete candidate. The README records full source/license notices and access-verification information.

## Sample activity

| Field | Serialized representation / validation |
|---|---|
| `id` | Unique string prefixed `sample-`; all associations must reference existing IDs. |
| `name` | Nonempty varied training title. |
| `sport`, `sportRaw` | Canonical `Run`, `Bike`, or `Swim`; sample raw label is consistent with that sport. |
| `calendarDate` | Valid `YYYY-MM-DD` in 2021-2025, checked by calendar round-trip. |
| `localStartTime` | Valid `HH:mm:ss` wall time; stable across visitor time zones. |
| `distance`, `duration` | Finite positive kilometers and seconds. |
| `distanceAvailable`, `durationAvailable` | `true` for bundled sample activities. |
| `avgHeartRate` | Positive bpm when supplied, otherwise `null`. |
| `avgCadence` | Run spm, Bike rpm, otherwise `null`; no cadence-doubling during hydration. |
| `avgWatts` | Positive watts for measured cycling sessions, otherwise `null`. |
| `elevationGain` | Nonnegative meters when meaningful, otherwise `null`. |
| `totalSteps` | Optional positive running step count, otherwise `null`. |
| `equipment` | Fictional equipment name or existing no-equipment convention. |
| `environment` | `outdoor`, `indoor`, or `pool`; pool only for Swim. |
| `routeId` | Matching pattern ID for tracked outdoor sessions; `null` otherwise. |

Hydration constructs real local `Date` objects for `date` at start of calendar day, `startTime` at the supplied wall time, and `monday` at the local start of that week's Monday. Use calendar arithmetic, not subtracting fixed 24-hour millisecond spans across daylight-saving boundaries. Personal import semantics are unchanged. Calendar/start-hour tests run under UTC, America/Los_Angeles, and Europe/Berlin, including year boundaries and daylight-saving transition dates.

## Route pattern and track association

Each pattern has `id`, `name`, `sport`, `points` in `[latitude, longitude]` order, `distanceKm`, `elevationGain`, and `provenance`. Provenance includes source URL, retrieval date, license identifier, attribution, and swimming-access evidence where applicable. No unknown or unreviewed license is accepted for publication.

Validate at least two distinct points, finite in-range coordinates, <= 2,000 points, successive segment distance <= 60 m, and permitted sport/environment. Coordinate order is not GeoJSON longitude/latitude. Loop closure must meet the same spacing rule. Outdoor activity distance must agree with its route's computed length within 5%; do not use repeated laps unless the route geometry explicitly represents them. Generation derives distance from geometry to avoid this tolerance becoming a source of drift.

Hydration creates `gpsTracksByActivityId[String(activity.id)] = { sport, points }`. Patterns may share immutable geometry in memory only while all consumers remain read-only; clone per track if a consumer mutates. No route is attached to indoor/pool activities. At least 12 distinct Run/Bike patterns and two Swim patterns are required; three Run/Bike patterns must each be used by at least 20 distinct activities.

## Power best efforts

`fitBestEffortsByActivityId[id] = { powerEfforts: [...] }` is valid only for a Bike activity. Each effort contains `targetSeconds`, `avgPower`, `startSec`, `endSec`, `startKm`, and `endKm`. Time values are elapsed seconds relative to activity start, not Unix timestamps. Positions are kilometers from activity start.

Validate `endSec - startSec === targetSeconds`, `0 <= startSec < endSec <= duration`, `0 <= startKm <= endKm <= distance`, and finite positive watts. Supported target durations are 5, 30, 60, 120, 300, 600, 1200, and 3600 seconds. Populate all durations across the dataset, with eligible cycling sessions in each year. Generated mean power and effort values come from the same deterministic underlying profile; retain only aggregate values and best intervals in the shipped payload.

## Runtime active dataset

Preserve the existing envelope: `kind: 'tri-activities-v1'`, `importedAt`, `sourceLabel`, `rawCsvData: []`, hydrated `activities`, `importExperienceStatistics`, `gpsTracksByActivityId`, and `fitBestEffortsByActivityId`. Build statistics with the existing accumulator in import orchestration after hydration. The sample has no media library.

Add `sourceType: 'sample'` and `sampleProvenance: { datasetId, synthetic: true, label }`. Existing datasets without this metadata remain personal; do not infer sample identity from free text. The adapter does not mutate active globals.

## Import operation lifecycle

An operation has a monotonically increasing generation, source kind, phase, and committed/counted flags. It is an orchestration record, not serialized training data.

```text
idle -> preparing -> validated -> committed -> rendered
                  -> failed
preparing / validated -> superseded
committed -> rendering-error (accepted dataset retained)
```

Only the current generation can commit or change its UI. Cancelled file dialogs do not create an operation. Duplicate active sample clicks are ignored. A failed newest request does not reactivate an older pending request. All uncommitted candidate resources are released on failure/supersession. The last committed dataset remains the fallback while preparation runs.

## View and export state

- Heatmap year is `null` for All years or an integer represented by the active dataset. Dataset replacement resets invalid years; render identity contains dataset revision, sport, and year.
- Export targets own a copied `sampleProvenance` or `null` and the selected year/sport context at capture start. Dataset replacement cannot mutate an existing export's identity or media lease.
- Sample identification is removed from new personal-data dashboard/export state, not from already captured sample export targets.

## Whole-dataset validation gates

At least 1,500 unique activities, 250 per year, all 60 months populated, three sports per year, real rest days each year, non-identical yearly totals, and varied monthly workloads. At least 600 tracked activities, 100 per year, and all three outdoor sports tracked every year. At least two shoes and two bicycles used over distinct periods. All required non-media analyses must have usable measurements. Reject dangling associations, illegal sports, invalid dates, future dates, missing required structures, discontinuities, incompatible schema, and inconsistent effort intervals before activation. The generator targets 1,600 activities and 700+ tracks to leave margin above acceptance minimums.

`validateSamplePayload` always checks the complete history, including these minimum counts; `hydrateSampleDataset` invokes that same validator with no bypass option. Positive hydration tests use a complete synthetic fixture. Small payloads are rejection cases, not valid production histories.

The following inclusive ranges apply only to synthetic activity averages, never to personal imports: heart rate 60-200 bpm, Run speed 5-22 km/h, Bike speed 8-50 km/h, Swim speed 1-6 km/h, Run cadence 110-220 steps/min, Bike cadence 40-120 rpm, and Bike mean power 50-350 W. Derived speed is `distance / duration * 3600` in km/h; an explicitly supplied `avgSpeed` must agree within 1%. Optional missing measurements remain `null`. Best efforts and average power must be generated from the same deterministic underlying profile.