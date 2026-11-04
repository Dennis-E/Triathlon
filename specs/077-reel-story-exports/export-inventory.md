# Export Surface Inventory

**Inspected**: 2026-11-03
**Purpose**: Evidence for the complete current export scope; code references describe the baseline, not a prescribed implementation.
**Specification**: [spec.md](spec.md)

## Shared Production Path

- [index.html](../../index.html) supplies the export buttons, format selectors, preview, and Personal Best detail dialog. [src/dashboard-tabs.js](../../src/dashboard-tabs.js) wires preview download and Personal Best detail export actions.
- [src/dashboard-export.js](../../src/dashboard-export.js): `EXPORT_CAPTURE_TARGET_IDS` registers 13 tab targets; `getExportableFlags`, `getTabExportTarget`, and `getExportPresentationData` resolve readiness, selection context, and presentation data.
- The same module's `exportVisualizationTab` / `exportActivePbDetail` lead to `exportVisualizationTarget`, `createExportCaptureSnapshot`, `drawExportComposition`, `prepareExportImage`, preview, and `downloadExportedImage`. The shared capture uses `html2canvas`; composition produces PNG images. Specialized drawing currently exists only for Distance, Equipment ranking, and Equipment Timeline.
- [src/export-utils.js](../../src/export-utils.js) owns format dimensions, display titles, filenames, layout, fit, typography/colour configuration, metadata, legends, and image validation. The baseline offers square 1080 x 1080 and portrait 1080 x 1350 only.
- [src/dashboard-tooltips.js](../../src/dashboard-tooltips.js) supplies isolated chart snapshots for registered adapters. The current composition can include pinned inspection callouts; the new social-export specification intentionally excludes them.

## Complete Registered Target Inventory

All target rows use the shared production path above; the table identifies the content owner and any special production branch.

| Target key | Visualization and variants | Capture target ID | Current producer / export-specific behaviour |
| --- | --- | --- | --- |
| totalDistance | Distance; daily, weekly, monthly, yearly; all/single sports and selected timeframe | totalDistanceChartWrapper | [src/dashboard-core.js](../../src/dashboard-core.js), `totalDistanceDashboard.getExportData`; `drawDistanceExportChart` redraws stacked period data. |
| paceMetrics | Pace vs metrics; sport-specific pace/speed, heart rate, cadence, elevation, distance, years, trend visibility and point sizing | paceMetricsChartWrapper | [src/dashboard-scatter.js](../../src/dashboard-scatter.js), `paceMetricsDashboard.getExportPresentationData` and `getExportSeries`; isolated chart snapshot and shared composition. |
| equipment | Equipment ranking; distance, pace, count, average length; shoes/bikes/all and applicable year/palette choices | equipmentChartWrapper | [src/dashboard-equipment.js](../../src/dashboard-equipment.js), `equipmentDashboard.getExportData`; `drawEquipmentRanking` redraws rows with a format-dependent top subset. |
| equipmentTimeline | Equipment usage spans or individual activity mode; shoes/bikes/all | equipmentTimelineWrapper | [src/dashboard-equipment.js](../../src/dashboard-equipment.js), `getTimelineExportData`; `drawEquipmentTimeline`, `getExportTargetPages` create rows and continuation images with a common time scale. |
| personalBests | Registered Personal Best overview target; user-facing exports are detail variants listed below | pbColumnsContainer | [src/dashboard-power-pb.js](../../src/dashboard-power-pb.js), `renderPbChart`; registered by exporter but no current overview export button was found in the markup. Do not mistake this registration for an additional visible action. |
| heatmap | GPS Heatmap; sport, year, colour scheme and selected map viewport | heatmapMapContainer | [src/dashboard-heatmap.js](../../src/dashboard-heatmap.js), `heatmapDashboard.getExportData`, `captureAtExportSize`; capture removes map zoom controls and handles palette styling. |
| distributions | Training distributions; length, duration, pace, elevation, power; sport selection | distributionsChartWrapper | [src/dashboard-distributions.js](../../src/dashboard-distributions.js), `renderDistributionsChart`; isolated chart capture with shared selection context and composition. |
| workoutTime | Workout Time; day/week/month/year, count/duration/distance and sport selection | workoutTimeChartWrapper | [src/dashboard-workout-time.js](../../src/dashboard-workout-time.js), `renderWorkoutTimeChart`; isolated export-resolution chart snapshot and shared composition. |
| trainingCalendar | Training Calendar; multiple years, sport selection and intensity palettes | trainingCalendarYears | [src/dashboard-training-calendar.js](../../src/dashboard-training-calendar.js), `trainingCalendarDashboard.getExportData`; export capture adjusts year sections, intensity colours, dimensions and overflow. `getExportTargetPages` paginates; capture generation currently enumerates square/portrait explicitly. |
| wordcloud | Workout Title Wordcloud; current included terms and frequency weighting | wordcloudCanvas | [src/dashboard-wordcloud.js](../../src/dashboard-wordcloud.js), `wordcloudDashboard.canRequestExport` and `hasExportableCloud`; readiness-gated canvas snapshot and shared composition. |
| pieCharts | Pie Charts; sport/duration/pace/equipment/length/power grouping, count/time/distance slice size, sport, time selection and palette | pieChartsCaptureArea | [src/dashboard-pie-charts.js](../../src/dashboard-pie-charts.js), `renderPieCharts`, `getExportChartImage`; capture substitutes a chart image, hides a duplicate summary, and arranges chart plus legend horizontally. |
| lifetimeStatistics | Lifetime summary; totals, milestones, equipment counts, country summary when available | lifetimeStatisticsExportArea | [src/dashboard-lifetime-statistics.js](../../src/dashboard-lifetime-statistics.js), `renderLifetimeStatistics(summary, { export: true })`; separate export-only summary markup, not the full dashboard sport table. |
| mediaGallery | Prepared media annual recap and collage; year/sport/activity filters or explicit selection, routes included/excluded | mediaGalleryExportArea | [src/dashboard-media.js](../../src/dashboard-media.js), `createMediaExport`, `createMediaAnnualRecap`, `createMediaCollage`; builds export-only media markup, invokes shared export, and leases selected media for isolated capture. |

## Additional User-Facing Variants

### Personal Best Detail Exports

The `pbDetailExport` action calls `exportActivePbDetail`, creates a `kind: 'pb-tile'` target, and captures `pbDetailCaptureTarget`. [src/dashboard-power-pb.js](../../src/dashboard-power-pb.js) produces the detail chart through `renderPbDetailChart`; `personalBestsDashboard.getActiveExportData` supplies record values and context. Each configured record definition must receive its own review row, rather than testing only a representative record.

- Run, Bike, and Swim distance-based Personal Best details for every configured distance available in the selected dataset.
- Longest swim, longest run, and longest bike record histories.
- Most elevation (Run) and most elevation (Bike) record histories.
- Bike power-duration record histories for every configured duration.
- Bike all-time power profile across durations.

Detail capture currently gives the chart a fixed wide shape and enlarges selected labels/callouts before composition. That baseline is not evidence that tall-layout requirements are already met.

### Media Image Exports

- Annual recap requires a selected year; collage can use explicitly selected media or the filtered set.
- Both sort readable assets chronologically and currently limit prepared output to 12 items. Video inputs contribute still-image previews, not exported video.
- Route inclusion is user controlled. Current prepared markup includes captions or filenames; this must not be generalized into permission to expose activity titles elsewhere.
- Both variants enter the same `mediaGallery` image-preview/download path; the gallery Export button can also export the prepared area. There is no separate video-download pipeline in the inspected image-export surface.

### Multi-Image Outputs

Training Calendar and Equipment Timeline already support continuation images. Their page counts depend on format and content. They are part of the full surface, including page context, scale consistency, preview navigation, and per-page downloads.

## Baseline Risks Relevant to the Specification

- Most views currently use contain-fit of captured content, which can retain a landscape shape and create unused vertical area. Adding only a format constant is insufficient.
- Specialized Distance drawing currently limits yearly labels/data to the most recent ten years; the feature's no-silent-truncation rule requires explicit coverage decisions.
- Equipment rows and timeline page sizes currently distinguish only square and portrait. Calendar capture generation also explicitly lists only these formats.
- `getSocialExportPresentation` currently omits humour for Pace vs metrics and some all-sport/equipment combinations. Universal optional humour is therefore a behavioural change, not merely a label change.
- Several views rely on fallback context rather than a dedicated data adapter. Dataset-wide dates or metric-agnostic headlines must not override the actual filtered meaning.
- The current safe margin and small branding text are not sufficient evidence for the new phone-readability and Instagram-safe-area requirements.
- Format/caption composition is asynchronous. Current shared state must be reviewed against the latest-selection and no-stale-download contract; this inventory does not claim the existing flow satisfies it.

## Inventory Maintenance

The baseline was reconciled against registered capture targets, export controls in the full dashboard markup, Personal Best detail wiring, media-generation actions, and image/download producers across the source tree. No additional independent user-facing image-download path was found. New targets, detail definitions, generated variants, or pagination modes must extend this inventory and the specification's full visual-review matrix.