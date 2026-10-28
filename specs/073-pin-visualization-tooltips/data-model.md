# Data Model: Pinned Visualization Detail

This is an ephemeral browser model, not a database schema. Pure helpers copy and validate plain data; DOM, chart, map, and image resources belong to adapters and request-scoped capture ownership.

## VisualizationContext

| Field | Meaning / validation |
| --- | --- |
| `tabId` | One of the thirteen existing visualization IDs; never infer a tab from a DOM label. |
| `datasetRevision` | Monotonic identity changed before replacing imported data. |
| `viewRevision` | Monotonic identity changed before displayed-data settings change, including legend visibility. |
| `settings` | Copied plain selection values needed to interpret the view, including mode and active series; no functions or DOM references. |
| `renderGeneration` | Identity of the renderer output represented by the context, used to reject incompatible pending work. |

Equality for selecting/exporting requires the same dataset and displayed-data context. Resize and map pan/zoom affect geometry, not context identity; the renderer reports an anchor update without invalidating content.

## TooltipContent

| Field | Meaning / validation |
| --- | --- |
| `title` | Full existing title; never read back an ellipsized visual label. |
| `sections` | Ordered groups of rows, with optional headings; each row retains its existing label, formatted value and unit text. |
| `footerLines` | Ordered totals or grouped footer lines present in the existing tooltip. |
| `notes` | Complete source, estimation, sampling, coverage, missing-data and availability notes. |
| `itemLabel` | Unambiguous description for accessibility and association when no visible anchor exists. |

All content is plain text, rendered with text nodes or canvas text, never inserted as untrusted HTML. Preserve ordering, explicit unavailable values, and all grouped members. Snapshot content is deep-copied; export must never recompute a random heatmap sample or resolve formatting against changed global settings. No new analytics are calculated here.

## TooltipSelection

| Field | Meaning / validation |
| --- | --- |
| `selectionKey` | Stable compound identity: tab, item kind, item/group ID; chart array indices alone are insufficient across changed contexts. |
| `context` | The VisualizationContext in which the detail was selected. |
| `content` | The complete TooltipContent shown at selection time. |
| `anchor` | See Anchor below; retained independently from the pointer. |
| `mode` | `transient` or `pinned`; absent selection represents `idle`. |

There is at most one pinned selection per tab. Switching tabs clears the previous selection rather than retaining hidden pins. No selection is restored after reload or dataset replacement.

### Anchor

- `kind`: `chart-item`, `svg-item`, `calendar-day`, `word`, `map-location`, `statistic`, or `media-item`.
- `itemId`: stable renderer-owned identity matching the selection key.
- `normalizedPoint`: finite x/y relative to the capture area when the selected item has a visible position.
- `geoPoint`: geographic coordinates for heatmap reprojection, when applicable.
- `visibility`: `visible`, `outside-view`, or `not-in-export`; a visible point must remain inside the associated capture geometry.
- `associationLabel`: copied item identity used when no valid visual anchor can be drawn.

An absent item in an export summary/collage does not authorize pointing at another item. Map movement may change visibility and normalized point while retaining geographic identity and content.

## State Transitions

| Current state | Event | Next state / effect |
| --- | --- | --- |
| idle/transient | hover or focus valid item | transient content for that item. |
| transient | leave/blur | idle, preserving existing unpinned behavior. |
| idle/transient | select valid item (including direct tap) | pinned content; validate current context first. |
| pinned | hover, leave, blur, empty-space click | unchanged selection. |
| pinned | select same item | release pin; no sticky state, normal transient behavior resumes. |
| pinned | select different item | replace with exactly one new pinned selection. |
| pinned | dismiss or owned Escape | release pin and restore an appropriate focus target. |
| any | displayed-data commit, tab change, import, landing/reset | idle before new result appears. |
| pinned | resize, pan, zoom | update anchor only, mark outside-view when necessary. |
| pinned | request export | unchanged live state; copy into independent export request. |

Reject stale-context events, invalid item identities and non-finite geometry. A dragged map gesture is not a selection. Re-rendering must neither duplicate handlers nor manufacture a second pinned overlay.

## ExportRequestSnapshot

| Field | Meaning / validation |
| --- | --- |
| `requestId` | Unique identity for cleanup and preview ownership. |
| `target` | Deep-copied tab, capture target, title, legend, filter/control context, palette and existing output configuration. |
| `context` | Request-time VisualizationContext; never subsequently read live settings for this request. |
| `pinnedSelection` | Deep-copied pinned selection or null; no transient selection included. |
| `captureGeometry` | Source dimensions and copied transforms needed for annotation projection. |
| `captureRecipe` | Snapshot-owned renderer inputs, tooltip-free canvas pixels or isolated chart recipe, DOM/SVG source, independently owned media sources, current tile URLs, and render-generation identity. |
| `resources` | Private nodes, canvases, object URLs, image references, and any generation-bound promises; cleaned up on every terminal path. |

Create the plain description and isolate source resources synchronously before any await. The description is deeply immutable; private mutable resources are exclusively owned by this request, not part of the selection state. Resolved chart presentation must not retain closures over live dashboard globals. Pending content may complete only for the captured generation; otherwise fail explicitly.

### MediaSourceLease

An exclusively owned resource under ExportRequestSnapshot.resources, acquired synchronously through the proposed `mediaLibrary.acquireExportSources(assetKeys)` before the first await. This is separate from the immutable plain request description.

| Field | Meaning / validation |
| --- | --- |
| `requestId` | Owner request identity; never release another request's or a replacement dataset's resources. |
| `sources` | Stable asset-key entries with copied descriptive metadata and either retained ready Blob/pixels or captured reader functions/read promises, acquired before live release can clear asset readers. |
| `objectUrls` | URLs created for this lease from retained/resolved Blobs; never aliases of live cache URLs. |
| `videoThumbnails` | Copies of the displayed JPEG data URL/pixels or existing fallback; do not regenerate after request acceptance. |
| `state` | `acquired`, `preparing`, `capturing`, `png-ready`, or `released`; failures/cancellation transition to released. |
| `release` | Idempotent cleanup that revokes owned URLs exactly once and drops retained readers/Blobs or closes owned bitmaps without changing the published PNG or live state. |

Source ownership must exist synchronously, but independent reads may resolve later. The captured reader must remain usable without consulting the cleared asset object or `library.getObjectUrl`. Ordinary live cache eviction and `mediaLibrary.release()` must not revoke this lease's URLs or release its retained sources. Once the independent PNG is ready, release source resources while keeping the result Blob/data URL available for preview/download. Copying an old URL string, cloning an image element, or starting a late read from live assets does not satisfy this model.

## ExportResult

Existing PNG data URL, decoded image, Blob, dimensions and copied target metadata. Annotation presentation is derived as `full` when all detail fits or `headline` when compaction is required; the latter retains the complete title or existing item/group label, plus any required outside-view association. Neither mode mutates the original content model. Publish only after annotation composition, PNG validation and decode succeed. Preview and download consume this one result without recapturing. Retain the current single-request guard and preview/download ownership rules. Failure never replaces a requested pin with a pin-free export.