# Research: Strava Media Gallery

## Decision 1: Reuse the Existing ZIP Import Boundary

**Decision**: Extend `src/zip-importer.js` so the existing Strava ZIP import reads the media manifest and returns media inventory/reconciliation data with its current activity, FIT, and GPS result. Keep TrainingPeaks import behavior unchanged.

**Rationale**: `importStravaZip()` already owns JSZip loading and the Strava archive; `dashboard-import.js` already applies a normalized imported dataset. Reading media at that boundary avoids selecting the ZIP again and keeps private bytes in the same local import session.

**Alternatives considered**: A second media-only ZIP selection was rejected because the user must select one ZIP once. A server-side media service was rejected by the privacy requirement and the static-browser constitution.

## Decision 2: Require Exact, Unique Reference Validation

**Decision**: Resolve an activity media reference only against a complete filename from the media manifest and a corresponding archive entry. Require one unique candidate. Track every reference and archive file outcome; do not use captions, timestamps, partial names, or inferred activity proximity as association keys.

**Rationale**: The provided export has 924 activities with media references, UUID-shaped references with image/video extensions, and a media manifest with filename and caption columns. The 1,458 manifest rows and 1,461 observed JPG/MP4 files do not imply complete correspondence. Exact comparisons make missing and ambiguous cases observable without fabricating links.

**Alternatives considered**: Caption/date heuristics and partial filename matching were rejected because they could silently attach personal media to the wrong activity. Treating every referenced UUID as valid without checking the manifest and ZIP entry was rejected because the two observed counts differ.

## Decision 3: Keep Media Session-Only and Load on Demand

**Decision**: Keep the active archive/inventory and any required object URLs in memory for the current page session. Extract/decode media only when requested, cache only what the current view needs, and release object URLs when the dataset is replaced or the page is left.

**Rationale**: This satisfies one-time import navigation without durable browser storage and avoids decoding all 1,461 original files for the initial gallery view. Existing application code does not use a media URL lifecycle or persistent media store.

**Alternatives considered**: Persisting blobs in IndexedDB/localStorage was rejected because the feature must not persist media without consent. Eagerly decoding all media was rejected for memory and responsiveness.

## Decision 4: Integrate with Existing Visualization Availability and Export

**Decision**: Register a `mediaGallery` availability flag derived from at least one readable supported item. Add the tab to the existing navigation registry and dispatch. Use the existing branded local preview/download flow for a rasterized gallery/collage capture, with a media-specific data/no-data gate.

**Rationale**: `src/visualization-availability.js`, `src/tab-navigation.js`, `src/dashboard-tabs.js`, and `src/dashboard-export.js` are the current owners of these concerns. The constitution requires all new visualization tabs to provide Share/Export.

**Alternatives considered**: An always-visible empty media tab was rejected by the spec. A separate upload/share service was rejected because media must remain local.

## Decision 5: Separate Visible Route Consent from Embedded GPS Metadata

**Decision**: Omit route/map content by default and include it only after an explicit user choice and preview. Always rasterize local output from displayed content and never pass through original photo bytes, which removes embedded source-photo location metadata from the exported image.

**Rationale**: The clarification requires embedded location data to be stripped even when a visible route is included. A newly rendered PNG is the existing export format and avoids copying source metadata into the output file.

**Alternatives considered**: Keeping original metadata whenever a visible route is selected was rejected by the accepted privacy clarification. Exporting original media files is outside this static-view export flow.

## Repository Findings

- `src/zip-importer.js` currently reads `activities.csv` and resolves FIT/GPX files from activity filename references; it does not process JPG/MP4 or a media manifest.
- `src/dashboard-import.js` builds/applies source-specific imported datasets and calls `refreshVisualizationTabs()` after replacement.
- `src/visualization-availability.js` computes tab availability from activities and auxiliary data.
- `src/tab-navigation.js` owns tab order, button/panel IDs, and available-tab behavior.
- `src/dashboard-tabs.js` dispatches to the active tab renderer.
- `src/dashboard-export.js` maps tabs to DOM capture targets and generates a local PNG preview/download; `src/export-utils.js` owns display titles and filename metadata.
- Existing focused suites are `__tests__/zip-importer.test.js`, `dashboard-import.test.js`, `visualization-availability.test.js`, `tab-navigation.test.js`, `dashboard-export-download.test.js`, `export-utils.test.js`, and `index-script-syntax.test.js`.
- The private reference ZIP must remain outside fixtures and version control. Use synthetic ZIP/CSV fixtures for automated tests and the local private archive only for manual end-to-end reconciliation.

## Open Implementation Validation

The implementation must report exact counts for manifest rows, discovered media entries, and activity reference outcomes against the local reference archive. No expected successful-link count is assumed until exact validation is run. The currently stated source counts alone are not an identity proof.