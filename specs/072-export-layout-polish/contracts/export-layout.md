# Export Layout Contract

This contract applies to the export preview and downloaded image. It does not redefine the interactive dashboard layout or chart data.

## Shared Composition

- Preserve the existing branded header, 1080 × 1080 image size, active filters, available controls, local preview, and download behavior.
- Place the active filter summary after visible whitespace below the branded header and before the visualization. Do not treat the filter summary as a separate heading.
- Filter values, controls, legend, and chart must not overlap or be clipped.
- Each updated export preview and downloaded image must be generated from the same final composition.
- Do not alter selected activities, filters, aggregation, data values, or no-data behavior.

## Visualization-Specific Rules

| Export | Required presentation |
|--------|-----------------------|
| Pace vs. | Legend entries name the years represented by visible bubble datasets and use their matching bubble colors. Do not substitute measure labels for the year series. |
| Distance | Use at least 85% of the available plot width and height where the chart's aspect ratio permits; preserve proportions and keep all axes, ticks, and labels visible. |
| Heatmap | Omit plus/minus zoom controls from the export only. Fit the complete map/route into the available content region. |
| Distributions | Use at least 85% of the available plot width where possible; preserve labels, units, and plotted data. |
| Workout time | Use at least 85% of the available plot width where possible; preserve labels, units, and plotted data. |
| Personal-best detail | Fit the selected detail chart into at least 85% of the available chart region in its limiting dimension, without cropping or distortion. |
| Pie charts | Omit the activity-count summary headline, allocate the freed space to the chart, and use a readable legend (minimum 18px text in the exported image). |
| Lifetime KPI | Increase KPI label text to at least 16px and section headings to at least 18px in the exported image; keep metric values and labels associated. |

## Capture Isolation and Privacy

- Heatmap zoom controls must be absent from the export while remaining available on the live map.
- Any temporary heatmap resize used to render the export must restore the live map's dimensions, center, and zoom before the preview appears, including when capture fails.
- Personal-best identity and all chart labels needed to understand the result remain visible.
- Capture, image composition, preview, and download remain local to the browser. No activity data or generated image is sent to a server.

## Acceptance Evidence

Validate pure layout and legend derivation with focused Jest tests. Validate actual rendered bounds, absence of heatmap controls, readability, and preview/download parity in a browser with representative imported data.