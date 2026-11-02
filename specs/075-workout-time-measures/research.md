# Research: Workout Time Measures

## 1. Extend The Existing Aggregator

**Decision**: Add optional filters.measure = count|duration|distance to buildWorkoutTimeDataset() in src/workout-time-utils.js. Preserve existing group count and root activityCount independently of the selected measure; add raw sums, availability counts, selected value, and coverage status.

**Rationale**: Current eligibility requires valid Date objects for both date and startTime, applies inclusive date-range filtering to date, and assigns a field by local startTime. The same activities must qualify for all measures. A single aggregation pass over fixed group definitions gives exact parity without duplicating filters or adding activity-level chart points.

**Alternatives considered**: Three independent aggregators (duplicated eligibility rules); redistribute duration across time boundaries (contradicts FR-006); change existing count to selected volume (breaks public meaning and availability consumers).

## 2. Honor Import Availability And Units

**Decision**: Duration uses activity.duration in seconds with durationAvailable !== false; distance uses activity.distance in kilometers with distanceAvailable !== false. In both cases require a finite nonnegative number. Missing flags do not invalidate otherwise usable values, including zero.

**Rationale**: src/dashboard-utils.js emits unavailable source measurements as numeric zero with the corresponding flag false. src/lifetime-statistics-utils.js already distinguishes these from measured zero using this rule, but its flag-checking helpers are internal. Use a small local pure check in workout-time-utils.js rather than changing that unrelated module's API. The recorded duration follows the existing imported workout-duration meaning; do not substitute elapsed time or reparse raw files.

**Alternatives considered**: Numeric check only (counts missing placeholders as real zero); require a true flag (rejects valid older/synthetic records with absent flags); test truthiness (rejects genuine zero); infer distance/duration from other fields (changes source semantics).

## 3. Represent Coverage Explicitly

**Decision**: Derive empty, complete, partial, and unavailable status from eligible and available counts. Selected values are zero for an empty field, null for a field with workouts but no usable selected measurement, and the usable raw sum otherwise. Global all-unavailable is distinct from valid all-zero.

**Rationale**: The same zero-height visual space can mean no activity, a real measured zero, or unavailable data. Status and coverage must determine detail text and export eligibility, not positive bar height. Existing getExportableFlags() already uses workoutTimeEmptyState visibility; a correct state transition can preserve that gate without a new export protocol.

**Alternatives considered**: Coerce unavailable values to zero (misleading); remove fields (changes ordering/group structure); block every zero-total export (rejects valid measured-zero histories).

## 4. Keep Zero And Unavailable Fields Inspectable

**Decision**: Add opt-in resolveHits, describeContent, and anchorPoint callbacks to the current attachChart() adapter, supplied only by Workout Time. Resolve category hits within chartArea, build detail from the captured field model, and use category/zero-baseline scale coordinates when there is no nonzero bar. Use the same callback for private export chart anchors.

**Rationale**: Current nearest/intersect hit testing cannot reliably select a zero-height bar. contentFromChart() depends on native tooltip filtering, which may omit null values. Existing keyboard traversal includes metadata elements without validating the numeric value, but it does not guarantee complete null detail or finite anchors. Opt-in callbacks address the actual gap while retaining the shared selection state, keyboard traversal, snapshot ownership, and other charts' defaults. When callbacks handle hover through the shared overlay, disable duplicate native hover content for this chart.

**Alternatives considered**: Epsilon or positive dummy values (fabricated volume); minBarLength as a data workaround (visually implies positive volume); independent pin controller (duplicates lifecycle/export behavior); global hit-testing change (unnecessary regressions in other views).

## 5. Extend Only The Workout Time Filter Domain

**Decision**: Use granularity -> sport -> measure -> start -> end for Workout Time keyboard cycling. Add count/duration/distance between sport and start, updating dependent date indices atomically. Keep the chosen measure for the page session, including replacement imports.

**Rationale**: getWorkoutTimeKeyboardAdapter() currently defines granularity -> sport -> start -> end, with end.min depending on the selected start. createDashboardFilterAdapter() validates a full candidate before commit. Shifting that dependency explicitly prevents invalid ranges or a metric that silently disappears from keyboard navigation.

**Alternatives considered**: Pointer-only measure selection (fails accessibility/navigation requirements); resetting measure on every other filter or tab change (unexpected and contrary to FR-010); localStorage preference (unrequested persistent behavior).

## 6. Reuse Request-Time Exports And Existing Tests

**Decision**: Add measure to existing export context/control summaries, retain workoutTimeChartWrapper, and capture all measure-dependent chart callbacks against immutable render-local metadata. Reuse request-time selection/private chart capture and prepared PNG for preview/download.

**Rationale**: The export already copies target/pin and isolates pixels before its first await. Re-reading selectedWorkoutTimeMeasure inside callbacks after a switch would bypass this isolation even if pixels are copied. Axis labels and tooltip content must therefore be captured with the same model. No export context bar or new workflow is needed.

**Alternatives considered**: Regenerate the chart at download time (different measure or selection); serialize only the global measure key but use mutable callbacks (race); add a new export action or global layout change (unnecessary scope).

**Decision**: Extend existing workout-time-utils, dashboard-core, dashboard-tooltips, index-script-syntax, tab-navigation, and dashboard-export-download suites; use browser tests for actual null/zero hit testing and rendering.

**Rationale**: Jest runs in Node, not jsdom. Existing VM and fake-document harnesses cover these owners, so no new test file or dependency is required. The CDN Chart.js load is currently unversioned; validate browser behavior against the actual loaded version and record it, without expanding this feature into dependency pinning.

All research questions are resolved. No user clarification, new package, backend service, or parser change is required. The exact proposed additive interfaces are defined in [contracts/workout-time-measures.md](contracts/workout-time-measures.md).