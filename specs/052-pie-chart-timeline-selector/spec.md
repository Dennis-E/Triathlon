# Feature Specification: Pie Chart Timeline Selector

**Feature Branch**: `052-pie-chart-timeline-selector`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "on the pie chart visualization: put timeline selector in. same as in total distance (the first) visualization."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore pie chart data within a selected time window (Priority: P1)

As an athlete, I want to limit the Pie Charts visualization to a familiar time window, so that the chart reflects the period of training I want to explore rather than always including my full imported history.

**Why this priority**: A time-window selector makes the existing pie chart meaningfully useful for reviewing recent training as well as long-term composition.

**Independent Test**: Import activities with known dates and grouping values across several years, choose different time windows, and verify that only activities within each selected window contribute to the pie's groups, values, percentages, and summary.

**Acceptance Scenarios**:

1. **Given** activities are imported and Pie Charts is opened, **When** the user views the timeframe control, **Then** it offers 3 months, 6 months, 1 year, 2 years, and All, with the one-year window selected by default.
2. **Given** activities occur both inside and outside the selected window, **When** the user selects a shorter timeframe, **Then** only activities within that window contribute to the pie chart and its activity count and total summary.
3. **Given** the user selects the all-history timeframe, **When** the pie chart updates, **Then** all eligible imported activities contribute, matching the existing all-history behavior of Total Distance.
4. **Given** a selected timeframe contains no eligible activities or no usable values for the active dimension and measure, **When** the chart updates, **Then** the existing explanatory Pie Charts empty state is shown instead of a blank or misleading chart.

---

### User Story 2 - Keep timeframe selection consistent while exploring and sharing (Priority: P2)

As an athlete, I want my selected time window to remain active while I change Pie Charts options and export the chart, so that I can explore and share results from the same period without repeatedly reapplying the filter.

**Why this priority**: Consistent filtering prevents mismatches between the displayed chart and the athlete's intended comparison period.

**Independent Test**: Select a non-default timeframe, change the sport filter, dimension, and measure, then export; verify the chosen timeframe remains selected and all displayed and exported results use only activities from that timeframe.

**Acceptance Scenarios**:

1. **Given** the user has selected a timeframe, **When** they change the sport filter, grouping dimension, measure, or colour scheme, **Then** the timeframe selection remains unchanged and the chart recalculates within that time window.
2. **Given** the user exports a populated Pie Charts view, **When** the local preview is shown, **Then** it reflects the currently selected timeframe and the corresponding filtered chart and summary.
3. **Given** the user changes timeframe and navigates away from and back to Pie Charts during the same page session, **When** Pie Charts is shown again, **Then** the most recently selected timeframe is retained.

### Edge Cases

- Imported activities with invalid or missing dates do not contribute to a time-window-filtered pie.
- A rolling timeframe is measured relative to the latest valid activity date in the imported dataset, consistent with Total Distance, rather than the current calendar date.
- The selected range includes activities on both its start and end dates.
- A window containing activities but none with usable values for the selected grouping dimension or measure shows the existing no-data state.
- Changing the timeframe must not reset the active sport, grouping dimension, measure, or colour scheme.
- The timeframe control remains usable on narrow viewports without causing horizontal overflow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Pie Charts visualization MUST provide a timeframe selector with the same familiar style and rolling-window behavior as Total Distance, offering 3 months, 6 months, 1 year, 2 years, and All.
- **FR-002**: The Pie Charts timeframe selector MUST default to the one-year window, matching the default timeframe of the Total Distance visualization.
- **FR-003**: Every timeframe selection MUST filter the activities used to calculate the selected grouping dimension, slice measure, percentages, counted-activity total, and chart summary.
- **FR-004**: Rolling time windows MUST be anchored to the latest valid activity date in the imported dataset, and activities on both range boundaries MUST be included.
- **FR-005**: Selecting the all-history option MUST include all otherwise-eligible activities in the current imported dataset, consistent with Total Distance.
- **FR-006**: Changing the timeframe MUST retain the user's current sport filter, grouping dimension, measure, and colour scheme; changing those controls MUST likewise retain the selected timeframe.
- **FR-007**: The selected timeframe MUST remain active when the user navigates between dashboard visualizations and returns to Pie Charts during the same page session.
- **FR-008**: The existing Pie Charts empty-state behavior MUST be shown when the selected timeframe has no activities or no usable values for the active selection.
- **FR-009**: The established local image-preview and download export MUST reflect the current timeframe selection and only the activity data within that window.
- **FR-010**: Timeframe filtering MUST use only the already imported activity data and MUST NOT send activity data to a new external service.
- **FR-011**: The timeframe control and Pie Charts view MUST remain usable on narrow and wide viewports without horizontal overflow.

### Key Entities *(include if data is involved)*

- **Timeframe**: A named rolling period or all-history option used to select which imported activity dates contribute to Pie Charts.
- **Filtered activity set**: The eligible imported activities whose valid dates fall within the selected timeframe and which provide values needed by the active sport, dimension, and measure.
- **Pie chart summary**: The groups, values, percentages, and activity count recalculated from the filtered activity set.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of validation datasets with known dates and values, every timeframe selection produces slice values, activity counts, and percentages matching independent calculations for the selected date window.
- **SC-002**: The initial Pie Charts view selects the same one-year timeframe as Total Distance in 100% of fresh page sessions.
- **SC-003**: In 100% of export checks, the preview reflects the active timeframe and the chart data visible before export.
- **SC-004**: At least 4 of 5 first-time reviewers can select a non-default timeframe and identify the active date window within 15 seconds without assistance.
- **SC-005**: Selecting a timeframe updates the chart within 1 second for datasets of up to 5,000 activities.
- **SC-006**: The timeframe control has no horizontal overflow at narrow mobile and desktop viewport widths.

## Assumptions

- “Timeline selector” refers to the existing Total Distance time-window selector, not a new chart aggregation or timeline visualization.
- The Pie Charts timeframe uses the Total Distance selector's weekly-view choices (3 months, 6 months, 1 year, 2 years, and All), labels, rolling-window semantics, and all-history behavior; its initial selection is one year, matching the current Total Distance default.
- The selected timeframe is session-only and is not persisted after a page reload, consistent with existing Pie Charts control selections.
- This feature adds date filtering to the existing Pie Charts visualization only; it does not introduce a new dashboard tab, grouping dimension, measure, or export mechanism.
- Existing Pie Charts handling of invalid/missing values, grouping, and no-data states remains unchanged except that those behaviors operate on the activities remaining after timeframe filtering.
