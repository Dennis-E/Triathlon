# Data Model: Strava Media Gallery

All entities below are scoped to the active import session. They are not serialized to browser storage or sent to a server.

## Existing Activity

The existing normalized activity remains authoritative for training data.

| Field | Meaning |
|-------|---------|
| `id` | Activity identity used by existing dashboard data |
| `date` | Activity date used for sport/year filters and activity context |
| `sport` | Existing normalized sport, when supported |
| `route` | Existing route data when available; not included in exports by default |

## Media Asset

Represents one discovered media file or one manifest record awaiting file validation.

| Field | Meaning |
|-------|---------|
| `key` | Stable, session-scoped key based on the archive entry path |
| `filename` | Complete filename recorded in the media manifest |
| `mediaType` | `photo`, `video`, or `unsupported` |
| `contentType` | Validated type inferred from supported file content/extension |
| `byteLength` | Compressed or decoded size metadata when available; not exposed as personal content |
| `caption` | Optional manifest caption |
| `capturedAt` | Reliable media capture date when available; otherwise null |
| `dateSource` | `media` or `activity-derived`; preserves provenance of the displayed date |
| `activityIds` | Zero or more uniquely validated activity IDs; ambiguous candidates are not included |
| `status` | `readable`, `unreferenced`, `missing`, `corrupt`, `unsupported`, or `ambiguous` |
| `readContent` | Session-only lazy reader for the archive entry; never persisted |

An asset with no reliable capture date may use its uniquely linked activity date for display and year filtering, marked `activity-derived`. An unlinked asset with no capture date remains undated and discoverable.

## Media Reference

Represents one media token declared by an activity and its validation result.

| Field | Meaning |
|-------|---------|
| `activityId` | Existing normalized activity identifier |
| `sourceToken` | Reference value from the activity export, retained only in memory for reconciliation |
| `candidateKeys` | Exact filename/archive-entry candidates found during validation |
| `status` | `matched`, `missing`, or `ambiguous` |
| `resolvedAssetKey` | Set only when exactly one supported, readable candidate is proven |
| `reason` | Safe user-facing status detail; never includes media bytes or captions in logs |

The matching relation is exact after only representation normalization (trim surrounding whitespace and normalize path separators). Filename case, partial names, caption text, and date proximity are not matching evidence. Duplicate manifest names or multiple candidates are ambiguous.

## Media Library

The session-scoped collection attached only to a Strava imported dataset.

| Field | Meaning |
|-------|---------|
| `assets` | Media assets and their state |
| `references` | All activity media references and their state |
| `counts` | Reconciled totals for listed, discovered, readable, unsupported, missing, unreferenced, and ambiguous items |
| `hasReadableMedia` | True only when at least one supported readable item can be displayed |
| `release` | Idempotent cleanup action for generated object URLs and retained media resources |

The media tab is available only when `hasReadableMedia` is true. Replacing the imported dataset releases the prior library before its state is discarded. TrainingPeaks datasets have no media library.

## Gallery Selection and Export

| Field | Meaning |
|-------|---------|
| `year` | Selected year, all years, or undated |
| `sport` | Selected supported sport or all sports |
| `activityId` | Selected activity, all activities, or unassigned |
| `assetKeys` | Ordered selected assets for a recap/collage |
| `includeVisibleRoute` | Explicit per-export choice; false by default |
| `output` | Locally rasterized static image sent to the existing preview/download flow |

Video assets may contribute a still preview to static exports. They are not automatically played. Original media bytes and embedded metadata are never used as exported output bytes.