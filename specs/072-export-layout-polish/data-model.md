# Data Model: Export Layout Polish

The feature adds no persisted data and does not alter activity records. It changes how existing export context and captured content are arranged.

## Export Target

The existing target describes the selected dashboard visualization or PB detail.

| Field | Meaning | Rules |
|------|---------|-------|
| `kind` | Target category (`tab` or `pb-tile`) | Preserves current target identity and export naming. |
| `key` | Visualization or PB detail key | Selects capture-specific treatment. |
| `targetElementId` | Browser capture element | Must identify the current visualization or selected PB detail. |
| `title` | Export title | Preserved in the branded header. |
| `filters` | Active filter/context values | Values and ordering remain unchanged; presentation gains adequate separation. |
| `availableControls` | Snapshot of available selections | Preserved; layout must not overlap the legend or image boundary. |
| `legend` | Optional labeled color series | Pace-versus items reflect visible bubble datasets, their years, and matching colors. |
| `contentFit` | Content fitting profile | Maintains the aspect ratio and prevents clipping; PB details use the tighter PB region. |

## Capture Snapshot

| Field | Meaning | Rules |
|------|---------|-------|
| `sourceBounds` | Captured content width and height | Taken from the selected target; not persisted. |
| `contentBounds` | Available image region after header and metadata reservations | Must remain within the 1080 × 1080 composition. |
| `drawBounds` | Scaled and positioned capture bounds | Must preserve aspect ratio and keep required content visible. |
| `exportAdjustments` | Temporary cloned-capture presentation changes | Must not mutate the live dashboard or source activity data. |

## Legend Series

| Field | Meaning | Rules |
|------|---------|-------|
| `label` | Category represented by a plotted series | For pace-versus bubbles, this is the year. |
| `color` | Series marker color | Must match the corresponding visible bubble dataset. |
| `visible` | Whether the series appears in the current visualization | Hidden or empty years are omitted from the export legend. |

## Export Image Lifecycle

The target and capture snapshot produce one final image. The preview and downloaded file use that same image; closing or exporting it does not modify the source visualization or stored activity data.