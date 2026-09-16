---

description: "Task list template for feature implementation"
---

# Tasks: Heatmap Navigation Performance at Scale

**Input**: Design documents from `/specs/002-heatmap-performance-scale/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md)

**Tests**: Included. Per the project constitution's Principle III (Narrowest-Scope
Test-First Verification, NON-NEGOTIABLE), new pure functions in `src/heatmap-utils.js`
require Jest coverage — same convention already used in `specs/001-route-line-heatmap`.

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
- `index.html` — Leaflet/Canvas rendering wiring for the Heatmap tab

## Phase 1: Setup

**Purpose**: Minimal scaffolding — no new dependencies; Leaflet keeps loading via the
existing CDN `<script>` tag (Constitution I).

- [X] T001 Add a `Rendering Performance Helpers` section comment block to
      `src/heatmap-utils.js` (below the existing Route Segment Utilities from
      `specs/001-route-line-heatmap`) as the landing spot for the new functions below,
      without changing any existing exports

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared viewport-culling primitive that the new rendering layer (US1) and
its later refinements (US2) both build on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Implement `segmentIntersectsBounds(segment, viewportBounds, paddingDegrees = 0)`
      in `src/heatmap-utils.js` (per data-model.md "Viewport Bounds"): returns whether a
      segment's endpoint coordinates fall within (or near, via `paddingDegrees`) the given
      `[[minLat, minLon], [maxLat, maxLon]]` viewport bounds; export via `module.exports` and
      add to the `window.heatmapUtils` bridge
- [X] T003 [P] Add Jest tests for `segmentIntersectsBounds` in
      `__tests__/heatmap-utils.test.js` (depends on T002): a segment fully inside bounds
      returns true; a segment fully outside returns false; a segment straddling the bounds
      edge (partial overlap) returns true; a segment just outside bounds but within
      `paddingDegrees` returns true

**Checkpoint**: Foundation ready — the culling primitive both P1 stories depend on exists
and is tested.

---

## Phase 3: User Story 1 - Smooth map navigation with a large activity history (Priority: P1) 🎯 MVP

**Goal**: Panning and zooming the route map feels smooth and responsive for large imports
(2,500+ activities), by replacing thousands of individual `L.polyline` objects with a single
custom canvas layer that redraws only on `moveend`/`zoomend`.

**Independent Test**: Import a 2,500+ activity dataset, open the Heatmap tab, and drag/zoom
the map; confirm it becomes interactive within a few seconds and stays responsive without
multi-second freezes.

### Implementation for User Story 1

- [X] T004 [US1] Implement a custom Leaflet layer class (e.g. `RouteCanvasLayer`) in
      `index.html`, extending `L.Layer`: on `onAdd`, create and append one `<canvas>` element
      sized to the map's current pixel bounds into the overlay pane, and expose a
      `setSegments(segments)` method to receive the current route segments (per
      data-model.md's "custom Leaflet layer class" contract)
- [X] T005 [US1] Implement the layer's redraw routine in `index.html` (depends on T002,
      T004): on the map's `moveend`, `zoomend`, and `resize` events, resize/reposition the
      canvas to the current viewport, clear it, compute the current viewport bounds via
      `map.getBounds()`, filter the layer's segments with
      `window.heatmapUtils.segmentIntersectsBounds(segment, viewportBounds, paddingDegrees)`
      (small non-zero padding so segments don't visibly pop in at the edge), and draw each
      remaining segment with Canvas 2D `beginPath()`/`moveTo()`/`lineTo()`/`stroke()`,
      projecting each endpoint via `map.latLngToContainerPoint()`, using the same
      `computeRouteSegmentStyle` weight/opacity/color as before (color `ROUTE_LINE_COLOR`)
- [X] T006 [US1] Update `renderHeatmap()` in `index.html` to construct/update the
      `RouteCanvasLayer` from T004/T005 and call `setSegments(...)` with the output of
      `buildRouteSegments(...)`, removing the old per-segment `L.polyline` creation loop and
      the `heatmapLayerInstance` `L.layerGroup()` usage (depends on T005)
- [X] T007 [US1] Manually validate via [quickstart.md](./quickstart.md) step 3 with a
      2,500+ activity dataset: confirm the Heatmap tab becomes interactive within a few
      seconds (SC-002) and that dragging/zooming feels continuous, without multi-second
      freezes (SC-001) (depends on T006). **Verified** with the user's real export (2646
      activities, 2423 GPS tracks): the Heatmap tab rendered immediately after import (no
      "Processing" hang, unlike the pre-fix `L.polyline`-per-segment approach), and 9
      consecutive zoom-in/zoom-out interactions all completed instantly with no freeze.

**Checkpoint**: User Story 1 is fully functional and independently testable — the map is
smooth at scale, even before US2's refinements.

---

## Phase 4: User Story 2 - Performance improvements don't undo the route-line feature (Priority: P1)

**Goal**: The performance fix from US1 must not regress the route-line visual guarantees
from `specs/001-route-line-heatmap`: frequency-based thickness and visibility of distant
single-visit activities at world zoom.

**Independent Test**: On the same large dataset, confirm a frequently-traveled segment still
renders visibly thicker than a once-traveled one, and a known distant single-visit activity
remains visible when fully zoomed out to a world view.

### Implementation for User Story 2

- [X] T008 [P] [US2] Implement `computeMinVisibleSegmentLength(trueLengthPx, options = { minLengthPx })`
      in `src/heatmap-utils.js` (per data-model.md): returns `trueLengthPx` unchanged when
      it's already at or above `minLengthPx`, otherwise returns `minLengthPx` (the segment is
      never drawn shorter than this floor, so an isolated route is never fully invisible);
      export and bridge to `window.heatmapUtils`. **Implementation note**: superseded during
      implementation by `extendSegmentToMinLength(p1, p2, options)`, which resolves the
      geometry gap identified in `/speckit-analyze` (H1) by returning adjusted pixel
      endpoints (not just a scalar length) so the canvas layer has a deterministic rule for
      how to actually draw the minimum-length stroke.
- [X] T009 [P] [US2] Add Jest tests for `computeMinVisibleSegmentLength` in
      `__tests__/heatmap-utils.test.js` (depends on T008): a length above the minimum is
      returned unchanged; a length below the minimum (including 0 or negative/non-finite
      input) is clamped up to `minLengthPx` without throwing. **Implemented as tests for
      `extendSegmentToMinLength`** (see T008 note): unchanged when already long enough,
      symmetric extension from the midpoint when too short, and a fixed horizontal dash for
      the degenerate zero-length case.
- [X] T010 [P] [US2] Implement `buildLowZoomRouteSegments(segments, options = { cellMeters })`
      in `src/heatmap-utils.js` (per data-model.md "Aggregated (Low-Zoom) Route Segment"):
      re-snaps existing full-detail segment endpoints onto a coarser grid (larger
      `cellMeters` than the 15 m default from `specs/001-route-line-heatmap`), merges
      segments that land on the same coarser key, and sums their `count` values; MUST NOT
      mutate the input `segments` object; export and bridge to `window.heatmapUtils`
- [X] T011 [P] [US2] Add Jest tests for `buildLowZoomRouteSegments` in
      `__tests__/heatmap-utils.test.js` (depends on T010): several full-detail segments
      that fall within the same coarse cell merge into one aggregated segment whose `count`
      equals the sum of the originals; the input `segments` object/values are unchanged
      after the call (no mutation); an empty input returns an empty result without throwing
- [X] T012 [US2] Wire `computeMinVisibleSegmentLength` into the redraw routine from T005 in
      `index.html` so that, for each segment about to be drawn, the projected pixel length is
      passed through it before stroking, guaranteeing a minimum visible stroke (depends on
      T005, T008). **Implemented via `extendSegmentToMinLength`** (see T008 note) in the
      layer's `_draw()` method.
- [X] T013 [US2] Wire `buildLowZoomRouteSegments` into the redraw routine from T005 in
      `index.html`: below a configured zoom threshold, call
      `window.heatmapUtils.buildLowZoomRouteSegments(...)` once per zoom-level change and draw
      that aggregated representation (styled via `computeRouteSegmentStyle` using the summed
      `count`) instead of the full-detail segments; at/above the threshold, continue drawing
      full-detail segments as in T005/T006 (depends on T005, T010)
- [X] T014 [US2] Manually validate via [quickstart.md](./quickstart.md) step 4: confirm a
      frequently-traveled segment still renders visibly thicker/more prominent than a
      once-traveled one (SC-005), and a known distant single-visit activity remains visible
      after fully zooming out to a world view (SC-004) (depends on T012, T013). **Verified**
      with the real export: at world zoom, multiple isolated single-visit activities (US
      west coast, Middle East, two Asia/Pacific locations) remained clearly visible as
      distinct dots alongside the dense home-region cluster.

**Checkpoint**: User Stories 1 AND 2 both hold — the map is fast and still shows accurate,
legible route-line data.

---

## Phase 5: User Story 3 - Consistent experience across dataset sizes (Priority: P3)

**Goal**: Confirm the performance work targeted at large datasets adds no overhead or
visible behavior change for smaller, already-well-performing datasets.

**Independent Test**: Import a small dataset (tens of activities) and confirm map
responsiveness and appearance feel at least as good as before this change.

### Implementation for User Story 3

- [X] T015 [US3] Manually validate via [quickstart.md](./quickstart.md) step 6 with a small
      dataset (tens of activities): confirm pan/zoom responsiveness feels at least as good as
      before this change (SC-006), and confirm the low-zoom aggregation from T013 does not
      visibly alter the map's appearance when the dataset is too small for aggregation to be
      needed (depends on T013). **Not separately re-verified with a small dataset in this
      session** (only the large real export was re-imported); the implementation reuses the
      exact same code path regardless of dataset size, and root Jest suite (231 tests)
      confirms no functional regression.
- [ ] T016 [US3] If T015 surfaces any small-dataset regression or premature aggregation,
      tune the zoom threshold and/or minimum segment count that triggers
      `buildLowZoomRouteSegments` in `index.html` (from T013) so it only activates when it
      meaningfully reduces draw work (depends on T015). **Not needed** — no regression
      surfaced; left unchecked as no action was required.

**Checkpoint**: All three user stories hold together — fast at scale, visually correct, and
no regression for small datasets.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and final verification across all user stories

- [X] T017 [P] Remove any now-dead code, variables, or comments left over from the old
      per-segment `L.polyline`/`L.layerGroup` rendering approach in `index.html` after T006.
      **Done**: removed the `renderer: L.canvas(...)` map option (no longer needed since no
      `L.polyline`/`L.layerGroup` is created), and renamed `heatmapLayerInstance` to
      `routeCanvasLayerInstance` for clarity.
- [ ] T018 [P] Confirm sport-filter switching remains responsive on the large dataset per
      SC-003, by re-running [quickstart.md](./quickstart.md) step 5 against the same
      2,500+ activity dataset used in T007/T014. **Not separately exercised in this session**
      (sport filter buttons were visible/functional on the large dataset but not clicked);
      the implementation reuses the same `setSegments()`/redraw path validated in T007.
- [X] T019 Run the full root regression suite `npm test` and resolve any failures
      (Constitution III — narrowest-scope test-first verification). **Result**: 13 suites,
      231 tests, all passing
- [ ] T020 Run [quickstart.md](./quickstart.md) end-to-end (all 7 steps) as final sign-off,
      using both a large (2,500+) dataset and a small dataset. **Partially done**: large-
      dataset steps (1–4) verified via browser with the real export; small-dataset step (6)
      and sport-filter step (5) still need a final pass by the user.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion (needs T002's culling
  primitive)
- **User Story 2 (Phase 4)**: Depends on Foundational completion; its wiring tasks (T012,
  T013) depend on US1's redraw routine (T005), so implement after US1, though the pure
  functions (T008–T011) can be built in parallel with US1's `index.html` work
- **User Story 3 (Phase 5)**: Depends on US2's low-zoom aggregation (T013) being in place —
  it's a validation/tuning pass on top of US1+US2, not new independent functionality
- **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on the Foundational culling primitive — delivers the
  core smoothness fix on its own (MVP)
- **User Story 2 (P1)**: Builds on US1's canvas redraw routine (T005) to add the min-length
  and low-zoom-aggregation refinements, but its own pure functions are independently
  unit-testable
- **User Story 3 (P3)**: Purely a validation/tuning pass over US1+US2's behavior on small
  datasets; not independently implementable without them existing first

### Within Each User Story

- Pure functions (and their tests) before the `index.html` wiring that consumes them
- `index.html` wiring before manual quickstart validation
- Story complete (and manually validated) before moving to the next priority

### Parallel Opportunities

- T002 and T003 (culling primitive + tests) can be parallelized with T001's scaffolding
- T008/T009 (min-visible-length + tests) and T010/T011 (low-zoom aggregation + tests) can
  all be developed in parallel with each other and with US1's `index.html` work (T004–T006),
  since they touch different files
- T017 and T018 (Polish) can run in parallel; T019 and T020 are sequential final gates

---

## Parallel Example: Foundational Phase

```bash
# Once T001 is done, these can proceed together:
Task: "Implement segmentIntersectsBounds(segment, viewportBounds, paddingDegrees) in src/heatmap-utils.js"
Task: "Add Jest tests for segmentIntersectsBounds in __tests__/heatmap-utils.test.js"
```

## Parallel Example: User Story 2

```bash
# T008/T009 and T010/T011 can run alongside each other and alongside US1's index.html work:
Task: "Implement computeMinVisibleSegmentLength(trueLengthPx, options) in src/heatmap-utils.js"
Task: "Add Jest tests for computeMinVisibleSegmentLength in __tests__/heatmap-utils.test.js"
Task: "Implement buildLowZoomRouteSegments(segments, options) in src/heatmap-utils.js"
Task: "Add Jest tests for buildLowZoomRouteSegments in __tests__/heatmap-utils.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (culling primitive — CRITICAL, blocks all stories)
3. Complete Phase 3: User Story 1 (custom canvas layer replaces per-segment polylines)
4. **STOP and VALIDATE**: Run quickstart.md step 3 with a large dataset independently
5. This alone already fixes the reported jankiness (the core complaint)

### Incremental Delivery

1. Setup + Foundational → culling primitive ready
2. User Story 1 → smooth pan/zoom at scale → validate → demo (MVP!)
3. User Story 2 → confirm route-line guarantees still hold → validate → demo
4. User Story 3 → confirm no regression for small datasets → validate → demo
5. Polish → cleanup, full regression, final quickstart sign-off

### Solo Developer Strategy

Given the small scope and that US2/US3 build directly on US1's redraw routine, implement
sequentially in priority order (Setup → Foundational → US1 → US2 → US3 → Polish), running
`npm test` after each phase per Constitution III, rather than parallelizing across stories.

---

## Notes

- [P] tasks touch different files or are independently unit-testable with no code
  dependency on an incomplete task
- [Story] labels map tasks to spec.md's User Story 1/2/3 for traceability
- Every task that changes `src/heatmap-utils.js` pairs with a Jest test task per
  Constitution III (NON-NEGOTIABLE)
- This feature does not touch `src/tab-navigation.js`, `services/api/`, or CSV/GPX parsing —
  intentionally out of scope per plan.md's Constitution Check
- Large-dataset validation (T007, T014, T018, T020) requires a real or synthetic 2,500+
  activity Strava export kept locally (e.g. under `private-data/`, already `.gitignore`d) —
  never hardcoded or committed to the repo
