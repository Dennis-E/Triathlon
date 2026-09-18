# Data Model: Enhanced Visualization Export

## ExportTarget

Represents the content selected for one export request.

| Field | Type | Required | Validation / meaning |
|---|---|---:|---|
| `kind` | `tab` or `pb-tile` | yes | Determines capture target and filename context. |
| `key` | string | yes | Supported tab key or stable PB tile key. |
| `title` | string | yes | Human-readable headline, drawn in the dedicated header. |
| `targetElementId` | string | yes | Existing visualization wrapper or generated PB tile block ID. |
| `hasData` | boolean | yes | Must be true before capture starts. |
| `filters` | list of FilterSummary | no | Only active, material filters are included. |
| `legend` | LegendModel or null | no | Included only when the selected content has meaningful plotted measures/categories. |
| `metricLabel` | string | no | Useful for PB tiles and single-metric visualizations. |

## FilterSummary

Represents user-visible context that materially affects the selected result.

| Field | Type | Required | Validation / meaning |
|---|---|---:|---|
| `label` | string | yes | Human-readable name such as `Sport` or `Date range`. |
| `value` | string | yes | Non-empty active value; unset/default values may be omitted when they add no context. |

## LegendModel

Represents an export-safe legend independent of interactive controls.

| Field | Type | Required | Validation / meaning |
|---|---|---:|---|
| `title` | string | yes | Short label such as `Measures` or `Sports`. |
| `items` | list of LegendItem | yes | At least two meaningful items; otherwise omit the legend. |

## LegendItem

| Field | Type | Required | Validation / meaning |
|---|---|---:|---|
| `label` | string | yes | Human-readable plotted measure/category, e.g. `Heart rate` or `Pace`. |
| `color` | string | yes | Canvas-safe color matching the visualization where applicable. |

## BrandAssetSet

Local image resources required for a complete export.

| Asset | Path | Use |
|---|---|---|
| TriAnalytica logo | `assets/logo.png` | Footer/header branding in the image. |
| Strava logo | `assets/Strava_Logo.svg` | Export control and source/platform branding. |
| Instagram logo | `assets/Instagram_logo_2016.svg` | Export control and destination branding. |
| QR code | `assets/QR Code webpage.png` | Footer return path to the app. |
| Domain | One configured public-domain string | Printed beside or below the QR code. |

## ExportImage

Generated local artifact and preview state.

| Field | Type | Required | Validation / meaning |
|---|---|---:|---|
| `dataUrl` | PNG data URL | yes after capture | Produced only after all required assets and target content are valid. |
| `target` | ExportTarget | yes | Enables correct filename and close/reset behavior. |
| `width` / `height` | number | yes | Both 1080 for the default square output. |
| `createdAt` | Date | yes | Used for deterministic filename generation. |

## State transitions

`idle` -> `checking` -> `capturing` -> `previewing`

Failure transitions return to `idle` after showing a toast. Closing the preview clears `dataUrl` and returns to `idle`. A second request while checking/capturing/previewing is ignored, preserving the existing single-preview behavior.
