# Research: Distributions Visual Polish

## Decision: Default state is a plain initializer change, not a reset mechanism

**Decision**: Change `index.html`'s existing `let selectedDistributionsDisplayMode = 'histogram'` initializer to `'line'` (sport filter already defaults to `'All'`). No new "has the user interacted yet" tracking is introduced.

**Rationale**: FR-001/FR-002 only require the *initial* render to be "All Sports" + "Line"; once a user changes either control, the existing `setDistributionsSportFilter`/`setDistributionsDisplayMode` functions already just update the same state variables and re-render — there is nothing to "reset back to," so a one-line initializer change satisfies both requirements with no added state-machine complexity.

**Alternatives considered**: Adding an explicit `hasUserInteractedWithDistributions` flag to defensively prevent any future code from resetting the default — rejected as unnecessary; no existing code path resets these variables outside the user's own control functions, so the extra flag would be speculative complexity with no current failure mode to guard against.

## Decision: Fire color gradient via a shared color-mapping helper, applied per bar/point

**Decision**: Add a pure `getFireGradientColor(position)` function to `src/distribution-utils.js`, where `position` is a normalized `0..1` value (0 = slowest/shortest, 1 = fastest/longest along the chart's effective axis order — see the axis-reversal decision below for how `position` is computed per bucket). It interpolates through a fixed yellow → orange → red stop sequence (e.g. `#FDE047` → `#F97316` → `#DC2626`). In `index.html`:
- **Histogram (bar) mode**: each bucket's bar `backgroundColor` is computed individually via `getFireGradientColor`, producing a per-bar gradient across the x-axis.
- **Line mode (single/combined series)**: the line's `pointBackgroundColor` is set to an array of per-point colors via `getFireGradientColor`; the line's `borderColor` stays a single neutral tone so the stroke itself does not visually compete with the point gradient.
- **Line mode, per-sport lines ("All Sports")**: each sport's line keeps its existing `PB_SPORT_COLOR`-based `borderColor` (so the legend/stroke still distinguishes Run/Bike/Swim, satisfying FR-004's "remaining visually distinguishable per sport"), while `pointBackgroundColor` is still set per-point via `getFireGradientColor` so each line's own points still read slow-to-fast.

**Rationale**: This satisfies FR-003 (consistent gradient on every chart) and FR-004 (gradient plus per-sport distinguishability) without needing a new Chart.js plugin — per-point/per-bar color arrays are natively supported by Chart.js's bar and line datasets.

**Alternatives considered**:
- A single solid gradient-simulating background (e.g. a canvas `CanvasGradient`) — rejected: harder to keep correct across dynamic bucket counts/overflow-underflow buckets, and Chart.js's per-datapoint color arrays already solve this more simply.
- Recoloring per-sport line strokes with the gradient instead of a solid sport color — rejected: would remove the ability to tell Run/Bike/Swim apart at a glance, which FR-004 explicitly requires to remain intact.

## Decision: Duration bucket steps use a fixed minutes-based "nice step" table

**Decision**: Add a `DURATION_NICE_STEPS_SECONDS` constant (`[300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400]` = 5m, 10m, 15m, 30m, 1h, 2h, 3h, 6h, 12h, 24h) and a `computeDurationNiceStep(range, targetBucketCount)` function that picks the smallest table entry whose resulting bucket count (`range / step`) is at or below `targetBucketCount`, falling back to the largest entry for very wide ranges. `computeDistributionBuckets` uses this instead of the generic `computeNiceStep` when `metricKey === 'duration'`.

**Rationale**: FR-005 requires clean, whole-minute (or larger) Duration boundaries; the existing generic `computeNiceStep` operates on raw seconds and produces steps like "1,020 seconds" (17 minutes) because 1/2/5×10^n has no concept of the minutes/hours the user actually reads. A dedicated minutes/hours-aware table directly produces the "full 10 minutes" style boundaries the user asked for, and scales gracefully to multi-hour ranges.

**Alternatives considered**: Converting the generic nice-step algorithm to always operate in whole minutes regardless of metric — rejected: Length/Elevation/Power still benefit from the existing decimal-friendly 1-2-5×10^n sequence (e.g. 0.5 km, 25 m), so a Duration-specific table is more precise than changing the shared algorithm's semantics for every metric.

## Decision: Pace unit moves from bucket labels to the axis title only

**Decision**: `formatMetricValue(metricKey, value, sport, { includeUnit })` gains a fourth options argument; bucket-label construction in `computeDistributionBuckets` calls it with `includeUnit: false` for the `pace` metric (all other metrics are unaffected, since their existing labels are already unit-suffixed in a way the user did not ask to change). Axis title construction in `index.html` calls the existing per-sport unit knowledge to render `"Pace (min/km)"` / `"Pace (min/100m)"` / `"Pace (km/h)"` for a single-sport selection, or a plain `"Pace"` title when "All Sports" is selected (since no single unit applies, matching `018`'s FR-005a).

**Rationale**: FR-006 explicitly asks for the unit to appear once, on the axis title, not on every bucket label. Reusing `formatMetricValue` with an `includeUnit` flag keeps a single source of formatting logic (per the Dual-Target Reusable Modules principle) rather than duplicating pace-formatting logic between bucket labels and axis titles.

**Alternatives considered**: Leaving bucket labels as-is and only adding the unit to the axis title (unit appears twice) — rejected: directly contradicts FR-006's "not at every label... but on the axis label" wording.

## Decision: Pace underflow bucket and axis reversal — scoped differently due to a shared-axis constraint

**Decision**:
- **Underflow bucket (FR-007)**: `computeDistributionBuckets` gains an `enableUnderflow` option; `index.html` passes `enableUnderflow: true` only when `metricKey === 'pace'`. When enabled, a lower fence (`Q1 - 1.5 × IQR`, mirroring the existing upper-fence overflow logic) is computed from the qualifying values; any value below it is grouped into one leading bucket labeled `"< [first regular boundary]"`. This applies regardless of the sport filter, since the underlying bucket-boundary computation already operates on whichever qualifying-value set is active (single-sport or the shared "All Sports" set), consistent with how the existing overflow bucket already works.
- **Axis reversal (FR-008)**: Only applied when the sport filter is a single sport equal to `'Run'` or `'Swim'` (not `'All'`). In that case, the chart's x-axis is configured to plot values in descending order (fastest/smallest value on the right) — implemented as Chart.js `x.reverse: true` for the linear (Line mode) axis, and by reversing the bucket array's rendering order for the categorical (Histogram mode) axis. When "All Sports" is selected, per-sport lines share one bucket-boundary set (per `019`'s design) on a single x-axis; reversing that shared axis for Run/Swim while Bike's own values are naturally ascending is not geometrically possible on one linear axis, so the combined view keeps its existing (unreversed) orientation — an accepted limitation consistent with `019`'s already-accepted "combined Pace axis mixes units without conversion" trade-off.

**Rationale**: The spec's clarification scoped the underflow bucket to Pace only (not all metrics), which this design honors directly. The axis-reversal scope split (single-sport only) is a plan-level technical resolution: `019-distributions-refinements` already established that "All Sports" Pace values from Run/Bike/Swim share one unconverted axis; reversing that axis would only be correct for Run/Swim and wrong for Bike simultaneously, which is not representable on a single shared linear axis. Restricting reversal to single-sport views is the only way to satisfy FR-008 without contradicting `019`'s existing combined-axis design.

**Alternatives considered**:
- Reversing the shared axis for "All Sports" too, accepting that Bike's orientation would then read backwards — rejected: would make Bike's own histogram/line (when included in "All Sports") visually wrong (slowest on the right), which is worse than the current accepted limitation.
- Converting Bike's speed to an inverted "pace-like" value so all three sports could share one reversed axis — rejected: reintroduces exactly the unit-conversion approach `018`'s FR-005a and `019`'s clarification already explicitly rejected.

## Decision: Swim + Elevation gain shows an explicit N/A indicator

**Decision**: In `renderDistributionsChart()`, when `selectedDistributionsMetric === 'elevation' && selectedDistributionsSportFilter === 'Swim'`, skip the normal chart/empty-state path entirely and show a distinct "N/A" message (reusing the existing empty-state element with metric/sport-aware text, e.g. "Elevation gain is not applicable to Swim activities."). In `groupBucketCountsBySport`'s call site for "All Sports" + Line mode, when the metric is `'elevation'`, the Swim entry is filtered out of the per-sport lines before rendering (Swim activities are simply never included in the elevation grouping call for that case).

**Rationale**: FR-009/FR-010 require Swim to never show a misleading empty/zero elevation chart or line; reusing the existing empty-state UI element (with different copy) avoids adding new DOM/markup, consistent with how `018`/`019` already handle "no qualifying data" states.

**Alternatives considered**: Disabling the "Swim" sport-filter button entirely when Elevation gain is selected — rejected: more intrusive than necessary and not requested; the spec only asks for an N/A indicator where Swim elevation data would otherwise be shown, not for restricting which controls are clickable.
