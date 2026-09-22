---

description: "Task list template for feature implementation"
---

# Tasks: Power PB Chart Improvements

**Input**: Design documents from `/specs/017-power-pb-chart-improvements/`

**Prerequisites**: [plan.md](../plan.md) (required), [spec.md](../spec.md) (required for user stories), [research.md](../research.md), [data-model.md](../data-model.md), [contracts/power-pb-chart-ui.md](../contracts/power-pb-chart-ui.md)

**Tests**: Included. The existing suite already asserts inline-script contract details for this Watt section (`__tests__/index-script-syntax.test.js`) and unit-tests `src/power-pb-utils.js` (`__tests__/power-pb-utils.test.js`); this feature extends both per the repo's Narrowest-Scope Test-First Verification principle.

**Organization**: Tasks are grouped by user story (from [spec.md](../spec.md)) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single static-browser project (existing layout, no build step):

- `src/power-pb-utils.js` — reusable power PB helpers (CommonJS + `window.*` bridge)
- `index.html` — `renderBikePowerSection()` and shared PB chart helpers (inline `<script>`)
- `__tests__/power-pb-utils.test.js`, `__tests__/index-script-syntax.test.js`

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before making changes.

- [X] T001 Run `npm test -- power-pb-utils index-script-syntax` from the repo root to confirm the current suite passes before any edit (baseline for this feature).

**Checkpoint**: Baseline green; safe to start story work.

## Phase 2: Foundational

**Purpose**: Shared blocking prerequisites for all user stories.

No shared blocking prerequisites are required: User Stories 1-3 add small, independent pieces to the same existing `renderBikePowerSection()` profile block in `index.html`, and User Story 4 is additive to the existing duration-tile loop in the same function. Each story's helper functions (if any) are introduced within that story's own phase below. Proceed directly to Phase 3.

## Phase 3: User Story 1 - Inspect all-time power profile points on hover (Priority: P1) 🎯 MVP

**Goal**: Hovering a point on the all-time power profile shows a tooltip with duration, watts, date, and activity name; moving off hides it.

**Independent Test**: Load Bike data with ≥2 duration-specific power PBs, open Personal Bests, hover a profile point, and verify the tooltip content and its hide-on-mouseleave behavior.

### Tests for User Story 1

- [X] T002 [P] [US1] Add an assertion to `__tests__/index-script-syntax.test.js` (new `it` in the existing `describe('index.html inline script syntax', ...)` block) that the all-time profile rendering in `index.html` wires `showPowerPbTooltip` to a per-point hover handler (e.g. assert `inlineCode` contains a profile-point hit-area calling `showPowerPbTooltip` and `movePbTooltip`/`hidePbTooltip`, distinct from the existing duration-tile detail wiring).

### Implementation for User Story 1

- [X] T003 [US1] In `index.html`, inside the all-time profile block of `renderBikePowerSection()` (the `profilePoints.forEach(...)` loop that currently only draws a `circle` + `label`), add a transparent SVG hit-area per point (matching the hit-area pattern already used in the duration-tile progression rendering around line 4714) and wire `mouseenter`/`mousemove`/`mouseleave` to call `showPowerPbTooltip(e, { date: point.record.date, watts: point.watts, name: point.record.title, targetSeconds: point.durationSeconds }, 1, 1, color, point.durationLabel)`, `movePbTooltip(e)`, and `hidePbTooltip()` respectively.
- [X] T004 [US1] Run `npm test -- power-pb-utils index-script-syntax` and fix any failures introduced by T002/T003.

**Checkpoint**: User Story 1 is independently functional — hovering any profile point shows/hides the shared PB tooltip correctly.

---

## Phase 4: User Story 2 - Read exact watt range from the profile's y-axis (Priority: P1)

**Goal**: The profile's y-axis shows the exact highest and lowest plotted watt values instead of a fixed zero baseline.

**Independent Test**: Load Bike data with duration PBs of clearly different watt values, open Personal Bests, and verify the y-axis labels match the highest and lowest plotted points (a single label when values are equal).

### Tests for User Story 2

- [X] T005 [P] [US2] Add a test in `__tests__/power-pb-utils.test.js` for a new exported helper `getPowerProfileWattRange(points)`: given points with watts `[900, 600, 300]` it returns `{ min: 300, max: 900 }`; given a single point or points that all share one watt value it returns `{ min: value, max: value }`; given `[]` it returns `{ min: null, max: null }`.

### Implementation for User Story 2

- [X] T006 [US2] In `src/power-pb-utils.js`, add and export `getPowerProfileWattRange(points)` — a pure function returning `{ min, max }` of `points[].watts` (or `{ min: null, max: null }` for an empty/invalid array) — added to both the `module.exports` object and the `window.powerPbUtils` bridge alongside the existing exports, per data-model.md's "All-Time Power Profile (extended)".
- [X] T007 [US2] In `index.html`, inside `renderBikePowerSection()`'s profile block, replace the current `maxWatts` computation and unlabeled y-axis with: call `window.powerPbUtils.getPowerProfileWattRange(profilePoints)`, then render two `appendYAxisLabel`-style text labels (or the existing inline label pattern used elsewhere in this chart) — one at the top showing `Math.round(range.max) + ' W'` positioned at the highest point's height, one at the bottom showing `Math.round(range.min) + ' W'` positioned at the lowest point's height — skipping the duplicate bottom label when `range.min === range.max`.
- [X] T008 [US2] Run `npm test -- power-pb-utils index-script-syntax` and fix any failures introduced by T005/T006/T007.

**Checkpoint**: User Story 2 is independently functional — the y-axis always shows the real highest (and, when different, lowest) plotted watt value.

---

## Phase 5: User Story 3 - Read duration labels on the x-axis without overlap (Priority: P2)

**Goal**: Only the shortest available duration and durations ≥ 5 minutes show an x-axis label; all points and the connecting line remain plotted regardless.

**Independent Test**: Load Bike data with qualifying PBs across all supported durations, open Personal Bests, and verify only the shortest duration and durations ≥5 min show x-axis text, while other short-duration points/line remain visible and hoverable.

### Tests for User Story 3

- [X] T009 [P] [US3] Add a test in `__tests__/power-pb-utils.test.js` for a new exported helper `markPowerProfileLabelVisibility(points)`: given points for `5s, 30s, 1m, 2m, 5m, 10m, 20m, 60m` it marks `showLabel: true` only for `5s` (shortest) and every point with `durationSeconds >= 300` (`5m,10m,20m,60m`), and `showLabel: false` for `30s, 1m, 2m`; given only long-duration points it marks all `showLabel: true`; given a single point it marks `showLabel: true`.

### Implementation for User Story 3

- [X] T010 [US3] In `src/power-pb-utils.js`, add and export `markPowerProfileLabelVisibility(points)` — a pure function that returns a new array of points (sorted as received) with an added `showLabel` boolean: `true` for the point with the smallest `durationSeconds` and for any point with `durationSeconds >= 300`, `false` otherwise — added to both `module.exports` and `window.powerPbUtils`, per data-model.md's "All-Time Power Profile Point (extended)".
- [X] T011 [US3] In `index.html`, inside `renderBikePowerSection()`'s profile block, call `window.powerPbUtils.markPowerProfileLabelVisibility(profilePoints)` and only append each point's duration `<text>` label when that point's `showLabel` is `true`; keep the `circle` (and the hit-area from T003) rendered for every point regardless of `showLabel`.
- [X] T012 [US3] Run `npm test -- power-pb-utils index-script-syntax` and fix any failures introduced by T009/T010/T011.

**Checkpoint**: User Story 3 is independently functional — x-axis labels are thinned per the 5-minute rule while every point/line stays plotted and hoverable.

---

## Phase 6: User Story 4 - See each duration's PB history over time (Priority: P1)

**Goal**: Each Bike power duration tile (e.g. 5s, 20m) renders an inline time-series chart of that duration's PB history — same axes/trend-line/current-best callout/tooltip pattern as the other Personal Bests tiles — instead of a static "Current best" summary.

**Independent Test**: Load Bike data with ≥2 power PBs on different dates for one duration, open Personal Bests, and verify that duration's tile shows a mini chart (axes, trend line, current-best callout, hover tooltip) matching the visual pattern of tiles like Longest/Elevation; verify a duration with exactly one PB still uses the chart layout (single marker); verify the maximize/full-screen detail button still works.

### Tests for User Story 4

- [X] T013 [P] [US4] Add an assertion to `__tests__/index-script-syntax.test.js` that a duration tile with power PBs renders via the shared timeline-chart helpers rather than the old static summary (e.g. assert `inlineCode` contains a duration-tile chart function that calls `appendTimelineAxes` and `appendCurrentBest` from within the `PB_BIKE_POWER_DURATIONS.forEach` rendering path, and no longer contains the old `'Current best'` static label markup for Bike power tiles).

### Implementation for User Story 4

- [X] T014 [US4] In `index.html`, add a new function `renderPowerDurationTileChart(block, allPbs, color)` (placed near `renderRecordCard`) that, given the duration's chronological successive-best records (`allPbs`, already computed in the `PB_BIKE_POWER_DURATIONS.forEach` loop), builds an inline SVG using the existing shared helpers `appendTimelineAxes`, `appendYAxisLabel`, `appendCurrentBest`, and the shared `tToX`/`X_AXIS_Y`/`CHART_TOP` constants — plotting watts on the y-axis and each PB's `date` on the x-axis — mirroring `renderRecordCard`'s structure (trend line/points, latest-point `appendCurrentBest` callout, and per-point hit-areas wired to `showPowerPbTooltip`/`movePbTooltip`/`hidePbTooltip`).
- [X] T015 [US4] In `index.html`, inside the `PB_BIKE_POWER_DURATIONS.forEach` loop in `renderBikePowerSection()`, replace the current static `valueRow`/`history` paragraph block with a call to `renderPowerDurationTileChart(block, allPbs, color)`, ensuring it renders correctly for both a single-PB duration (single marker, no trend line) and a multi-PB duration (full trend line), while leaving the `appendPbDetailButton` (maximize) wiring in the tile header unchanged.
- [X] T016 [US4] Run `npm test -- power-pb-utils index-script-syntax` and fix any failures introduced by T013/T014/T015.

**Checkpoint**: User Story 4 is independently functional — every rendered duration tile shows the same chart pattern as other PB tiles, and the full-screen detail button still works.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories together.

- [X] T017 Run the complete root suite `npm test` and resolve any regressions across all Bike/Run/Swim Personal Bests tests.
- [ ] T018 Manually validate all four stories together in the browser per [quickstart.md](../quickstart.md) (`python -m http.server`, import synthetic data, exercise tooltip, y-axis, x-axis thinning, duration-tile charts, and the maximize button).

## Dependencies & Execution Order

- **Setup (Phase 1)** → no dependencies; run first.
- **Foundational (Phase 2)**: none — skip directly to story phases.
- **User Stories (Phases 3-6)**: All four stories only add to the existing `renderBikePowerSection()` in `index.html` plus (for US2/US3) new pure helpers in `src/power-pb-utils.js`. They touch different sub-blocks of the same function (profile block for US1-3, duration-tile loop for US4) and different/no shared new helpers, so they are independently implementable and testable; sequence T003 (US1's hit-area) before T007/T011 (US2/US3 reuse the same point-loop structure) is recommended but not required since each edits distinct concerns (tooltip wiring vs. axis labels vs. label visibility) within the same loop body — implement and test one story fully before starting the next to avoid merge conflicts in the same function.
- **Polish (Phase 7)**: after all desired stories are complete.

## Parallel Execution Examples

- T002 (US1 test) and T005/T009 (US2/US3 tests) touch different files/describe blocks and can be authored in parallel with each other, but each story's implementation tasks (T003, T006-T007, T010-T011, T014-T015) edit the same `renderBikePowerSection()` function in `index.html` and should be applied sequentially, one story at a time, to avoid overlapping edits.
- T013 (US4 test) and T014 (US4 new tile-chart function) can be prepared in parallel with US1-3 work since User Story 4 touches a different sub-block (the duration-tile loop) and a new standalone function, not the profile block.

## Implementation Strategy

**MVP first**: Implement User Story 1 (tooltip) alone, verify via its independent test, and ship — it is the smallest, most requested, highest-value fix.

**Incremental delivery**: US1 → US2 (y-axis range) → US3 (x-axis thinning) → US4 (duration-tile charts). Each story phase ends with its own checkpoint and can be verified/demoed independently before moving to the next, per the spec's priority order (P1, P1, P2, P1 — US4 is prioritized after US1-3 here because it is the largest single change and least likely to be blocked by the smaller profile-chart fixes).
