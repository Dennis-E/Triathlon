# Data Model: Recording Ownership and Heatmap Routes

No persistent schema or migration is introduced. These are existing in-memory shapes with clarified selection rules.

## Imported Activity and File Association

| Field | Meaning / Rule |
|-------|----------------|
| `activityId` | Existing nonempty activity identity; references imported activity and output maps. |
| `filename` | Archive entry used as the key of `parseGpsFileEntries`'s Map. |
| `ext` | Existing `fit` or `gpx` format identification; gzip is identified from the filename. |
| `sport` | Existing normalization to Run, Bike or Swim; unknown sports are not silently converted. |
| `startTime`, `endTime` | Optional summary-derived Dates. The current end derives from Moving Time or an existing next-start fallback; not authoritative standalone-recording limits. |

One filename maps to an array of associations. Exactly one association means singleton ownership; multiple associations mean shared ownership. Duplicate activity IDs in a shared set are ambiguous and must not cause whole-file assignment.

## Parsed FIT Record

| Field | Meaning / Rule |
|-------|----------------|
| `position_lat`, `position_long` | Existing finite-coordinate validation in GPS extraction; no new coordinate conversion or parser redesign. |
| `timestamp` | Optional for standalone GPS; a valid finite Date is required for shared ownership. Existing power processing may independently require timing. |
| Power/time/distance fields | Existing bike-power input; the same ownership-selected records feed GPS and power extraction. |

Keep original record order. A singleton record's missing timestamp does not discard otherwise valid coordinates. A record without usable coordinates contributes no GPS point even if it contains usable power data.

## Shared Ownership Window

- All associations must have distinct IDs, finite start/end Dates and `startTime < endTime`; otherwise every association in that file receives an empty record list.
- For valid windows, a record is a candidate when `startTime <= timestamp <= endTime`.
- Exactly one candidate assigns the record to that activity. Zero or multiple candidates omit it from all owners.
- Missing/invalid timestamps are omitted from shared outputs. No nearest-neighbor, first-owner, whole-file or unbounded-window fallback is allowed.
- Adjacent inclusive windows share their exact boundary point; that point is omitted as ambiguous. Disjoint, non-touching windows retain their matching records.

## Output Maps

- `gpsTracksByActivityId[activityId] = { sport, points: [[lat, lon], ...] }`: existing valid coordinates, simplification and 2,000-point cap. No new ownership metadata is exposed.
- `fitBestEffortsByActivityId[activityId] = { powerEfforts }`: existing Bike-only result when qualifying efforts exist.
- `buildRouteSegments` produces drawable routes only from sufficient distinct points. Zero or one location does not imply a visible route; existing import shapes may retain a single point.
- Existing imported dataset state, heatmap sport filter, map viewport behavior, and export capture target remain unchanged.

## Processing States

1. Load an archive entry; decompress/parse a FIT at most once.
2. Resolve its association count before any segmentation.
3. Singleton: select all records. Shared: apply validated unique-window ownership.
4. Extract GPS and Bike power from selected records; simplify coordinates using existing logic.
5. Publish existing maps; heatmap uses sport filtering and existing no-route state.
6. Strava file failure: omit that file and continue unrelated entries. TrainingPeaks failure: retain existing complete-import rejection.

TrainingPeaks continues to use its separate normalized FIT-session entities and `getSessionRecords`; the Strava ownership-window policy is not applied to that importer.