# Export UI Contract

## Export controls

Every supported visualization tab and every data-bearing Personal Best detail tile exposes an export control using the wording pattern `Export for ...`.

The control:

- shows both the local Strava and Instagram logo assets;
- keeps text and logos readable at narrow widths;
- identifies the selected visualization or Personal Best tile in its accessible label;
- does not appear for an empty Personal Best tile.

## Export preview

The existing preview modal remains the handoff surface and MUST provide:

- a preview of the generated square PNG;
- a download action;
- a close action;
- a clear error/toast when no data or a required asset is unavailable.

## Export image regions

The 1080px square image uses non-overlapping regions:

1. Header: TriAnalytica identity and a concise headline, separate from the visualization.
2. Main content: the selected tab visualization or one selected Personal Best tile.
3. Context: active filters and, when applicable, a legend such as `Heart rate` versus `Pace`.
4. Footer: TriAnalytica logo, Strava/Instagram context as applicable, QR code, and the configured public domain.

Empty filter summaries and non-applicable legends are omitted. Required assets must not be represented by broken placeholders.

## Privacy and download

Capture, preview creation, and download use browser-local data. No visualization data or generated image is sent to the analysis API. Filename generation preserves the existing `trianalytica-<target-slug>-<yyyyMMdd-HHmmss>.png` convention, extended with a stable PB-tile slug when the target is a tile.
