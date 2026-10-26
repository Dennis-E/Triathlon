# UI Contract: Strava Media Gallery

This is a local browser interaction contract. The feature introduces no server endpoint or third-party media interface.

## Availability

- Show the media tab only after a Strava import contains at least one readable supported media item.
- Do not show the tab for TrainingPeaks imports or imports with no readable supported media.
- Keep the imported media accessible while the user changes dashboard tabs in the same page session.
- On import replacement, release the old media resources before using the new dataset.

## Gallery

- Present readable items chronologically, with year, sport, activity, and unassigned filters where the corresponding data is known.
- Do not fabricate a date, sport, or activity association. Show undated/unassigned items in a discoverable state.
- Make filters, item selection, preview dismissal, and playback operable by keyboard, with visible focus and meaningful accessible names.
- Distinguish loading, loaded, empty, and failed preview states; keep failure details understandable without exposing personal filenames or captions in diagnostics.
- Selecting an item opens a larger local preview. A uniquely associated activity can be opened from that preview; a route is reachable only when one exists.
- Video playback requires an explicit user action. Static views use a still preview rather than autoplay.
- Missing, corrupt, unsupported, or ambiguous items have a comprehensible status; these statuses do not block valid training views.

## Recap, Collage, and Export

- Build the annual recap and collage from the current filter or explicit selection and provide a preview before local download.
- The tab has a working Share/Export action using the existing local image-preview/download experience and a clear no-data state.
- Do not include a map, route, or exact location by default. A visible route may be included only after an explicit user choice and must be apparent in the preview.
- Always rasterize the final image locally. Never pass through original photo bytes or their embedded location metadata, even when a visible route is included.
- Do not upload or persist the export or its source media.