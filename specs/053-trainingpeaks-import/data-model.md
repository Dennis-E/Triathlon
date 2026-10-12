# Data Model: TrainingPeaks Data Import

**Feature**: [TrainingPeaks Data Import](spec.md)

## Import Source

Represents which provider-specific archive rules and UI instructions apply during a single import.

| Field | Type | Rules |
|---|---|---|
| source | `Strava` or `TrainingPeaks` | Required; exactly one source per import operation. |
| sourceLabel | string | User-facing label saved with the active imported dataset. |
| importedFileCount | non-negative integer | Number of selected archives contributing to the import; retained in memory for the visible import summary. |
| importedSourceFiles | string array | Names of selected archives for the active in-memory session only; not persisted or sent over the network. |

## Export Archive

A ZIP selected for a TrainingPeaks import.

| Field | Type | Rules |
|---|---|---|
| fileName | string | Required for progress and actionable per-file errors; do not persist after the in-memory import session. |
| entries | collection of FIT workout and optional GPX route entries | Archive must contain at least one supported FIT workout; supplied files use `.FIT.gz` plus optional `.GPX.gz` companions. |
| validationState | enum | `pending`, `valid`, `failed`; import is applied only when all selected archives validate and process successfully. |
| failingEntry | string or unavailable | On a corrupt/unreadable FIT/GZIP entry, retain only for the in-memory error report so the message can identify the archive and entry; do not persist it. |
| skippedUnsupportedSportCount | non-negative integer | Count successfully parsed sessions whose sport is unsupported; skip without misclassification and show the count after a successful import. |

An import operation owns an ordered selection of archives, but activity order is chronological, not dependent on selection order.

## FIT Workout Session

A sport-specific session decoded from a FIT file. A single FIT file may yield more than one session.

| Field | Type | Rules |
|---|---|---|
| sourceFileKey | string | Stable archive entry identity, scoped to the import source. |
| sessionIndex | integer | Zero-based position within the decoded FIT session collection. |
| startTime | date/time or unavailable | Required to create a dated dashboard activity; derive from FIT session time, with filename timestamp only as a documented fallback if validated. |
| sportRaw | string or unavailable | Preserve provider value for diagnosis; do not infer an unsupported sport. |
| sport | `Run`, `Bike`, `Swim`, or null | Normalize only known values; unknown sport is not silently mapped. |
| duration | non-negative seconds or unavailable | Prefer session timer/moving time when reliable; retain unknown as unavailable. |
| distance | non-negative kilometers or unavailable | Convert parser-provided meters to kilometers exactly once. |
| avgHeartRate | number or unavailable | Preserve only when parser/session/record data supports a valid average. |
| avgWatts | number or unavailable | Used for bike metrics only when supplied by FIT data. |
| avgCadence | number or unavailable | Preserve only when meaningful for the normalized sport. |
| elevationGain | number or unavailable | Preserve only when supplied and valid. |
| routePoints | optional list of latitude/longitude pairs | Prefer records within the FIT session interval; otherwise use a timestamped GPX route only if its track time range uniquely identifies this session. Simplify using the current route utility; ambiguous tracks remain unattached. |
| powerEfforts | optional list of duration/power values | Derived from the session's records for supported bike sessions. |
| deduplicationKey | string | Prefer source filename plus session index; fallback fingerprint combines normalized start, sport, duration, and distance to identify renamed duplicate sessions. |

## Normalized Activity Dataset

The shared dashboard-facing result, independent of provider format.

| Field | Type | Rules |
|---|---|---|
| kind | string | MUST remain the existing dataset discriminator `tri-activities-v1`; this feature adds no incompatible dataset version or persisted schema. |
| importedAt | ISO timestamp | Set once when dataset is prepared. |
| sourceLabel | string | Identifies TrainingPeaks import; no file names or personal data persisted beyond normal in-memory dataset usage. |
| activities | normalized activity array | Chronologically sorted; one element per sport-specific session; includes existing fields such as `id`, `date`, `startTime`, `monday`, `sportRaw`, `sport`, `distance`, `distanceAvailable`, `duration`, `durationAvailable`, `avgHeartRate`, `avgWatts`, `avgCadence`, `elevationGain`, and `name`. Preserve established shape: unavailable numeric `distance`/`duration` use the existing numeric placeholder `0` with their corresponding `distanceAvailable`/`durationAvailable` set to `false`; optional metrics use `null`. Consumers for this source MUST honor availability flags and MUST NOT include unavailable placeholders in totals, averages, or charts as real zero measurements. |
| gpsTracksByActivityId | object keyed by normalized activity ID | Optional routes remain aligned to the sport-specific activity/session. |
| fitBestEffortsByActivityId | object keyed by normalized activity ID | Optional power results remain aligned to their bike activity/session. |
| importExperienceStatistics | existing import statistics structure | Calculated from normalized activities using existing accumulation rules, excluding unavailable metric placeholders. |

## Persistence and network boundary

- The normalized dataset, FIT-derived sessions, route points, and power efforts are in-memory only for the active browser session; they MUST NOT be written to `localStorage`, IndexedDB, cookies, or a server-side workout database.
- The existing Firestore-backed analysis counter remains separate from the activity dataset. It stores the aggregate count in `metrics/analyses` and count-event metadata (`createdAt`) in `analysisEvents`; it MUST NOT receive or store workout/activity fields.
- A successful import may trigger the existing counter request once, but that request contains only the established event identifier/key headers and no activity payload/body.

## Validation and state transitions

1. Selected archive: `pending` → `valid` after ZIP and all contained FIT/GZIP entries are read and parsed; any invalid archive or corrupt/unreadable FIT/GZIP entry makes the full selected import `failed` and names the archive and entry. No active dataset is replaced.
2. Import operation: `validating` → `processing` → `ready`; any archive/entry parse failure transitions to `failed` and does not replace the currently active dataset.
3. A decoded FIT session lacking a valid start time is excluded with a reported count; a successfully parsed unsupported sport is skipped and included in the visible skipped-activity count. Neither may be silently misclassified as Run/Bike/Swim.
4. Optional metrics remain unavailable and are omitted from metric-specific aggregates; they are not coerced to zero.
