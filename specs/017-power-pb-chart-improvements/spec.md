# Feature Specification: Power PB Chart Improvements

**Feature Branch**: `017-power-pb-chart-improvements`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "regarding the watts on pb there are certain things to improve: a) all-time power profile should have tool-tip on mouse-over. 2) y axis label should show the watts for the highest and lowest data point. 3) x-axis should only show 1second, and then starting from 5min again as it is otherwise overlapping. i.e. leave out 5,10,20 seconds and 1 min 4) the single tiles (eg 5sec, 20 min etc) should show the development of the PBs over time in same logic and layout as the other PB tiles."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inspect all-time power profile points on hover (Priority: P1)

A cyclist viewing the all-time power profile chart in Personal Bests wants to hover over a plotted point to see exactly which duration, watt value, date, and activity it represents, instead of only seeing an unlabeled dot.

**Why this priority**: Without a tooltip, the profile's data points are not individually verifiable; this is the most requested missing interaction and matches the tooltip behavior already present on every other Personal Bests chart.

**Independent Test**: Load Bike data with at least two duration-specific power PBs, open Personal Bests, hover over a point on the all-time power profile, and verify a tooltip appears showing the duration, watt value, date, and activity name for that point, and disappears on mouse-out.

**Acceptance Scenarios**:

1. **Given** the all-time power profile is rendered with two or more points, **When** the user moves the mouse over a point, **Then** a tooltip appears showing that point's duration label, watt value, date, and source activity name.
2. **Given** the tooltip is shown for a point, **When** the user moves the mouse to a different point, **Then** the tooltip updates to reflect the newly hovered point without flickering or showing stale data.
3. **Given** the tooltip is shown, **When** the user moves the mouse away from all points, **Then** the tooltip is hidden.

---

### User Story 2 - Read exact watt range from the profile's y-axis (Priority: P1)

A cyclist wants the all-time power profile's y-axis to display the actual watt values for the highest and lowest plotted points, so the chart's scale is immediately understandable without hovering over every point.

**Why this priority**: A y-axis without concrete values forces guesswork about the plotted range; showing the extremes is the minimum needed to read the chart correctly, consistent with how other Personal Bests mini-charts already label their axis extremes.

**Independent Test**: Load Bike data with duration-specific power PBs of clearly different watt values, open Personal Bests, and verify the y-axis shows a label matching the highest plotted watt value near the top and a label matching the lowest plotted watt value near the bottom.

**Acceptance Scenarios**:

1. **Given** the all-time power profile has at least one point, **When** it is rendered, **Then** the y-axis shows a label with the exact watt value of the highest point positioned at or near that point's height.
2. **Given** the all-time power profile has at least two points with different watt values, **When** it is rendered, **Then** the y-axis also shows a label with the exact watt value of the lowest point positioned at or near that point's height, instead of a fixed zero baseline.
3. **Given** all plotted points share the same watt value, **When** the profile is rendered, **Then** the y-axis shows that single value once rather than duplicate identical labels.

---

### User Story 3 - Read duration labels on the x-axis without overlap (Priority: P2)

A cyclist wants the all-time power profile's x-axis duration labels to remain legible, so closely spaced short-duration points do not produce overlapping, unreadable text.

**Why this priority**: Overlapping text makes the chart look broken and hides which point corresponds to which duration; thinning the labels while keeping every data point plotted preserves the visualization's completeness while fixing legibility.

**Independent Test**: Load Bike data with qualifying PBs across all supported short and long durations, open Personal Bests, and verify that only the shortest duration's label and labels for durations of 5 minutes or longer are shown, while intermediate short-duration labels are hidden but their points and connecting line remain visible.

**Acceptance Scenarios**:

1. **Given** the all-time power profile includes points for durations shorter than 5 minutes, **When** it is rendered, **Then** only the shortest available duration shows an x-axis label; other durations shorter than 5 minutes have their points plotted but no x-axis label.
2. **Given** the all-time power profile includes points for durations of 5 minutes or longer, **When** it is rendered, **Then** every one of those durations shows its own x-axis label.
3. **Given** labels are hidden for some points, **When** the user hovers over an unlabeled point, **Then** the point's duration is still available via the tooltip from User Story 1.

---

### User Story 4 - See each duration's PB history over time (Priority: P1)

A cyclist looking at a single duration tile (for example 5 seconds or 20 minutes) wants to see how that duration's power PB developed over time, presented the same way as the other Personal Bests tiles (Longest, Elevation, Fastest Pace, etc.), instead of only a static "current best" number and a one-line history summary.

**Why this priority**: The duration tiles are the primary place cyclists check progress for a specific effort length; matching the established mini-chart pattern makes progress visible at a glance and keeps the Personal Bests panel consistent.

**Independent Test**: Load Bike data with at least two power PBs recorded on different dates for the same duration (e.g., 5 seconds), open Personal Bests, and verify the duration tile shows a mini time-series chart with axes, a trend line/steps connecting each PB, a current-best callout, and a tooltip on hover — matching the visual pattern of the other PB tiles.

**Acceptance Scenarios**:

1. **Given** a duration has two or more qualifying PBs recorded over time, **When** the user views that duration's tile, **Then** the tile shows an inline chart plotting each PB against its date, using the same axis style, current-best callout, and tooltip interaction as the other Personal Bests tiles.
2. **Given** a duration has exactly one qualifying PB, **When** the user views that duration's tile, **Then** the tile still renders using the same chart layout (a single point/marker) rather than reverting to the old static-text summary.
3. **Given** the user hovers over any historical point in a duration tile's chart, **When** the tooltip appears, **Then** it shows that PB's date, watt value, and source activity name, consistent with the tooltip behavior on other tiles.
4. **Given** the duration tile's existing "view in full screen" detail button, **When** the user opens it, **Then** the full-screen detail chart continues to work unchanged.

### Edge Cases

- A duration with only one qualifying PB must still render using the shared tile chart layout (not the old static summary), showing a single marker with its watt value.
- If the all-time power profile has fewer than two points, it keeps its existing limited-profile message and does not attempt tooltip/axis behavior on a chart that isn't drawn.
- If two or more durations shorter than 5 minutes tie for the shortest, only one x-axis label is shown at that shortest duration to avoid duplicate overlapping labels.
- Tooltip and axis-label changes must not alter which values qualify as PBs or change any computed watt value.
- Existing full-screen detail view behavior (opened via the maximize button) must remain unaffected by these inline-chart and axis changes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a tooltip when the user hovers over a point on the all-time power profile chart, displaying that point's duration label, watt value, date, and source activity name.
- **FR-002**: The system MUST hide the all-time power profile tooltip when the mouse leaves a point and MUST update it without stale data when the mouse moves directly between points.
- **FR-003**: The system MUST label the all-time power profile's y-axis with the exact watt value of the highest plotted point.
- **FR-004**: The system MUST label the all-time power profile's y-axis with the exact watt value of the lowest plotted point, replacing the fixed zero baseline, and MUST show a single label (not duplicates) when all points share the same watt value.
- **FR-005**: The system MUST show an x-axis label for the shortest available duration in the all-time power profile.
- **FR-006**: The system MUST show an x-axis label for every plotted duration of 5 minutes or longer in the all-time power profile.
- **FR-007**: The system MUST hide x-axis labels for durations that are shorter than 5 minutes and are not the shortest available duration, while still plotting their points and connecting line.
- **FR-008**: Each Bike power duration tile (e.g., 5 seconds, 20 minutes) MUST render an inline time-series chart of that duration's PB history using the same axis, trend-line, current-best callout, and tooltip pattern used by the other Personal Bests tiles (Longest, Elevation, Fastest Pace).
- **FR-009**: A duration tile with exactly one qualifying PB MUST render using the same shared chart layout as a single-point chart, not the previous static "current best" text summary.
- **FR-010**: The existing full-screen detail view opened from a duration tile's maximize button MUST continue to function unchanged.
- **FR-011**: These changes MUST NOT alter which efforts qualify as duration-specific PBs, the highest-value selection logic for the all-time profile, or any other existing Personal Bests section.

### Key Entities

- **All-Time Power Profile Point**: One highest qualifying watt value per duration, now also carrying tooltip-displayable date and activity context, and a label-visibility flag driven by its duration relative to 5 minutes.
- **Duration Power Tile**: The per-duration Bike power PB display, now rendering its full PB history as a time-series chart instead of a single current-best value.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of manual/automated hover tests on the all-time power profile, hovering any plotted point shows a tooltip with the correct duration, watts, date, and activity, and hides on mouse-out.
- **SC-002**: In 100% of rendering tests with at least one point, the profile's y-axis displays the exact highest watt value; with at least two differing values, it also displays the exact lowest watt value.
- **SC-003**: In 100% of rendering tests with points spanning both short (<5 min) and long (≥5 min) durations, only the shortest duration's label appears among the short durations, and all long-duration labels appear, with no unlabeled long-duration point.
- **SC-004**: In 100% of duration tiles with two or more PBs, the tile displays a time-series chart matching the visual pattern (axes, trend line, callout, tooltip) of the other Personal Bests tiles.
- **SC-005**: Existing Personal Bests regression tests (duration qualification, PB values, non-power sections) remain fully passing after these changes.

## Assumptions

- "1 second" in the request refers to whichever duration is the shortest currently supported/available power duration (today 5 seconds); the rule is defined generically as "shortest available duration" rather than a hardcoded 1-second value, since no 1-second duration currently exists in the supported set.
- "Same logic and layout as the other PB tiles" means reusing the existing shared timeline-chart helpers (axes, current-best callout, hit-area tooltips) already used by tiles like Longest and Elevation, applied to each duration's own PB history.
- The all-time power profile's point-selection logic (highest qualifying watt value per duration) is unchanged; only tooltip, axis labeling, and label-thinning behavior are added.
- No new duration categories are added or removed by this feature; the existing supported durations (5s, 30s, 1m, 2m, 5m, 10m, 20m, 60m) are unchanged.
