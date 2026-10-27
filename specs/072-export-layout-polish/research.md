# Research: Export Layout Polish

## Existing Export Flow

- **Decision**: Keep the existing browser-local pipeline: `getTabExportTarget` selects a target, `html2canvas` captures it, `drawExportComposition` places it in the 1080 × 1080 image, and the same resulting image feeds preview and download.
- **Rationale**: This preserves existing filename, branding, no-data, privacy, and download behavior while changing the presentation at the narrowest shared boundary.
- **Alternatives considered**: Replacing the capture or download flow was rejected because none of the requested changes require a new export lifecycle or remote service.

## Layout Ownership

- **Decision**: Put shared composition spacing, fit, and legend rules in `src/dashboard-export.js` and pure calculations in `src/export-utils.js`. Place the active filter summary after deliberate spacing below the branded header and before the visualization. Hide Leaflet zoom controls in the cloned capture. Before a heatmap capture, temporarily size the existing Leaflet container to 960 × 500 and invalidate its size so tiles and the route canvas render across the export area; restore its inline dimensions, center, and zoom in a `finally` path before showing the preview.
- **Rationale**: The user confirmed the order as branded header, whitespace, filter summary, then visualization. Browser validation showed CSS-resizing only the cloned Leaflet element left tile and route content at its original narrow width. Leaflet must recalculate against the export dimensions; saving and restoring styles and viewport preserves the dashboard state after capture.
- **Alternatives considered**: Clone-only CSS sizing was rejected because existing Leaflet tiles and canvas geometry do not recalculate in the cloned document. Leaving the live map permanently resized was rejected because export must not alter dashboard layout or viewport. Duplicating the entire exporter for each tab was rejected because image framing and preview/download are shared.

## Pace-versus Year Legend

- **Decision**: Build the export legend from the bubble datasets actually represented in the current chart, using each dataset's year and border color. Exclude years hidden by the year controls and do not label trend-line measures as bubble series.
- **Rationale**: `src/dashboard-scatter.js` creates one bubble dataset per year, while the current static `EXPORT_LEGENDS.paceMetrics` describes two generic measures and can disagree with the displayed marks.
- **Alternatives considered**: A fixed list of years was rejected because the visible years depend on imported data and user selections. Reusing the trend-line labels was rejected because they describe a different visual encoding.

## Personal-Best Content

- **Decision**: Apply the requested tighter fit to the selected PB detail capture (for example, Run 5 km), using its actual captured bounds and preserving aspect ratio. Keep PB identity, selected metric, and chart labels intact.
- **Rationale**: The request names a specific PB result and the current detail export has a dedicated `pbDetailCaptureTarget`; the generic PB overview and the selected detail are distinct targets.
- **Alternatives considered**: Enlarging only the whole PB overview was rejected because it does not address the named detail preview. Cropping or stretching the detail chart was rejected because it can remove labels or distort data.

## Heatmap and Chart Whitespace

- **Decision**: Hide Leaflet zoom controls only in the cloned export capture, fit the full route/map to the available region, and tighten chart framing for distance, distributions, and workout time without clipping axes or labels.
- **Rationale**: The heatmap zoom controls are interactive dashboard chrome. These charts share a 960 × 500 standard composition box, while excess margins can arise in both the capture target and its contain-fit placement.
- **Alternatives considered**: Hiding controls on the live map was rejected because zoom remains useful interactively. Cropping to fill the canvas was rejected because routes and axis labels must remain complete.

## Pie and KPI Typography

- **Decision**: Omit the activity-count summary from the pie export capture, enlarge its chart/legend in the export representation, and increase export KPI label/heading sizes in the existing separate Lifetime Statistics export rendering.
- **Rationale**: The pie summary, chart, and legend currently share `pieChartsCaptureArea`; the Lifetime Statistics dashboard already renders a dedicated export view. Export-only treatment keeps ordinary dashboard presentation stable.
- **Alternatives considered**: Removing pie summary content from the dashboard was rejected because the request concerns exports. Enlarging KPI values alone was rejected because the existing values are already larger than their labels, and the requested issue is the headings.

## Validation and Dependencies

- **Decision**: Reuse existing Chart.js, Leaflet, html2canvas, and Jest; add no package or external contract. Validate pure computations with Node tests and the final visual layout in a browser.
- **Rationale**: The project already owns these capture and chart integrations. Unit tests cannot measure rendered image bounds or guarantee that preview and downloaded image match visually.
- **Alternatives considered**: Adding a browser testing framework or image-processing dependency was rejected for this focused feature; a manual browser scenario plus existing focused tests fits current project practice.

The clarification resolves the original spacing ambiguity: place visible whitespace below the branded header, then the active filter summary, then the visualization. This changes presentation order only and introduces no new data field or filter.