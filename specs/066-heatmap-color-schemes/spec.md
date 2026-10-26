# Feature Specification: Heatmap Color Schemes

**Feature Branch**: `066-heatmap-color-schemes`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "Heatmap: filter for 'colour scheme'. Auswahl: black mode with 'fire'. blue-red. yellow-red. blueish."

## Clarifications

### Session 2026-10-23

- Q: Soll „Black + Fire“ die Kartenfläche abdunkeln oder nur die Routenfarben ändern? → A: Die Kartenfläche wird dunkel dargestellt und die Routen erhalten einen Feuer-Farbverlauf.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose a heatmap color scheme (Priority: P1)

As an athlete viewing my GPS heatmap, I want to choose a color scheme that suits my
preference and viewing conditions, so that route frequency is easy to distinguish on the
map.

**Why this priority**: The requested feature is the ability to select among distinct ways
to display the existing route-frequency information.

**Independent Test**: Load activities with routes at several visit frequencies, select each
available scheme in turn, and confirm the map and its frequency guide update to that scheme.

**Acceptance Scenarios**:

1. **Given** the heatmap has route data, **When** the athlete opens the color-scheme filter,
   **Then** the choices are Black + Fire, Blue to Red, Yellow to Red, and Blue.
2. **Given** routes with different visit frequencies are visible, **When** the athlete selects
   any scheme, **Then** the map displays an ordered, distinguishable color progression for
   those frequencies using the selected scheme.
3. **Given** the athlete selects a scheme and then changes the sport filter, **When** the
   heatmap updates, **Then** the selected scheme remains active and colors reflect the
   frequencies within the newly selected sport view.
4. **Given** the athlete changes the selected scheme, **When** the frequency guide is
   displayed, **Then** its colors match the active scheme and its low-to-high meaning remains
   clear.

---

### User Story 2 - Use a dark fire-style map (Priority: P2)

As an athlete who prefers a dark map, I want a black map presentation with fire-colored
routes, so that the heatmap remains readable in a dark visual style.

**Why this priority**: This is one of the explicitly requested choices and provides a
distinct appearance from the color ramps on the standard map.

**Independent Test**: Select Black + Fire and confirm the map presentation is dark, route
colors remain visible and ordered by frequency, and the legend explains the same progression.

**Acceptance Scenarios**:

1. **Given** the standard map is visible, **When** the athlete selects Black + Fire,
   **Then** the map uses a black or near-black presentation and routes use a visible fire
   progression from lower to higher frequency.
2. **Given** Black + Fire is active, **When** the athlete switches to another scheme,
   **Then** the map returns to the standard map presentation and applies the selected route
   colors.

### Edge Cases

- When all visible routes have the same frequency, they MUST use the same color within the
  selected scheme and MUST NOT imply a frequency difference.
- When no GPS-backed routes exist for the selected sport, the existing empty state MUST
  remain visible; changing schemes MUST NOT create misleading routes or legend values.
- When the athlete changes schemes while the heatmap has no route data, the choice MUST be
  retained for the next rendered data view.
- Every scheme MUST keep low-frequency routes visible against its map presentation,
  including Black + Fire.
- Exporting the heatmap MUST capture the currently selected scheme and map presentation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The heatmap MUST provide a color-scheme filter with exactly these choices:
  Black + Fire, Blue to Red, Yellow to Red, and Blue.
- **FR-002**: The heatmap MUST display route frequency through an ordered color progression
  for each selected scheme, with higher visit frequency appearing more prominent than lower
  visit frequency.
- **FR-003**: Black + Fire MUST darken the map presentation and use a contrasting
  fire-colored route progression that remains visible across the supported frequency range.
- **FR-004**: Blue to Red MUST progress from blue for lower route frequency to red for higher
  route frequency.
- **FR-005**: Yellow to Red MUST progress from yellow for lower route frequency to red for
  higher route frequency.
- **FR-006**: Blue MUST use a blue-only progression that distinguishes lower from higher
  route frequency.
- **FR-007**: Changing the color scheme MUST update route colors and the frequency guide
  without changing route frequencies, route geometry, or activity data.
- **FR-008**: The selected scheme MUST remain active when the athlete changes among All
  Sports, Run, Bike, and Swim, and route colors MUST reflect the active sport's frequencies.
- **FR-009**: The frequency guide MUST use the selected scheme and continue to identify the
  low-to-high frequency meaning.
- **FR-010**: The default scheme MUST preserve the current Blue to Red appearance for
  existing users until they select another scheme.
- **FR-011**: Empty-state behavior, route visibility, map navigation, activity details, and
  the existing heatmap export flow MUST continue to work with every scheme; export output
  MUST reflect the active scheme.

### Key Entities *(include if feature involves data)*

- **Color Scheme**: A named visual style selected for the heatmap, defining the map
  presentation where applicable and the ordered route-frequency colors.
- **Route Frequency Scale**: The current view's mapping of route visit frequencies to
  low-to-high positions, reused by every color scheme.
- **Frequency Guide**: The visual explanation of the active scheme's route-frequency
  progression.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All four requested schemes are available from the heatmap filter and can each
  be selected successfully.
- **SC-002**: In a view containing at least four distinct route-frequency values, every
  scheme displays the values in correct low-to-high order, with adjacent sample values
  visually distinguishable.
- **SC-003**: Switching schemes updates the map and frequency guide together, with no stale
  colors remaining from the previously selected scheme.
- **SC-004**: After selecting a scheme, switching through All Sports, Run, Bike, and Swim
  retains that scheme and shows colors based on each selected view's frequencies.
- **SC-005**: In all four schemes, low-frequency routes remain identifiable and the empty
  state remains correct when no GPS routes match the active sport filter.
- **SC-006**: Heatmap exports match the currently selected scheme and map presentation in
  every supported scheme.

## Assumptions

- “Black mode with fire” means a dark map presentation with contrasting fire-colored routes,
  not merely a route-color change on the existing map.
- The other three schemes change route colors while retaining the standard map
  presentation.
- The existing logarithmic frequency mapping and sport-specific route counts remain the
  source of route prominence; this feature changes visual presentation only.
- Blue to Red is the default so the heatmap retains its current appearance unless the user
  chooses another scheme.
- The selection persists while the current dashboard session is active; persistence across
  page reloads is not required.
- Exact color values and intermediate stops are design decisions, provided each progression
  is distinguishable, ordered, and readable against its map presentation.