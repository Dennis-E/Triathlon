# Data Model: Compact Export Context

This feature changes only the presentation of existing export metadata. It adds no persisted data, server records, or new user state.

## Entities

### Export Target

One visualization selected for image capture.

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `kind` | `tab` or `pb-tile` | Yes | Identifies a dashboard visualization or a Personal Best detail tile. |
| `key` | string | Yes | Stable identity of the selected visualization or tile. |
| `title` | string | Yes | Existing title displayed in the export header. |
| `targetElementId` | string | Yes | Existing capture target for the selected visualization. |
| `filters` | list of label/value pairs | No | The selected values that directly determine this view; only these may appear as filter context. |
| `availableControls` | list of control groups | No | Alternative controls currently available in the dashboard; not rendered in the exported image. |
| `legend` | optional legend | No | Existing explanatory key for a visualization, when applicable. |

### Active View Context

The concise, non-interactive export summary derived from an export target's `filters`.

- Each item has a human-readable label and selected value.
- Items with an empty label or value are omitted.
- No separate context region is allocated when no items remain.
- Values must correspond to the state used to render the selected visualization. For Distance, this includes sport, aggregation, and timeframe when applicable.

### Export Composition

The square 1080 x 1080 PNG shown in preview and offered for download.

- It retains existing title and branding.
- It contains one selected visualization, fitted proportionally in the area left after the header and optional active-context line.
- It may contain the existing legend when relevant.
- It does not contain alternative filter controls, option lists, or inactive values.

### Visualization Bounds

The destination rectangle for the captured visualization within the available export area.

- It preserves the captured source aspect ratio.
- It is the largest rectangle that fits in the available area without cropping.
- Its limiting width or height is the dimension used to check the revised 80% criterion.

## Relationships and Validation

- Each Export Target produces one Export Composition.
- An Export Target has zero or more Active View Context entries; `availableControls` does not produce image content.
- Each Export Composition has one Visualization Bounds rectangle and may include a legend.
- The same target state supplies both the displayed view and its active context; export must not mutate dashboard selection.
