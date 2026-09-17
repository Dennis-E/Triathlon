# Feature Specification: True-Path Route Geometry Rendering

**Feature Branch**: `006-true-route-geometry`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "starting from a certain zoom level the tracks consist of short small linear pieces. why is this? isn't there a way that the true gps track is shown and coloured? that it looks smooth also on larger zoom? i don't know meter by meter ideally"

## Clarifications

### Session 2026-09-17

- Q: Soll pro Korridor (Straßenabschnitt) genau eine repräsentative Linie in echter Pfadform gezeichnet werden, oder eine eigene Linie pro beitragender Aktivität? → A: Eine repräsentative True-Path-Linie pro Korridor (kanonische Geometrie einer beitragenden Aktivität) — bewahrt die bestehende "ein Draw-Call pro Korridor"-Kardinalität statt möglicherweise Hunderter überlappender Fastduplikate.
- Q: Wenn die eine repräsentative Linie eines Korridors durch mehrere unterschiedlich häufig befahrene Abschnitte verläuft, in welcher Granularität soll sich die Farbe entlang der Linie ändern? → A: Farbwechsel auf Ebene der bestehenden ~30 m-Matching-Fenster (Korridor-Granularität aus `specs/004-heatmap-frequency-details`), nicht kontinuierlich pro einzelnem Punktpaar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Routes look like the real path at any zoom level (Priority: P1)

As an athlete zooming into the heatmap (e.g., to street level to check a specific junction or
trail), I want the drawn route to visually follow the actual shape of my recorded GPS path,
so that it looks like a real route rather than a series of short, disconnected straight
segments stitched together.

**Why this priority**: This is the core visual credibility of the heatmap. At the zoom
levels athletes actually use to inspect a specific road/trail, today's rendering shows
visibly straight, faceted pieces instead of the recorded curve, which looks broken and
undermines trust in the feature — independent of the smoothing already done to the
underlying recorded data in `specs/005-heatmap-rendering-quality`.

**Independent Test**: Zoom into a curving section of a previously imported route at
street-level zoom. Verify the drawn line follows the curve continuously, without visible
short straight facets connected at sharp angles that don't correspond to the real path shape.

**Acceptance Scenarios**:

1. **Given** an imported activity with a smoothly curving recorded path, **When** the athlete
   zooms in to street level, **Then** the rendered route visually follows the curve, not a
   sequence of short straight chords with visible corners.
2. **Given** the same route is viewed at a moderate (city-level) zoom and at a close
   (street-level) zoom, **When** the athlete zooms in further, **Then** the route continues
   to look like a continuous path at every zoom step, not just at the zoom levels tested
   today.
3. **Given** a route recorded by a device with a genuinely low GPS sampling rate (few
   original points over a long distance), **When** it is rendered at street-level zoom,
   **Then** it is allowed to show its real, sparser shape — it is not required to look
   smoother than what was actually recorded.

---

### User Story 2 - Frequency coloring still applies to the true path (Priority: P1)

As an athlete, I want the visit-frequency color (from `specs/003-logarithmic-heatmap-colors`
and `specs/004-heatmap-frequency-details`) to still correctly represent how often each part
of the real path was traveled, even though the line now follows the true recorded shape
instead of straight matching chords.

**Why this priority**: Rendering the true path is only useful if it still communicates
frequency correctly; a smooth but uncolored (or incorrectly colored) line would just trade
one defect for another and regress the feature's main purpose.

**Independent Test**: Compare a frequently traveled curving road segment against a nearby
once-traveled curving segment; verify both are drawn following their true shapes and both
show the correct relative color (frequent = closer to red, rare = closer to light blue) along
their whole visible length.

**Acceptance Scenarios**:

1. **Given** a curving road traveled many times, **When** it is rendered, **Then** its full
   visible curved length shows the color corresponding to its visit frequency, not just the
   two endpoints of a straight approximation.
2. **Given** a single continuous recorded path that overlaps a frequently traveled corridor
   for part of its length and is otherwise unique, **When** it is rendered, **Then** the
   shared part is colored according to the higher shared frequency and the unique part is
   colored according to its own (lower) frequency, both while following the true path shape.
3. **Given** the existing hover/tooltip behavior (`specs/004-heatmap-frequency-details`),
   **When** the athlete hovers over any point along the true-path line, **Then** the tooltip
   still resolves and lists the correct contributing activities for that part of the route.

---

### User Story 3 - No regression to matching, aggregation, or performance (Priority: P2)

As the product owner, I want this visual fidelity improvement to preserve everything already
working: route matching/frequency counting, low-zoom aggregation, the frequency-on-top
draw-order guarantee, fixed-style single-channel color encoding, and large-dataset
performance, so that this feature is a pure rendering improvement, not a rework of the
underlying frequency logic.

**Why this priority**: This is a regression guardrail rather than new user value; it matters
once the primary visual fix (User Story 1/2) is in place, to confirm nothing else broke.

**Independent Test**: Re-run the existing heatmap validation flows (matching tolerance,
low-zoom aggregation, frequency-on-top layering, fixed line style, and large-dataset pan/zoom)
against the new true-path rendering and confirm all prior guarantees still hold.

**Acceptance Scenarios**:

1. **Given** the existing 30-meter/30-degree corridor matching behavior
   (`specs/004-heatmap-frequency-details`), **When** true-path rendering is enabled, **Then**
   which recordings count as "the same route" is unchanged.
2. **Given** a low zoom level showing the coarser aggregated view
   (`specs/002-heatmap-performance-scale`), **When** the athlete zooms out, **Then** the
   existing aggregated rendering behavior is used exactly as before (this feature only
   changes rendering at zoom levels detailed enough to show individual paths).
3. **Given** a large imported dataset at the previously validated performance scale, **When**
   the athlete pans/zooms around, **Then** navigation remains smooth with no new perceptible
   multi-frame freeze.

### Edge Cases

- What happens where two or more recorded paths overlap for only part of their length and
  diverge elsewhere — does the visible line correctly show shared color where they overlap
  and separate colors where they diverge, without one path's true shape distorting the
  other's? (Resolved by FR-001/FR-004: at every point exactly one representative corridor
  line is drawn; where corridors diverge, each has its own representative line and color.)
- What happens when a recorded path loops back over itself (e.g., an out-and-back run) —
  does each direction's true shape still render distinctly, without merging into a single
  drawn line where they are physically close but not the same direction of travel? (Per
  FR-005, matching is unchanged from `specs/004-heatmap-frequency-details`'s undirected
  heading rule, so both directions of an out-and-back already match the same corridor today;
  this feature renders that shared corridor as one true-path line, consistent with existing
  matching semantics — it does not newly distinguish direction.)
- What happens at the boundary between the "true path" rendering zoom range and the existing
  low-zoom aggregated rendering — is the transition visually reasonable, without a jarring
  jump in shape or color at the threshold?
- What happens for an isolated, rarely traveled recorded path with a naturally sparse GPS
  recording — does it still render at its true (sparser) shape without being forced to look
  artificially smoother than what was recorded?
- What happens when many distinct true paths pass through the same small area at a detailed
  zoom level (e.g., a busy trailhead) — does rendering remain legible and performant rather
  than degrading into visual clutter or a slowdown?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: At zoom levels detailed enough to show individual routes (i.e., above the
  existing low-zoom aggregation threshold from `specs/002-heatmap-performance-scale`), the
  system MUST render each corridor as exactly one representative line following the shape of
  an actual recorded (and curve-preserving-simplified, per `specs/005-heatmap-rendering-quality`)
  GPS path from one of its contributing activities, not a small, fixed number of long
  straight chords between coarse matching points, and not one separately drawn line per
  contributing activity.
- **FR-002**: The visual smoothness in FR-001 MUST reflect the real recorded shape; the
  system MUST NOT fabricate positional detail beyond what a given recording actually
  contains (consistent with `specs/005-heatmap-rendering-quality` FR-005). A sparsely
  recorded path is allowed to render with its true, sparser shape.
- **FR-003**: The existing visit-frequency color encoding (`specs/003-logarithmic-heatmap-colors`,
  `specs/004-heatmap-frequency-details`) MUST continue to apply along the full visible
  length of the true-path rendering, so a viewer can tell which parts of a route were
  traveled more or less often by looking at the color of the true path itself, not just at a
  coarse chord's endpoints.
- **FR-004**: Where multiple recorded paths overlap for part of their length and diverge for
  another part, the rendering MUST reflect the higher shared frequency where they overlap and
  each path's own frequency where they diverge, without visually merging or distorting
  diverging sections into a single incorrect shape. Per FR-001, this remains one
  representative line per corridor at every point — never multiple overlapping lines for the
  same shared corridor, even where many activities contribute to it. Color changes along a
  representative line at the granularity of the existing corridor/matching-window boundaries
  (`specs/004-heatmap-frequency-details`'s ~30-meter probe spacing), not continuously per
  individual recorded point.
- **FR-005**: The existing route-matching behavior that determines which recordings count as
  the same corridor (30-meter/30-degree tolerance and continuity rules from
  `specs/004-heatmap-frequency-details`) MUST remain unchanged; this feature only changes
  what is drawn, not what counts as a match.
- **FR-006**: The existing low-zoom aggregated rendering (`specs/002-heatmap-performance-scale`)
  MUST continue to be used unchanged below the aggregation zoom threshold; true-path
  rendering applies only at zoom levels where individual routes are already shown today.
- **FR-007**: The existing frequency-on-top draw-order guarantee and fixed single-channel
  (color-only) style encoding (`specs/005-heatmap-rendering-quality`) MUST continue to apply
  to true-path rendering.
- **FR-008**: The existing hover/tooltip activity-resolution behavior
  (`specs/004-heatmap-frequency-details`) MUST continue to correctly resolve the contributing
  activities for any point along a true-path-rendered route.
- **FR-009**: The system MUST continue to support datasets at the scale already validated by
  `specs/002-heatmap-performance-scale` without reintroducing perceptible navigation
  slowdown, after switching to true-path rendering at detailed zoom levels.
- **FR-010**: Visual fidelity to the recorded path MUST be close enough that a viewer at
  street-level zoom perceives a continuous, naturally shaped route; pixel-level or
  meter-level exactness is explicitly not required (per the user's own stated expectation).

### Key Entities

- **True-Path Rendering Geometry**: The sequence of points actually drawn for a route at
  detailed zoom levels, derived from one representative contributing activity's recorded
  (simplified) GPS track rather than from coarse matching-probe chords or from every
  contributing activity separately; this is the new concept this feature introduces.
- **Route Segment / Corridor**: Unchanged from `specs/001`/`004` — still the unit that
  determines visit-frequency counts and matching; now used to look up/derive color for
  true-path geometry instead of being drawn directly as its own straight chord.
- **GPS Track**: Unchanged from `specs/005-heatmap-rendering-quality` — the curve-preserving-
  simplified recorded point sequence that now becomes the direct source of rendered geometry
  at detailed zoom levels.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When zoomed to street level on a curving section of a previously imported
  route, the rendered line visually tracks the curve continuously, with no visible straight
  facet longer than what a typical narrow street/trail curve would show at that zoom (judged
  against the same route's appearance before this feature, using previously reported
  problem cases as reference).
- **SC-002**: A frequently traveled curving road and a nearby once-traveled curving road are
  both visually distinguishable by color along their entire visible curved length, not only
  at two endpoints.
- **SC-003**: All existing route-matching, low-zoom aggregation, frequency-on-top,
  fixed-style, and hover/tooltip behaviors continue to pass their existing validation flows
  unchanged after this feature.
- **SC-004**: Map panning and zooming remain smooth (no perceptible multi-frame freeze) at
  the dataset scale already validated in `specs/002-heatmap-performance-scale`.
- **SC-005**: A sparsely recorded route (few true GPS points) is not visually misrepresented
  as smoother than it actually is; its rendered shape still reflects only its real recorded
  points.

## Assumptions

- "Smooth" in the user's request means visually continuous and naturally shaped at the zoom
  levels an athlete actually uses to inspect a route (city to street level), not
  mathematically perfect curve interpolation; the user explicitly said meter-by-meter
  precision is not required.
- The existing corridor/matching model (probe spacing, tolerance, continuity, heading rules)
  from `specs/004-heatmap-frequency-details` remains the correct way to decide what counts as
  "the same route" for frequency purposes; this feature changes only what geometry is drawn
  for a matched corridor, not how matching itself works.
- The existing low-zoom aggregation threshold and behavior from
  `specs/002-heatmap-performance-scale` are the right boundary for when true-path rendering
  applies; below that threshold, the existing coarser aggregated rendering remains
  appropriate and is out of scope for this feature.
- This feature builds on and must remain compatible with `specs/001-route-line-heatmap`
  through `specs/005-heatmap-rendering-quality`; none of those prior guarantees are being
  removed, only the drawn geometry at detailed zoom levels is being corrected.
- Which contributing activity's recorded geometry becomes the "representative" true-path
  line for a corridor follows the same deterministic convention already used for canonical
  corridor geometry in `specs/004-heatmap-frequency-details` (the first activity by sorted
  activity ID); this feature does not introduce a new selection rule.
- Rendering true-path geometry is expected to increase the number of drawn line segments per
  visible route compared to today's fixed small number of chords; the associated
  best-effort performance goal remains as previously established in
  `specs/002-heatmap-performance-scale` (no new specific hard scale target).
