# Export Composition Contract

## Scope

This contract applies to every existing visualization image export, including dashboard tabs and Personal Best detail tiles. It covers the image shown in the existing preview and the corresponding downloaded PNG.

## Image

- The generated image remains a 1080 x 1080 square PNG.
- Existing title, TriAnalytica branding, domain, QR code, and applicable legend behavior remain unchanged.
- The selected visualization is placed at the largest size that fits in the available area after the header and any active-context line are excluded.
- The visualization's aspect ratio is preserved; it is not cropped or stretched to fill unused space.

## Filter Context

- The image may show a concise, non-interactive summary of only selected values that directly determine the displayed visualization, such as Run, yearly aggregation, or 2026.
- It must not show controls, menus, unselected options, alternate views, or values irrelevant to the selected visualization.
- If there is no relevant active context, no empty context area is reserved.
- Dashboard filter controls and selection behavior are unchanged.

## Preview, Download, and Privacy

- Preview and download show the same composed PNG and retain the existing actions and behavior.
- Capture, composition, and download remain browser-local; this feature does not transmit activity data or generated images.
