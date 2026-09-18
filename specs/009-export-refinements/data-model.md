# Data Model: Export Refinements

## Export Branding Configuration

Represents the user-visible identity printed in the export composition.

| Field | Type | Rules |
|------|------|-------|
| domain | string | MUST equal `https://dennis-e.github.io/Triathlon/` for this feature. |
| logoAsset | local asset reference | Uses the existing TriAnalytica logo asset. |
| sourceAspectRatio | positive number | Derived from the loaded logo dimensions; never replaced by an unrelated fixed ratio. |

## Export Asset

Represents a locally loaded image used by the composition or an export control.

| Field | Type | Rules |
|------|------|-------|
| role | enum | `trianalytica-logo`, `strava-control-icon`, `instagram-control-icon`, or `qr-code`. |
| path | string | Must resolve to an existing local asset path. |
| naturalWidth | positive number | Used for proportional fitting when drawn into the export image. |
| naturalHeight | positive number | Used for proportional fitting when drawn into the export image. |

Platform logo assets may be used by export controls, but `strava-control-icon` and `instagram-control-icon` MUST NOT be rendered into the preview/download composition.

## Available Control Snapshot

Represents the actual filter and view controls communicated in the export's available-options picture.

| Field | Type | Rules |
|------|------|-------|
| groupLabel | string | Identifies a view or filter group. |
| controls | list of Control Snapshot | Preserves current visible order. |
| sourceId | string | Identifies the current dashboard control group used to derive the snapshot. |

### Control Snapshot

| Field | Type | Rules |
|------|------|-------|
| label | string | Must match the visible dashboard button label. |
| selected | boolean | Reflects the current selected/active state. |
| available | boolean | False controls are omitted or visibly disabled according to the current UI. |

## Export Target

Represents the content selected for capture.

| Field | Type | Rules |
|------|------|-------|
| kind | enum | `tab` for a visualization or `pb-tile` for a personal-best detail. |
| key | string | Stable visualization or PB detail key used for title and filename. |
| title | string | Identifies the selected content. |
| targetElementId | string | Current DOM capture source. |
| hasData | boolean | False blocks export and shows the existing no-data message. |
| filters | list | Active filter summary; empty when no meaningful filter is active. |
| legend | optional object | Included only when applicable to the selected visualization. |
| detailModel | optional object | For `pb-tile`, derived from the currently expanded `activePbDetailModel`. |

## State Transitions

### Export Preview

`idle` -> `checking` -> `capturing` -> `previewing` -> `idle` after close/download flow.

Invalid or missing data transitions from `checking` back to `idle` with a no-data message. Capture or asset errors transition from `capturing` back to `idle` with a user-facing error.

### Personal-Best Detail

`overview` -> `expanded(detailModel)` when a tile is opened. The popup exposes exactly one detail export action while in `expanded`. Closing returns to `overview` and removes the popup action. Opening another tile replaces the active detail model and its export target.
