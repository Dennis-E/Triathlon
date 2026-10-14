# Data Model: Export Download Location

This feature introduces no imported, server-side, or persisted application data. It models
the state of one user-initiated local save attempt.

## Export Image

- **Fields**: existing PNG data URL/bytes, target metadata, suggested filename, MIME type
  (`image/png`).
- **Owner**: current export preview state (`lastExportedImage`).
- **Lifecycle**: produced once by the existing export capture/composition flow; available for
  repeated save attempts while the preview remains open; cleared when the preview closes.
- **Invariant**: the selected file contains the exact PNG shown in the preview; no recapture
  or upload is part of download.

## Download Request

- **Fields**: export image, suggested filename, outcome.
- **Outcomes**: `awaiting-destination`, `saved`, `cancelled`, `fallback-downloaded`, or
  `failed` (conceptual outcomes; implementation need not persist an enum).
- **Lifecycle**: each Download click starts a new request; one request ends in a single outcome.
- **Retry**: cancellation/failure leaves the preview available; another click creates a fresh
  request and destination selection.

## Destination Choice

- **Fields**: user-confirmed destination handle and optionally edited filename, held only for
  the duration of the active save operation.
- **Validation**: the browser mediates destination access and permission. The final image
  remains PNG regardless of a user-edited filename.
- **Persistence**: none; the application must not cache directory paths or silently reuse a
  previous destination.

## State transitions

1. Preview available → Download clicked → destination chooser requested when supported.
2. Chooser confirmed → write the preview PNG → `saved` or `failed`.
3. Chooser cancelled by user → `cancelled`; keep preview available, show no error, do not
   start fallback download.
4. Chooser unavailable/disallowed → notify user and perform the established browser download
   fallback; keep preview available.
5. Preview closed → clear current export image and any transient save-attempt state.