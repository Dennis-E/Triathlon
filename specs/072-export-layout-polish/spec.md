# Feature Specification: Export Layout Polish

**Feature Branch**: `072-export-layout-polish`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: Improve export previews and images by adding space below the gray filter heading; using more of the available space in distance, heatmap, distribution, and workout-time visualizations; correcting the pace-versus legend to identify year-colored bubbles; enlarging personal-best previews; hiding heatmap zoom controls; removing the activity-count headline and enlarging the legend in pie charts; and making KPI headlines more readable.

## Clarifications

### Session 2026-10-27

- Q: Where should the extra whitespace appear in the export? → A: Directly below the branded header containing the logo and QR code, before the filter summary; the filters appear before the visualization.
- Q: How should pie-legend and KPI-heading readability be accepted? → A: Use fixed minimum sizes: pie legend 18 px, KPI labels 16 px, and KPI section headings 18 px; all text must remain unclipped at normal preview size.
- Q: What measurable target should apply to vertical space use in the Distance export? → A: Use at least 85% of available width and height where the aspect ratio permits, without distortion or clipping.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand export context and series (Priority: P1)

A user reviews an exported visualization and needs the filters and legend to describe the content clearly without crowding the chart.

**Why this priority**: Crowded filters and a legend that names measures instead of the displayed year series make an otherwise correct export difficult to interpret.

**Independent Test**: Generate an export with visible filters and a pace-versus chart containing multiple years; inspect the spacing and compare each legend label and color with the displayed bubbles.

**Acceptance Scenarios**:

1. **Given** an export with active filter values, **When** the export is rendered, **Then** the filter summary appears after visible space below the branded header and before the visualization, without crowding or overlapping either region.
2. **Given** a pace-versus visualization whose bubbles use colors to distinguish years, **When** the export legend is rendered, **Then** it identifies the represented years and uses the matching bubble colors rather than presenting red and blue measure labels as the bubble legend.
3. **Given** a year has no displayed data, **When** the legend is rendered, **Then** it does not imply that the absent year is represented by a bubble series.

### User Story 2 - Use visualization space efficiently (Priority: P1)

A user views distance, heatmap, distribution, or workout-time exports and wants the visualization to use the available image area rather than leaving large unused margins.

**Why this priority**: Excessive empty space makes visualizations and their data harder to inspect at normal viewing size.

**Independent Test**: Generate representative exports for distance, heatmap, distributions, and workout time; compare chart bounds with the available content region and verify that no content is clipped.

**Acceptance Scenarios**:

1. **Given** a distance visualization, **When** it is exported, **Then** it uses the available vertical and horizontal chart area with substantially reduced empty space on both sides.
2. **Given** a heatmap export, **When** it is rendered, **Then** the plus and minus zoom controls are absent from the export and the map uses the available area while remaining fully visible.
3. **Given** a distribution or workout-time visualization, **When** it is exported, **Then** the plot uses the available width without excessive left or right margins and its labels remain visible.

### User Story 3 - Read detailed and summary exports (Priority: P1)

A user views a personal-best, pie-chart, or KPI export and needs its primary content and labels to be legible at normal viewing size.

**Why this priority**: Small charts, unnecessary headlines, and undersized supporting text obscure the most useful information in these exports.

**Independent Test**: Generate a personal-best export such as Run 5 km, a pie-chart export, and a KPI export; inspect their content area, title hierarchy, and text legibility.

**Acceptance Scenarios**:

1. **Given** a personal-best export with substantial unused space around the chart, **When** the preview is rendered, **Then** the chart is enlarged to use the available content region without clipping or distortion.
2. **Given** a pie-chart export with an activity-count headline, **When** the export is rendered, **Then** that headline is omitted, the pie chart receives the freed space, and the legend is larger and readable at normal viewing size.
3. **Given** an export containing KPI headings, **When** it is rendered, **Then** the headings are larger and easier to read than in the current export presentation.

### Edge Cases

- Long filter values or several filter rows must retain separation from the visualization without being clipped.
- A pace-versus export with only one represented year must show only that year in the series legend.
- Heatmaps with different route shapes must remain fully visible when fitted into the available area.
- Personal-best charts with different aspect ratios must be enlarged without changing proportions or clipping labels.
- Pie charts with many legend entries must keep every entry available and readable without overlapping the chart.
- Narrow export dimensions must preserve readable labels and avoid overlap, even when the chart cannot fill both dimensions at once.
- Empty or unavailable visualization data must retain its existing no-data behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Export images MUST place the active filter summary after visible spacing below the branded header and before the visualization; the filter summary MUST NOT crowd or overlap either region.
- **FR-002**: Pace-versus export legends MUST identify the years represented by the displayed bubble series and MUST associate each year with its actual bubble color.
- **FR-003**: Distance exports MUST use at least 85% of the available plot width and height where the chart's aspect ratio permits, reduce excessive side margins, and preserve proportions without clipping.
- **FR-004**: Heatmap exports MUST omit plus and minus zoom controls and enlarge the map to fit the available content area while keeping the map fully visible.
- **FR-005**: Distribution and workout-time exports MUST reduce excessive left and right whitespace and use the available plot width while preserving readable labels.
- **FR-006**: Personal-best export previews MUST enlarge the selected visualization to use the available content region without distortion, clipping, or unnecessary surrounding whitespace.
- **FR-007**: Pie-chart exports MUST omit the activity-count headline, use the resulting space to enlarge the pie chart, and display legend text at a minimum 18 px without clipping.
- **FR-008**: KPI exports MUST display KPI labels at a minimum 16 px and section headings at a minimum 18 px without clipping.
- **FR-009**: Each updated export preview and its corresponding downloaded image MUST present the same visualization layout and visible labels.
- **FR-010**: These changes MUST affect presentation only and MUST NOT change the selected activities, filters, aggregation, or visualization values.
- **FR-011**: Export generation MUST retain the existing local-processing behavior; visualization data and generated images MUST NOT be sent to a server.

### Key Entities *(include if feature involves data)*

- **Export Preview**: The on-screen representation of an image users can inspect before using the export.
- **Exported Visualization**: The final shareable image, including its chart, filters, legend, and any summary labels.
- **Series Legend**: Labels and colors that explain the categories represented by plotted marks, including years in pace-versus charts.
- **Chart Content Region**: The area available for a visualization after its relevant headings, filters, and labels are placed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of representative exports with filters, the filter summary appears after visible spacing below the branded header and before the visualization, with no overlap.
- **SC-002**: In 100% of pace-versus exports, every displayed year series has a matching year label and color in the legend, and no unrepresented year is shown as a series.
- **SC-003**: In representative Distance exports, chart content uses at least 85% of the available plot width and height where the aspect ratio permits; Distribution and Workout Time exports use at least 85% of the available plot width. No labels are clipped; heatmaps show no zoom controls and fit the complete map within the available content area.
- **SC-004**: In representative personal-best exports, the chart occupies at least 85% of the available chart region in its limiting dimension while preserving its proportions and remaining unclipped.
- **SC-005**: In 100% of representative exports, pie-legend text is at least 18 px, KPI labels are at least 16 px, and KPI section headings are at least 18 px; all remain unclipped at normal preview size.
- **SC-006**: In 100% of checked updated export types, the preview and downloaded image have matching layouts, and the selected activity data and values remain unchanged.
- **SC-007**: No visualization data or generated image is transmitted to a server by these presentation changes.

## Assumptions

- The requested changes apply to export previews and the corresponding exported images, not to the underlying dashboard visualizations outside the export flow.
- The branded header remains first; the filter summary is moved below it with visible spacing, ahead of the visualization.
- Existing filtering, aggregation, chart values, and no-data behavior remain unchanged.
- “Normal viewing size” means the displayed preview or image at its intended, unzoomed size.
- If a visualization's aspect ratio prevents it from filling both dimensions, preserving the complete visualization and its proportions takes precedence over filling the region.