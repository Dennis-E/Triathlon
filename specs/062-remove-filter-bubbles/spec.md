# Feature Specification: Remove Filter Summary Bubbles

**Feature Branch**: `062-remove-filter-bubbles`

**Created**: 2026-10-20

**Status**: Draft

**Input**: User description: "Bei verschiedenen Visualisierungen stehen oben jetzt Bubbles, welche Filter ausgewählt sind. Die sollen weg. Man sieht das ja bei den Filtern bereits, was ausgewählt ist."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See selected filters directly at their controls (Priority: P1)

As an athlete viewing a dashboard visualization, I want the redundant bubbles summarizing selected filters above the visualization removed, so that the view is less cluttered and the selected values remain visible at the filters themselves.

**Why this priority**: The bubbles repeat information already shown by the filter controls and take up space above the visualizations.

**Independent Test**: Open visualizations that have selected filters and verify that no summary bubbles appear above them, while each filter control still shows its selected value and changing a filter still updates the visualization.

**Acceptance Scenarios**:

1. **Given** a visualization has one or more selected filters, **When** the user views it, **Then** no separate bubbles summarizing those selections appear above the visualization.
2. **Given** a filter has a selected value, **When** the user views its control or changes the value, **Then** the control continues to show the selection and the visualization continues to reflect it.
3. **Given** the user switches between visualizations or changes filter selections, **When** the view updates, **Then** no summary bubbles appear for the active visualization.

### Edge Cases

- Visualizations with no filter controls or no active selection must not show an empty summary area.
- Switching between visualizations, including visualizations with different filter sets, must not restore summary bubbles.
- Removing the summary must not hide, disable, or alter the selected-state indication in the filter controls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST NOT display separate summary bubbles listing selected filters above any visualization.
- **FR-002**: Filter controls MUST continue to visibly indicate their current selections.
- **FR-003**: Users MUST be able to change filters as before, and each affected visualization MUST continue to reflect those selections.
- **FR-004**: Switching visualizations or changing selections MUST NOT recreate the removed summary bubbles or leave an empty summary area.

### Key Entities *(include if data is involved)*

- **Filter selection**: The current value or set of values chosen in a visualization's filter controls; it remains visible at those controls and continues to determine the displayed visualization.
- **Filter summary bubble**: A separate, redundant label above a visualization that repeats a selected filter value; this is the UI element being removed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all tested visualizations with filters, zero separate filter-summary bubbles are visible above the visualization.
- **SC-002**: In all tested filter changes, the chosen value remains visibly selected in its control and the corresponding visualization updates as before.
- **SC-003**: At least 90% of usability-test participants can identify the active filter selection from the filter controls without relying on a separate summary row.

## Assumptions

- "Bubbles" refers to the separate row of labels summarizing active filter selections above the visualization panels, not the filter controls themselves.
- Existing filter choices, selected-state styling, filtering behavior, visualization layouts, and export behavior remain unchanged.
- The change applies consistently to every dashboard visualization that currently displays the summary.