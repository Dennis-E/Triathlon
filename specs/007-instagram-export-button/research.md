# Phase 0 Research: Instagram-Ready Visualization Export

All items below resolve the open technical questions from Technical Context. No
`NEEDS CLARIFICATION` markers remain.

## 1. DOM-to-image capture approach

- **Decision**: Use `html2canvas` (loaded via CDN `<script>`, same pattern as Chart.js and
  Leaflet) to rasterize the visualization container for every tab, rather than mixing
  per-technology export paths.
- **Rationale**: The six tabs render three different ways — Chart.js `<canvas>` (Total
  Distance, Heart Rate & Pace, Equipment, Equipment Timeline), inline SVG line charts
  (Personal Bests), and a Leaflet map combining raster tile `<img>`s with a custom canvas
  overlay (Heatmap). A single DOM rasterizer gives one code path, one place to compose the
  square crop/title, and one thing to test/maintain, instead of three bespoke exporters.
- **Alternatives considered**:
  - *Per-tab native export* (Chart.js's own `canvas.toDataURL()` for chart tabs, manual
    SVG-to-canvas for Personal Bests, a Leaflet image plugin for Heatmap): rejected — three
    independent code paths with inconsistent output sizing/quality, harder to keep the title
    /crop composition consistent, and harder to test uniformly.
  - *`dom-to-image` / `dom-to-image-more`*: a viable CDN-loadable alternative with similar
    capabilities; rejected only because `html2canvas` is more widely used/maintained and has
    the same CDN-friendly, no-bundler footprint required by Principle I.

## 2. Heatmap tab tile CORS limitation

- **Decision**: Accept that the Heatmap tab's exported image will show the app's own
  canvas-drawn route overlay correctly, but the OpenStreetMap raster tile background may
  render blank/untextured in the exported image, because `tile.openstreetmap.org` does not
  send `Access-Control-Allow-Origin`, which taints the canvas region containing those tiles
  for any DOM rasterizer (including `html2canvas`). Document this as a known, accepted
  limitation rather than solving it in this iteration.
- **Rationale**: Fixing this would require either switching tile providers (risking the
  stable heatmap behavior delivered across `specs/001`–`006`) or adding a same-origin tile
  proxy (a new backend dependency), both of which conflict with this feature's "no server
  involvement" constraint (FR-008) and its otherwise small, additive scope.
- **Alternatives considered**:
  - *Switch to a CORS-enabled tile provider*: rejected — out of scope, touches an unrelated,
    already-stabilized feature area.
  - *Add a same-origin tile proxy*: rejected — introduces a server dependency and network
    upload path this feature explicitly avoids (FR-008).

## 3. Square (1:1) framing strategy

- **Decision**: Use a "contain" (fit-and-letterbox) strategy — scale the captured
  chart/graphic to fit fully inside a square canvas, padding any remaining space with the
  app's existing dark background color, rather than cropping or stretching.
- **Rationale**: Cropping risks cutting off axis labels, legends, or route lines; stretching
  distorts the data visually. Letterboxing guarantees FR-009 (1:1 square) and SC-004 (no
  cropped-off key content) simultaneously for every tab regardless of its natural aspect
  ratio (e.g., the Heatmap's wide `480px`-tall container vs. narrower chart panels).
- **Alternatives considered**:
  - *Hard crop to square*: rejected — risks cutting off chart edges/legend content (violates
    SC-004).
  - *Stretch to square*: rejected — distorts the visualization, misrepresenting the data.

## 4. Title composition

- **Decision**: After rasterizing the chart/graphic region, draw a short title bar directly
  onto the final square canvas using the 2D canvas API (not `html2canvas`), reusing each tab's
  existing display name (the same labels already used for the tab buttons).
- **Rationale**: Drawing the title with the canvas API keeps text crisp at the final output
  resolution and avoids temporarily mutating live dashboard DOM (which risks visible flicker
  or capturing an inconsistent intermediate state).
- **Alternatives considered**:
  - *Inject a temporary title DOM node before calling `html2canvas`, then remove it*:
    rejected — adds DOM-mutation timing complexity and a visible flicker risk for a
    cosmetic gain.

## 5. Preview delivery mechanism

- **Decision**: Show the captured image in an in-page modal overlay (a `<div>` shown on top
  of the dashboard), not a new browser window/tab via `window.open()`.
- **Rationale**: `window.open()` can be blocked by browser popup blockers (an explicit Edge
  Case in the spec) and would navigate outside the existing dashboard experience. An in-page
  modal satisfies FR-003 ("without navigating away from the dashboard") and sidesteps popup
  blocking entirely.
- **Alternatives considered**:
  - *`window.open()` popup window*: rejected — subject to popup blockers and browser
    chrome differences; harder to guarantee a consistent, dismissable UX.

## 6. Download mechanism

- **Decision**: Convert the final square canvas to a PNG Blob/data URL and trigger a save via
  a temporary `<a download="...">` element, following the standard browser download pattern.
  Filename pattern: `trianalytica-<tab-slug>-<yyyyMMdd-HHmmss>.png`.
- **Rationale**: This is the standard, dependency-free way to save a client-generated image in
  a browser, and needs no server round-trip (consistent with FR-008).
- **Alternatives considered**: None material — this is the conventional approach for
  browser-only file downloads.

## 7. Concurrent export requests

- **Decision**: While an export capture is in progress for a given click, ignore additional
  clicks on any export button until the in-flight capture resolves (success or failure) and
  the modal is shown or the error is reported.
- **Rationale**: Prevents stacked modals or races between two captures, per the spec's edge
  case about rapid repeated clicks.
- **Alternatives considered**: *Queue subsequent requests*: rejected — unnecessary complexity
  for a manual, single-user click action.

## 8. "No data to export" detection

- **Decision**: Reuse each tab's existing empty-state signal (e.g., the same condition that
  shows `pbEmptyState` for Personal Bests or `heatmapEmptyState` for Heatmap, and the
  equivalent "no data" condition already computed for the chart tabs) as the input to a pure,
  testable `hasExportableContent(tabName, flags)`-style helper in `src/export-utils.js`.
- **Rationale**: Avoids duplicating each tab's data-presence logic; keeps the decision itself
  unit-testable without a DOM.
- **Alternatives considered**: *Re-derive data presence independently in the export code*:
  rejected — duplicates existing logic and risks drifting out of sync with each tab's actual
  empty state.
