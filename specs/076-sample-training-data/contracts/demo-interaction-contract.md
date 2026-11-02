# Demo Interaction and Export Contract

## Landing entry

- Add one real `type="button"` labelled exactly "Use exemplary data" beside existing import choices. Use existing visual conventions and an appropriate Lucide icon; retain desktop/mobile and keyboard access.
- `handleSampleDataIngest` starts one sample operation, shows busy feedback with accessible status, fetches the complete resource, hydrates/stages it, and activates through the shared dataset path with dashboard opening enabled.
- Repeated clicks during the same active sample operation do nothing. Existing personal import entry points remain available; a newer selection supersedes pending work.
- Failure restores enabled controls and offers retry and personal import. Do not hide or destroy the previous committed dataset. A stale operation cannot update errors, progress, timers, status, or active data.

## Shared activation rules

1. Begin an import generation on sample activation or confirmed nonempty Strava/TrainingPeaks/CSV input. Nested helpers reuse the outer operation; standalone CSV calls create their own.
2. Parse, validate, hydrate, calculate statistics, and prepare required indices without changing active dataset references or releasing its media.
3. Immediately before commit, check generation identity. If stale, discard the candidate, release only its owned resources, and do not count it.
4. Install the entire candidate synchronously, reset stale selection/cache/render state, and refresh normal controls and available tabs. Clear prior gallery and PB-detail state. Release previous dataset ownership only after acceptance; maintain independent media export leases.
5. Render and open the ordinary dashboard. Count a committed personal import exactly once through the existing analysis-counter path; a sample never calls `recordCompletedAnalysis`. Do not suppress the application's ordinary initial counter read.

Validation/transport failures preserve the previous dataset. Exceptions after commit are reported as rendering failures without pretending the previous dataset is still active; no full DOM rollback mechanism is required. Tests must cover exceptions before activation and distinguish post-commit failures.

## Race matrix

| Earlier operation | Later operation | Required result |
|---|---|---|
| Sample pending | Personal succeeds | Personal remains active even if sample finishes afterward; only personal counted. |
| Personal pending | Sample succeeds | Sample remains active; superseded personal result not counted and candidate media released. |
| Any pending | Newer request fails | Last previously committed dataset remains; earlier pending result stays superseded. |
| Duplicate sample click | Same sample pending | One fetch/operation, no duplicates or counter increment. |
| Old progress/error/timer | Newer request active | No mutation of newer UI or dataset. |

Exercise both completion orders for Strava, TrainingPeaks, and standalone CSV, plus invalid and cancelled selections.

## Heatmap year behavior

Provide All years and represented years from the active dataset on the existing heatmap, for samples and personal imports. Combine year and sport before building segments and hover data. Include selection in asynchronous render identity and export context. A filter selection must not show stale segments, hover counts, or data from another year; absent combinations show the existing empty state.

Retain map zoom/view behavior on filter changes. On dataset replacement, invalidate stale renders and reset an unavailable year to All years. Preserve existing tab names, IDs, order, dispatch, and Share/Export action; test contract consistency without renaming unchanged IDs.

## Provenance in dashboard and exports

Active sample state has a visible "Synthetic sample training data" context. Personal replacement clears it. Add copied sample provenance explicitly to `createExportTarget` and the PB-detail target construction; export target cloning must retain it.

The common image composition reserves a readable synthetic-data line for sample exports, independent of optional context truncation, pace/PB special layouts, selected export aspect ratio, humor mode, or later recomposition. Include it in every generated sample image. Keep the existing local preview/download flow, naming, and format controls.

An export in progress during dataset replacement retains its captured identity and independent media resources. A sample export remains labelled synthetic after a personal import; a personal export must not acquire a sample label when the active dataset later becomes sample. Target provenance is immutable snapshot state, never read lazily from current globals.

## Script and dependency contract

Load the new pure utility before `dashboard-import.js` via a classic script tag; update the existing script-load-order documentation. Do not introduce a bundler or new global redeclarations. The API service, its dependencies, and server-side validation/rate limits remain untouched.