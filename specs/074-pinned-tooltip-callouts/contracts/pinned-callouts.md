# Contracts: Pinned Export Callouts

## Lifetime Statistics UI

The statistic itself is the inspection target; no separate Pin data symbol or icon control remains. A content target uses its existing stable statistic identity, visible focus, accessible name, button activation semantics, and synchronized pressed state. Preserve table semantics by focusing content inside a row rather than changing the row's role. Pointer/touch click and Enter/Space activate exactly once; Space prevents page scrolling. Reselect toggles, selecting another statistic replaces, and Escape/dismiss releases. Existing primary actions and pin controls in other views remain unchanged.

## Export Anchor Adapter (Proposed Additive Contract)

`resolveExportAnchor(selection, captureContext)` returns a plain resolved anchor described in [data-model.md](../data-model.md). Existing adapter methods retain their signatures and behavior.

- selection is the immutable request-time detail, not the current controller state.
- captureContext contains the request-owned target kind, source/render identity, isolated capture element or renderer layout, and final capture dimensions. Export-specific DOM/canvas resizing must be reflected before anchor resolution.
- Preparation may be asynchronous, but context resources and their underlying data must have been acquired before the first await. No resolver may consult a replaced live chart, changed selection, released media URL, or restored map dimensions.
- visible means the selected item exists within the captured pixels. capturePoint is normalized against the whole captured image, accounting for nested canvas offsets and resized renderers.
- outside-view means a selected map/item location is outside the visible capture. not-in-export means it is genuinely omitted by an alternate export layout. Both require an item-identifying explanatory note and no tail.
- An unresolved anchor for a visible captured item must fail preparation rather than silently produce an unanchored or falsely associated bubble.

### Capture Coverage

| Tab ID | Capture Target | Required Projection |
|--------|----------------|---------------------|
| totalDistance | totalDistanceChartWrapper | selected chart element through canvas offset/size into wrapper |
| paceMetrics | paceMetricsChartWrapper | selected chart element/group through wrapper transform |
| equipment | equipmentChartWrapper | selected chart element through wrapper transform |
| equipmentTimeline | equipmentTimelineWrapper | selected timeline element through wrapper transform |
| personalBests | pbColumnsContainer | selected PB item in captured columns; pb-tile variant uses pbDetailCaptureTarget |
| heatmap | heatmapMapContainer | selected geoPoint in the actual capture map state; outside-view when appropriate |
| distributions | distributionsChartWrapper | selected bin/group through wrapper transform |
| workoutTime | workoutTimeChartWrapper | selected chart item/group through wrapper transform |
| trainingCalendar | trainingCalendarYears | selected day within captured year layout |
| wordcloud | wordcloudCanvas | selected rendered word, not inspection-list coordinates; omitted words explicitly not-in-export |
| pieCharts | pieChartsCaptureArea | selected arc in export-resized chart with legend/layout offsets |
| lifetimeStatistics | lifetimeStatisticsExportArea | selected captured KPI; excluded sport row explicitly not-in-export |
| mediaGallery | mediaGalleryExportArea | selected image in exported collage; omitted media explicitly not-in-export |

Preserve these IDs, tab order, dispatch, and export mappings. This is a behavior-only change, not a navigation migration.

## Pure Callout Layout (Proposed Additive Contract)

`computeTooltipCalloutLayout({ content, anchor, visualizationRect, bounds, protectedRects, measureText })` returns one derived callout layout or throws RangeError when no readable layout exists. Add through the existing export-utils CommonJS and browser global bridge without changing existing exported signatures.

- visualizationRect is the exact final-image rectangle used to draw the captured image after contain-fit and centering. Map a normalized visible capture point with x = visualizationRect.x + capturePoint.x * visualizationRect.width, and equivalently for y.
- bounds describes image-safe placement limits; protectedRects describe header, legend, branding, and any required reserved export regions. Include a small selected-anchor exclusion region when visible.
- First measure full content with the existing text fitter at a bounded candidate width; derive body width from measured lines plus padding, not the entire visualization width. Start with a 360 px preferred body width and 480 px maximum on the 1080 px export, reducing to available width where needed; retain the existing 18 px minimum text size and 280 px text-layout height cap.
- Evaluate four bounded side candidates in a deterministic order, preferring short tails and minimal displacement from the selected item. Reject collisions and out-of-image geometry; clamping must not silently introduce overlaps.
- Retry placement in complete-headline mode when no full-content candidate fits. Preserve the association note even in compact mode. Never truncate the headline, omit the pin, or revert to a bottom bar.
- A visible-item tail is a tapered triangle attached to the body, ending just outside an approximately 10 px selected-anchor clearance region. The body and tail must not cover the selected item or protected content.
- Unanchored bubbles for outside-view/not-in-export choose an available bounded region, include the required note, and have tail: null. They are still compact bubbles, never a full-width strip.
- Return plain serializable geometry and text metadata; do not mutate content, snapshot, or anchor. Geometry must be testable with deterministic measureText and without browser globals.

## Composition And Resource Contract

drawExportComposition() stops reserving annotationHeight for pinned exports and draws the captured visualization using its existing no-pin fit. It draws one 8 px-radius outlined bubble body, an optional tapered tail, and text; it excludes pin/dismiss UI. No-pin images preserve existing composition and no-data behavior.

Header/legend/branding bounds must be computed from the actual export variant, including Lifetime's early-return path and PB-detail layout. Protected areas are not estimated from a generic chart alone.

Export requests keep their isolated canvas pixels, immutable detail context, and independent media leases. prepareExportImage() continues to produce one prepared PNG used by preview and download. Closing the preview, completing download, or failing preparation releases request-owned resources via existing lifecycle paths and does not dismiss the live pin.

## Test Contract

- Existing public helper tests continue to pass; add deterministic geometry cases for four sides, edges, corners, dense content, full-to-headline placement fallback, mandatory off-screen notes, and impossible fit.
- Test actual pinned composition drawing, not only a mocked compositor: one body/tail, correct projected tip, no annotation strip, no duplicate labels/control glyphs, unchanged no-pin fit, and actual protected rectangles.
- Exercise all capture mappings above, including nested canvas offsets, DPR differences, resized pies, map capture/restoration, Lifetime excluded sport rows, media collage omissions, and PB-detail captures.
- Retain request-time selection and resource-isolation regression tests with deferred preparation and live-state changes after the request.
- Verify final images at native size and 360/1440 px interaction viewports; unit spies alone do not prove readable cartoon callouts.