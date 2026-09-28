# Feature Specification: Landing Preview and Navigation

**Feature Branch**: `044-landing-preview-navigation`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "On the landing page: (1) the Workout Time preview is missing; (2) the header bar with navigation to visualizations has a fixed width instead of an adaptive design. When it does not fit on screen, show a `>>` button to scroll the bar. Once it has been scrolled to the right, also show a `<<` symbol on the left."

## Clarifications

### Session 2026-09-28

- Q: Wie weit soll die Visualisierungsleiste bei jedem Klick auf `>>` oder `<<` scrollen? → A: Bis zum nächsten noch ausgeblendeten Eintrag scrollen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover Workout Time Preview (Priority: P1)

As a visitor to the landing page, I want to see a Workout Time preview with the other visualization previews so that I can understand this visualization before importing my own data.

**Why this priority**: The absent preview leaves visitors unaware of an available visualization and makes the landing-page overview incomplete.

**Independent Test**: Open the landing page without importing data and verify that the Workout Time preview is visible, identifiable, and behaves consistently with the other preview cards.

**Acceptance Scenarios**:

1. **Given** a visitor opens the landing page before importing data, **When** the visualization preview area is displayed, **Then** a clearly titled Workout Time preview appears alongside the other previews.
2. **Given** a visitor selects the Workout Time preview, **When** dashboard data is required, **Then** the existing import guidance is shown rather than an empty or misleading visualization.
3. **Given** a visitor views the Workout Time preview, **When** they compare it with the other cards, **Then** its preview image, title, and description make its purpose recognizable.

---

### User Story 2 - Reach Every Visualization on Any Screen (Priority: P1)

As a visitor navigating the visualization header bar, I want its available space to adapt to my screen and controls to scroll the bar when its contents do not fit, so that every visualization remains reachable without the bar forcing the page wider than the screen.

**Why this priority**: Fixed-width navigation can hide visualization choices on narrow screens and prevents users from reaching dashboard content.

**Independent Test**: View the visualization navigation at widths where all items fit and where they overflow; verify that the navigation adapts, the appropriate directional controls appear, and each item can be reached in both directions.

**Acceptance Scenarios**:

1. **Given** all visualization navigation items fit in the available header space, **When** the page is displayed, **Then** neither scroll control is shown and all items remain visible.
2. **Given** navigation items extend beyond the available space on the right, **When** the page is displayed at that width, **Then** a `>>` control is shown and activating it scrolls the navigation to reveal further items.
3. **Given** the navigation has been scrolled away from its starting position, **When** additional items remain hidden to the left, **Then** a `<<` control is shown and activating it scrolls the navigation back toward the start.
4. **Given** the navigation is at its starting position or its farthest reachable position, **When** the corresponding direction has no more content to reveal, **Then** that direction's control is hidden or unavailable.
5. **Given** the screen is resized or the navigation contents change, **When** the available space or overflow changes, **Then** the visible controls update to match the new scroll position and available content.
6. **Given** a visitor uses keyboard navigation, **When** they reach either scroll control, **Then** it has an understandable accessible name, can be activated by keyboard, and does not prevent access to the visualization items.
7. **Given** additional navigation items are hidden in the activated direction, **When** a visitor activates a directional control, **Then** the bar scrolls just far enough to reveal the next hidden item without skipping an item.

### Edge Cases

- When the navigation fits exactly within the available width, no scroll control is shown unless content is actually hidden.
- When the user scrolls to the far right, the `>>` control is no longer shown while the `<<` control remains available until the bar returns to its starting position.
- When resizing changes the bar from overflowing to fitting, both controls disappear and all navigation items become visible.
- When long visualization names or a very narrow viewport reduce the visible area, controls do not cover the labels or make any item unreachable.
- When the user activates a control repeatedly or reaches either end of the bar, scrolling stops at the available content boundary without changing the selected visualization unexpectedly.
- When a preview asset is unavailable, the Workout Time card remains identifiable and the rest of the landing page remains usable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The landing page MUST display a clearly titled Workout Time preview in the same preview area and visual pattern as the other visualization previews.
- **FR-002**: The Workout Time preview MUST communicate that it presents when workouts occur, using a recognizable visual, title, or description.
- **FR-003**: Selecting the Workout Time preview MUST preserve the existing behavior for accessing data-dependent visualizations, including import guidance when no activity data has been provided.
- **FR-004**: The visualization navigation bar MUST adapt to the available screen width rather than force its contents to determine a wider page layout.
- **FR-005**: When navigation items are hidden beyond the visible area to the right, the navigation MUST provide a `>>` control that reveals them when activated.
- **FR-006**: After the navigation has moved from its starting position and items are hidden to the left, the navigation MUST provide a `<<` control that reveals them when activated.
- **FR-007**: Each directional control MUST be hidden or unavailable when there is no further navigation content in its direction, and its availability MUST update when the viewport size or navigation position changes.
- **FR-008**: The directional controls MUST have accessible names, support keyboard activation, and leave the visualization navigation items operable.
- **FR-009**: At supported narrow and wide screen sizes, users MUST be able to reach every visualization navigation item without page-level horizontal overflow, clipped labels, or controls obscuring items.
- **FR-010**: Activating a directional control MUST scroll just far enough to reveal the next navigation item hidden in that direction, without skipping any intervening item.
- **FR-011**: Adding the Workout Time preview and adaptive navigation MUST NOT change the existing visualization destinations or their selection behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of landing-page checks before data import, visitors can identify a Workout Time preview among the available visualization previews.
- **SC-002**: In 100% of navigation checks where all items fit, all items are visible and neither directional control is displayed.
- **SC-003**: In 100% of navigation checks with hidden items, users can reveal and reach every item using the directional controls in both directions.
- **SC-004**: At least 95% of checks across supported narrow and wide screen sizes complete without page-level horizontal overflow, clipped navigation labels, or obscured controls.
- **SC-005**: In 100% of checks at the start and end of the navigation bar, the controls accurately indicate whether additional items can be revealed in each direction.
- **SC-006**: Keyboard-only users can operate both scroll controls and reach every visualization navigation item in 100% of accessibility checks.

## Assumptions

- The requested Workout Time preview is a visitor-facing example card on the landing page, using the existing preview content and dashboard-entry behavior rather than adding a new Workout Time visualization capability.
- The navigation bar is the existing header navigation for dashboard visualizations; its destinations, labels, and selection behavior remain unchanged.
- `>>` and `<<` describe rightward and leftward navigation controls; their visual styling may follow the established interface as long as their direction and purpose are clear.
- Navigation may also be moved through existing pointer or touch interactions; directional controls provide an explicit way to reveal items when the available width is insufficient.
- The preview remains usable without a visitor-side private activity export, and any published preview content follows the project's existing privacy expectations.
- Supported screen sizes include narrow mobile viewports and wide desktop viewports; the exact responsive breakpoints follow the existing product conventions.
