# Export Experience Contract

This contract describes the user-visible behavior and the browser-side boundary for export generation. It introduces no network API.

## Entry and Selection

- Every current visualization export action and personal-best detail export enters the shared export experience.
- The user selects `Square` (default, 1080 × 1080) or `Portrait` (1080 × 1350).
- An optional humor control toggles only the secondary line. Recommended initial state: off so factual content is the default.
- The selected analysis state determines data. Controls/filter summaries are not printed in the image.

## Rendering and Preview

- The export is composed locally from a single immutable capture of the selected visualization and its data context.
- The generated PNG is shown in preview before download. Preview and download must use identical generated image bytes.
- A user may close the preview without affecting dashboard data or selection.
- A later change to dashboard filters, format, or map viewport requires a new capture; it must not silently mutate an already displayed preview.
- For a heatmap, the captured geographic extent is exactly the viewport currently selected by the user with pan/zoom. No automatic fit-to-routes, additional map crop, distortion, or persistent change to the live map is allowed. The map should occupy at least 65% of usable image height when this is compatible with preserving the exact extent; the extent takes precedence.
- For an equipment timeline that exceeds the per-format row limit, expose all rows through a numbered preview/download series with a shared scale. The standard equipment ranking remains a labeled Top 5/7 selection.

## Output Content

- English factual headline of at most seven words, at most two lines.
- Optional relevant central value; omit it when the visualization does not support one.
- Main visualization, concise applicable sport/metric/period/unit context, and compact logo plus readable website footer.
- No app navigation, interactive controls, filter summaries, generic "Shareable visualization" copy, or large QR code.
- Preserve the selected visualization's data and useful labels. Apply the detailed family rules in FR-008–FR-013 for the six named families.

## Resource and Error Behavior

- Required images, fonts, and visible map tiles must be ready before a PNG is offered for download.
- On missing data, explain why and disable download.
- On a required-resource failure, report a clear error and do not provide a partial PNG.
- Retrying after a transient failure must be possible without reloading the application.
- Export data and generated image bytes remain local to the browser. Existing map tile requests remain an external map dependency and are not an upload of the user's export.

## Browser-Side Boundary

The capture orchestration receives an existing export target, selected format, optional humor state, and optional family metadata. It returns a ready preview/download image or a typed/user-readable failure. Format/layout calculation remains pure and deterministic. Dashboard adapters expose existing selected values read-only; the export layer does not recompute analytics.