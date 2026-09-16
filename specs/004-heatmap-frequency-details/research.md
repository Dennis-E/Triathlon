# Phase 0 Research: Heatmap Frequency and Activity Details

All Technical Context items are resolved. No `NEEDS CLARIFICATION` markers remain.

## Decision 1: Separate logarithmic frequency position from color interpolation

- **Decision**: Keep logarithmic normalization of count $c$ between filtered minimum $m$
  and maximum $M$:

  $$
  t(c)=\operatorname{clamp}\left(\frac{\ln(c)-\ln(m)}{\ln(M)-\ln(m)},0,1\right)
  $$

  Then interpolate RGB channels directly from light blue `#60A5FA` at $t=0$ to red
  `#DC2626` at $t=1$. The former dark-blue stop at $t=0.9$ is removed. The logarithmic
  midpoint count is $e^{(\ln(m)+\ln(M))/2}$ and receives the exact RGB midpoint `#9E6690`.
- **Rationale**: Logarithmic compression belongs to count placement, while a uniform
  two-endpoint color ramp makes the entire resulting range visible. For counts
  `1, 10, 100, 1000`, expected colors are `#60A5FA`, `#897BB3`, `#B3506D`, and `#DC2626`.
- **Alternatives considered**:
  - Keep the upper-ten-percent red band: rejected because it caused almost all real routes
    to remain blue and contradicts the clarified requirement.
  - Apply logarithmic interpolation to RGB channels as well: rejected because it applies the
    compression twice and moves the visual midpoint away from the frequency midpoint.

## Decision 2: Match 30-meter route corridors with heading and continuity

- **Decision**: Convert each track edge transiently into probes spaced no farther than 30
  meters. Candidate probe segments are found through a 30-meter spatial hash and its neighbor
  cells. Two undirected probes can correspond when their midpoint distance is at most 30
  meters and heading difference is at most 30 degrees. A match becomes a shared route only
  after at least three consecutive corresponding probes, representing approximately 90
  meters of path continuity. Reverse traversal is equivalent. Inputs and candidate ties are
  ordered deterministically by activity ID, longest continuity, mean distance, heading
  difference, and segment key.
- **Rationale**: The current exact pair of 15-meter endpoint cells fails at cell boundaries
  and different GPS sample phases. Neighbor search handles boundary effects; heading rejects
  perpendicular crossings; continuity rejects brief adjacency. Keeping the first
  deterministically sorted activity's geometry prevents transitive geometric drift.
- **Alternatives considered**:
  - Increase the current grid cell from 15 to 30 meters only: rejected because boundary,
    sample-alignment, crossing, and parallel-route errors remain.
  - Use midpoint distance alone: rejected because crossings and short neighboring sections
    would merge.
  - Add an external road-network matcher: rejected because it introduces network/privacy
    dependencies and cannot support the static local-processing model.

## Decision 3: Accept the information limit for indistinguishable parallel routes

- **Decision**: Treat sustained paths with the same heading and less than 30 meters separation
  as the same corridor when GPS geometry alone cannot distinguish them. Validate that paths
  which diverge, cross briefly, differ in heading, or exceed 30 meters stay separate.
- **Rationale**: Two geometrically indistinguishable recordings cannot be assigned to
  different physical roads without external map-matching data. Stating the boundary avoids
  pretending the local GPS input contains information it does not.
- **Alternatives considered**:
  - Promise separation for every parallel road under 30 meters: rejected as unverifiable
    from the available data.

## Decision 4: Make distinct activity membership the source of frequency truth

- **Decision**: Every detail segment stores a deterministically sorted `activityIds` array;
  `count` is always derived as `activityIds.length`. Per-activity temporary sets prevent a
  loop from adding the same ID more than once. Low-zoom aggregates union source ID arrays and
  derive their tooltip total and line prominence from the union size; `colorCount` remains
  the maximum source-detail count so geographic aggregation does not invent an extreme route.
- **Rationale**: This makes counts auditable and supplies tooltip membership without a second
  reconstruction pass. Arrays consume less long-lived overhead than one `Set` object per
  segment, while temporary sets make union construction efficient.
- **Alternatives considered**:
  - Store only counts and recover activity IDs on hover: rejected because scanning all tracks
    during pointer movement violates the 250-millisecond target.
  - Sum low-zoom counts: rejected because one activity can contribute to several source
    segments and would be counted repeatedly.

## Decision 5: Retain the single Canvas and build a screen-space hover index

- **Decision**: During each Canvas redraw, store only visible drawn strokes as screen entries
  containing projected endpoints, line width, key, and segment reference. Insert each entry
  into all intersected cells of a 32-pixel screen grid. Throttle `mousemove` lookup with one
  animation-frame callback and inspect only the pointer cell and immediate neighbors. A hit
  uses point-to-segment distance within `max(lineWidth / 2 + 5px, 6px)`; ties resolve by
  shortest distance, higher frequency, then lexical key.
- **Rationale**: The existing single Canvas removed per-segment map-object overhead. A
  screen-space hash preserves that architecture and avoids scanning approximately 221,000
  segments on every pointer event.
- **Alternatives considered**:
  - Restore one interactive map object per route: rejected because it reintroduces the
    performance regression solved by feature 002.
  - Read Canvas pixels to identify routes: rejected because colors are shared and
    anti-aliased pixels do not retain segment identity.

## Decision 6: Join tooltip metadata once per import

- **Decision**: Build a `Map<string, ActivitySummary>` from `processedActivities` whenever an
  imported dataset is applied. Preserve `id`, `name`, `date`, normalized `sport`, distance in
  kilometers, and duration in seconds. Tooltip models resolve segment IDs through this map;
  they never query a service or rescan CSV rows.
- **Rationale**: `processedActivities` already contains all requested fields and uses the
  same activity IDs as `gpsTracksByActivityId`. A one-time map gives constant-time lookup and
  keeps personal data local.
- **Alternatives considered**:
  - Copy all activity metadata onto every route segment: rejected because repeated strings
    and dates would greatly increase memory on hundreds of thousands of segments.

## Decision 7: Sample ten distinct activities once per open tooltip

- **Decision**: Deduplicate IDs, resolve available summaries, and use a partial Fisher-Yates
  shuffle with injectable randomness to select ten distinct entries when more than ten are
  available. Cache the resulting model by hovered segment key until the pointer leaves or
  targets a different segment. Show `Random 10 of X activities` where $X$ is total distinct
  membership; additionally report unavailable metadata when fewer IDs resolve. For ten or
  fewer resolved activities, list all.
- **Rationale**: Sampling without replacement satisfies the wording and injectable randomness
  makes tests deterministic. Per-hover caching prevents the list from flickering on every
  mouse movement.
- **Alternatives considered**:
  - First or latest ten: rejected because the user explicitly requested random activities.
  - Resample on every mousemove: rejected because it is visually unstable.

## Decision 8: Format sport values in pure tooltip models

- **Decision**: Run/Bike distances use kilometers, Swim distances use meters, and all sports
  use elapsed `h:mm:ss` or `m:ss` duration. Missing values become `Unknown activity`,
  `Unknown date`, `Unknown sport`, or `--`. DOM rendering uses text nodes/text content only.
- **Rationale**: Pure formatting is Jest-testable and avoids unsafe HTML construction from
  imported personal metadata.
- **Alternatives considered**:
  - Format directly in DOM code: rejected because the Node test environment cannot validate
    it and inconsistent units become harder to detect.

## Decision 9: Close interaction state on map transitions

- **Decision**: Hide and clear the tooltip on pointer leave, map move/zoom start, sport-filter
  change, data replacement, and layer removal. The tooltip uses `pointer-events: none` and is
  clamped within the map wrapper. Touch events and map gestures are not intercepted.
- **Rationale**: A tooltip tied to old projected geometry becomes misleading after map or
  filter state changes. Non-interactive overlay behavior preserves existing navigation.
- **Alternatives considered**:
  - Keep the tooltip open and reposition it: rejected because the represented route may no
    longer be visible or belong to the active filter.
