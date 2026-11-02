# Data Model: Pinned Tooltip Callouts

No persistent data model, migration, or analytical calculation is introduced. Existing tooltip state remains authoritative.

## Statistic Inspection Target

- Identity: stable statistic key within lifetimeStatistics, matching statisticDetails; selectionKey remains lifetimeStatistics:<key>.
- Content: existing title, itemLabel, sections with headings/rows, footerLines, and notes.
- Interaction: focusable content target with data-statistic-key, data-tooltip-inspector, accessible activation semantics, and synchronized pressed state. This is not a separate pin-icon button.
- Relationship: one item target can become the controller's current origin; replacing or invalidating the selection clears the previous origin's selected state.
- Validation: no inspection targets for empty/nonexistent statistics; no nested interactive controls or changed table-row semantics.

## Pinned Detail And Request Snapshot

- Reuse existing selectionKey, tab context, full content, and anchor metadata; at most one pin per visualization.
- Live normalizedPoint is not an export coordinate. Existing capturePoint is usable only with its source coordinate frame explicitly accounted for.
- Snapshot identity and data context are fixed synchronously at request time. Later projection reads request-owned render data, not current live selection.
- No live DOM nodes or resource handles enter deeply frozen plain composition data. Capture handles and media leases remain owned by the request lifecycle.

## Resolved Export Anchor (Additive Export-Only Model)

- selectionKey: identity of the captured selection.
- visibility: visible, outside-view, or not-in-export.
- capturePoint: finite normalized {x, y} relative to the complete final captured image; required for visible, absent for other states.
- associationLabel: explicit item-identifying note explaining outside-view or omitted-from-capture status; required for non-visible states and retained in headline fallback.
- Resolution uses the isolated capture's final layout, including nested element offsets, chart resizing, KPI-only layouts, map capture state, and collage membership.
- Validation: visible points lie within the capture; no viewport-relative values or unrelated fallback centers. Missing projection is an error, not a visibility category.

## Callout Layout (New Derived Value)

- mode: full or headline, preserving existing text-fit meaning.
- lines, fontSize, lineHeight, padding: readable wrapped text and measurement metadata.
- body: final-image rectangle {x, y, width, height}; content-sized and bounded.
- side: above, below, left, right, or unanchored.
- tail: either null or base endpoints and tip in final-image pixels; tip approaches the selected anchor without covering its clearance region.
- bounds and protectedRects are placement inputs, not stored activity data.
- Validation: finite geometry; body/tail inside image bounds; no body/tail collision with protected rectangles or anchor clearance; one layout per selection; deterministic output for identical measured inputs.

## State Transitions

1. Existing transient detail -> selected item activation -> pinned detail.
2. Same item activation, dismiss, or Escape -> no pin; another item -> replacement pin with old origin cleared.
3. Filter/tab/dataset context change -> cleared pin; unchanged viewport resize retains current selection under existing rules.
4. Export request -> immutable selection/context plus isolated owned capture resources.
5. Prepared capture -> resolved export anchor -> full callout candidate; unavailable full placement -> complete-headline candidate.
6. Valid candidate -> single composed PNG shared by preview/download. No readable compact placement or unresolved visible anchor -> existing export error feedback.
7. Success, cancellation, or failure -> release request resources in finally; do not change the live pin unless independent user/context actions already did so.