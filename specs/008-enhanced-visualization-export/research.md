# Research: Enhanced Visualization Export

## Existing capture flow

- **Decision**: Retain the current `html2canvas` plus 1080px square canvas flow and extend its composition stage.
- **Rationale**: The repository already waits for chart settling, captures a selected DOM target, uses `computeSquareFit`, previews a data URL, and downloads locally. Reusing it minimizes risk and preserves the established user flow.
- **Alternatives considered**: A new image/export library was rejected because it would add a dependency and duplicate existing behavior; browser screenshots were rejected because they cannot reliably produce a downloadable branded image.

## Reusable helper boundary

- **Decision**: Add pure export metadata, filter-summary, legend-selection, asset-reference, and target-validation helpers to `src/export-utils.js`, preserving CommonJS exports and the `window.exportUtils` bridge.
- **Rationale**: These decisions can be unit tested in the repository's Node Jest environment without requiring a DOM. `index.html` remains responsible for reading live DOM state and drawing.
- **Alternatives considered**: Putting all logic in the inline script was rejected because it would make state derivation difficult to test and would violate the repository's reusable-module convention.

## Personal Best tile targeting

- **Decision**: Extend the existing `appendPbDetailButton(header, model)` path with an export action that receives the rendered tile block or a stable tile identifier, while preserving the existing full-screen action.
- **Rationale**: Every data-bearing PB tile is constructed at this shared function boundary, so one change covers distance, elevation, longest, and power tiles without duplicating button logic. Empty tiles return before the detail action and therefore cannot expose misleading export controls.
- **Alternatives considered**: Capturing the whole `pbColumnsContainer` was rejected because it cannot satisfy the requirement to export one selected tile; adding separate buttons to each PB renderer was rejected as duplication-prone.

## Filters and legends

- **Decision**: Build export context from the same state already reflected by each visualization's visible controls: sport/timeframe for Total Distance, sport/date range/trend state for Heart Rate & Pace, metric/type for Equipment, mode/type for Equipment Timeline, sport for Heatmap, and tile title/metric for Personal Bests.
- **Rationale**: Reading the active control labels at export time ensures the image describes the result currently visible to the user and avoids introducing a second filter state.
- **Alternatives considered**: Capturing all surrounding controls was rejected because it includes interactive chrome and does not produce a stable shareable composition; hard-coded legends for every chart were rejected because not every visualization has a meaningful legend.

## Asset loading and failure handling

- **Decision**: Use the existing local paths for `assets/logo.png`, `assets/Strava_Logo.svg`, `assets/Instagram_logo_2016.svg`, and `assets/QR Code webpage.png`; preload them as image objects before drawing and fail the export with a user-facing toast if a required asset cannot load.
- **Rationale**: Local assets preserve privacy and avoid broken placeholders in downloaded images. SVG assets can be loaded as images by the browser and drawn into the canvas when same-origin.
- **Alternatives considered**: Remote asset URLs were rejected because they add network/privacy dependencies and can taint canvas capture; silently skipping a missing logo was rejected because it would produce a misleading incomplete export.

## Domain handling

- **Decision**: Keep the QR code and printed domain as one export-brand configuration value rather than scattering URL literals through the composition code. Use the current TriAnalytica public domain associated with the provided QR asset when implementing and test that the same value appears in the image metadata/layout.
- **Rationale**: The QR image itself does not expose a machine-readable URL in the repository, and no canonical domain constant currently exists. A single configuration point makes the value auditable and replaceable without changing capture logic.
- **Alternatives considered**: Deriving the domain from `window.location` was rejected because local development URLs would be printed into public exports; inventing multiple domain strings was rejected because the QR and visible domain could disagree.

## Composition and layout

- **Decision**: Reserve explicit vertical regions for header, selected content, optional filter/legend context, and footer branding/QR/domain; scale or letterbox the captured content inside its region.
- **Rationale**: Separate regions guarantee the headline is not painted over the visualization and give filters, legend, and branding stable non-overlapping areas at the existing square output size.
- **Alternatives considered**: Painting metadata directly over the captured image was rejected because it risks obscuring chart/map content and fails the no-overlap requirement.
