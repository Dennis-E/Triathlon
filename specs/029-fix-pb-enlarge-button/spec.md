# Feature Specification: Fix Power PB Enlarge Button

**Feature Branch**: `029-fix-pb-enlarge-button`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "on the PB tiles for watt the \"enlarge\" icon differs from the other tiles. actually it is a button which is fully black filled and nothing is shown. please correct this"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use the Power PB enlarge control (Priority: P1)

A cyclist viewing a Bike power Personal Best tile wants to recognize and use the enlarge control, so the detailed view can be opened just like for the other Personal Best tiles.

**Why this priority**: The current control appears as a solid black button with no visible icon, making its purpose unclear and reducing access to the detailed power PB view.

**Independent Test**: Open the Personal Bests view with Bike power data, inspect each power duration tile, verify the enlarge control is visibly identifiable, and activate it to confirm that the corresponding detailed view opens.

**Acceptance Scenarios**:

1. **Given** a Bike power duration tile is displayed, **When** the user looks at its header, **Then** the enlarge control shows a visible enlarge icon with the same recognizable appearance as the corresponding controls on the other Personal Best tiles.
2. **Given** a Bike power duration tile has a visible enlarge control, **When** the user activates it, **Then** the detailed view for that tile opens and displays the matching power PB content.
3. **Given** multiple Bike power duration tiles are displayed, **When** the user compares their enlarge controls, **Then** all controls use the same visual treatment, including icon visibility, button size, contrast, and interactive states.

### Edge Cases

- The control remains visible and identifiable when a tile contains only one power PB data point.
- The control remains usable at narrow viewport widths without being clipped or pushed outside the tile header.
- Hover, focus, and active states must preserve sufficient contrast so the icon does not disappear.
- If no Bike power tiles are rendered, no orphaned enlarge control is shown elsewhere in the Personal Bests view.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each rendered Bike power Personal Best duration tile MUST display a recognizable enlarge icon inside its detail-view button.
- **FR-002**: The enlarge control on Bike power tiles MUST use the same visual appearance and interaction states as the enlarge controls on the other Personal Best tiles.
- **FR-003**: The enlarge icon and its surrounding button MUST have sufficient contrast in default, hover, focus, and active states so the icon remains visible.
- **FR-004**: Activating a Bike power tile's enlarge control MUST continue to open the detailed view for that specific tile.
- **FR-005**: The correction MUST apply consistently to every supported Bike power duration tile without changing PB calculations, chart values, or tile data.
- **FR-006**: The control MUST remain visible and usable across supported desktop and narrow viewport layouts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of visual checks for rendered Bike power PB tiles, the enlarge icon is visible against the button background in the default state.
- **SC-002**: In 100% of interaction checks, activating the enlarge control opens the matching power PB detail view without changing the selected tile's data.
- **SC-003**: In 100% of comparisons with the other Personal Best tiles, the Bike power enlarge controls match their icon visibility, dimensions, contrast, and interaction states.
- **SC-004**: The corrected control remains fully visible and usable at both standard desktop and narrow supported viewport sizes.
- **SC-005**: Existing Personal Best regression tests for power PB values and detail-view behavior continue to pass.

## Assumptions

- "Other tiles" refers to the existing Personal Best tile controls that already display a recognizable enlarge icon and open a full-screen detail view.
- The requested correction is limited to the enlarge control's presentation and does not change the power PB chart, calculations, supported durations, or detail-view content.
- The existing accessible name and detail-view interaction are retained unless a presentation fix requires their text to be adjusted.
- The Personal Bests view continues to support its existing desktop and narrow viewport layouts.
