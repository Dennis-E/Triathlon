# Feature Specification: Heatmap Frequency and Activity Details

**Feature Branch**: `004-heatmap-frequency-details`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Update the colour scheme implementation. All routes are light blue even the most travelled in my dataset. Logarithmic means the counting of routes and matching to position on the colour scheme, not the colour scheme itself. The midpoint colour should be between blue and red instead of reserving red for only the top 10%. Consider a broader distance for matching tracks that belong together. Add mouse-over tooltips showing the respective activities; when there are many, show ten random ones and 'random 10 of [x] activities'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See meaningful frequency colors (Priority: P1)

As an athlete, I want the complete heatmap color range to represent route frequency, so that
my most-traveled routes are visibly red and routes around the logarithmic midpoint have a
color halfway between light blue and red instead of nearly every route looking light blue.

**Why this priority**: The current color result does not communicate frequency on a real
multi-year dataset. Correcting the meaning of the logarithmic scale is the primary purpose
of this feature.

**Independent Test**: Display route segments at the minimum frequency, logarithmic midpoint,
and maximum frequency of a varied dataset. Verify that they are light blue, a visually even
blue-red midpoint color, and red respectively.

**Acceptance Scenarios**:

1. **Given** a filtered view contains routes with different visit frequencies, **When** the
   heatmap renders, **Then** the least-frequent route is light blue and the most-frequent
   route is red.
2. **Given** a route's visit count lies at the logarithmic midpoint between the current
   minimum and maximum counts, **When** its color is assigned, **Then** its color lies halfway
   between the light-blue and red endpoints.
3. **Given** route counts increase by equal multiplicative factors, **When** colors are
   assigned, **Then** their positions advance by equal steps through the continuous
   light-blue-to-red color progression.
4. **Given** the athlete changes the sport filter, **When** the filtered frequencies change,
   **Then** the complete color range and legend update from that filter's minimum and maximum.

---

### User Story 2 - Group repeated routes despite GPS variation (Priority: P1)

As an athlete, I want repeated travel along the same real-world route to count together even
when GPS recordings vary slightly, so that genuinely frequent routes accumulate enough visits
to become visually prominent.

**Why this priority**: A correct color scale still appears uniformly light if repeated
activities are split into many nearby segments. Frequency depends on reliable route matching.

**Independent Test**: Use multiple recordings of the same route with positional deviations
up to 30 meters and a separate nearby route outside that tolerance. Verify that the repeated
recordings contribute to shared segment counts while the separate route remains distinct.

**Acceptance Scenarios**:

1. **Given** recordings follow the same route with GPS deviations of up to 30 meters,
   **When** route frequencies are calculated, **Then** corresponding portions count as the
   same route segment.
2. **Given** two routes are farther apart than the 30-meter matching tolerance, **When**
   frequencies are calculated, **Then** they remain separate route segments.
3. **Given** one activity crosses the same matched segment multiple times, **When** its
   contribution is counted, **Then** that activity increases the segment frequency only once.
4. **Given** the sport filter changes, **When** matching and counting are recalculated,
   **Then** only activities in the selected sport contribute to route frequency.

---

### User Story 3 - Inspect activities behind a route (Priority: P2)

As an athlete, I want to point at a route and see which activities contributed to it, so that
I can understand and verify the frequency shown by the map.

**Why this priority**: Activity details make the aggregation transparent and help users
confirm that nearby recordings were grouped as intended.

**Independent Test**: Hover over a route segment with known contributing activities. Verify
that the tooltip reports the total and lists either all activities or a random sample of ten,
with readable sport-specific values.

**Acceptance Scenarios**:

1. **Given** a route segment has between one and ten contributing activities, **When** the
   athlete hovers over it, **Then** the tooltip lists every contributing activity.
2. **Given** a route segment has more than ten contributing activities, **When** the athlete
   hovers over it, **Then** the tooltip lists ten distinct randomly selected activities and
   displays the text "Random 10 of [x] activities", where `[x]` is the total count.
3. **Given** an activity appears in the tooltip, **When** its details are displayed, **Then**
   the athlete sees its name, date, sport, distance, and duration, with running and cycling
   distance in kilometers and swimming distance in meters.
4. **Given** the pointer leaves the route or map, **When** no route is targeted, **Then** the
   tooltip closes without changing the map's selected sport or frequency scale.

### Edge Cases

- When all displayed route segments have the same frequency, the map MUST use one clearly
  visible non-red color and the legend MUST state that all frequencies are equal rather than
  implying a range.
- When only one route exists, it MUST remain visible and hoverable without being labeled as
  both the least and most frequent route.
- Invalid, missing, zero, or negative counts MUST NOT alter the frequency range or prevent
  valid routes from rendering.
- Matching near the 30-meter boundary MUST produce deterministic results for identical input.
- Parallel or intersecting routes MUST NOT be merged solely because they briefly enter the
  same tolerance area; matching MUST account for continued path correspondence.
- Activities missing a name, date, distance, or duration MUST still appear in the tooltip
  with a neutral fallback for the missing field.
- When fewer than ten valid activity records can be resolved for a segment whose frequency is
  higher, the tooltip MUST show the records available and accurately explain the discrepancy.
- At low zoom, hovering an aggregated visual route MUST describe the activities represented by
  that visual route without inventing duplicate activities.
- Touch-only devices MUST retain all existing heatmap behavior; mouse-over details are an
  enhancement and MUST NOT block map pan or zoom gestures.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST calculate each valid route count's position using logarithmic
  normalization between the minimum and maximum frequencies in the complete active
  sport-filter result.
- **FR-002**: The system MUST map normalized position continuously across the entire color
  progression from light blue at position 0 to red at position 1.
- **FR-003**: The color at normalized position 0.5 MUST be the visual midpoint produced by
  equal interpolation between the light-blue and red endpoint colors.
- **FR-004**: The maximum-frequency route in every varied filtered view MUST receive the red
  endpoint color; red MUST NOT be restricted to a separate upper-ten-percent band.
- **FR-005**: Equal route counts under the same active filter MUST receive equal colors, and
  higher counts MUST advance monotonically toward red.
- **FR-006**: The scale guide MUST display the continuous light-blue-to-red progression and
  identify the current minimum, logarithmic midpoint, and maximum frequencies.
- **FR-007**: The system MUST treat corresponding route portions recorded within a 30-meter
  positional tolerance as candidates for the same route segment.
- **FR-008**: Route matching MUST use enough path continuity to avoid merging unrelated
  parallel, crossing, or briefly adjacent routes solely because individual points fall within
  the positional tolerance.
- **FR-009**: Each activity MUST contribute at most one visit to a matched route segment,
  regardless of repeated traversal within that activity.
- **FR-010**: Each route segment MUST retain the distinct activity identifiers that contribute
  to its frequency count so the displayed count and tooltip membership can be reconciled.
- **FR-011**: Hovering a visible route MUST show an activity tooltip without requiring a click
  and without interfering with map navigation.
- **FR-012**: For route segments with ten or fewer contributing activities, the tooltip MUST
  list all contributing activities.
- **FR-013**: For route segments with more than ten contributing activities, the tooltip MUST
  select ten distinct activities at random and show "Random 10 of [x] activities" using the
  segment's total distinct activity count.
- **FR-014**: A random tooltip sample MUST remain stable while that tooltip stays open; a new
  hover may produce a new sample.
- **FR-015**: Each tooltip activity entry MUST show activity name, date, normalized sport,
  distance, and duration; Run and Bike distances MUST use kilometers and Swim distances MUST
  use meters.
- **FR-016**: Tooltip activity details MUST come from the already imported local activity
  records and MUST NOT trigger network requests or expose activity data outside the browser.
- **FR-017**: Color, matching, and tooltip behavior MUST honor the existing All Sports, Run,
  Bike, and Swim filters and MUST not retain stale details after a filter change.
- **FR-018**: The updated behavior MUST preserve route visibility, frequency-based thickness,
  low-zoom rendering, empty states, pan/zoom responsiveness, and large-dataset support from
  the existing heatmap features.

### Key Entities *(include if feature involves data)*

- **Matched Route Segment**: A continuous route portion shared by one or more activities,
  characterized by geometry, a distinct set of contributing activity identifiers, frequency,
  and active-filter membership.
- **Frequency Position**: A route count's normalized logarithmic position from 0 to 1 within
  the active filtered range; this position is used for direct full-range color interpolation.
- **Activity Summary**: Locally imported metadata for one contributing activity, including
  identifier, name, date, sport, distance, and duration.
- **Activity Tooltip**: The hover presentation containing the total contributing activity
  count and either all activity summaries or a stable random sample of ten.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In every varied-frequency validation dataset, the minimum route is light blue,
  the maximum route is red, and a route at the logarithmic midpoint receives the exact visual
  midpoint between those endpoint colors.
- **SC-002**: For frequencies `1`, `10`, `100`, and `1,000`, colors occupy four ordered and
  visibly distinct positions spanning the full light-blue-to-red range.
- **SC-003**: In a test set of repeated routes with up to 30 meters of realistic GPS
  deviation, at least 95% of corresponding route portions aggregate into the same route while
  routes beyond the tolerance remain separate.
- **SC-004**: For every sampled route, its displayed frequency equals the number of distinct
  contributing activity identifiers retained for that route.
- **SC-005**: Tooltips list all activities for totals up to ten and exactly ten distinct
  randomly selected activities for totals above ten, with the correct
  "Random 10 of [x] activities" label in 100% of validation cases.
- **SC-006**: At least 90% of usability-test participants can identify the most-used route and
  inspect an underlying activity within five seconds of opening the heatmap.
- **SC-007**: Switching each sport filter leaves zero route colors, counts, or tooltip entries
  from the previously selected filter.
- **SC-008**: A dataset of at least 3,000 activities remains navigable and hover feedback
  appears within 250 milliseconds without a multi-second map freeze.

## Assumptions

- The requested logarithmic behavior applies to mapping visit counts onto normalized scale
  positions. Color interpolation itself is continuous and uniform from light blue to red.
- A 30-meter positional tolerance is the initial broader matching default, doubled from the
  existing 15-meter tolerance. Planning may refine the matching method but not weaken the
  30-meter acceptance scenarios or merge unrelated route geometry.
- "Sports units" means each tooltip lists the underlying activities and formats their values
  in familiar units for the activity's sport: kilometers for Run/Bike distance, meters for
  Swim distance, and elapsed duration for all sports.
- Random sampling applies only to which activity summaries are displayed. It does not change
  frequency counts, route colors, or the total shown in the tooltip.
- Activity name, date, sport, distance, and duration are already available in the imported
  dataset and can be joined to GPS tracks through the existing activity identifier.
- Mouse hover is the requested interaction for pointer devices. A separate touch interaction
  is outside this feature's scope, but existing touch navigation must continue to work.
- The feature revises and supersedes the upper-ten-percent red rule and exact-color assumptions
  in `specs/003-logarithmic-heatmap-colors`; its performance and visibility guarantees remain
  in force.