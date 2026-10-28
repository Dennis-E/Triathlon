# Research: Export Context Cleanup

## Shared Composition Path

- **Decision**: Keep export presentation changes in the shared capture/composition flow owned by `src/dashboard-export.js`; use existing pure layout helpers from `src/export-utils.js` where appropriate.
- **Rationale**: Dashboard tab exports and Personal Best detail exports both pass through `drawExportComposition()`. That function currently draws `target.filters` and uses their rendered line count to position the visualization. Removing that rendering and reserved context height addresses filters and the resulting blank space consistently.
- **Alternatives considered**: Per-tab filter removal was rejected because it would duplicate behavior and leave less common export types inconsistent. Altering dashboard filters was rejected because exports must not change the selected view.

## Capture Frame Removal

- **Decision**: Remove outer decorative framing from the cloned capture DOM only; leave the live dashboard and the contents inside each visualization unchanged.
- **Rationale**: `html2canvas` captures target elements with their rendered styles. Some capture roots carry card-like border, rounding, background, clipping, or padding. Clone-only changes satisfy export presentation without changing dashboard appearance.
- **Alternatives considered**: Editing all live target markup/styles was rejected because it would affect on-screen dashboards. Globally removing every border or background inside a capture was rejected because it could erase meaningful data encodings or chart structure.

## Labels and Legends

- **Decision**: Omit filter/context summaries entirely, including redundant labels such as `Sport: All Sports`, `Colour Scheme`, and the PB `Metric: Time` line. Preserve actual visualization titles, results, axes, data marks, and explanatory legends.
- **Rationale**: These requested redundant values are rendered as export context, while legends such as Pace vs year colors and Pie Chart categories explain plotted data and are part of the visualization.
- **Alternatives considered**: Selectively filtering label names was rejected because any filter summary is unwanted and future controls could introduce new labels. Removing all boxed items was rejected because legend content must remain even if it has its own styling.

## Preview, Download, and Privacy

- **Decision**: Preserve the current 1080 x 1080 PNG composition and the existing shared preview/download image. Keep export capture and generation local.
- **Rationale**: The image is composed once and that generated data URL drives both preview and download. No new server integration is needed. Browser libraries and map tiles may still use the network; this requirement is specifically that activity data and generated export images are not transmitted by this feature.
- **Alternatives considered**: A new image format, export endpoint, or browser-test dependency was rejected because none is needed to satisfy the presentation change and each expands scope.

## Validation

- **Decision**: Use focused Jest coverage for composition, target handling, and preview/download paths, supplemented by a real-browser visual check.
- **Rationale**: Jest runs in Node and uses VM/Canvas mocks; it does not render the actual `html2canvas` output. Browser inspection is needed to verify frame removal, embedded legends, and heatmap output.
- **Alternatives considered**: Adding a browser automation framework was rejected for this focused feature; it would add dependencies beyond the established validation pattern.