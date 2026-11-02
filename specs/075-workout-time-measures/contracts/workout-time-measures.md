# Contracts: Workout Time Measures

These are proposed additive interfaces for implementation; they do not claim new source APIs already exist.

## Pure Utility Contract

Owner: src/workout-time-utils.js, retaining CommonJS and window.workoutTimeUtils exports.

- Existing GRANULARITIES, matchesFilters(), getGroupDefinitions(), and buildWorkoutTimeDataset(activities, filters = {}) remain callable with their current signatures.
- Add MEASURES with count, duration, distance and pure getMeasureDefinition(measure) / formatWorkoutTimeValue(value, measure) helpers through both existing export bridges. Count remains the omitted-measure default; unknown explicit measures fail validation rather than silently displaying the wrong quantity.
- filters.measure is additive. Existing filters.sport, minDate, maxDate and granularity retain their semantics. Existing group count and root activityCount keep their meanings even when a different measure is selected.
- Extend group and dataset results as specified in [data-model.md](../data-model.md). Validate availability flags and finite nonnegative values before summing. No input mutation, early rounding, source parsing, or alternate metric inference.
- Format count as a whole value, duration as a cumulative hour/minute/second quantity, and distance as fractional kilometers. A null value formats as Not available, never 0. Formatting may round for display only; 4500 seconds must represent 1h 15m and an axis value of 1.25 hours.

## Selector And State Contract

Owner: index.html and src/dashboard-workout-time.js.

| Concern | Contract |
|---------|----------|
| New group ID | workoutTimeMeasure; accessible name Measure |
| New button IDs | workoutTimeMeasureBtnCount, workoutTimeMeasureBtnDuration, workoutTimeMeasureBtnDistance |
| Visible choices | Workout number, Duration, Distance |
| Selected state | Exactly one active/pressed choice; count initially |
| Setter | setWorkoutTimeMeasure(measure); accept only count/duration/distance, no change on invalid input |
| Session state | selectedWorkoutTimeMeasure; no localStorage, no reset on other filters, tab visits, or replacement import |
| Pin state | Invalidate before changing a different measure and before rendering its result |
| Preserved IDs | vizTabWorkoutTime, vizPanelWorkoutTime, workoutTimeChartWrapper, workoutTimeChart, workoutTimeActivityCount, workoutTimeEmptyState |
| Existing controls | Existing granularity, sport, and date control IDs unchanged |

Use the established segmented control style, visible focus, and synchronized aria-pressed state. No new explanatory on-screen instructions or new visualization tab are needed.

### Keyboard Domain

getWorkoutTimeKeyboardAdapter() exposes granularity -> sport -> measure -> start -> end. Domains are day/week/month/year, All/Run/Bike/Swim, count/duration/distance, start index 0..maxIndex, and end index selectedStart..maxIndex respectively. The end minimum reads the start value at prefix[3]. Full candidate validation remains atomic; no intermediate render is allowed with only some filters applied.

Retain normal Tab/Shift+Tab, Enter/Space activation, existing workspace arrow navigation, and text/native input editing boundaries. Verify src/tab-navigation.js constants/order against index.html markup/dispatch and related tests without renaming unchanged IDs.

## Rendering And Availability Contract

- Chart categories and sequence remain the existing field definitions. Only numeric measure, labels, units, and coverage detail change.
- Data values: count unchanged, duration value / 3600, distance value unchanged; preserve null for unavailable nonempty fields. Keep empty fields zero and genuine available zeros zero.
- Value-axis titles: Workouts, Duration (h), Distance (km). Count ticks use whole values; hours/km ticks may be fractional. The activity-count summary remains the number of eligible workouts regardless of selected-measure coverage.
- Shared formatted detail contains the field name, selected measure, formatted raw value/unit, and status explanation: No activities; complete value; Available for X of Y workouts; or No usable duration/distance values. Never let a native null-tooltip filter hide the required explanation.
- Dataset empty -> existing no-eligible-activity state. Dataset unavailable -> selected-measure unavailable explanation. Both use workoutTimeEmptyState and clear/destroy obsolete chart content. Complete/partial, including a valid all-zero dataset, show the chart and hide that state.
- Keep selector and other filter controls operable in either unavailable state. Global Workout Time tab availability remains based on eligible activities, not the currently selected measure, so switching back to count remains possible.

## Opt-In Chart Inspection Contract

Owner: src/dashboard-tooltips.js; supplied by src/dashboard-workout-time.js.

Extend attachChart(tabId, chart, inspection = {}) without changing existing two-argument callers:

- inspection.resolveHits(event, chart): returns actual category/dataset hits from pointer position within chartArea. Workout Time maps X to its existing ordered field; clicking outside chartArea does not fabricate a selection. Zero/null fields are included.
- inspection.describeContent(chart, hits): returns complete plain tooltip content from the immutable render-local field dataset, not mutable global measure state or native tooltip rows. Existing contentFromChart() remains the default for callers without this hook.
- inspection.anchorPoint(chart, hit): returns finite {x, y} using the supplied chart's category and selected-value scales. Null/zero fields anchor at that category and the zero baseline; private snapshot charts call the same hook against their own dimensions.
- The opted-in path supports pointer hover/leave, click/tap, keyboard field inspection/pinning, replace, toggle, Escape, and dismiss via the existing controller. Native tooltip rendering must not duplicate the shared overlay for Workout Time. Other charts keep their previous behavior.
- Keyboard field traversal must include every existing field, even when the native metadata marks null entries skipped. Do not depend on native tooltip activation to construct unavailable detail. If metadata is absent, resolve the category from its field identity rather than inventing a neighboring hit.
- Keep selection content plain/finite and snapshot-owned; derive selectionKey from grouping, measure, and field key. Keep actual chartElements indices for export identity. Missing or invalid finite anchors are errors, never grounds to point at another field.

## Export Contract

Owner: src/dashboard-export.js, retaining workoutTime -> workoutTimeChartWrapper.

- Add the selected Measure to getExportContext(workoutTime) and its three options/selected state to getAvailableControlContext(workoutTime). Do not reintroduce a metadata bar or change global export layout.
- Measure-specific axis text and pinned field detail make exported values identifiable in the actual image. Use the existing full/headline speech bubble and request-owned private chart/anchor flow.
- getExportableFlags().workoutTime continues to follow the correctly maintained empty-state visibility, not value > 0. A valid zero-total measurement can export; empty and all-unavailable selections cannot produce a populated export.
- Snapshot before the first await: chart data/options, render-local field metadata used by callbacks, measure labels/units, and optional pinned selection. After an independent measure/filter/tab/data change, that request still describes its original chart and field.
- Preview and download share the same prepared PNG. Success/cancellation/failure does not itself mutate the live measure or pin. Preserve resource release and existing error feedback.

## Verification Contract

- Exact count parity and 48 grouping/sport/measure combinations using known synthetic histories. Verify inclusive date bounds, invalid timestamps, boundary-spanning workouts, explicit false flags with zero placeholders, absent flags with valid zero, invalid numeric values, partial/unavailable fields, valid all-zero data, >24h duration, and unrounded raw sums.
- UI/VM tests prove validated state changes, one active/pressed measure, filter retention, replacement-import retention, default on reload, pre-change pin invalidation, and shifted dependent start/end domain indices.
- Adapter/browser tests inspect and pin zero/null fields by pointer, touch, and keyboard and resolve finite anchors in live/private charts. Regression tests exercise a two-argument non-Workout chart to prove opt-in isolation.
- Export tests cover all three measures, pinned/unpinned, valid zero versus all unavailable, request-time callbacks and label isolation after delayed preparation, and shared prepared PNG/resource lifecycle.
- SC-005 browser measurement includes visible rendering completion, not just aggregation runtime: 10,000 activities, 20 switches cycling all measures, same filters, recorded actual Chart.js/browser/machine versions, at least 19 results <= 1000 ms, no reimport. Record any failure rather than weakening the threshold.