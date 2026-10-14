# Feature Specification: Heatmap Zoom Preservation on Sport Filter Changes

**Feature Branch**: `058-heatmap-zoom-preservation`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Heatmap: when switching from ‘All’ to e.g. ‘Bike’ (or Run or Swim), the zoom returns to the world view. It should stay at the same zoom and coordinates as before."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep the current map view while filtering (Priority: P1)

As an athlete exploring the heatmap, I want the map to keep its current zoom and geographic position when I switch the sport filter, so that I can compare the routes for different sports in the same area without having to navigate back to it each time.

**Why this priority**: Losing the current map view interrupts exploration and makes comparisons between All Sports, Run, Bike, and Swim unnecessarily difficult.

**Independent Test**: Open the heatmap, pan and zoom to a recognizable location, then switch from All Sports to each individual sport and back. Confirm that the same geographic area remains centered at the same zoom after every change while the displayed routes reflect the selected filter.

**Acceptance Scenarios**:

1. **Given** the map is panned and zoomed away from its initial world view, **When** the athlete changes from All Sports to Run, Bike, or Swim, **Then** the map remains at the same geographic center and zoom level while the routes update to the selected sport.
2. **Given** the athlete has selected an individual sport, **When** they switch to another sport or back to All Sports, **Then** the map retains the same geographic center and zoom through each successive filter change.
3. **Given** the map is at a city or street-level view, **When** the athlete changes the sport filter, **Then** the view does not reset to the world view or jump to the filtered routes' overall extent.

### User Story 2 - Preserve the view when a filter has no routes (Priority: P2)

As an athlete exploring a particular area, I want an empty sport-filter result to leave the map view in place, so that I can change to another sport and continue comparing the same location.

**Why this priority**: A sport with no GPS-backed routes in the current dataset should not discard the user's map position or make returning to another filter disruptive.

**Independent Test**: Navigate to a non-default map view, select a sport with no GPS-backed routes, and verify that the existing empty state appears without changing the map center or zoom. Select a sport with routes and verify the map still shows the original area at the original zoom.

**Acceptance Scenarios**:

1. **Given** the athlete is at a non-default map view and the selected sport has no GPS-backed routes, **When** they select that sport, **Then** the existing empty state is shown and the map view remains unchanged.
2. **Given** the empty state is shown after a filter change, **When** the athlete selects a sport that has routes, **Then** those routes appear in the retained map view without resetting or auto-fitting the map.

### Edge Cases

- Switching filters while already at the initial world view MUST leave the map at that same view.
- Switching filters repeatedly, including between two individual sports without returning to All Sports, MUST preserve the same view across every change.
- If the active filter has no GPS-backed routes, the existing empty-state behavior MUST remain intact and MUST NOT reset the map view.
- The current viewport-preservation behavior applies while exploring the same imported dataset. Importing a different dataset may continue to use the application's existing initial-view behavior.
- Selecting the already-active filter MUST NOT cause the map to move or change zoom.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the athlete changes the heatmap sport filter among All Sports, Run, Bike, and Swim, the map MUST retain the geographic center and zoom level that were active immediately before the change.
- **FR-002**: The system MUST update the displayed routes, route frequencies, and other filter-dependent map information to reflect the newly selected sport while retaining the current map view.
- **FR-003**: Changing the sport filter MUST NOT reset the map to its initial world view or automatically fit the selected sport's routes to the viewport.
- **FR-004**: The map MUST retain its current center and zoom when the selected sport has no GPS-backed routes and the existing empty state is displayed.
- **FR-005**: The retained map view MUST continue to apply across successive filter changes, including switching directly between individual sports and returning to All Sports.
- **FR-006**: The existing filter choices, route filtering, map navigation, and empty-state behavior MUST remain available and function as before, except that changing a filter no longer resets the viewport.
- **FR-007**: The current map-view preservation requirement MUST apply while the imported dataset remains unchanged; behavior when a different dataset is imported remains governed by the existing initial-view behavior.

### Key Entities *(include if feature involves data)*

- **Map View**: The geographic center and zoom level currently chosen by the athlete through map navigation; the state to be retained while the sport filter changes.
- **Sport Filter**: The active choice among All Sports, Run, Bike, and Swim that determines which activities and routes are shown.
- **Filtered Route Display**: The routes and related map information derived from the active sport filter, which changes independently of the retained map view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested transitions among All Sports, Run, Bike, and Swim on an unchanged dataset, the map remains at its pre-change geographic center and zoom level.
- **SC-002**: In 100% of tested filter transitions from city- or street-level views, the map does not return to the world view or jump to the selected routes' overall extent.
- **SC-003**: After every tested filter change, the displayed routes match the selected sport, with no routes left visible from the previous filter.
- **SC-004**: When a selected sport has no GPS-backed routes, the existing empty state is shown and the map retains the same center and zoom; selecting a sport with routes afterward restores matching routes within that retained view.
- **SC-005**: Athletes can compare multiple sports in the same geographic area without manually re-panning or re-zooming after each filter change.

## Assumptions

- “Same coordinates” means retaining the geographic center currently visible to the athlete, along with the same zoom level; it does not require preserving pixel-level positions of individual route lines as filter-dependent content changes.
- Filter changes apply to the currently imported dataset and do not imply a dataset reload or a deliberate map reset.
- Existing route filtering, frequency calculations, map controls, and empty-state presentation remain unchanged; the requested behavior concerns only retention of the current map view during sport-filter changes.
