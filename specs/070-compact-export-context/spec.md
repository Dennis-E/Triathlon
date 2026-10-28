# Feature Specification: Compact Export Context

**Feature Branch**: `070-compact-export-context`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "- export: remove from all exports the \"filter views\", eg in the picture that is created the filters are taking too much space. only include the relevant filters that are used to create this view, eg run, yearly or 2026. in principle: Give the concrete visualization much more space soit is much better visible and readable"

## Clarifications

### Session 2026-10-27

- Q: Which area should count as the denominator for the requirement that the visualization fill at least 80% of an export? → A: The area below the title and branding, excluding any compact active-context line.
- Q: Should exported image dimensions adapt to each visualization to reach the 80% area target? → A: Keep the existing square export format and adjust the target to a maximum aspect-ratio-preserving fit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the visualization clearly in exports (Priority: P1)

A user exports a visualization and wants the image to focus on the chart, with only a concise indication of the active choices that determine what the chart shows.

**Why this priority**: Large filter-control areas reduce the space available to the visualization and make the exported image harder to read.

**Independent Test**: Export representative visualizations with several available filter controls, then verify the image shows only the active context relevant to each view and gives the visualization substantially more space.

**Acceptance Scenarios**:

1. **Given** a visualization filtered to Run, yearly aggregation, and 2026, **When** the user exports it, **Then** the image identifies those active choices concisely and does not show controls or options for changing to other sports, aggregation levels, or years.
2. **Given** a visualization with available filters but no active filter that determines its displayed content, **When** the user exports it, **Then** no empty filter area is reserved and the visualization uses that space.
3. **Given** two different visualization types with different active filter dimensions, **When** each is exported, **Then** each image includes only the active context relevant to that specific visualization.
4. **Given** the same visualization is exported through different existing export actions, **When** each image is generated, **Then** each uses the same compact-context behavior and preserves the displayed visualization and its selected state.

### Edge Cases

- A selected value that does not affect the current visualization must not be included as active export context.
- When several active values are relevant, all must remain identifiable without restoring the full filter controls or obscuring the visualization.
- Long active labels must remain readable and must not overlap the visualization.
- Visualizations with no filters or no relevant active selections must not retain a blank context region.
- Compacting export context must not change filter choices or the visualization shown in the dashboard.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every existing visualization image export MUST omit filter controls, option lists, and alternative filter views that are not themselves part of the rendered visualization.
- **FR-002**: An export MUST include a concise indication of each currently selected filter value that directly determines the exported visualization, such as sport, aggregation period, or year.
- **FR-003**: The exported image MUST NOT include inactive or irrelevant filter values, including choices that are merely available but not selected or do not affect that visualization.
- **FR-004**: If there is no active filter context relevant to the visualization, the export MUST omit the context area rather than reserve empty space.
- **FR-005**: The visualization MUST be scaled to the largest size that fits in the export area remaining after the existing title and branding and any compact active-context indication are excluded, while preserving its aspect ratio and avoiding cropping.
- **FR-006**: Active context labels MUST remain readable, distinguishable from the visualization, and non-overlapping in every existing export format.
- **FR-007**: Exporting MUST preserve the currently displayed visualization and its selected filter state; this feature MUST NOT change dashboard filter controls or filtering behavior.
- **FR-008**: All existing visualization image export entry points MUST apply the same rules for choosing and displaying active context.

### Key Entities *(include if feature involves data)*

- **Exported Visualization**: The image of the currently displayed chart or visual, including its existing title and branding.
- **Active Visualization Context**: The selected filter values that directly determine which data or presentation appears in a particular visualization, such as Run, yearly aggregation, or 2026.
- **Available Filter Options**: Choices offered by dashboard controls that are not all part of the current view and must not be reproduced as export controls or lists.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested exports, no inactive filter option, alternative view control, or irrelevant filter value appears in the image.
- **SC-002**: In 100% of tested exports with active relevant filters, every value that determines the displayed view is identifiable from the compact context.
- **SC-003**: In 100% of representative exports, the visualization is fitted at its largest aspect-ratio-preserving size within the available area and uses at least 80% of the dimension that limits that fit.
- **SC-004**: At least 90% of reviewers can identify the visualization's active sport and time scope from the exported image without opening the dashboard.
- **SC-005**: In 100% of tested exports without relevant active filters, no blank filter/context region is visible.
- **SC-006**: In 100% of tested export entry points, the exported chart and filter state match the visualization selected in the dashboard.

## Assumptions

- "Filter views" refers to the filter controls, menus, and alternative options currently taking space in exported images, not the dashboard's interactive filter controls.
- The compact context is a non-interactive summary of only the selected values that directly determine the exported view; for example, it may identify Run, yearly aggregation, and 2026.
- The behavior applies to all existing visualization image exports, including their current preview and download routes.
- The exported image retains the existing 1080 x 1080 square format. The 80% threshold applies to the limiting width or height of the maximum proportional fit, rather than the total pixel area of the remaining canvas.
- Existing titles, branding, chart content, and export behavior unrelated to filter presentation remain unchanged.
- This export-only change does not restore or alter dashboard filter-summary bubbles addressed by a separate feature.
