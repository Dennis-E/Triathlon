# Data Model: Export Context Cleanup

This feature changes presentation of existing transient export data. It adds no persisted fields, server records, or user state.

## Entities

### Export Target

An existing dashboard visualization or Personal Best detail selected for capture.

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `kind` | `tab` or `pb-tile` | Yes | Identifies a tab export or Personal Best detail export. |
| `key` | string | Yes | Stable identity of the selected visualization or PB detail. |
| `title` | string | Yes | User-facing visualization title retained in the branded export header. |
| `targetElementId` | string | Yes | DOM capture target for the selected visualization. |
| `hasData` | boolean | Yes | Indicates whether the target has content eligible for export. |
| `filters` | list of label/value pairs | No | Existing selected-view metadata; it is not rendered as image context. |
| `availableControls` | list of control groups | No | Dashboard options; they are not rendered into the image. |
| `legend` | optional legend | No | Composer-level explanatory series legend, when applicable. |

### Captured Visualization

The browser-rendered image of the selected target, captured from a cloned document.

- Its chart content, labels, and data marks reflect the current dashboard state.
- Export-only outer card framing is removed from the clone.
- Internal chart structure and meaningful legends remain intact.
- Preparing the clone does not mutate live dashboard filters or visual styles.

### Export Composition

The existing 1080 x 1080 PNG produced from the branded header and captured visualization.

- It contains the existing title and branding, the selected visualization, and applicable meaningful data legends.
- It contains no filter summaries, alternative controls, redundant context labels, or outer frame around the visualization.
- It reserves no image region for removed filter/context content.
- It is used for both the on-screen preview and the corresponding download.

## Relationships and Validation

- Each valid Export Target selects one Captured Visualization and produces one Export Composition.
- A target may retain filter metadata to describe selected dashboard state, but that metadata must not become visible text or reserved layout in the image.
- A target may supply a series legend; the legend's data labels and color associations remain visible.
- Empty targets retain existing no-data behavior and do not produce a preview image.
- Export preparation is transient and browser-local; no new persistence or server transfer is introduced.