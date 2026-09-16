# Feature Specification: Route-Based Heatmap (Line Density Map)

**Feature Branch**: `001-route-line-heatmap`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Es existiert das Feature der Heatmap allerdings ist Heatmap vielleicht der falsche Begriff dieser flächigen runden Heat in die, was ich will, was dargestellt sein sollte, sind die konkreten Routen, also wirklich Striche durch die Straßen und Wege, die der Sportler genutzt hat, diese sollten umso dicker werden je häufiger der Sportler dort war. Natürlich mit einer Obergrenze das beziehungsweise Skalierung in einer Form, dass sowohl einmalige Routen immer noch gut zu erkennen sind, aber natürlich stärkere Routen viel prominenter sind, insbesondere muss der Kontrast zur Karte gut erkennbar sein. Prüfe dazu vielleicht einmal Bilder von der Strava-Heatmap. Ursprüngliche Bild sollte auf der ausgezoomten Weltkarte zu sehen sein und dann könnte der Sportler hineinzoomen, also insbesondere auch auf der Weltkarte muss ersichtlich sein, wenn ein Sportler einmal z.B. den New York Marathon gemacht hat und deswegen einmal in New York war, sollte das schon gut ersichtlich sein."

## Clarifications

### Session 2026-09-16

- Q: Soll die UI-Bezeichnung "Heatmap" (Dashboard-Karte, Tab-Titel) beibehalten werden, obwohl sich die Darstellung von Flächen zu Routenlinien ändert, oder soll sie umbenannt werden? → A: Option A — Name "Heatmap" überall beibehalten; nur die interne Rendering-Technik ändert sich, keine Umbenennung von Labels, IDs, oder Tab-Konstanten.
- Q: Wie eng muss die GPS-Toleranz sein, innerhalb derer zwei GPS-Spuren als dieselbe Route für die Häufigkeitszählung gelten? → A: 15 Meter Snapping-Toleranz.
- Q: Für welche Datenmenge muss die Route-Map performant und flüssig bleiben? → A: Option C — kein festes Performance-Ziel für v1; "best effort" ist für diese Iteration ausreichend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Replace blob heat with route lines (Priority: P1)

As an athlete reviewing my training map, I want to see my actual routes drawn as lines on
the map instead of soft circular heat blobs, so that I can recognize the real streets and
paths I used, not just a vague area of activity.

**Why this priority**: This is the core visual change the user is asking for; without it,
nothing else in this feature matters. It replaces the current point-based blur heatmap with
route-line rendering.

**Independent Test**: Import a dataset with GPS tracks, open the Heatmap tab, and confirm
that recognizable line-shaped paths following streets/trails are rendered instead of round,
diffuse blobs.

**Acceptance Scenarios**:

1. **Given** an athlete has imported GPS-tracked activities, **When** they open the Heatmap
   tab, **Then** the map shows line-shaped routes following the paths actually traveled,
   not circular/blurred blobs.
2. **Given** two activities share a partial route and one activity covers a unique side
   street, **When** the map is rendered, **Then** both the shared segment and the unique
   segment are visible as distinct lines.

---

### User Story 2 - Frequency-based line thickness with a legible scale (Priority: P1)

As an athlete, I want route segments I've traveled many times to appear visibly thicker and
more prominent than segments I've only traveled once, so I can see which routes are my
regular training paths versus one-off routes.

**Why this priority**: This is the "why" behind switching to route lines — frequency
encoding is the main information the user wants surfaced, and it must remain readable at
both ends of the frequency spectrum.

**Independent Test**: Import a dataset containing one segment traveled once and another
segment traveled many times (e.g., 20+ times), render the map, and confirm the well-worn
segment is clearly thicker/more prominent while the once-traveled segment is still visible
and distinguishable from the map background.

**Acceptance Scenarios**:

1. **Given** a route segment was traveled only once, **When** the map is rendered, **Then**
   that segment is still clearly visible against the base map (sufficient contrast) even
   though it renders at the thinnest/lightest end of the scale.
2. **Given** a route segment was traveled many times, **When** the map is rendered, **Then**
   that segment renders visibly thicker/more prominent than a once-traveled segment, up to a
   capped maximum so extremely frequent segments don't overwhelm the map or overlap
   neighboring routes illegibly.
3. **Given** segments with a wide range of visit counts (e.g., 1 vs. 5 vs. 50), **When**
   the map is rendered, **Then** the visual scaling between them is chosen so that the
   difference between "rare" and "common" is perceptible without either extreme becoming
   unreadable (matching the general visual language of well-known route-heatmap products).

---

### User Story 3 - Visible activity clusters at world/zoomed-out view (Priority: P2)

As an athlete who has traveled for a single event (e.g., ran a marathon in a different
city), I want that trip to be visible even when the map is zoomed all the way out to a
world view, so that one-off but geographically distant activities aren't lost.

**Why this priority**: Without this, a single trip like "New York Marathon" would be
invisible at world zoom because it's just one thin line among a sparse set of points, which
defeats the purpose of showing where an athlete has been overall. This is a refinement on
top of the P1 line-rendering behavior.

**Independent Test**: Import a dataset with a dense cluster of local activities and one
isolated activity in a distant city, zoom the map out to a world view, and confirm both the
local cluster and the distant single-city activity are visibly distinguishable from the
base map.

**Acceptance Scenarios**:

1. **Given** an athlete's activities are concentrated in one home region plus a single trip
   to a distant city, **When** the map is fully zoomed out to a world view, **Then** the
   distant city's route is still visibly rendered (not reduced to an invisible sliver).
2. **Given** the athlete then zooms into the distant city, **When** the map view updates,
   **Then** the individual route lines of that one visit remain visible and are consistent
   with what was shown at world zoom.

### Edge Cases

- What happens when an activity has no GPS track data at all (e.g., manually entered or
  indoor activity)? It MUST be excluded from the route map without causing errors, same as
  today's heatmap behavior.
- How does the system handle two nearly-identical but not pixel-identical GPS traces of the
  same real-world path (typical GPS noise)? They MUST be treated as the same route segment
  for frequency counting purposes when they fall within a 15-meter matching tolerance,
  rather than rendering as two separate close but unmerged lines.
- How does the system handle an extremely dense area (e.g., years of daily commuting on the
  exact same street) without the line becoming so thick it obscures surrounding streets or
  map labels?
- How does the system behave when switching the sport filter (All/Run/Bike/Swim) — do route
  frequency counts and thickness scaling recompute per filter, or use a global count? (See
  FR-006.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render an athlete's GPS-tracked activities as distinct route
  lines that follow the actual paths traveled, replacing the current diffuse circular heat
  rendering.
- **FR-002**: The system MUST visually increase the thickness/prominence of a route segment
  in proportion to how many times the athlete traveled that segment.
- **FR-003**: The system MUST cap the maximum visual thickness/prominence of a route segment
  so that very frequently traveled segments remain legible and do not visually overwhelm
  neighboring routes or the base map.
- **FR-004**: The system MUST render single-visit (frequency = 1) route segments with
  sufficient contrast against the base map that they remain clearly recognizable, not just
  barely visible.
- **FR-005**: The system MUST use a non-linear or otherwise perceptually-tuned scale between
  visit frequency and visual thickness, so that the difference between rarely- and
  commonly-traveled segments is perceptible at a glance (matching the visual language of
  well-known route-heatmap products such as Strava's global heatmap).
- **FR-006**: The system MUST keep the existing sport filter (All Sports / Run / Bike /
  Swim) working with the new route-line rendering, recomputing which routes and frequencies
  are shown based on the selected filter.
- **FR-007**: The system MUST keep routes visible and distinguishable from the base map
  across the full zoom range, from a single-city zoomed-in view out to a fully zoomed-out
  world view.
- **FR-008**: The system MUST exclude activities without GPS track data from the route map,
  consistent with current heatmap behavior, without producing errors.
- **FR-009**: The system MUST treat GPS traces of what is effectively the same real-world
  path/street as the same route segment for the purpose of counting visit frequency when
  they fall within a 15-meter matching tolerance, rather than counting them as separate
  routes due to GPS noise.
- **FR-010**: The system MUST preserve the existing entry points to this view (the Heatmap
  dashboard card and Heatmap visualization tab) and their current behavior of showing an
  empty state when no GPS data is available. The "Heatmap" naming (card label, tab title,
  IDs) MUST remain unchanged; only the underlying rendering technique changes from
  point-blur to route-line based (see Clarifications, Session 2026-09-16).

### Key Entities *(include if feature involves data)*

- **Route Segment**: A portion of path shared by one or more activities, characterized by
  its geographic shape and a visit-frequency count (how many imported activities passed
  through it), used to drive line thickness/prominence.
- **GPS Track**: An existing per-activity sequence of geographic points (already available
  from imports), the raw input from which route segments and their frequencies are derived.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Athletes can visually distinguish their most-traveled routes from
  once-traveled routes within a few seconds of opening the map, without needing to zoom in.
- **SC-002**: A single distant-city activity (e.g., one marathon in another country) remains
  visibly identifiable when the map is zoomed out to a world view, matching the user's
  expectation set by well-known route-heatmap products.
- **SC-003**: Once-traveled route segments remain visually distinguishable from the base map
  at typical viewing zoom levels (not reduced to invisible or near-invisible lines).
- **SC-004**: Switching the sport filter updates the displayed routes and their relative
  thickness consistently with the selected sport's activity data, with no stale routes left
  visible from a previously selected sport.
- **SC-005**: No specific performance/scale target is required for this iteration (v1); a
  best-effort implementation for typical hobbyist-scale activity datasets is acceptable, and
  scaling to very large (power-user, multi-year) datasets is explicitly out of scope for now.

## Assumptions

- GPS track data per activity (as already extracted and stored today, e.g. via
  `gpsTracksByActivityId`) is a sufficient and available data source for deriving route
  segments and frequency counts; no additional data import is required for this feature.
- "Route segment" granularity (i.e., how finely paths are subdivided/matched for frequency
  counting) is an implementation detail to be decided during planning, as long as it
  satisfies FR-009 (GPS noise tolerance) and the thickness-scaling requirements.
- The existing Heatmap dashboard card, visualization tab, sport filters, and empty-state
  behavior remain the intended entry points for this view; this feature changes how the map
  is drawn, not where or how it is navigated to.
- Visual styling (exact colors, base map tiles) should maintain strong contrast against the
  underlying map but exact color choices are left open for the planning/design phase, guided
  by the general look of established route-heatmap products referenced in the input.
- This feature targets the existing browser-based map view; no new export or sharing
  capability is in scope here (that already exists separately in the TODO backlog).
