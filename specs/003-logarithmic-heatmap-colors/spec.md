# Feature Specification: Logarithmic Heatmap Colors

**Feature Branch**: `003-logarithmic-heatmap-colors`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "In the heatmap I would like a colour scheme depending on the frequency from light blue towards darker blue and then becoming red in the extreme cases. Make it a logarithmic scale, so that infrequently travelled areas do not fully disappear because some tracks are magnitudes more used."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read route frequency from color (Priority: P1)

As an athlete, I want route colors to progress from light blue through darker blue to red
as travel frequency increases, so that I can distinguish occasional routes, regular routes,
and exceptionally frequent routes at a glance.

**Why this priority**: Frequency is the core information conveyed by the heatmap. A clear,
ordered color progression makes the athlete's route history understandable without inspecting
individual activities.

**Independent Test**: Display route segments with frequencies spanning several orders of
magnitude (for example 1, 10, 100, and 1,000 visits) and verify that their colors progress in
order from light blue through increasingly dark blue, with red reserved for the extreme end.

**Acceptance Scenarios**:

1. **Given** visible route segments have low, medium, high, and extreme visit frequencies,
   **When** the heatmap is rendered, **Then** the segments progress from light blue through
   darker blue to red in the same order as their frequencies.
2. **Given** two route segments have the same visit frequency under the active sport filter,
   **When** the heatmap is rendered, **Then** they receive the same frequency color.
3. **Given** a route segment is frequent but not at the extreme end of the displayed
   frequency range, **When** the heatmap is rendered, **Then** it remains blue rather than
   being presented as an extreme red segment.

---

### User Story 2 - Keep infrequent routes visible (Priority: P1)

As an athlete with a few heavily repeated routes and many occasional routes, I want the color
scale to compress large frequency differences, so that one-off and infrequent travel remains
visible instead of being visually erased by routes used hundreds or thousands of times.

**Why this priority**: Preserving infrequent routes is the reason for using a logarithmic
scale. Without this behavior, the new palette would fail for long training histories where
route frequencies differ by orders of magnitude.

**Independent Test**: Display a dataset containing one-visit routes alongside routes visited
10, 100, and 1,000 times. Confirm that every frequency level remains visible against the base
map and that the lower-frequency levels retain distinguishable shades.

**Acceptance Scenarios**:

1. **Given** a once-traveled route is displayed alongside a route traveled 1,000 times,
   **When** the heatmap is rendered, **Then** the once-traveled route remains clearly visible
   against the base map.
2. **Given** route frequencies differ by equal multiplicative steps such as 1, 10, 100, and
   1,000, **When** colors are assigned, **Then** each step produces a meaningful progression
   through the scale rather than concentrating nearly all visible change at the highest step.
3. **Given** multiple low-frequency routes have different visit counts, **When** the heatmap
   is rendered, **Then** their colors remain distinguishable where the logarithmic scale
   assigns them different positions.

---

### User Story 3 - Understand and filter the scale consistently (Priority: P2)

As an athlete, I want the map's frequency colors to remain understandable when I change sport
filters, so that I can compare route prominence within the currently selected activity set.

**Why this priority**: The existing sport filters change the underlying visit frequencies.
The color display must follow those values without stale or contradictory results.

**Independent Test**: Switch among All Sports, Run, Bike, and Swim using a dataset where the
same route has different frequencies per sport. Verify that colors update from the selected
frequencies and that the displayed scale communicates the current low-to-extreme progression.

**Acceptance Scenarios**:

1. **Given** a route has different frequencies across sport categories, **When** the athlete
   changes the sport filter, **Then** its color updates to reflect its frequency within the
   selected category.
2. **Given** the selected filter changes the displayed frequency range, **When** the map
   updates, **Then** the visible scale guide updates to match the current light-blue,
   dark-blue, and red meaning.

### Edge Cases

- When every displayed route has the same frequency, all routes MUST use the same visible
  blue color; the map MUST NOT imply nonexistent frequency differences or mark every route
  as extreme.
- When only one route is available, it MUST remain visible in blue and MUST NOT be marked red
  merely because it is the maximum of a one-item dataset.
- When the highest route frequency is many orders of magnitude above the lowest, the lowest
  frequencies MUST remain visible and the color ordering MUST remain monotonic.
- When no GPS-backed routes exist for the selected filter, the existing empty state MUST be
  preserved and the frequency scale guide MUST NOT show misleading values.
- When invalid or non-positive frequency values are encountered, they MUST NOT influence the
  scale or cause valid routes to be rendered incorrectly.
- Color changes MUST preserve the existing visibility of isolated routes at world zoom and
  MUST NOT obscure map labels or route geometry at closer zoom levels.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST assign route-segment colors from their visit frequencies using
  a logarithmic scale.
- **FR-002**: The scale MUST map the lowest valid frequency to a clearly visible light blue,
  progress through darker blues as frequency increases, and use red for only the extreme
  high end of a varied frequency range.
- **FR-003**: Color progression MUST be monotonic: a route with a higher frequency MUST NOT
  appear lighter or less prominent in color than a route with a lower frequency in the same
  filtered view.
- **FR-004**: The logarithmic scale MUST give equal multiplicative increases in frequency
  comparable visual spacing, so datasets spanning orders of magnitude do not compress all
  low-frequency routes into an indistinguishable minimum.
- **FR-005**: Single-visit and other infrequently traveled route segments MUST remain clearly
  visible against the base map even when the maximum frequency is at least 1,000 times the
  minimum frequency.
- **FR-006**: Red MUST be reserved for the upper tenth of the logarithmic frequency range;
  all non-extreme positions below that range MUST remain within the blue progression.
- **FR-007**: A view with only one frequency value, whether one route or many equally
  frequented routes, MUST use a visible blue color and MUST NOT classify that value as an
  extreme.
- **FR-008**: The system MUST recalculate route colors from the frequencies produced by the
  active sport filter whenever the filter changes.
- **FR-009**: The heatmap MUST provide a compact visual scale guide that identifies the
  low-frequency light-blue end, the increasingly frequent dark-blue range, and the extreme
  red end for the current filtered view.
- **FR-010**: The color scheme MUST preserve the existing route geometry, frequency-based
  thickness, zoom behavior, sport filters, and empty-state behavior established by the
  route-line heatmap.
- **FR-011**: Invalid, missing, or non-positive frequencies MUST be excluded from color-scale
  calculation and MUST NOT prevent valid route segments from being displayed.

### Key Entities *(include if feature involves data)*

- **Route Segment**: An existing portion of an athlete's traveled path with a visit-frequency
  count; its frequency determines both its existing prominence and its new color.
- **Frequency Color Scale**: The ordered mapping for the current filtered view from valid
  route frequencies to visible colors, including its minimum, maximum, logarithmic positions,
  and extreme range.
- **Scale Guide**: A compact visual explanation of the current color progression and its
  low-to-extreme frequency meaning.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a validation dataset containing frequencies of 1, 10, 100, and 1,000, all
  four levels are visible, ordered correctly by color, and visually distinguishable from
  adjacent levels.
- **SC-002**: A once-traveled route remains identifiable against the base map in 100% of
  tested views when displayed alongside a route traveled at least 1,000 times.
- **SC-003**: In every tested varied-frequency dataset, red appears only for values in the
  upper 10% of the logarithmic range, while all lower values remain light-to-dark blue.
- **SC-004**: In usability validation, at least 90% of participants can identify the least
  and most frequently traveled of four sample routes within five seconds using the map and
  its scale guide.
- **SC-005**: Switching each sport filter updates all sampled route colors to match that
  filter's frequencies, with zero stale colors from the previously selected filter.
- **SC-006**: Existing checks for route visibility, route geometry, frequency-based
  thickness, map zoom behavior, and the no-data state continue to pass without regression.

## Assumptions

- The color scale supplements the existing frequency-based line thickness rather than
  replacing it; both encodings communicate route frequency.
- "Extreme" means the upper 10% of the logarithmic range between the lowest and highest
  valid frequencies in the current filtered view. This keeps red exceptional while allowing
  the scale to adapt to different activity histories.
- Exact color values and transitions are design decisions for planning, provided light blue,
  dark blue, and red remain distinguishable and satisfy the visibility outcomes above.
- Frequencies are recalculated by the existing All Sports / Run / Bike / Swim filters; the
  feature does not change how visits are counted or routes are matched.
- This feature changes only frequency color encoding and its scale guide. It does not change
  route aggregation, map navigation performance, imported data, or the heatmap's entry points.
- The existing route-line heatmap and its performance follow-up remain dependencies whose
  behavior must not regress.