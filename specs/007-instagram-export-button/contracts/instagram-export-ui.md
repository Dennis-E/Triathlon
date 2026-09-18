# UI Contract: Instagram-Ready Visualization Export

## Scope

This contract covers the browser-visible export button, preview modal, and download
behavior added to each of the six visualization tabs. It introduces no network or
persistence API; the only client-visible surfaces are the export button, the preview modal,
and the resulting downloaded file.

## Export Button

- Every visualization tab panel (Total Distance, Heart Rate & Pace, Equipment, Equipment
  Timeline, Personal Bests, Heatmap) shows exactly one export button, in a consistent
  location and style relative to that tab's existing header area.
- Clicking the button on a tab with exportable content starts capture for that tab only.
- Clicking the button on a tab with no data to export shows a clear inline message (e.g., a
  toast or inline note) stating there is nothing to export; no modal opens and no image is
  generated.
- While a capture is in progress (for any tab), additional clicks on any export button are
  ignored until the current request resolves (success, failure, or the resulting modal is
  closed).

## Preview Modal

- Appears in-page (overlay), without navigating away from the dashboard or opening a new
  browser window/tab.
- Contains:
  - The composed 1:1 square image (chart/graphic + generated title) as an `<img>`.
  - A **Download** action.
  - A **Close** action (also dismissible via an overlay click or an equivalent standard
    close affordance).
- Closing the modal (via Close or overlay dismissal) discards the in-memory image; no file is
  saved or sent as a result of closing.
- Remains usable and legible at small/mobile viewport widths (image, Download, and Close all
  remain reachable and tappable).

## Download

- Selecting **Download** saves a PNG file to the user's device using the browser's standard
  download mechanism (no server round-trip).
- Filename pattern: `trianalytica-<tab-slug>-<yyyyMMdd-HHmmss>.png`.

## Error / Empty States

- No-data state: inline message only, no modal (see Export Button above).
- Capture failure (rendering not settled / unexpected error): the modal either does not open,
  or opens with a clear error message instead of a broken/blank image; the user can retry by
  clicking the export button again.

## Out of Scope

- No "mail to" / email sharing action is present in this iteration (see spec Clarifications).
- No aspect ratio other than 1:1 square is offered.
- The Heatmap tab's exported image may show a blank/untextured base map background behind the
  route overlay, due to OpenStreetMap tile CORS restrictions (see `research.md`); this is a
  known, accepted limitation, not a defect.
