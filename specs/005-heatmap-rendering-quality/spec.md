# Feature Specification: Heatmap Rendering Quality (Smooth Tracks & Correct Frequency Layering)

**Feature Branch**: `005-heatmap-rendering-quality`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "on the heatmap it looks like the routes are following certain points that are far from each other, not smoothly following the roads. is the ingest/digest of data only saving some of the GPS points? Also: I want the tracks to show smoothly on the map. Also, on areas where there are many activities there are many tracks on 'one road', many in blue looks like and then others in red — overall the blue seems to be layered on top of red, but the roads much travelled should appear red, not blue. Check best practice on the internet for such a use case. Maybe the thickness of lines is not a proper way?"

## Clarifications

### Session 2026-09-17

- Q: Welcher Ansatz soll das feste 180-Punkte-Limit pro Track beim GPS-Downsampling ersetzen, um Kurven glatter darzustellen? → A: Kurvenerhaltende Vereinfachung (z. B. Douglas-Peucker mit Distanz-Toleranz) statt gleichmäßigem Stride-Downsampling.
- Q: Soll die Linienbreite (Sekundärkanal) künftig konstant/fixiert sein, damit Frequenz ausschließlich über die Farbe kommuniziert wird? → A: Ja, feste konstante Linienbreite für alle Segmente; Frequenz wird ausschließlich über Farbe kommuniziert.
- Q: Nach welcher Regel soll entschieden werden, welches von zwei Segmenten mit exakt gleicher Besuchsanzahl sichtbar oben liegt? → A: Lexikalische Sortierung nach Segment-Key (konsistent mit der bestehenden Tie-Break-Konvention aus `specs/004-heatmap-frequency-details`).
- Q: Soll die kurvenerhaltende Vereinfachung (FR-004) zusätzlich ein oberes Sicherheitslimit pro Track haben, oder ausschließlich über die Distanz-Toleranz gesteuert werden? → A: Distanz-Toleranz-basierte Vereinfachung mit einem großzügigen Sicherheits-Maximum pro Track als Fallback, falls das toleranzbasierte Ergebnis dieses Maximum überschreitet.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Frequent routes are always visibly on top (Priority: P1)

As an athlete reviewing my heatmap, I want the most-traveled road segments to always render
in their true frequency color (toward red) regardless of which activity happened to be
imported or drawn last, so that the map honestly shows where I go most, not an arbitrary
draw order.

**Why this priority**: This is a correctness defect, not a polish item. Today a heavily
traveled segment can visually disappear underneath a rarely traveled one, actively
misleading the athlete about their own training patterns. It undermines the entire purpose
of the heatmap and must be fixed before any cosmetic changes matter.

**Independent Test**: Import a dataset containing one segment traveled a high number of
times and a nearby/overlapping segment traveled once. Verify the high-frequency segment's
color is always visible at that location regardless of the underlying activity import order,
including after re-importing the same data in a different file order.

**Acceptance Scenarios**:

1. **Given** two route segments occupy the same visible road position with different visit
   counts, **When** the heatmap renders, **Then** the segment with the higher visit count is
   the one visibly on top at that position.
2. **Given** the same dataset is imported twice with activities processed in a different
   order, **When** the heatmap renders both times, **Then** the visible top color at any
   shared position is identical both times.
3. **Given** the map is panned or zoomed after the initial render, **When** redraws occur,
   **Then** the higher-frequency segment remains the visible one at that position (the fix is
   not order-dependent per redraw either).

---

### User Story 2 - Routes follow the road smoothly (Priority: P1)

As an athlete, I want my recorded routes to visually follow the actual road/path shape, so
that the heatmap looks like real routes and not a rough, angular approximation cutting
across curves.

**Why this priority**: Equally fundamental to the map being trustworthy and visually
credible; currently corners and curves are visibly cut short, which is the first thing users
notice and undermines confidence in the whole feature.

**Independent Test**: Import an activity with a known curving path recorded at typical GPS
sampling density. Verify the rendered route follows the curve shape closely and does not
show long straight chords cutting across turns, compared to the same activity rendered
today.

**Acceptance Scenarios**:

1. **Given** an imported activity follows a winding road, **When** its route is drawn on the
   heatmap, **Then** the drawn path visibly tracks the curve instead of connecting a few
   widely spaced points with straight lines.
2. **Given** a long-duration activity (e.g., several hours of cycling) that previously showed
   very coarse, angular lines, **When** it is re-imported under this feature, **Then** its
   route is visibly smoother without requiring the athlete to change any settings.
3. **Given** the underlying recording device already sampled GPS points sparsely (e.g., an
   older device with a low sampling rate), **When** that specific activity is rendered,
   **Then** the system does not fabricate detail that was never recorded, but it also does
   not further reduce the detail that is available.

---

### User Story 3 - Frequency is communicated primarily through one clear visual cue (Priority: P2)

As an athlete, I want frequency to be obvious from a single, consistent visual signal rather
than three overlapping cues (color, thickness, and opacity) that can visually fight each
other, so that the map is easy to read at a glance and thin/thick lines don't hide or
exaggerate how well-traveled a road is.

**Why this priority**: This is a readability/best-practice refinement that becomes
meaningful only after Story 1 and 2 establish a correct and smooth base map. It improves
clarity but does not by itself correct misleading output.

**Independent Test**: Compare the current triple-encoded rendering (variable width +
variable opacity + variable color) against the revised rendering on the same dataset side by
side, and confirm frequency order is still at least as easy to read, with less visual
clutter/occlusion of nearby parallel roads at typical zoom levels.

**Acceptance Scenarios**:

1. **Given** two nearby but distinct parallel roads with different visit frequencies,
   **When** both are rendered at a normal zoom level, **Then** neither is visually merged
   into or obscured by the other, because both are drawn at the same fixed line thickness.
2. **Given** the full range of visit-frequency values in a dataset, **When** the athlete
   scans the map, **Then** they can order routes from least to most traveled using color
   alone, since line thickness no longer varies by frequency.
3. **Given** a single isolated, rarely traveled route, **When** it is rendered, **Then** it
   remains clearly visible at the same fixed thickness as every other route (not reduced to
   an imperceptible hairline).

### Edge Cases

- What happens when two segments have the exact same visit count and overlap at the same
  position? (Resolved by FR-003: deterministic lexical segment-key tie-break, not visually
  random.)
- How does the system handle an activity whose original recording already has very few GPS
  points (sparse source data), so that "smoother" cannot mean "more accurate than recorded"?
- What happens at very low zoom levels where many segments are aggregated into coarser
  geographic buckets (existing low-zoom aggregation) — does the frequency-on-top guarantee
  and smoothing still hold for aggregates, or only for full-detail segments?
- What happens for extremely short segments (a few meters) where smoothing could visually
  overshoot past the actual recorded endpoint?
- How does re-filtering by sport (e.g., switching from "All" to "Bike") interact with the
  frequency ordering guarantee, since the set of visible segments and their relative
  frequencies changes?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render overlapping or coincident route segments so that the
  segment with the higher visit-frequency count is the one visibly displayed at any shared
  screen position, independent of activity import order or file processing order.
- **FR-002**: The frequency-on-top guarantee in FR-001 MUST hold consistently across repeated
  redraws triggered by panning, zooming, or sport-filter changes, not only on first render.
- **FR-003**: When two overlapping segments have an identical visit-frequency count, the
  system MUST resolve which one is visible on top by lexical order of the segment's key (the
  same deterministic tie-break convention already used for overlapping-hit resolution in
  `specs/004-heatmap-frequency-details`), so the same input always produces the same visible
  output.
- **FR-004**: The system MUST reduce each imported GPS track's point count using a
  curve-preserving simplification (retaining points where the path bends and dropping points
  that lie within a small distance tolerance of a straight line between their neighbors)
  instead of today's fixed-count, evenly-spaced-stride reduction, so that curves and turns in
  the original recording are visibly followed rather than approximated by a small number of
  long, straight chords. If the tolerance-based result for a single track still exceeds a
  generous safety maximum point count, the system MUST apply additional reduction only as a
  fallback to stay within that safety maximum, so no single unusually noisy or winding
  recording can disproportionately affect rendering performance.
- **FR-005**: The system MUST NOT invent GPS detail beyond what a given recording actually
  contains; a track recorded with very few original points must not be misrepresented as
  more detailed than it was. The curve-preserving simplification in FR-004 MUST only remove
  points, never interpolate new ones.
- **FR-006**: The system MUST continue to support datasets of the scale already validated by
  the existing heatmap feature (see `specs/002-heatmap-performance-scale`) without
  reintroducing perceptible navigation slowdown, after increasing per-track positional
  detail.
- **FR-007**: The visual encoding of visit frequency MUST use color (as established by
  `specs/003-logarithmic-heatmap-colors` and `specs/004-heatmap-frequency-details`) as the
  sole way an athlete distinguishes low-frequency from high-frequency routes.
- **FR-008**: Line thickness MUST be a fixed, constant value that does not vary by
  visit-frequency count, so it can never visually merge two distinct, non-overlapping
  nearby roads together, nor make a real, isolated route imperceptible. Opacity MAY still
  vary only to the extent already required for the frequency-on-top guarantee in FR-001,
  not as an additional frequency-communicating cue.
- **FR-009**: A single, rarely traveled, isolated route MUST remain visible on the map (no
  regression of the existing minimum-visibility guarantee from
  `specs/002-heatmap-performance-scale`).
- **FR-010**: The existing low-zoom geographic aggregation behavior MUST continue to convey
  relative frequency correctly (i.e., more-traveled aggregated areas remain visually more
  prominent than less-traveled ones) after this feature's changes.
- **FR-011**: The existing hover/tooltip behavior for identifying which activities contributed
  to a segment (see `specs/004-heatmap-frequency-details`) MUST continue to work correctly
  after segments are reordered for display and after track detail changes.

### Key Entities

- **Route Segment**: A short piece of aggregated path between two nearby points, carrying a
  visit-frequency count and the set of contributing activity IDs; its on-screen draw order
  and visual prominence are what this feature corrects.
- **GPS Track**: The ordered sequence of recorded positions for one imported activity; its
  retained positional detail (how many original points survive into what gets matched and
  drawn) directly determines how smoothly its route follows the real path.
- **Frequency Visual Scale**: The mapping from a visit-frequency count to what the athlete
  sees (primary color position, and any secondary cue); this feature revisits how many cues
  are used and how draw order relates to this scale.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a dataset with segments of mixed visit frequency at the same road position,
  100% of the time the higher-frequency segment is the one visible on top, verified across
  repeated renders and different import orderings of the same data.
- **SC-002**: For activities with a typical modern GPS recording density, at least 90% of
  route curvature that is visually "cut across" today is eliminated, judged by comparing
  rendered paths against the original recorded points for a sample of previously-reported
  problem activities (e.g., long cycling routes).
- **SC-003**: Athletes can correctly rank at least 3 routes of clearly different visit
  frequency from least to most traveled using only the primary visual cue, without relying on
  line thickness, in a simple side-by-side comparison.
- **SC-004**: Map panning and zooming remain smooth (no perceptible multi-frame freeze) after
  this change, for dataset sizes already validated as the performance baseline in
  `specs/002-heatmap-performance-scale`.
- **SC-005**: A single, rarely-traveled, isolated route remains visible in 100% of manual
  spot checks after this change (no regression of the existing minimum-visibility guarantee).

## Assumptions

- The "roads not smooth enough" complaint is primarily caused by the existing fixed
  per-track point cap applied during import (independent of trip length or duration), not by
  a fundamental limitation of the recording devices themselves; most affected activities have
  materially more original GPS points available than are currently retained for rendering.
- Curve-preserving simplification (FR-004) means the retained point count per track becomes
  variable and shape-dependent (straight sections need very few points, winding sections keep
  more), rather than a single fixed count per activity; this is expected to increase the
  average number of retained points versus today's cap for typical winding routes. The safety
  maximum in FR-004 is set well above today's 180-point cap so it only bounds rare, unusually
  noisy or complex recordings rather than shaping typical results.
- "Best practice" for this feature means established, widely used approaches for rendering
  many overlapping trip/route lines on a 2D web map (e.g., resolving draw order by value so
  higher values are never hidden by lower ones, and preferring one primary ordered visual
  channel—typically color—over stacking multiple redundant channels for the same quantity),
  rather than introducing an unrelated visualization type (e.g., this feature does not
  replace the route-line heatmap with a fundamentally different chart type such as a raster
  density grid).
- This feature builds on and must remain compatible with the existing route-line heatmap
  (`specs/001-route-line-heatmap`), its performance work (`specs/002-heatmap-performance-scale`),
  its color scale (`specs/003-logarithmic-heatmap-colors`), and its frequency/tooltip details
  (`specs/004-heatmap-frequency-details`); none of those prior guarantees are being removed,
  only corrected or refined.
- Increasing per-track positional detail is expected to increase the number of points
  processed per activity; the associated best-effort performance goal remains as previously
  established (no specific hard scale target beyond what is already validated), per
  `specs/002-heatmap-performance-scale`.
- Changing which secondary visual channels are used (removing variable line thickness in
  favor of a fixed constant width) is a visual/rendering change only; it does not change what
  counts as "the same route" (route matching/corridor tolerance) or how frequency counts are
  computed.
