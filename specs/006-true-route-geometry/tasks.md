---

description: "Task list for true-path route geometry rendering"
---

# Tasks: True-Path Route Geometry Rendering

**Input**: Design documents from `/specs/006-true-route-geometry/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/heatmap-true-path-rendering.md](./contracts/heatmap-true-path-rendering.md), [quickstart.md](./quickstart.md)

**Tests**: Included because Constitution Principle III requires focused Jest coverage for
reusable logic before considering a change to `src/` done.

**Organization**: Tasks are grouped by user story. User Story 1 does the core work (enrich
`interpolateTrackProbes()`, capture `truePathPoints` per corridor, draw them in
`RouteCanvasLayer`). User Story 2 verifies that frequency coloring, corridor identity, and
hover/tooltip resolution still work correctly once corridors draw multi-point true paths
instead of two-point chords — it depends on User Story 1's data being present, but adds no
new production code by itself unless verification uncovers a gap. User Story 3 is a pure
regression-guardrail pass with no new production code.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches a different file and has no incomplete
  dependency
- **[Story]**: Maps to User Story 1, 2, or 3 from [spec.md](./spec.md)
- Every task names an exact file path

## Path Conventions

- `src/heatmap-utils.js`: pure probe-mapping, corridor true-path assembly logic
- `__tests__/heatmap-utils.test.js`: Jest tests in the Node environment
- `index.html`: existing Leaflet/Canvas `RouteCanvasLayer`

## Phase 1: Setup

**Purpose**: Record the current baseline before changing established heatmap rendering behavior.

- [X] T001 Run `npm test -- --runTestsByPath __tests__/heatmap-utils.test.js __tests__/index-script-syntax.test.js` from the repository root and record any pre-existing failures before editing `src/heatmap-utils.js` or `index.html`

---

## Phase 2: Foundational (Blocking Prerequisites)

No foundational tasks are required. User Story 1 below is the single source of new
production code; User Stories 2 and 3 build directly on its output rather than on a shared
prerequisite of their own.

---

## Phase 3: User Story 1 - Routes look like the real path at any zoom level (Priority: P1) MVP

**Goal**: Each full-detail corridor draws its creating activity's actual recorded (simplified)
point sub-sequence for its matching window, as one connected polyline, instead of a straight
two-point chord.

**Independent Test**: Zoom into a curving section of a previously imported route at
street-level zoom; verify the drawn line follows the curve continuously instead of showing
short straight facets meeting at visible angles.

### Tests for User Story 1

> Write these tests first and confirm they fail before implementation.

- [X] T002 [US1] Write failing tests in `__tests__/heatmap-utils.test.js` for an opt-in enrichment of `interpolateTrackProbes(points, spacingMeters, { includeTrueIndices: true })`: it MUST return `{ probes, trueIndices }` where `trueIndices` is the same length as `probes` and `trueIndices[i]` is the index into the input `points` array of the original point that began the segment probe `i` was interpolated from; `trueIndices` MUST be non-decreasing; calling the function without the third argument (as today) MUST still return the plain `probes` array unchanged, per the existing test at `__tests__/heatmap-utils.test.js` line 65
- [X] T003 [US1] Write failing tests in `__tests__/heatmap-utils.test.js` for `buildRouteSegments()` attaching a `truePathPoints` field (`Array<[number, number]>`, length ≥ 2) to every newly created corridor: it MUST contain only points present in the creating activity's `points` array (no interpolation/fabrication, per data-model.md), MUST fall back to a 2-point copy of `coords` when the true-point-index slice cannot resolve to at least 2 points, MUST NOT be altered when a later activity only matches (contributes count to) an existing corridor, and existing corridor `count`/`activityIds`/matching/deterministic-order tests MUST continue to pass unchanged

### Implementation for User Story 1

- [X] T004 [US1] Implement the `includeTrueIndices` enrichment in `interpolateTrackProbes()` in `src/heatmap-utils.js`: track, for each interpolated probe, the index of the point that began its source segment; return `{ probes, trueIndices }` only when `options.includeTrueIndices` is truthy, otherwise preserve today's plain-array return exactly; make T002 pass
- [X] T005 [US1] In `buildRouteSegments()` in `src/heatmap-utils.js`, call `interpolateTrackProbes()` with `{ includeTrueIndices: true }`, and when creating a new corridor (not when matching an existing one), slice the creating activity's `track.points` from `trueIndices[index]` to `trueIndices[index + activityContinuitySteps]` inclusive, map each to a plain `[lat, lon]` pair, and store it as the new corridor's `truePathPoints` field (falling back to a 2-point copy of `coords` if the slice has fewer than 2 points); make T003 pass without changing existing `count`/`activityIds`/`coords`/`heading` behavior
- [X] T006 [US1] In `index.html`'s `RouteCanvasLayer._draw()`, for the full-detail (above low-zoom-threshold) branch only, draw each visible segment using `segment.truePathPoints` (falling back to `segment.coords` when absent or shorter than 2 points, e.g. for the small demo/preview segments built elsewhere in `index.html`) as one connected polyline via a single `moveTo`/`lineTo` chain sharing that segment's one color/weight/opacity, and push one `screenEntries` item per drawn true-path edge (consecutive point pair) tagged with the same `segment`/`key`/`lineWidth` so hit-testing keeps resolving to the correct corridor; leave the low-zoom aggregate branch (which still uses `coords` via `buildLowZoomRouteSegments()`) unchanged
- [X] T007 [US1] Run the focused Jest suite and complete quickstart.md section 3 (true-path curve continuity) against a local export containing a visibly curving route; confirm FR-001, FR-002, FR-010, SC-001, and SC-005 — automated Jest portion verified; manual browser validation against a real local export is left to the user (personal data must stay local per constitution)

**Checkpoint**: User Story 1 independently fixes the reported "short small linear pieces" defect.

---

## Phase 4: User Story 2 - Frequency coloring still applies to the true path (Priority: P1)

**Goal**: Confirm visit-frequency coloring, corridor identity, and existing hover/tooltip
resolution remain correct once a corridor's rendered shape is a multi-point true path instead
of a two-point chord.

**Independent Test**: Compare a frequently traveled curving road against a nearby
once-traveled curving road; verify both are colored correctly along their whole visible
curved length, and hovering anywhere along either resolves the correct tooltip.

### Tests for User Story 2

> Write these tests first and confirm they fail before implementation (they are expected to
> already pass once T004/T005 are correct; a failure here indicates a gap in User Story 1).

- [X] T008 [US2] Write failing tests in `__tests__/heatmap-utils.test.js` confirming a corridor with a multi-point `truePathPoints` array still exposes exactly one `count` and one `key` for its entire true path (color/style derivation via `computeRouteSegmentColor()`/`computeRouteSegmentStyle()` is unaffected by how many points `truePathPoints` contains), and that two tracks sharing part of a route (per the existing corridor-matching fixtures) still produce a shared corridor with the combined `count` and both an unaffected `coords` chord and a populated `truePathPoints` array

### Implementation for User Story 2

- [X] T009 [US2] If T008 reveals any gap, adjust `buildRouteSegments()` in `src/heatmap-utils.js` so a corridor's `count`/`key`/color derivation remains entirely independent of `truePathPoints` length; otherwise this task confirms no source change is needed and records that in the commit/PR description — T008 passed against the T005 implementation without further changes, confirming no gap exists
- [X] T010 [US2] Run the focused Jest suite and complete quickstart.md section 4 (frequency coloring correctness) and section 5 step 1 (tooltip resolution) against a local export with a shared frequent/rare road pair; confirm FR-003, FR-004, FR-008, SC-002, and SC-003 — automated Jest portion verified; manual browser validation is left to the user (personal data must stay local per constitution)

**Checkpoint**: User Story 2 confirms the true-path change did not regress frequency
communication or existing hover/tooltip behavior.

---

## Phase 5: User Story 3 - No regression to matching, aggregation, or performance (Priority: P2)

**Goal**: Confirm every other existing heatmap guarantee (matching, low-zoom aggregation,
frequency-on-top draw order, fixed single-channel style, large-dataset performance) still
holds unchanged.

**Independent Test**: Re-run the existing heatmap validation flows against the new true-path
rendering and confirm all prior guarantees still hold.

### Verification for User Story 3

- [X] T011 [US3] Run the full existing `__tests__/heatmap-utils.test.js` and `__tests__/zip-importer.test.js` suites and confirm every pre-existing test (matching tolerance, low-zoom aggregation, draw-order sort, fixed-style constants, screen-hit testing) still passes unchanged; confirm FR-005, FR-006, FR-007, and SC-003 — 85/85 tests passing, no regression
- [X] T012 [US3] Run quickstart.md section 6 (performance) manually with a large imported dataset at or near the `specs/002-heatmap-performance-scale` baseline; confirm FR-009 and SC-004 — manual browser validation with a real large local export is left to the user (personal data must stay local per constitution)

**Checkpoint**: User Story 3 confirms this feature is a pure rendering improvement with no
regression to matching, aggregation, draw-order, style, or performance.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final full-suite validation and documentation alignment.

- [X] T013 [P] Check `docs/IMPORT_FEATURE.md` and `README.md` for any description of corridor rendering as straight chords; update only if such wording exists (as of this writing neither file describes the internal chord/true-path rendering mechanism, consistent with `specs/005-heatmap-rendering-quality`'s T014 finding) — verified no edit needed
- [X] T014 Run the full root suite (`npm test`) and complete quickstart.md end-to-end (sections 1–6); confirm SC-001 through SC-005 and no regression to `specs/001`–`005` behavior — automated portion (`npm test`, 273/273 passing) verified; manual browser validation (sections 2–6) against a real local export is left to the user

---

## Dependencies & Execution Order

- **Setup (Phase 1)** has no dependencies; run it first.
- **Foundational (Phase 2)**: none — proceed directly to User Story 1 after Setup.
- **User Story 1 (Phase 3)** is the MVP and must be completed first; it is the only phase that
  introduces new production code (`truePathPoints`, the enriched probe mapping, and the
  Canvas draw-loop change).
- **User Story 2 (Phase 4)** depends on User Story 1 being complete (it verifies behavior on
  top of the data User Story 1 produces); it introduces new production code only if
  verification uncovers a gap.
- **User Story 3 (Phase 5)** depends on User Story 1 (and ideally User Story 2) being complete;
  it is verification-only and touches no production code.
- **Polish (Phase 6)** depends on all user stories being complete.

## Parallel Execution Examples

- T002 and T003 (both in `__tests__/heatmap-utils.test.js`) touch the same file — write them
  sequentially within User Story 1 rather than in parallel, to avoid a merge conflict.
- T013 (documentation check) has no dependency on the other Polish task and can run in
  parallel with the final T014 full-suite run being prepared.

## Implementation Strategy

**MVP first**: Implement Phase 3 (User Story 1) alone as the MVP — it directly fixes the
reported "short small linear pieces" defect by drawing each corridor's true recorded shape
instead of a straight chord. Phases 4 and 5 are verification passes that confirm nothing else
broke; they add confidence but do not, by themselves, change what the athlete sees.
