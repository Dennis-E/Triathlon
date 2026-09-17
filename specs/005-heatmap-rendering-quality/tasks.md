---

description: "Task list for heatmap rendering quality (smooth tracks & correct frequency layering)"
---

# Tasks: Heatmap Rendering Quality (Smooth Tracks & Correct Frequency Layering)

**Input**: Design documents from `/specs/005-heatmap-rendering-quality/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/heatmap-rendering-ui.md](./contracts/heatmap-rendering-ui.md), [quickstart.md](./quickstart.md)

**Tests**: Included because Constitution Principle III requires focused Jest coverage for
reusable logic before considering a change to `src/` done.

**Organization**: Tasks are grouped by user story. All three stories are independent of each
other: User Story 1 touches only the draw-order sort path (`src/heatmap-utils.js` +
`index.html`'s `RouteCanvasLayer`), User Story 2 touches only GPS track simplification
(`src/zip-importer.js`), and User Story 3 touches only the fixed style constants
(`computeRouteSegmentStyle()` in `src/heatmap-utils.js`, already consumed unchanged by the
existing `index.html` draw loop). No Foundational (Phase 2) tasks are required — there is no
shared blocking prerequisite beyond the Setup baseline.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches a different file and has no incomplete
  dependency
- **[Story]**: Maps to User Story 1, 2, or 3 from [spec.md](./spec.md)
- Every task names an exact file path

## Path Conventions

- `src/heatmap-utils.js`: pure segment sort-order and style-constant logic
- `src/zip-importer.js`: pure GPS track simplification logic
- `__tests__/heatmap-utils.test.js`, `__tests__/zip-importer.test.js`: Jest tests in the Node environment
- `index.html`: existing Leaflet/Canvas `RouteCanvasLayer`

## Phase 1: Setup

**Purpose**: Record the current baseline before changing established heatmap rendering behavior.

- [X] T001 Run `npm test -- --runTestsByPath __tests__/heatmap-utils.test.js __tests__/zip-importer.test.js __tests__/index-script-syntax.test.js` from the repository root and record any pre-existing failures before editing `src/heatmap-utils.js`, `src/zip-importer.js`, or `index.html`

---

## Phase 2: Foundational (Blocking Prerequisites)

No foundational tasks are required. Each user story below is self-contained: it adds one new
pure helper (or replaces one existing pure helper's body) in a single file, with no shared
new data structure or cross-story dependency.

---

## Phase 3: User Story 1 - Frequent routes are always visibly on top (Priority: P1) MVP

**Goal**: Guarantee that the segment with the higher visit-frequency count is always the one
visibly displayed at any shared screen position, regardless of import order, redraw, or
sport-filter changes, with a deterministic lexical-key tie-break for equal counts.

**Independent Test**: Import a dataset with one high-frequency and one low-frequency segment
at the same road position; verify the high-frequency color is on top across re-imports in a
different file order, and after panning/zooming/filter changes.

### Tests for User Story 1

> Write these tests first and confirm they fail before implementation.

- [X] T002 [US1] Write failing tests in `__tests__/heatmap-utils.test.js` for a new segment draw-order sort helper (e.g. `sortSegmentsForDrawOrder()`): ascending order by `count` (or `colorCount` for low-zoom aggregates), lexical ascending order of `key` as the tie-break for equal counts (per FR-003), and stable/identical output when the same segments are supplied in a different (shuffled) input order representing a different activity-import order

### Implementation for User Story 1

- [X] T003 [US1] Implement the tested sort helper in `src/heatmap-utils.js` as a pure function that accepts a segment array (or object map) and an optional count-field name (defaulting to `count`, usable with `colorCount` for low-zoom aggregates), returns a new array sorted ascending by `(countField, key)`, export it through both `module.exports` and `window.heatmapUtils`, and make T002 pass
- [X] T004 [US1] In `index.html`'s `RouteCanvasLayer`, call the new sort helper exactly once on the full-detail segment array inside `setSegments()` immediately after it is assigned to `this._segments`, and call it again on `this._lowZoomSegments` (using the `colorCount` field) immediately after it is built inside `_draw()`'s low-zoom branch, so `_draw()`'s per-frame `for` loop only ever iterates already-sorted arrays and never re-sorts on pan/zoom
- [X] T005 [US1] Run the focused Jest suite and complete quickstart.md sections 3 and 4 (frequency-on-top across redraws/filters, and re-import order independence) against a local export with an overlapping high/low-frequency road position; confirm FR-001, FR-002, FR-003, SC-001, and SC-004 (no perceptible slowdown from the one-time sort) — automated Jest portion verified; manual browser validation against a real local export is left to the user (personal data must stay local per constitution)

**Checkpoint**: User Story 1 independently corrects the misleading overlap/draw-order defect.

---

## Phase 4: User Story 2 - Routes follow the road smoothly (Priority: P1)

**Goal**: Replace fixed-count, evenly-spaced-stride GPS track downsampling with
curve-preserving (Ramer–Douglas–Peucker) simplification, so recorded curves and turns are
followed accurately instead of cut across by long straight chords, without ever inventing
GPS detail that was not recorded.

**Independent Test**: Import a known winding-route activity and verify the rendered path
follows the curve shape instead of connecting a few widely spaced points with straight lines,
compared to today's rendering.

### Tests for User Story 2

> Write these tests first and confirm they fail before implementation.

- [X] T006 [P] [US2] Write failing tests in `__tests__/zip-importer.test.js` for a new `simplifyTrackPoints(points, options)` helper: it MUST always return the input's first and last point (verbatim, never a new interpolated point, per FR-005 and data-model.md); it MUST drop a point only when its perpendicular deviation from the straight chord between its retained neighbors is within `options.toleranceMeters` (default `3`, per data-model.md); it MUST retain a point whose deviation exceeds that tolerance (e.g., a sharp turn fixture); and when the tolerance-based result for a single track still exceeds `options.maxPoints` (default `2000`, per data-model.md), it MUST fall back to further bounded reduction so the final length never exceeds `maxPoints`
- [X] T007 [P] [US2] Extend `__tests__/zip-importer.test.js` with a failing test asserting `extractGpsTracksFromZip()` now calls the new simplification helper (not the old fixed-180 stride `downsampleTrack`) when building each activity's `points` array

### Implementation for User Story 2

- [X] T008 [US2] Implement `simplifyTrackPoints()` in `src/zip-importer.js` as a pure, recursive Ramer–Douglas–Peucker function (using a haversine-based perpendicular-distance-in-meters calculation consistent with the existing distance approach used elsewhere in the heatmap code, so tolerance is latitude-independent), keep the existing `downsampleTrack()` function available for use only as T006's bounded safety-maximum fallback, export the new helper via `module.exports` and the existing `window.*` bridge, and make T006 pass
- [X] T009 [US2] Replace the `downsampleTrack(points, 180)` call inside `extractGpsTracksFromZip()` in `src/zip-importer.js` with `simplifyTrackPoints(points, { toleranceMeters: 3, maxPoints: 2000 })`, keeping the existing `.map(p => [p.lat, p.lon])` conversion and per-activity `result[activityId]` assignment unchanged, and make T007 pass
- [X] T010 [US2] Run the focused Jest suite and complete quickstart.md section 5 against a previously-reported long/winding cycling activity (see [TODO.md](../../TODO.md): "bike activities are not smooth enough"); confirm FR-004, FR-005, and SC-002 — automated Jest portion verified; manual browser validation against the user's real cycling activity is left to the user

**Checkpoint**: User Story 2 independently produces visibly smoother, curve-following routes.

---

## Phase 5: User Story 3 - Frequency is communicated primarily through one clear visual cue (Priority: P2)

**Goal**: Make color the sole frequency-communicating visual channel by replacing the
count-dependent line weight/opacity with fixed constants, so nearby distinct roads never
visually merge and isolated routes never become imperceptible.

**Independent Test**: Compare today's triple-encoded rendering (variable width + variable
opacity + variable color) against fixed-width/opacity rendering on the same dataset; confirm
frequency is still readable from color alone and nearby parallel roads no longer merge.

### Tests for User Story 3

> Write these tests first and confirm they fail before implementation.

- [X] T011 [P] [US3] Write failing tests in `__tests__/heatmap-utils.test.js` asserting `computeRouteSegmentStyle(count)` returns the same fixed `{ weight, opacity }` pair for widely different counts (e.g., `1`, `50`, `100000`) instead of a logarithmically scaled value, replacing/removing the prior variable-weight/opacity assertions for this function

### Implementation for User Story 3

- [X] T012 [US3] Replace the logarithmic scaling body of `computeRouteSegmentStyle()` in `src/heatmap-utils.js` with fixed constants per research.md Decision 3 (e.g. `weight: 3`, `opacity: 0.85`), remove the now-unused `ROUTE_STYLE_DEFAULTS` scaling fields it no longer needs, keep the function's existing exported name/signature so `index.html`'s existing `computeRouteSegmentStyle(segment.count)` call site needs no change, and make T011 pass
- [X] T013 [US3] Run the focused Jest suite and complete quickstart.md section 6 (parallel roads not merging, ranking by color alone, isolated-route visibility) against a local export with nearby parallel roads of different frequency; confirm FR-007, FR-008, FR-009, SC-003, and SC-005 — automated Jest portion verified; manual browser validation against a real local export is left to the user

**Checkpoint**: User Story 3 independently reduces the heatmap to one clear frequency cue.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final full-suite validation and documentation alignment across all three stories.

- [X] T014 [P] Update `docs/IMPORT_FEATURE.md` and/or `README.md` heatmap descriptions, if they currently describe fixed-stride point downsampling or frequency-dependent line thickness, to reflect curve-preserving simplification and color-only frequency encoding — verified neither file mentions the old point-cap or variable-thickness implementation details, so no edit was needed
- [X] T015 Run the full root suite (`npm test`) and complete quickstart.md end-to-end (sections 1–7) against a real local export at or near the `specs/002-heatmap-performance-scale` scale baseline; confirm SC-001 through SC-005 and no regression to `specs/001`–`004` behavior — automated portion (`npm test`, 269/269 passing) verified; manual browser validation (sections 2–7) against a real local Strava export requires the user's own data/browser and is not run by the agent

---

## Dependencies & Execution Order

- **Setup (Phase 1)** has no dependencies; run it first.
- **Foundational (Phase 2)**: none — proceed directly to user stories after Setup.
- **User Stories (Phases 3–5)** are mutually independent and may be implemented/tested in any
  order, or in parallel by different contributors, because they touch disjoint code:
  - User Story 1 → `src/heatmap-utils.js` (new sort helper) + `index.html` (`RouteCanvasLayer`)
  - User Story 2 → `src/zip-importer.js` only
  - User Story 3 → `src/heatmap-utils.js` (`computeRouteSegmentStyle()` body only)
  - User Story 1 and User Story 3 both edit `src/heatmap-utils.js`, but different, unrelated
    functions; run them sequentially if the same contributor/session is doing both, to avoid
    an unnecessary merge conflict.
- **Polish (Phase 6)** depends on all user stories being complete.

## Parallel Execution Examples

- T002 (US1 test, `__tests__/heatmap-utils.test.js`) and T006–T007 (US2 tests,
  `__tests__/zip-importer.test.js`) touch different files and can be written in parallel.
- T008–T010 (User Story 2, entirely within `src/zip-importer.js` and its test file) can
  proceed in parallel with Phase 3 (User Story 1) or Phase 5 (User Story 3), since neither
  touches `src/zip-importer.js`.
- T011 (US3 test) is in the same file as T002 (US1 test); do not run these two concurrently
  in the same working copy — complete one story's `heatmap-utils.js` edits before starting
  the other's to avoid merge conflicts.

## Implementation Strategy

**MVP first**: Implement Phase 3 (User Story 1) alone as the MVP — it fixes the most
misleading defect (high-frequency roads hidden under low-frequency ones) with the smallest,
most isolated change (a sort call in two places). Phases 4 and 5 can ship as fast-follow
increments in either order, since both are independently valuable and independently testable.
