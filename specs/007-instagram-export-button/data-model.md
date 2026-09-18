# Phase 1 Data Model: Instagram-Ready Visualization Export

This feature adds no persisted storage. The entities below describe in-memory/session
concepts used while composing and previewing an export.

## Exported Visualization Image

Represents one generated image for a single export action.

| Field | Type | Notes |
|---|---|---|
| `sourceTab` | string (enum) | One of `totalDistance`, `heartratePace`, `equipment`, `equipmentTimeline`, `personalBests`, `heatmap` — matches the existing `TAB_ORDER` values in [src/tab-navigation.js](../../../src/tab-navigation.js). |
| `titleText` | string | Human-readable title drawn onto the image, derived from the tab's existing display label (FR-002, "meaningful title"). |
| `width` | number | Final canvas width in pixels. Always equal to `height` (FR-009). |
| `height` | number | Final canvas height in pixels. Always equal to `width` (FR-009). |
| `format` | string (const) | Always `"png"`. |
| `dataUrl` | string | `data:image/png;base64,...` representation used to render the `<img>` preview in the modal and as the download source. |
| `createdAt` | Date/timestamp | Used only for the generated filename; not persisted. |

Lifecycle: created when the user clicks a tab's export button and `hasExportableContent(...)`
returns true; exists only in memory for the lifetime of the preview modal; discarded when the
modal is closed. If the user clicks Download, the browser's own download/save mechanism takes
over — no separate record is kept by the app (per FR-008, nothing is uploaded or persisted by
this feature).

## Export Request State (in-memory, per click)

A small transient state machine that governs a single button click through to modal display
or a user-facing message.

| State | Meaning | Entered when |
|---|---|---|
| `idle` | No export in progress. | Initial state; after modal close; after error acknowledged. |
| `checking` | Verifying the active tab has exportable content. | Export button clicked. |
| `blocked-no-data` | Active tab has nothing to export. | `hasExportableContent(...)` returns false (FR-006). |
| `capturing` | `html2canvas` rasterization + square/title composition in progress. | Data check passed. |
| `previewing` | Composed image shown in the modal with Download/Close actions. | Capture succeeded. |
| `capture-failed` | Capture could not complete (e.g., rendering not settled, unexpected error). | Capture threw/timed out. |

Only one export request may be in a non-`idle` state at a time across the whole dashboard
(FR-covered by the "concurrent export requests" decision in `research.md`); additional clicks
while not `idle` are ignored.

## Relationships

- Each `Exported Visualization Image` is produced by exactly one `Export Request` reaching
  `previewing`.
- `sourceTab` on the image always matches the visualization tab that was active when the
  triggering click occurred (FR-007), never a previously viewed tab.
