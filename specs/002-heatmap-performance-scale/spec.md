# Feature Specification: Heatmap Navigation Performance at Scale

**Feature Branch**: `002-heatmap-performance-scale`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Bei meinem Heatmap Feature ist die Performance doch sehr schlecht. Ich habe über zwei tausend Aktivitäten und das Navigieren auf der Weltkarte fühlt sich sehr ruckelig an. Das sollte sehr viel flüssiger laufen. Ich nehme an, dass die Daten dafür weiter aggregiert werden müssen, wie man hier eine höhere Performance sicherstellen können"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Smooth map navigation with a large activity history (Priority: P1)

As an athlete with a large training history (thousands of activities), I want panning and
zooming the route map to feel smooth and responsive, so that I can actually explore where
I've trained instead of fighting a laggy map.

**Why this priority**: This is the exact problem reported — navigation feels "ruckelig"
(janky/stuttery) with a real ~2,600-activity dataset. Without this, the route-line heatmap
feature (see `specs/001-route-line-heatmap`) is unpleasant to use for exactly the athletes
who have trained long enough to have the most interesting data to look at.

**Independent Test**: Import a large dataset (2,500+ activities with GPS tracks), open the
Heatmap tab, and pan/zoom the map. Confirm the map responds to drag and zoom input without
multi-second freezes or visibly dropped frames.

**Acceptance Scenarios**:

1. **Given** an athlete has imported 2,500+ GPS-tracked activities, **When** they open the
   Heatmap tab, **Then** the map becomes interactive (draggable and zoomable) within a few
   seconds, not tens of seconds.
2. **Given** the map is showing a large dataset, **When** the athlete drags (pans) the map,
   **Then** the map follows the drag smoothly without the browser tab appearing to freeze.
3. **Given** the map is showing a large dataset, **When** the athlete zooms in or out (via
   the zoom controls or scroll/pinch), **Then** the zoom completes and the map remains
   responsive to further input almost immediately.

---

### User Story 2 - Performance improvements don't undo the route-line feature (Priority: P1)

As an athlete, I want the map to still show my real routes with frequency-based thickness
and still show isolated one-off trips even when zoomed out to a world view, so that making
the map faster doesn't quietly break the route-line heatmap behavior I already rely on.

**Why this priority**: Performance work is only acceptable if it preserves what
`specs/001-route-line-heatmap` already established (route lines instead of blobs, frequency
scaling, distant single-activity visibility at world zoom). A "fast but broken" map is not
an improvement.

**Independent Test**: Using the same large dataset, confirm that (a) a well-worn route still
renders thicker than a once-traveled route, and (b) a known distant single-visit activity
(e.g., a trip to another country) is still visible at world zoom, exactly as before this
change.

**Acceptance Scenarios**:

1. **Given** a large dataset with both frequently- and rarely-traveled route segments,
   **When** the map is rendered at any zoom level, **Then** the frequently-traveled segments
   still appear visibly thicker/more prominent than rarely-traveled ones.
2. **Given** a large dataset that includes a single geographically isolated activity (e.g.,
   one trip to a distant city), **When** the map is fully zoomed out to a world view,
   **Then** that isolated activity is still visibly rendered, not dropped for performance
   reasons.

---

### User Story 3 - Consistent experience across dataset sizes (Priority: P3)

As an athlete with a smaller training history, I want the map to remain exactly as
responsive as it already is today, so that performance work targeted at large datasets
doesn't add overhead or complexity that slows things down for everyone else.

**Why this priority**: This is a regression-guard rather than new user value — it ensures
the fix is scoped to the actual problem (large datasets) without degrading the common case.

**Independent Test**: Repeat the manual quickstart validation from
`specs/001-route-line-heatmap/quickstart.md` with a small dataset (tens of activities) and
confirm map responsiveness feels at least as good as before this change.

**Acceptance Scenarios**:

1. **Given** an athlete has imported a small number of activities (e.g., under 100), **When**
   they navigate the route map, **Then** the map feels at least as responsive as it did
   before this performance work.

### Edge Cases

- What happens when a single densely-overlapping area exists (e.g., years of daily commuting
  on the same street), combined with thousands of other activities elsewhere? The map MUST
  remain navigable; the dense area MAY be visually simplified as long as it still reads as
  "very frequently traveled" (per FR-003 below).
- What happens during the transition between a simplified, zoomed-out representation and the
  full-detail, zoomed-in representation? The transition MUST NOT make previously-visible
  isolated activities (per User Story 2) disappear at any point in the transition.
- What happens when the sport filter is switched on a large dataset? The same responsiveness
  expectations from User Story 1 apply to the filtered view, not just the initial "All
  Sports" view.
- What happens if the underlying browser/device is unusually slow (e.g., older hardware)?
  The feature MUST at minimum avoid an unresponsive/crashed tab; some residual slowness on
  underpowered devices is acceptable as long as the tab stays usable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to pan and zoom the route map without perceptible freezing
  or multi-second stalls, regardless of how many activities/GPS tracks are loaded.
- **FR-002**: The system MUST make the Heatmap tab's map interactive (able to accept pan/zoom
  input) within a bounded, short time after the tab is opened or the sport filter is
  changed, even for large imports (see SC-002 for the specific target).
- **FR-003**: Any performance optimization MUST preserve the existing route-line heatmap
  guarantees from `specs/001-route-line-heatmap`: frequency-based line thickness/contrast
  (FR-002–FR-005 there) and visibility of geographically isolated single-visit activities at
  world zoom (FR-007, SC-002 there).
- **FR-004**: The system MUST NOT silently discard or undercount activity/route data as part
  of any performance optimization — simplification MAY apply to what is rendered, but the
  underlying visit-frequency counts MUST remain accurate.
- **FR-005**: Switching the sport filter (All Sports / Run / Bike / Swim) on a large dataset
  MUST remain within the same responsiveness expectations as FR-001/FR-002, not just the
  initial render.
- **FR-006**: The system MUST NOT regress map responsiveness for smaller datasets (activity
  counts typical of the existing test/quickstart scenarios) as a side effect of optimizing
  for large datasets.
- **FR-007**: The system MUST remain usable (no browser tab crash or permanently unresponsive
  page) for at least the dataset size that surfaced this issue (~2,600 activities / ~2,400
  GPS tracks), and SHOULD be validated against a comfortable margin above that (see SC-001).

### Key Entities *(include if feature involves data)*

- **Route Segment** *(existing, from `specs/001-route-line-heatmap`)*: A portion of path
  shared by one or more activities with a visit-frequency count; this feature changes how
  efficiently large numbers of these are rendered and navigated, not what they represent.
- **Rendered Map View**: The currently visible/interactive portion of the route map at a
  given pan/zoom state; this feature is concerned with keeping this responsive as the total
  number of underlying Route Segments grows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Athletes with at least 3,000 activities (a margin above the ~2,600-activity
  dataset that surfaced this issue) can pan and zoom the route map with no freeze longer than
  a fraction of a second per interaction — navigation feels continuous, not step-by-step.
- **SC-002**: The Heatmap tab becomes interactive within a few seconds of being opened, even
  for large imports, instead of the map appearing to hang.
- **SC-003**: Switching sport filters on a large dataset updates the map within a similarly
  short, bounded time, without the page appearing frozen.
- **SC-004**: A known geographically isolated single-visit activity remains visible at world
  zoom after this change, exactly as it was before (no regression vs. `specs/001-route-line-heatmap`).
- **SC-005**: Frequently-traveled routes remain visibly more prominent than rarely-traveled
  ones after this change (no regression vs. `specs/001-route-line-heatmap`).
- **SC-006**: Athletes with small activity histories perceive no slowdown in map
  responsiveness compared to before this change.

## Assumptions

- The reported dataset (~2,646 activities, ~2,423 GPS tracks) is representative of the
  "large" case this feature must handle comfortably; a round-number margin above it (3,000
  activities) is used as the concrete scale target in Success Criteria, in the absence of a
  different number from the user.
- "Feels smooth" / "no perceptible freeze" is judged by manual interaction during the
  quickstart-style validation (dragging, zooming, and observing whether the map keeps up),
  consistent with how `specs/001-route-line-heatmap` already validates its own criteria —
  no automated frame-timing tooling is assumed to exist in this repo.
- The exact technique for scaling rendering (e.g., aggregating/simplifying data at certain
  zoom levels, limiting work to the visible area, or another approach) is an implementation
  decision left to planning; this spec only fixes the required outcomes (responsiveness,
  preserved visual guarantees, no data loss).
- This feature is a performance/scaling follow-up to `specs/001-route-line-heatmap` and
  does not change the Heatmap tab's naming, entry points, or visual language (color, line
  style) established there.
- Import/parsing time (reading the ZIP, extracting GPS tracks before the map is shown) is a
  separate, already-acknowledged best-effort concern (`specs/001-route-line-heatmap`
  Clarifications, SC-005) and is out of scope here; this feature is specifically about
  map *navigation* responsiveness once the Heatmap tab is showing data.
