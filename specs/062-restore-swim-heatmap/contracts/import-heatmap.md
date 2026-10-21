# Contract: Import Ownership, Swim Heatmap and Export

## Reusable Import Interfaces

Preserve the signatures, CommonJS exports and browser globals of:

- `extractGpsAndPowerFromZip(zip, rawCsvText, activitySportById, reportProgress, fitDeps)`.
- `segmentFitRecordsByActivity(records, sessions)`.
- `importTrainingPeaksZips(zipFiles, reportProgress, fitDeps)`.

The combined importer still resolves to `{ gpsTracksByActivityId, fitBestEffortsByActivityId }`. Shared segmentation still returns an object keyed by activity ID with record arrays. No caller-visible schema, dependency injection contract, or progress/timing callback changes are planned.

### Strava FIT Ownership

| Input condition | Required outcome |
|-----------------|------------------|
| One association, summary time mismatch | All records remain available to existing GPS/power extraction. |
| One association, moving duration shorter than elapsed duration | No summary-based truncation. |
| One association, valid GPS without record timestamps | GPS survives; existing power timing validation remains in force. |
| Multiple associations, all valid bounded intervals | Only uniquely matching timestamped records are assigned. |
| Multiple associations, missing/invalid bounds or duplicate IDs | Empty selected records for every association in that file; no whole-file fallback. |
| Multiple valid intervals, record matches two windows | Record appears in neither output; other unambiguous records remain available. |
| No valid GPS / only one point | No invented drawable heatmap route. |
| Corrupt Strava file | Other valid files still import. |

Identical points and normal simplification may reduce coordinate counts. Regression assertions must compare expected simplified geometry or endpoint retention, not demand every raw point appear in the output.

GPX and gzip handling retain existing behavior. Tests must exercise compressed FIT dependency injection as well as uncompressed FIT, while a browser smoke check covers the actual decoder/decompressor path.

### TrainingPeaks Compatibility

Keep existing FIT-session segmentation, normalized Swim classification, archive combination and deduplication behavior. Preserve complete-import failure for corrupt archives/recordings. Do not substitute Strava summary windows for TrainingPeaks FIT-session windows.

## Heatmap UI Contract

- A recovered drawable swim route appears under All and Swim, not Bike or Run.
- Import-to-route tests use real `buildRouteSegments`, not only a mocked canvas/map layer.
- Selecting a sport with no drawable routes shows the existing empty state; a pool swim does not acquire fabricated GPS.
- Existing map viewport preservation, navigation, controls and identifiers remain unchanged.

## Share/Export Contract

- Use the already registered heatmap capture target and existing local preview/download flow.
- With Swim selected, capture the displayed swim map and retain the Swim export context.
- With no drawable route for the selected view, keep the existing no-data guard; do not export a hidden/stale map.
- Browser acceptance must inspect the preview and resulting PNG for the visible route. Capture-target or context assertions alone do not prove route pixels are present.

## Privacy and Error Boundaries

Use synthetic histories and existing injected parser dependencies for repeatable checks. No personal training export is committed or transmitted by this change. Existing CDN/map requests remain possible; local file processing is not a claim that the whole application is network-free.

No external API, persistence, analysis-counter behavior or extraction CLI contract changes.