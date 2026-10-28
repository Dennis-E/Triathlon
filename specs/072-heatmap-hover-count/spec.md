# Feature Specification: Heatmap Hover Count Threshold

**Feature Branch**: `072-heatmap-hover-count`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Heatmap: mouseover. only show \"# of tracks\" on top when it is more than 10, if less, leave it out."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reduce clutter in heatmap hover details (Priority: P1)

As an athlete inspecting a heatmap, I want the "# of tracks" heading to appear only when the hovered location represents more than ten tracks, so that ordinary hover details stay uncluttered while high track counts remain easy to notice.

**Why this priority**: The threshold directly controls whether the requested count heading adds useful context or unnecessary visual noise.

**Independent Test**: Hover heatmap locations with known track counts on both sides of the threshold and verify the heading's presence, position, and displayed count.

**Acceptance Scenarios**:

1. **Given** a hovered location represents more than ten tracks, **When** its hover details appear, **Then** the exact heading "# of tracks" appears above the other details and refers to that location's track count.
2. **Given** a hovered location represents ten or fewer tracks, **When** its hover details appear, **Then** the heading is absent and the remaining hover details are displayed as usual.
3. **Given** the pointer moves from a location with more than ten tracks to one with ten or fewer, **When** the new hover details appear, **Then** the heading from the previous location is no longer shown.

### Edge Cases

- A count of exactly ten MUST be treated as ten or fewer, so the heading is hidden.
- A count of zero or another valid value below ten MUST NOT show the heading.
- If a hovered location has no valid track count, the heading MUST be omitted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a user hovers over a heatmap location representing more than ten tracks, the system MUST show the exact heading "# of tracks" above the other hover details.
- **FR-002**: When a hovered location represents ten or fewer tracks, the system MUST omit the "# of tracks" heading without leaving an empty heading or reserved space.
- **FR-003**: When the heading is shown, its count MUST correspond to the currently hovered location.
- **FR-004**: When the hovered location changes, the heading's visibility MUST be recalculated from the new location's count and MUST NOT retain a stale heading from the prior location.
- **FR-005**: The threshold behavior MUST NOT change track-count calculation or other existing heatmap hover details.

### Key Entities *(include if feature involves data)*

- **Hovered Heatmap Location**: The currently targeted heatmap location and its represented track count.
- **Track Count Heading**: The exact "# of tracks" text shown above hover details only when the location represents more than ten tracks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all threshold checks, locations with counts of 0 through 10 show the heading in 0% of cases, while locations with counts above 10 show it in 100% of cases.
- **SC-002**: In all checks where the heading is shown, its count matches the currently hovered location, including after moving from a location above the threshold to one at or below it.
- **SC-003**: At least 90% of usability-test participants correctly identify that the heading appears only for counts above ten without losing access to the other hover details.

## Assumptions

- "More than 10" is a strict threshold: exactly 10 does not qualify.
- The count refers to the number of tracks represented by the currently hovered heatmap location.
- Existing mouseover behavior and all hover content other than this heading remain unchanged.
- This request changes presentation only; track aggregation and calculation are out of scope.
