---

description: "Task list template for feature implementation"
---

# Tasks: Route-Based Heatmap (Line Density Map)

**Input**: Design documents from `/specs/001-route-line-heatmap/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md)

**Tests**: Included. The project constitution's Principle III (Narrowest-Scope Test-First
Verification, NON-NEGOTIABLE) requires Jest coverage for new pure functions in
`src/heatmap-utils.js`, so test tasks are part of the required work, not optional.

**Organization**: Tasks are grouped by user story (from [spec.md](./spec.md)) to enable
independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in each description

## Path Conventions

Single project (existing static web app), per [plan.md](./plan.md):

- `src/heatmap-utils.js` — pure, DOM-free logic (CommonJS + `window.heatmapUtils` bridge)
- `__tests__/heatmap-utils.test.js` — Jest tests (`node` environment, no jsdom)
- `index.html` — Leaflet rendering wiring for the Heatmap tab and dashboard preview card

## Phase 1: Setup

**Purpose**: Minimal scaffolding — no new dependencies or build tooling are needed since
Leaflet already loads via the existing CDN `<script>` tag (Constitution I).

- [X] T001 Add a `Route Segment Utilities` section comment block to
      `src/heatmap-utils.js` (below the existing heatmap point helpers) as the landing spot
      for the new functions in Phase 2, without changing any existing exports

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core segment-derivation logic that every user story depends on (segment
identity, GPS-noise tolerance, frequency counting, sport filtering)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Implement `snapToGridCell(lat, lon)` in `src/heatmap-utils.js`: rounds a
      `[lat, lon]` pair to a fixed-size grid cell key at ~15 m resolution (FR-009's matching
      tolerance from spec.md Clarifications); export via `module.exports` and add to the
      `window.heatmapUtils` bridge
- [X] T003 Implement `buildRouteSegments(gpsTracksByActivityId, options = { sportFilter })`
      in `src/heatmap-utils.js` (depends on T002): for each track, snap consecutive points
      with `snapToGridCell`, build a segment per consecutive pair, key segments
      order-independently (`[cellA, cellB].sort().join('|')`) so A→B and B→A count as the
      same segment (FR-009), **retain each segment's endpoint `coords` (lat/lon pair) as
      defined in data-model.md — this is required by T007/T008 to draw and bound the
      polylines**, aggregate a `count` per key across activities matching the optional
      `sportFilter` (FR-006), and skip activities without track data (FR-008, reusing the
      existing `hasGpsData`-style guard); export and bridge to `window.heatmapUtils`
- [X] T004 [P] Add Jest tests for `snapToGridCell` in `__tests__/heatmap-utils.test.js`:
      points within ~15 m map to the same cell key, points further apart map to different
      keys (depends on T002)
- [X] T005 Add Jest tests for `buildRouteSegments` in `__tests__/heatmap-utils.test.js`
      (depends on T003), covering: two activities sharing a partial route plus one unique
      side street produce both a shared segment (count 2) and a unique segment (count 1),
      each with correct `coords`; GPS-noise traces within 15 m that land in the *same* grid
      cell merge into one segment (note: points that straddle a cell boundary are a known,
      accepted v1 limitation per research.md Decision 1 and are NOT required to merge); sport
      filter changes which activities/segments are included; activities with no GPS track
      are excluded without errors

**Checkpoint**: Foundation ready — segment identity, frequency counting, and sport
filtering are in place; user story implementation can now begin.

---

## Phase 3: User Story 1 - Replace blob heat with route lines (Priority: P1) 🎯 MVP

**Goal**: The Heatmap tab renders GPS-tracked activities as distinct route lines following
actual paths, instead of the current diffuse circular `leaflet.heat` blobs.

**Independent Test**: Import a dataset with GPS tracks, open the Heatmap tab, and confirm
recognizable line-shaped paths are rendered instead of round, blurred blobs; confirm a
shared segment and a unique segment both render as distinct lines.

### Implementation for User Story 1

- [X] T006 [US1] Remove the `leaflet.heat` plugin script loading from `ensureLeafletLoaded()`
      in `index.html` (the `heatScript` block loading
      `https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js`) since route lines use
      vanilla Leaflet only (research.md Decision 2)
- [X] T007 [US1] Update `renderHeatmap()` in `index.html` to call
      `window.heatmapUtils.buildRouteSegments(gpsTracksByActivityId, { sportFilter: selectedHeatmapSportFilter })`
      and draw one `L.polyline` per returned segment (initial fixed weight/opacity) onto
      `heatmapMapInstance`, replacing the existing `L.heatLayer(points, ...)` call (depends
      on T003, T006)
- [X] T008 [US1] Add a `computeRouteSegmentBounds(segments)` helper in
      `src/heatmap-utils.js` (or extend the existing `computeHeatmapBounds`) so
      `renderHeatmap()`'s `fitBounds(...)` call keeps working from segment endpoint
      coordinates instead of raw heatmap points (depends on T003); cover it with a Jest test
      in `__tests__/heatmap-utils.test.js`
- [X] T009 [US1] Manually validate via [quickstart.md](./quickstart.md) step 3: confirm
      line-shaped routes render (not blobs) and shared/unique segments are both visible as
      distinct lines (depends on T007, T008). **Verified** with the user's real Strava export
      (2646 activities, 2423 GPS tracks) via a local browser session: routes render as
      distinct lines/clusters instead of blurred blobs, no console errors

**Checkpoint**: User Story 1 is fully functional and independently testable — routes render
as uniform-thickness lines instead of blobs.

---

## Phase 4: User Story 2 - Frequency-based line thickness with a legible scale (Priority: P1)

**Goal**: Route segments render with thickness/opacity proportional to visit frequency, on
a perceptually-tuned, capped scale so both rare and common routes stay legible.

**Independent Test**: Import a dataset with one segment traveled once and another traveled
20+ times; confirm the frequent segment is visibly thicker/more prominent while the
once-traveled segment remains clearly visible against the base map.

### Implementation for User Story 2

- [X] T010 [P] [US2] Implement `computeRouteSegmentStyle(count, options = { minWeight, maxWeight, minOpacity, maxOpacity })`
      in `src/heatmap-utils.js`: a non-linear (e.g. `log(1 + count)`-based) mapping from
      visit count to a clamped `{ weight, opacity }` pair, per research.md Decision 3
      (satisfies FR-002 proportional thickness, FR-003 hard cap, FR-004 single-visit
      contrast floor, FR-005 non-linear perceptual scale); export and bridge to
      `window.heatmapUtils`
- [X] T011 [P] [US2] Add Jest tests for `computeRouteSegmentStyle` in
      `__tests__/heatmap-utils.test.js` (depends on T010): `count = 1` returns the minimum
      but still-visible weight/opacity floor; weight/opacity increase monotonically with
      count; values are clamped at the configured max regardless of how large `count` is;
      out-of-range/invalid counts (0, negative, non-finite) are handled without throwing
- [X] T012 [US2] Wire `computeRouteSegmentStyle(segment.count)` into the per-segment
      `L.polyline` creation in `renderHeatmap()` in `index.html`, replacing the fixed
      weight/opacity from T007 with the computed values (depends on T007, T010)
- [X] T013 [US2] Manually validate via [quickstart.md](./quickstart.md) step 3: confirm the
      frequently-traveled segment renders visibly thicker/more prominent than the
      once-traveled segment, and the once-traveled segment stays clearly visible (depends on
      T012). **Verified** with the real export: the dense home-region cluster renders
      noticeably more prominent than isolated single-visit routes elsewhere on the map

**Checkpoint**: User Stories 1 AND 2 both work independently — routes now show
frequency-based thickness.

---

## Phase 5: User Story 3 - Visible activity clusters at world/zoomed-out view (Priority: P2)

**Goal**: A single distant-city activity (e.g. a one-off marathon) remains visibly
identifiable even when the map is zoomed all the way out to a world view, and the
dashboard preview card stays visually consistent with the full map.

**Independent Test**: Import a dataset with a dense local cluster plus one isolated distant
activity; zoom out to a world view and confirm the distant route is still visible; zoom
back into that city and confirm consistency with the world-zoom appearance.

### Implementation for User Story 3

- [X] T014 [US3] Tune the `minWeight`/`minOpacity` constants used by
      `computeRouteSegmentStyle` (T010) so a single-visit segment stays perceptible at low
      (world) zoom without per-zoom recalculation (FR-007); document the chosen constants
      with a short code comment in `src/heatmap-utils.js` explaining the reasoning (depends
      on T010)
- [X] T015 [US3] Replace `buildDemoHeatmapPoints()` in `index.html` with a
      `buildDemoRouteSegments()` helper that produces synthetic segments with varied visit
      counts (at least one count = 1 and one higher count), for use by the dashboard preview
      card (research.md Decision 4)
- [X] T016 [US3] Update `renderHeatmapPreviewMap()` in `index.html` to draw the segments
      from T015 as styled `L.polyline`s via `computeRouteSegmentStyle` (T010), replacing the
      `L.heatLayer(demoPoints, ...)` call, so the dashboard card preview matches the full
      map's visual language (depends on T010, T015)
- [X] T017 [US3] Manually validate via [quickstart.md](./quickstart.md) steps 4 and 6:
      confirm a distant single-city route stays visible at world zoom and remains consistent
      when zoomed in; confirm the dashboard preview card shows varied-thickness demo lines
      instead of heat blobs (depends on T014, T016). **Verified** with the real export: at
      full world zoom, multiple isolated single activities (e.g. a US East Coast trip, a
      Greece trip, Middle East/Asia trips) remained clearly visible as distinct dots/short
      lines alongside a dense home-region cluster — confirms SC-002. Dashboard preview card
      also confirmed to render polylines instead of heat blobs.

**Checkpoint**: All three user stories are independently functional — route lines, frequency
thickness, and world-zoom/preview consistency all work together.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and final verification across all user stories

- [X] T018 [P] Remove now-unused `leaflet.heat`-related naming/comments left in `index.html`
      (e.g. stale references to `heatLayerInstance` if renamed, or comments mentioning heat
      blobs) so the code matches the new route-line behavior. Also removed the now-dead
      point-based `buildHeatmapPoints`/`computeHeatmapBounds` functions (and their tests)
      from `src/heatmap-utils.js` since nothing references them anymore
- [X] T019 [P] Confirm the sport filter recomputation still updates displayed routes with no
      stale segments left from a previously selected sport (SC-004), by re-running the
      relevant part of [quickstart.md](./quickstart.md) step 5. **Verified** with the real
      export: switching from "All Sports" to "Bike" recomputed the visible routes (fewer
      clusters shown, map re-fit its bounds) with no leftover routes from other sports
- [X] T020 Run the full root regression suite `npm test` and resolve any failures
      (Constitution III — narrowest-scope test-first verification). **Result**: 13 suites,
      220 tests, all passing
- [X] T022 [P] Discovered during real-data testing (2646 activities / 2423 GPS tracks): the
      default Leaflet SVG renderer became unresponsive when rendering thousands of route
      segments as individual `<path>` elements. Fixed by passing a shared `L.canvas()`
      renderer to both the main map and the preview map (`index.html`, `renderHeatmap()` and
      `renderHeatmapPreviewMap()`), matching the canvas-renderer approach already called for
      in research.md Decision 2 / plan.md but not wired up in the initial implementation.
      Re-verified with the same real export: import + Heatmap tab + sport-filter switching
      all responded normally afterward, with no repeat of the freeze.
- [X] T021 Run [quickstart.md](./quickstart.md) end-to-end (all 7 steps) as final sign-off,
      including an explicit check that the dashboard card label, tab title, and element IDs
      for "Heatmap" are unchanged from before this feature (FR-010). **Verified** end-to-end
      with the user's real 2646-activity export (naming/entry points unchanged; all steps
      re-run after the T022 canvas-renderer fix with no console errors)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion; wires into US1's rendering
  (T012 depends on T007), so in practice implement after US1, though the styling function
  itself (T010, T011) can be built in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational completion and on `computeRouteSegmentStyle`
  (T010) from US2; the preview-card work (T015, T016) can start as soon as T010 exists
- **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories — independently testable with
  uniform-thickness lines
- **User Story 2 (P1)**: Builds on US1's per-segment `L.polyline` rendering (T007) to swap in
  computed styles, but its core function (T010) is independently unit-testable
- **User Story 3 (P2)**: Builds on US2's styling function (T010) for both the world-zoom
  tuning and the preview card; independently testable via its own acceptance scenarios

### Within Each User Story

- Foundational data functions before rendering wiring
- Pure functions (and their tests) before the `index.html` wiring that consumes them
- Story complete (and manually validated via quickstart.md) before moving to the next
  priority

### Parallel Opportunities

- T002 and T004 (grid-snap function + its tests) can be parallelized with early scaffolding
  in T001
- T010 and T011 (US2's styling function + its tests) can be developed in parallel with US1's
  `index.html` wiring (T006–T008), since they don't share files
- T018 and T019 (Polish) can run in parallel; T020 and T021 are sequential final gates

---

## Parallel Example: Foundational Phase

```bash
# Once T001 is done, these can proceed together:
Task: "Implement snapToGridCell(lat, lon) in src/heatmap-utils.js"
Task: "Add Jest tests for snapToGridCell in __tests__/heatmap-utils.test.js"
```

## Parallel Example: User Story 2

```bash
# T010/T011 can run alongside User Story 1's index.html work (different files):
Task: "Implement computeRouteSegmentStyle(count, options) in src/heatmap-utils.js"
Task: "Add Jest tests for computeRouteSegmentStyle in __tests__/heatmap-utils.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (segment building — CRITICAL, blocks all stories)
3. Complete Phase 3: User Story 1 (uniform-thickness route lines replace blobs)
4. **STOP and VALIDATE**: Run quickstart.md step 3 for User Story 1 independently
5. This alone already fixes the core complaint ("Heatmap" no longer shows blobs)

### Incremental Delivery

1. Setup + Foundational → segment data pipeline ready
2. User Story 1 → lines instead of blobs → validate → demo (MVP!)
3. User Story 2 → frequency-based thickness → validate → demo
4. User Story 3 → world-zoom visibility + consistent preview card → validate → demo
5. Polish → cleanup, full regression, final quickstart sign-off

### Solo Developer Strategy

Given the small scope, implement sequentially in priority order (Setup → Foundational →
US1 → US2 → US3 → Polish), running `npm test` after each phase per Constitution III, rather
than parallelizing across stories.

---

## Notes

- [P] tasks touch different files or are independently unit-testable with no code
  dependency on an incomplete task
- [Story] labels map tasks to spec.md's User Story 1/2/3 for traceability
- Every task that changes `src/heatmap-utils.js` pairs with a Jest test task per
  Constitution III (NON-NEGOTIABLE)
- No task renames the "Heatmap" dashboard card, tab, or IDs (per FR-010 / Clarifications) —
  `src/tab-navigation.js` and its tests are intentionally out of scope for this feature
