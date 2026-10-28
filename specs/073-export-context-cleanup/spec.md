# Feature Specification: Export Context Cleanup

**Feature Branch**: `073-export-context-cleanup`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "- export: 1) in \"distance\" export all filters are visible in the bottom. this shouldnt be the case. in no export nowhere. 2) also in pace vs. 3) also in pb, eg run 5 km, also\" Metric: Time\" is not needed here, it is clear that it is time 4) also in gps heatmap it is visible the filters on the bottom. actually with \"filters\" i mean it shows all visuals as boxed - this is not needed. and filters are shown also not needed, nowhere. also \"sport:all sports colour scheme\" is not needed 5) it is everywhere"

## Clarifications

### Session 2026-10-28

- Q: Sollen Exporte nur Filterelemente entfernen oder auch die äußeren Rahmen um die Visualisierungen? → A: Auch äußere Rahmen um Visualisierungen entfernen; Inhalte und Datenlegenden beibehalten.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export a clean visualization (Priority: P1)

A user previews or downloads any visualization and wants the image to focus on the visualization, without filter controls, filter summaries, boxed filter/context panels, or outer frames enclosing the visualization.

**Why this priority**: Filter elements are repeated across export types and distract from the content users are trying to share.

**Independent Test**: Preview and download representative Distance, Pace-versus, personal-best, and GPS heatmap exports, then inspect each image for filter-related controls, summaries, boxes, and unused space left behind by removed elements.

**Acceptance Scenarios**:

1. **Given** a Distance export with filter elements at the bottom and an outer frame around the chart, **When** the user previews or downloads it, **Then** neither the filter elements nor the outer chart frame appears in the image.
2. **Given** Pace-versus, personal-best, or GPS heatmap export content, **When** the user previews or downloads it, **Then** the same filter-free presentation is applied.
3. **Given** any other existing visualization export, **When** the image is generated, **Then** it also contains no filter controls, filter summaries, or filter/context boxes.
4. **Given** filter elements have been removed from an export, **When** the remaining image is composed, **Then** the visualization uses the available space without an empty area reserved for those elements.

### User Story 2 - Keep the visualization understandable (Priority: P2)

A user needs the exported image to retain its actual title and labels that explain data, while avoiding redundant labels that merely restate obvious settings.

**Why this priority**: Removing filter presentation should simplify the export without making the chart itself ambiguous.

**Independent Test**: Inspect a Run 5 km personal-best export and representative charts with data legends; verify redundant metadata is absent while the title and meaningful chart labels remain.

**Acceptance Scenarios**:

1. **Given** a Run 5 km personal-best export, **When** it is rendered, **Then** the redundant "Metric: Time" label is omitted while the Run 5 km identification and result remain visible.
2. **Given** an export that displays labels such as "Sport: All Sports" or "Colour Scheme", **When** it is rendered, **Then** those redundant filter/configuration labels are omitted.
3. **Given** a visualization with a legend necessary to explain plotted data, **When** its export is rendered without the outer visualization frame, **Then** the legend and its data labels remain visible.
4. **Given** a user changes dashboard filters and exports the resulting view, **When** the export is generated, **Then** the dashboard's selected filters still determine the chart data even though the filter selections are not printed in the image.

### Edge Cases

- An export with no filter elements must not gain a blank filter or context region.
- Removing filter panels and outer visualization frames must not remove a chart legend or label needed to interpret data.
- Long chart titles and labels must remain visible after the freed space is reassigned.
- A no-data export must retain its existing no-data presentation without adding filter summaries.
- Previewed and downloaded versions of the same visualization must follow the same presentation rules.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every existing visualization export MUST omit interactive filter controls, inactive filter options, selected-filter summaries, and other filter/context presentation that is not part of the visualization itself.
- **FR-002**: Export images MUST NOT display filter-related elements as boxed panels, including panels positioned at the bottom of the image, or outer frames that enclose the visualization as a box.
- **FR-003**: Export images MUST omit redundant filter or configuration labels, including "Sport: All Sports" and "Colour Scheme", when those labels do not explain plotted data.
- **FR-004**: Personal-best exports MUST omit redundant metric labels such as "Metric: Time" when the selected personal-best title already identifies the metric, while retaining the event and result.
- **FR-005**: The rules in FR-001 through FR-004 MUST apply to all existing visualization export types and entry points, including Distance, Pace-versus, personal bests, GPS heatmaps, and any other exportable visualization.
- **FR-006**: After filter/context presentation is omitted, the export MUST use the available image space for the visualization and MUST NOT retain a blank region for removed elements.
- **FR-007**: Export images MUST retain titles, plotted content, and data labels or legends that are necessary to identify or interpret the visualization, even when outer visualization frames are removed.
- **FR-008**: Removing filter presentation from exports MUST NOT alter dashboard filter controls, selected filter state, activity selection, aggregation, or visualization values.
- **FR-009**: Preview and download outputs for the same visualization MUST have consistent filter-free presentation and retain the same visualization content.
- **FR-010**: Export generation MUST retain the existing local-processing behavior; this presentation change MUST NOT send visualization data or generated images to a server.

### Key Entities *(include if data involved)*

- **Exported Visualization**: The image preview or downloaded image of a selected dashboard visualization, including its meaningful title, plotted content, and explanatory data labels.
- **Filter/Context Presentation**: Filter controls, available or selected filter values, configuration summaries, and boxed panels that describe or change the view rather than explain the plotted data.
- **Meaningful Chart Label**: A title, result, axis label, or data legend required to identify or interpret the visualization.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of representative exports checked across Distance, Pace-versus, personal bests, GPS heatmaps, and other existing export types, no filter control, filter summary, boxed filter/context panel, or outer frame enclosing the visualization is visible.
- **SC-002**: In 100% of representative exports, redundant labels including "Sport: All Sports", "Colour Scheme", and "Metric: Time" on a Run 5 km personal-best image are absent when they do not explain chart data.
- **SC-003**: In 100% of representative exports, no blank area remains solely to reserve space for omitted filter/context elements, and no meaningful visualization content is clipped.
- **SC-004**: In 100% of checked previews and corresponding downloads, the filter-free layout and the selected visualization content match.
- **SC-005**: At least 90% of reviewers can identify the visualization and its main result from a filter-free export without opening the dashboard.
- **SC-006**: Dashboard filter selections and displayed data remain unchanged by exporting, and no visualization data or generated image is sent to a server by this presentation change.

## Assumptions

- "Filters" includes the boxed filter views and filter controls shown at the bottom of some exports, along with any selected-filter summary or equivalent filter presentation anywhere in an export.
- The request applies to export previews and downloaded images for every existing visualization type; interactive dashboard filters remain available in the dashboard.
- Outer frames enclosing a visualization are removed. Titles, results, axes, and legends that explain plotted data remain; a data legend is not removed merely because it has a boxed or labeled appearance.
- This request supersedes earlier export requirements wherever they call for active filter values or filter summaries to appear in exported images.
- Existing visualization data, dashboard state, no-data behavior, and local-processing boundaries remain unchanged.