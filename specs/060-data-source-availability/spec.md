# Feature Specification: Data-Source-Aware Visualizations

**Feature Branch**: `060-data-source-availability`

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "we have now two datasources strava and trainingspeaks. both have differences in data availability. not all data is available in all data sources. If data is not available in a datasource, do not show visualizations that have no data available. eg if there is no equipment data after import, then dont show the equipment tabs in navigation."

## Clarifications

### Session 2026-10-16
- Q: Soll eine einzige Aktivität mit gültigen Daten jede passende Visualisierung freischalten, oder soll jede Ansicht erst ab einer eigenen Mindestmenge erscheinen? → A: Jede Ansicht erscheint erst, wenn genügend Daten für eine sinnvolle Darstellung vorhanden sind.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See only supported visualizations (Priority: P1)

After importing activities from Strava or TrainingPeaks, a user wants the dashboard to offer only visualizations that the imported activities can actually populate. For example, when no equipment information is available, the equipment views should not appear in navigation and an empty equipment visualization should not be shown.

**Why this priority**: Empty or irrelevant views make the dashboard harder to navigate and imply that useful data is missing from the user's own activities rather than unavailable from the source.

**Independent Test**: Import a dataset without equipment information and another with equipment information. Verify that equipment navigation and content are absent for the first and present for the second, while other supported views remain available.

**Acceptance Scenarios**:

1. **Given** a completed import with no usable equipment data, **When** the dashboard is displayed, **Then** equipment navigation and its visualization are not shown.
2. **Given** a completed import with usable data for a visualization, **When** the dashboard is displayed, **Then** that visualization remains available even if unrelated data fields are absent.

---

### User Story 2 - Respect source-specific data availability (Priority: P2)

A user importing from either Strava or TrainingPeaks wants visualization availability to reflect the fields present in that imported dataset, rather than assuming both sources provide the same data.

**Why this priority**: Differences between Strava and TrainingPeaks should not cause empty views for either source or hide views that the current import can populate.

**Independent Test**: Separately import representative Strava and TrainingPeaks datasets with different field coverage. Verify that each dataset shows only the visualizations its own activities can populate.

**Acceptance Scenarios**:

1. **Given** a Strava dataset without usable equipment data and a separate TrainingPeaks dataset with usable equipment data, **When** each dataset is imported separately, **Then** equipment views are hidden for the first and available for the second.
2. **Given** equivalent usable activity data imported through either supported source, **When** visualization availability is evaluated, **Then** the source label alone does not change which views are available.

---

### User Story 3 - Keep navigation current after importing (Priority: P3)

A user importing a new dataset wants the available visualizations to reflect that import, not the previously displayed one. The imported activity data itself remains unchanged; only visualization availability and visibility are recalculated.

**Why this priority**: Users need a consistent dashboard after each import, including when fields available in the previous data are absent from the new data.

**Independent Test**: Import one dataset that supports a view, then import another that does not. Verify that the view is hidden, the dashboard remains on an available view, and neither imported dataset's activity values are changed by availability handling.

**Acceptance Scenarios**:

1. **Given** a currently available visualization and a new completed import without its required data, **When** the new import becomes the dashboard's current data, **Then** the visualization is hidden and any selection of it is moved to an available view without modifying imported activity data.
2. **Given** a new completed import that adds data for a previously unavailable visualization, **When** the dashboard is refreshed, **Then** the corresponding visualization becomes available.

### Edge Cases

- A source may include a field name but have no usable values; this does not count as data availability.
- A partially populated field makes a visualization available only when its view-specific minimum amount of valid data for meaningful content is met.
- When activities within the current import complement each other, availability is determined from all activities in that import; missing values in one activity do not invalidate usable values in another.
- If an import leaves no visualizations available, no empty visualization is shown and the dashboard remains in a stable, understandable state.
- When the selected view becomes unavailable after an import, the dashboard must not leave the user on stale content or an unusable selection.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST determine whether each existing visualization meets its own minimum amount of usable data for meaningful content in the currently loaded activities.
- **FR-002**: The dashboard MUST show a visualization in navigation and display its content only when its view-specific minimum amount of usable data is met.
- **FR-003**: For either supported source, the dashboard MUST determine availability from the usable data in the currently imported activities; source identity alone MUST NOT make a visualization available or unavailable.
- **FR-004**: The dashboard MUST NOT display an empty visualization as a substitute when none of the currently loaded activities provides its required data.
- **FR-005**: After each completed import, the dashboard MUST update visualization availability to match the newly imported data.
- **FR-006**: If an import makes the currently selected visualization unavailable, the dashboard MUST move to an available view or a stable dashboard state without stale visualization content.
- **FR-007**: Navigation unrelated to visualizations MUST remain available regardless of visualization data availability.
- **FR-008**: Availability handling MUST NOT modify imported source files, normalized activity records, or their values; it MUST only control visualization visibility and selection.

### Key Entities *(include if data involved)*

- **Loaded activities**: The currently imported activities from either supported source, including the fields and usable values each activity provides.
- **Visualization data needs**: The information required for an existing visualization to present meaningful content.
- **Visualization availability**: Whether the loaded activities meet the minimum amount of usable information required to present a specific visualization meaningfully.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all tested imports, 100% of visualization entries shown in navigation meet that visualization's minimum data requirement.
- **SC-002**: In all tested imports, 100% of visualizations with no qualifying activity are absent from both navigation and displayed dashboard content.
- **SC-003**: For both Strava and TrainingPeaks imports, every visualization supported by usable data in the current dataset remains available, and source identity alone does not alter the result.
- **SC-004**: In user acceptance testing, at least 90% of participants can identify available visualizations after an import without encountering an empty visualization caused by unavailable source data.

## Assumptions

- Strava and TrainingPeaks datasets are evaluated as separate imports; availability reflects the currently loaded dataset. Combining sources into one import is outside this feature.
- The feature adjusts availability of existing dashboard visualizations and does not add new visualizations or change which sources are supported.
- Each visualization has a minimum amount of valid data needed to render meaningful content; a field name alone is not sufficient.
- Existing visualizations remain available when some activities lack their data, provided other loaded activities can populate them.
- Importing a new dataset may make it the dashboard's current dataset, but availability checks do not alter the imported data or remove activities or field values.
