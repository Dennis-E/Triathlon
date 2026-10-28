# Contract: Tooltip Interaction and Export

This contract describes proposed additive browser/module interfaces and observable UI behavior. No HTTP endpoint or persisted schema is introduced. Data shapes and transitions are defined in [data-model.md](../data-model.md).

## Pure Utility Boundary

`src/tooltip-selection-utils.js` exports the same API through CommonJS and `window.tooltipSelectionUtils`:

| Proposed operation | Contract |
| --- | --- |
| `transitionSelection(state, event)` | Return new plain selection state; no DOM mutation, analytics, timers, or global dashboard reads. Enforce context validity, toggle/replace rules and immutable content. |
| `copyPinnedSelection(state, context)` | Return a deep independent pinned selection only if the context matches; otherwise null. Never include a transient tooltip. |
| `resolveTooltipPlacement(contentSize, bounds, anchor)` | Return finite in-bounds placement and explicit association visibility; do not change selection content. |

Use the existing export utility's layout boundary for image annotation measurement rather than introducing a second competing export compositor. Preserve current public helper signatures, adding optional inputs where appropriate and updating their consumers/tests together.

## Dashboard Adapter Boundary

The orchestrator owns the selection store, accessible live overlay, focus ownership, context invalidation, and export access. Each registered adapter identifies exactly one existing tab and implements these capabilities:

| Capability | Required behavior |
| --- | --- |
| `readContext()` | Return current dataset/view/generation identity and copied displayed-data settings. |
| `resolveItem(input)` | Resolve pointer/tap/keyboard target using renderer hit logic; return stable item identity or no hit. A currently shown grouped tooltip remains the target group. |
| `describeItem(item)` | Return complete existing formatted TooltipContent plus anchor; use existing formatting and snapshot sampled data. |
| `inspectItem(direction)` | Move a roving active inspection item through valid data items without triggering tab/filter navigation. DOM adapters may use existing focusable items. |
| `projectAnchor(selection)` | Reproject the same item after resize/map movement; return explicit outside-view state when needed. |
| `snapshotCapture(context)` | Synchronously isolate renderer source and tooltip-free content for that exact context. Return owned recipe/resources; never mutate the live chart or selection. |
| `dispose()` | Remove listeners, overlays and private references for the adapter lifecycle; never leave duplicate handlers after redraws. |

Registration covers exactly `totalDistance`, `paceMetrics`, `equipment`, `equipmentTimeline`, `personalBests`, `heatmap`, `distributions`, `workoutTime`, `trainingCalendar`, `wordcloud`, `pieCharts`, `lifetimeStatistics`, and `mediaGallery`. Rendering modes and PB detail dialog remain adapter-owned rather than new tabs.

### User Input and Accessibility

1. Ordinary data click/tap pins, replaces, or toggles off the selected item. Empty space does not pin or dismiss. Hover never replaces a pin.
2. Existing primary clicks remain intact. Media opening and collage selection keep their original controls; an independent item-level pin action is keyboard/touch reachable and not nested inside another button or link.
3. Canvas views expose one focusable inspection entry with a roving active item and readable description, not thousands of tab stops. Arrow navigation belongs to that inspector; Enter/Space selects. DOM/SVG targets use equivalent native or explicit keyboard activation.
4. The overlay has an accessible region name, item description, pinned-state text/symbol, and a labelled dismiss button. Expose active-item selection through an appropriate ARIA selected/pressed state on its action, rather than attaching unsupported attributes to tooltip text. Focus remains visible.
5. Escape first releases a pin within its inspection/detail scope and is consumed there. A subsequent Escape may close the PB detail dialog; unrelated modal ownership remains unchanged. Dashboard capture-phase arrow handlers must recognize the inspector before handling its keys.
6. Touch hit resolution is independent of hover. Map movement beyond the existing drag tolerance remains navigation, not a click. Tooltip interaction never starts unintended map dragging.
7. Live content may scroll on small screens; dismissal remains reachable. Export uses full semantic content, not the visible scroll slice. User text is rendered safely as text.

## Context Invalidation Contract

Before a new displayed-data result is committed, clear selection for changes to sport, metric, timeframe, aggregation, data-affecting mode, visible series/legend, word inclusion, media filters/collage membership, and imported data. Tab switch and return to landing clear selection before panel transition. Wire centralized revision paths plus explicit owner hooks for controls not covered by them. Palette/layout-only changes may preserve the pin if item content and membership are unchanged; capture their presentation independently. Resize and map pan/zoom preserve it.

## Export Request Contract

1. Retain current active-target/no-data/concurrency checks. Validate target and requested selection context synchronously.
2. Before the first await, deep-copy the request description and isolate its source. Preserve DOM/SVG dimensions, route pixels, map transforms/tiles, media sources, chart presentation, and native-tooltip-free chart recipes. Acquire the media-source lease described below at this point; later independent file reads are allowed, later reads from cleared live asset objects are not. Snapshotting only the pin, target labels or live URL strings is insufficient.
3. Finish only snapshot-owned or generation-bound work. Never use a later live palette, dataset, selection, legend, or wordcloud render. Missing/unrecoverable request-time content causes the existing capture-failed path.
4. Capture private, measurable, noninteractive staging content; exclude all transient tooltips and live interactive overlays locally. Do not use display:none for a source that needs layout, and do not mutate/hide/restore live pins.
5. Draw exactly one annotation from the copied pinned model. No pin means no annotation or transient data tooltip. Keep the existing 1080-square output, title, context, branding, legend, and no-data behavior.
6. Measure wrapped text at no less than 18 output pixels. Reserve space before placing chart and annotation. Use complete headings, rows, units, footer and notes when they fit; otherwise switch automatically to a compact annotation containing the complete headline, or existing item/group label if there is no title. Preserve required outside-view association. Omit detail rows only in this compact export presentation, never from the live tooltip or snapshot. Wrap the retained headline without clipping; fail for fit only if even this compact presentation cannot fit readably. Do not shrink below the minimum, paginate, or change output dimensions silently.
7. Visible selected items get a matching marker or connector. An off-screen map item gets its identity and an outside-current-view note without a false anchor. A media/statistic item absent from a specialized export summary is identified without pointing at unrelated content.
8. Decode and validate the PNG before publishing the result. Preview and download reference identical image bytes and copied request metadata. Existing picker/fallback and ownership rules remain in force.
9. Asset, snapshot, fit, capture, or decode failures retain live state and use existing error feedback. Clean private resources on every terminal path. Never restore an old live pin over newer user interaction.

### Media Source Ownership Contract

The existing media library in `src/zip-importer.js` gains an additive `acquireExportSources(assetKeys)` operation. It synchronously validates selected keys and retains ready Blob/pixel sources or reader functions/read promises independently of the live asset objects and URL cache. It returns an exclusive MediaSourceLease as defined in the data model. It must not defer source acquisition until after an await or require a later `library.getObjectUrl` call.

Each resolved Blob gets a request-owned URL; ready decoded pixels can instead be copied synchronously. Preserve the currently displayed video thumbnail/data-URL fallback rather than regenerating from a live video URL. Cache eviction, gallery clearing and replacement-dataset `mediaLibrary.release()` continue to release live resources normally, but never invalidate accepted export sources. The lease's idempotent release revokes only its own URLs and drops/closes its sources after PNG readiness, failure or cancellation. Preview/download use the independent PNG, not these temporary source URLs.

Request acceptance fails clearly if an independent source cannot be secured; it never silently substitutes the replacement dataset, missing media, or a later video frame.

## Script and Compatibility Contract

- Load the utility before `src/export-utils.js`; load `src/dashboard-tooltips.js` immediately after `src/dashboard-state.js` and before `src/dashboard-core.js`.
- Update the exact-order assertions in `__tests__/index-script-syntax.test.js` and the existing modularization script-load-order document with the production wiring.
- Keep current tab IDs, order, capture targets, and export button dispatch intact. Extend navigation ownership and tab-navigation tests where needed.
- Keep static/CDN delivery, CommonJS utility tests, and existing API/CLI dependency boundaries. This feature introduces no new request containing imported activity or tooltip content.

## Required Contract Tests

Shared tests enumerate the thirteen adapters and cover pin stability, same-item toggle, different-item replacement, full grouped content, no hit, no data, safe text, and disposal. Add context reset tests for every nonstandard control and for imports/tab transitions. Export tests must hold asynchronous work pending, mutate live state, and prove request-time image/context identity, tooltip-free no-pin captures, exactly one annotation, cleanup and current live-state preservation. Browser tests inspect actual pixels and accessible interaction, not only mocked canvas calls.

Media release-race tests must use an actual synthetic library from `extractMediaFromZip` and the real import/release path, mocking URL creation/revocation with a validity registry. Pause export, replace the dataset, assert live URLs are revoked and old readers cleared, and reject capture attempts that use revoked sources. Original images, displayed video thumbnails, context and pin must still reach the same preview/download PNG through the owned lease. Assert exactly-once lease cleanup on success/failure/cancellation and no revocation of replacement-dataset resources.