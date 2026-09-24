# Feature Specification: Workout Time Visualization

**Feature Branch**: `030-workout-time`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "new feature/ visualization: workout-time: display of times of workouts during the day / week / month / year"

## Clarifications

### Session 2026-09-23

- Q: Soll die Monatsansicht Workouts nach dem Tag des Monats über alle ausgewählten Monate aggregieren oder konkrete Kalendertage chronologisch anzeigen? → A: Workouts über alle ausgewählten Monate nach Tag 1 bis 31 aggregieren.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See when workouts usually start during the day (Priority: P1)

An athlete wants to understand which times of day they typically start workouts, so they can recognize routines and identify opportunities to plan training more consistently.

**Why this priority**: The time-of-day view is the most direct interpretation of the requested feature and delivers immediate value from the imported activity history.

**Independent Test**: Import activity data containing start times, open the Workout Time visualization, select the day view, and verify that activities are grouped into the correct times of day.

**Acceptance Scenarios**:

1. **Given** imported activities with valid start times, **When** the user opens the Workout Time visualization in day view, **Then** the visualization shows how many workouts started in each time-of-day interval.
2. **Given** activities started at different times, **When** the user inspects a time-of-day interval, **Then** its displayed count represents only activities whose local start time falls within that interval.
3. **Given** the user has filtered the dashboard by sport, **When** the user views the day distribution, **Then** only activities matching the selected sport filter are included.

---

### User Story 2 - Compare workout timing across calendar periods (Priority: P2)

An athlete wants to switch between week, month, and year views, so they can see whether workouts cluster on particular weekdays, dates, or months.

**Why this priority**: Different calendar perspectives turn the same activity history into useful planning and seasonality insights, while the feature remains useful with only the day view.

**Independent Test**: Switch between each calendar view using the same imported dataset and verify that the axis and grouping change to the selected period without losing the active filters.

**Acceptance Scenarios**:

1. **Given** imported activities spanning multiple weekdays, **When** the user selects week view, **Then** the visualization groups workouts by weekday in calendar order.
2. **Given** imported activities from one or more months, **When** the user selects month view, **Then** the visualization aggregates workouts by day of month from 1 through 31 across the selected date range.
3. **Given** imported activities spanning multiple months, **When** the user selects year view, **Then** the visualization groups workouts by calendar month in chronological order.
4. **Given** the user switches between day, week, month, and year views, **When** a sport or time-range filter is active, **Then** the selected filters remain active and the visualization recalculates for the new grouping.

---

### User Story 3 - Inspect timing details and empty states (Priority: P3)

An athlete wants to understand the values behind a timing pattern and receive a clear explanation when the selected period has no usable data.

**Why this priority**: Clear details and empty states make the visualization trustworthy and usable across incomplete imports, even though they are secondary to rendering the core distributions.

**Independent Test**: Hover or inspect rendered groups with known activity counts, then apply filters that exclude all activities and verify both the detail information and empty state.

**Acceptance Scenarios**:

1. **Given** a rendered time group with one or more workouts, **When** the user inspects that group, **Then** the visualization identifies the group and the number of matching workouts.
2. **Given** the selected sport and date range contain no activities with valid start times, **When** the user views any Workout Time granularity, **Then** an explicit empty-state message is shown instead of a blank or misleading chart.
3. **Given** some activities have no usable start time, **When** the user views the visualization, **Then** those activities are excluded and the remaining valid activities are still represented.

### Edge Cases

- Activities starting exactly at a period boundary are assigned consistently to that boundary's group, including midnight, the first weekday, the first day of a month, and January.
- A dataset containing only one valid activity still renders one meaningful group without requiring a minimum number of activities.
- Activities whose start time cannot be parsed are excluded from the visualization rather than assigned to an arbitrary group.
- A date range with no qualifying activities shows the explicit empty-state message for every granularity.
- Month view handles months with different numbers of days without inventing activity counts for unavailable dates; day numbers absent from a specific month contribute no activity to that month.
- Year view remains ordered January through December when the selected range crosses a calendar year boundary; activities from all selected years contribute to their corresponding month group.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a new "Workout Time" visualization that is discoverable and navigable in the same way as the other dashboard visualizations.
- **FR-002**: The system MUST derive workout timing from each activity's valid start date and start time.
- **FR-003**: Users MUST be able to select exactly one grouping granularity at a time: Day, Week, Month, or Year.
- **FR-004**: In Day view, the system MUST group activities by local time of day using twelve consistently labeled two-hour intervals covering the full 24-hour day.
- **FR-005**: In Week view, the system MUST group activities by weekday in a fixed calendar order beginning with Monday and ending with Sunday.
- **FR-006**: In Month view, the system MUST aggregate activities by day of month from 1 through 31 across all selected months, preserving numeric day order and leaving days without matching workouts distinguishable from populated days.
- **FR-007**: In Year view, the system MUST group activities by calendar month in chronological order from January through December.
- **FR-008**: The system MUST apply the existing sport filter (All, Run, Bike, Swim) and date-range filter before calculating the selected time grouping.
- **FR-009**: The system MUST exclude activities without a valid start date/time from all Workout Time groupings without failing the remaining visualization.
- **FR-010**: The system MUST display the number of matching workouts for every rendered time group and identify the group using an unambiguous label.
- **FR-011**: The system MUST show an explicit empty-state message when no activities qualify after applying the selected granularity, sport filter, date range, and valid-start-time requirement.
- **FR-012**: Users MUST be able to change the grouping granularity without losing the currently selected sport or date-range filters.
- **FR-013**: The visualization MUST provide labels and units appropriate to the selected granularity: time-of-day intervals for Day, weekday names for Week, calendar dates for Month, and month names for Year.
- **FR-014**: The Workout Time visualization MUST support the same shareable export behavior as the other dashboard visualizations.

### Key Entities

- **Workout activity**: An imported training record with a sport, start date/time, and participation in the active dashboard filters.
- **Time granularity**: The selected perspective for grouping activities: Day, Week, Month, or Year.
- **Time group**: A labeled period within the selected granularity paired with the count of qualifying workouts.
- **Filter state**: The active sport and date-range selections that determine which activities are included.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch among all four time granularities and see a correctly labeled timing distribution after each selection without restarting the import or losing active filters.
- **SC-002**: For a supplied dataset with known start times, 100% of qualifying activities appear in the correct Day, Week, Month, and Year group, and no excluded activity contributes to a count.
- **SC-003**: Users can identify the count for any rendered time group within one inspection action, such as selecting or hovering over that group.
- **SC-004**: In 100% of cases where no qualifying activity has a valid start time, the visualization shows an explicit empty-state message instead of an empty or broken chart.
- **SC-005**: For a typical imported history of up to 10,000 activities on a supported desktop browser, users see the recalculated Workout Time result within 500 milliseconds after changing a granularity or filter.
- **SC-006**: Exporting the Workout Time visualization produces a shareable image containing the selected granularity, visible labels, and current filtered result.

## Assumptions

- A workout's timing is based on its recorded activity start time, not its elapsed duration or finish time.
- Start times are interpreted in the local time representation supplied by the imported activity data; v1 does not attempt timezone conversion beyond the available value.
- Day view uses twelve evenly sized, human-readable two-hour intervals rather than one separate group for every minute.
- Week view uses Monday as the first day of the week to match the common European calendar convention used by the product context.
- Month view aggregates the day numbers 1 through 31 across the selected date range; days with no matching workouts may remain visible so gaps in the pattern are understandable.
- The existing dashboard sport and date-range filters are reused, and no login, remote storage, or new data source is part of this feature.
- The feature is a standalone visualization tab and does not change existing activity parsing semantics.
