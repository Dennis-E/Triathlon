# Export Presentation Contract

## Scope

This contract applies to every existing visualization export, including all dashboard tab targets and Personal Best detail exports. It governs the image shown in the existing preview and the corresponding downloaded PNG.

## Image Content

- Preserve the existing 1080 x 1080 PNG format, branded header, visualization title, chart data, and no-data behavior.
- Do not display filter controls, selected-filter summaries, available options, or redundant configuration labels in the image.
- Do not display outer decorative frames enclosing the visualization.
- Do not reserve blank space for removed filter/context content.
- Preserve visualization content and explanatory labels/legends, including Pace vs year colors, Pie Chart categories, and Personal Best identity/result.
- Omit redundant PB metric context such as `Metric: Time` when the selected PB title already identifies the result.
- Preserve chart proportions; do not crop or stretch content to fill the available region.

## Dashboard Isolation

- The dashboard's filters and selected values continue to control which visualization is captured.
- Export-only frame cleanup applies to the captured clone and does not change the live dashboard's styles or filter state.
- Removing export labels must not alter activity selection, aggregation, data values, or chart rendering.

## Preview, Download, and Privacy

- Preview and download use the same composed PNG and show matching presentation.
- Capture and image composition remain browser-local. This feature must not transmit activity data or generated images to a server.
- This contract does not claim that the entire application makes no network requests; existing CDN or map-tile requests are outside this export-data boundary.