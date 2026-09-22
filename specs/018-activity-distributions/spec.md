# Feature Specification: Activity Distributions Visualization

**Feature Branch**: `018-activity-distributions`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "create an entirelly new visualization "Distributions" on which length, duration, pace, height meter, watt can be looked at as a filter. Also include the possibility of a time-horizon for which data is shown like in heartrate vs pace. Another filter should be if it is an approximated line chart or a histogram with bars"

## Clarifications

### Session 2026-09-22

- Q: How should the "Pace" metric be handled when the sport filter spans sports with incompatible pace units (Run min/km, Bike km/h, Swim min/100m)? → A: Each activity's own sport-specific performance value (Run pace, Swim pace, Bike speed) is combined on one shared chart without unit conversion, reusing the same convention already used by "Heartrate vs Pace".
- Q: What strategy determines the number/width of histogram buckets per metric? → A: A fixed, reasonable bucket count (e.g., 10-15) spread evenly across the observed min/max range of the filtered data.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore the distribution of a single metric (Priority: P1)

An athlete wants to understand how their activities are distributed across a metric of interest (e.g., how many runs fall into which distance ranges) so they can spot patterns such as "most of my runs are 5-8 km" or "my rides cluster around 2-3 hours."

**Why this priority**: This is the core value of the feature — without the ability to pick a metric and see its distribution, there is no "Distributions" visualization at all.

**Independent Test**: Can be fully tested by opening the new "Distributions" tab, selecting a metric (e.g., "Length"), and verifying a chart renders showing how many activities fall into each value range for that metric.

**Acceptance Scenarios**:

1. **Given** imported activity data with varying distances, **When** the user selects the "Length" metric filter, **Then** the chart displays the distribution of activity lengths across the dataset.
2. **Given** the user is viewing the "Length" distribution, **When** the user switches the metric filter to "Duration", "Pace", "Elevation gain", or "Power (Watt)", **Then** the chart re-renders to show the distribution for the newly selected metric.
3. **Given** a metric has no data in the current dataset (e.g., no power data because no activity recorded watts), **When** that metric is selected, **Then** the chart area shows an empty-state message instead of an empty or broken chart.

---

### User Story 2 - Restrict the analysis to a time horizon (Priority: P2)

An athlete wants to compare how a metric's distribution looked in a specific period (e.g., "this year" vs. "last year" vs. "all time") to track how their training has evolved.

**Why this priority**: Time-horizon filtering is essential for meaningful comparisons over a training history, matching the existing pattern from the "Heartrate vs Pace" visualization, but the feature still delivers value without it (a single all-time distribution).

**Independent Test**: Can be fully tested by adjusting the date-range control on the "Distributions" tab and confirming the chart updates to reflect only activities within the selected range.

**Acceptance Scenarios**:

1. **Given** activities spanning multiple years, **When** the user narrows the date range using the range control, **Then** only activities within that range contribute to the displayed distribution.
2. **Given** a date range is applied, **When** the user resets the range to cover the full history, **Then** the chart reflects the complete dataset again.
3. **Given** a sport filter (All/Run/Bike/Swim) consistent with other visualization tabs, **When** the user changes the sport filter, **Then** the distribution recalculates using only activities of the selected sport(s).

---

### User Story 3 - Switch between histogram and smoothed line views (Priority: P3)

An athlete wants to choose between a bar-based histogram (clear discrete buckets) and a smoothed, approximated line/curve view (easier to see the overall shape of the distribution) depending on their preference.

**Why this priority**: This is a presentation refinement on top of the core distribution feature; the feature is useful with just one chart style, but offering both improves usability for different analysis styles.

**Independent Test**: Can be fully tested by toggling a "Histogram" / "Line" display-mode control and confirming the same underlying data is rendered as bars in one mode and as a smoothed curve in the other.

**Acceptance Scenarios**:

1. **Given** a metric distribution is displayed as a histogram, **When** the user switches the display mode to "Line", **Then** the same filtered dataset is rendered as an approximated smoothed line/curve instead of bars.
2. **Given** the display mode is set to "Line", **When** the user switches back to "Histogram", **Then** the chart returns to a bar representation using the same bucket boundaries as before.
3. **Given** the user changes the metric, time horizon, or sport filter, **When** a display mode is already selected, **Then** the chart re-renders in that same display mode with the updated data.

---

### Edge Cases

- What happens when the selected metric has zero qualifying activities in the current time horizon/sport filter combination? The system shows an explicit empty-state message rather than a blank or misleading chart.
- What happens when the "Power (Watt)" metric is selected but the dataset contains no power-capable activities (e.g., no bike computer with a power meter)? The system shows the empty-state message rather than a flat/zero chart.
- What happens when only one activity qualifies for the selected metric/filters? The histogram shows a single bucket and the line-chart mode shows a degenerate/minimal curve rather than erroring.
- How does the system handle extreme outliers (e.g., one exceptionally long ultra-distance activity among many short runs)? Buckets still span the full observed min-to-max range in even steps (per FR-010); an outlier may produce a wide range with mostly-empty buckets rather than being clipped into a separate overflow bucket — this is an accepted v1 trade-off for keeping bucket computation simple and consistent.
- What happens when the user narrows the date range to a period with no activities at all? The empty-state message is shown, consistent with other visualization tabs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a new "Distributions" visualization tab, discoverable and navigable in the same way as other visualization tabs (e.g., "Heartrate vs Pace", "Equipment mileage").
- **FR-002**: Users MUST be able to select exactly one metric at a time to visualize its distribution, from the set: Length (distance), Duration, Pace, Elevation gain (height meters), and Power (Watt).
- **FR-003**: The system MUST compute the distribution using only activities that have a valid value for the currently selected metric, silently excluding activities missing that value.
- **FR-004**: Users MUST be able to restrict the analyzed activities to a time horizon via a date-range control, consistent with the existing date-range control used in the "Heartrate vs Pace" visualization.
- **FR-005**: Users MUST be able to filter the analyzed activities by sport (All, Run, Bike, Swim), consistent with existing sport filters elsewhere in the dashboard.
- **FR-005a**: When the "Pace" metric is selected and the sport filter includes more than one sport, the system MUST combine each activity's own sport-specific performance value (Run pace, Swim pace, Bike speed — as already computed for "Heartrate vs Pace") into one shared distribution without converting between units, rather than restricting the metric to a single sport.
- **FR-006**: Users MUST be able to toggle the chart's display mode between a "Histogram" (discrete bars per value bucket) and an "Approximated line" (smoothed curve representing the same underlying distribution).
- **FR-007**: The system MUST preserve the selected metric, time horizon, sport filter, and display mode when the user switches between these controls, re-rendering the chart with the combined filter state.
- **FR-008**: The system MUST show an explicit empty-state message when no activities qualify for the current metric/time-horizon/sport combination, instead of rendering an empty or broken chart.
- **FR-009**: The system MUST label chart axes and buckets in units appropriate to the selected metric (e.g., kilometers for Length, minutes/hours for Duration, the sport-specific pace/speed unit already used by "Heartrate vs Pace" for Pace, meters for Elevation gain, watts for Power).
- **FR-010**: The system MUST derive bucket boundaries automatically for each metric by dividing the observed min/max range of the filtered dataset into a fixed, reasonable number of evenly-sized buckets (target 10-15 buckets), so that changing the time horizon or sport filter recalculates the range and buckets accordingly.
- **FR-011**: Users MUST be able to export the Distributions chart in the same way other visualization tabs support export (e.g., "Export for Insta / Strava"), consistent with existing export behavior.

### Key Entities

- **Metric selection**: The currently chosen dimension to analyze (Length, Duration, Pace, Elevation gain, Power); determines which activity field is aggregated and how axes are labeled.
- **Time horizon**: The date range currently applied to restrict which activities are included in the distribution, mirroring the existing date-range concept used elsewhere.
- **Sport filter**: The sport (All, Run, Bike, Swim) currently applied to restrict which activities are included.
- **Display mode**: Whether the distribution is rendered as a histogram (bars) or an approximated line (smoothed curve).
- **Distribution bucket**: A computed value range (for the selected metric) paired with the count of qualifying activities falling into that range.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between all five metrics (Length, Duration, Pace, Elevation gain, Power) and see an updated, correctly-labeled distribution chart within the same interaction time as other existing visualization tabs.
- **SC-002**: Users can narrow or widen the time horizon and see the distribution recalculated to reflect only activities in that range, with no stale data from outside the range appearing.
- **SC-003**: Users can toggle between histogram and approximated line display modes for any metric/filter combination without errors or blank charts.
- **SC-004**: When no qualifying activities exist for a given metric/time-horizon/sport combination, 100% of the time an explicit empty-state message is shown instead of an empty or broken chart.
- **SC-005**: The Distributions tab's export produces a shareable image consistent in style and behavior with existing visualization exports.

## Assumptions

- The "time-horizon" filter reuses the same date-range interaction pattern already implemented for the "Heartrate vs Pace" visualization (a dual-handle range control over the full imported date span).
- Sport filtering follows the existing All/Run/Bike/Swim convention used elsewhere in the dashboard rather than introducing new sport categories.
- "Power (Watt)" distribution is only meaningful for activities that recorded power data (in practice, primarily Bike activities); activities without recorded power values are excluded from that metric's distribution rather than treated as zero.
- Bucket/range boundaries for the histogram and the underlying data for the approximated line are computed automatically from the filtered dataset using a fixed target of 10-15 evenly-sized buckets spanning the observed min/max range (no manual bucket-width configuration is required for v1).
- The "approximated line" display mode is a smoothed representation of the same bucketed distribution data (e.g., a smoothed curve through bucket counts), not a separate raw data model.
- This feature is presented as a new, standalone visualization tab rather than a mode added to an existing tab.
- Pace values are combined across sports as-is (Run pace, Swim pace, Bike speed), with no unit conversion between sports; this matches the existing "Heartrate vs Pace" precedent rather than introducing a new normalization scheme.
