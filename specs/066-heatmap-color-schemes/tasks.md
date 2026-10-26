# Tasks: Heatmap Color Schemes

**Input**: Design documents from `specs/066-heatmap-color-schemes/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/heatmap-color-scheme-ui.md`, and `quickstart.md`

**Tests**: Focused test tasks are included because the project constitution requires
narrow-scope validation for dashboard behavior and reusable visualization utilities.

**Organization**: Tasks are grouped by the two prioritized user stories in `spec.md`.

## Phase 1: Setup

**Purpose**: No project initialization is required. The feature uses the existing static
browser application, Leaflet integration, Jest setup, and dependencies described in
`specs/066-heatmap-color-schemes/plan.md`.

## Phase 2: Foundational

**Purpose**: No shared infrastructure or data-schema change blocks the user stories. The
existing heatmap utility, dashboard script, toolbar, and export flow are the foundation.

## Phase 3: User Story 1 - Choose a Heatmap Color Scheme (Priority: P1)

**Goal**: Let athletes choose among four ordered route-frequency color schemes while
preserving frequency calculations, sport filtering, legend meaning, and export context.

**Independent Test**: With routes at several visit frequencies, select each scheme and
verify the selector value, ordered route colors, matching frequency guide, and retained
selection after changing sport. Blue to Red remains the default.

### Tests for User Story 1

- [X] T001 [P] [US1] Add palette tests for all four ordered ramps, the Blue to Red default, and invalid-scheme fallback in `__tests__/heatmap-utils.test.js`
- [X] T002 [P] [US1] Add dashboard tests for scheme selection, scheme retention through sport changes, and updated route colors in `__tests__/dashboard-heatmap.test.js`
- [X] T003 [P] [US1] Add markup and keyboard-filter assertions for the four-choice Color scheme selector in `__tests__/index-script-syntax.test.js`
- [X] T004 [P] [US1] Add export-summary and Black + Fire clone-capture assertions for the active scheme in `__tests__/dashboard-export-download.test.js`

### Implementation for User Story 1

- [X] T005 [P] [US1] Extend `computeRouteSegmentColor` with a backward-compatible scheme option and ordered ramps for `blue-red`, `yellow-red`, `blue`, and `black-fire` in `src/heatmap-utils.js`; preserve the current Blue to Red output and invalid-input fallback
- [X] T006 [US1] Update `buildFrequencyScaleGuide` in `src/heatmap-utils.js` to use the active scheme's gradient, constant-value swatch, and matching accessible low-to-high description
- [X] T007 [P] [US1] Add the labelled `Color scheme` selector with exactly `Blue to Red`, `Yellow to Red`, `Blue`, and `Black + Fire` options, defaulting to `Blue to Red`, in `index.html`
- [X] T008 [US1] Add session-scoped scheme state and `setHeatmapColorScheme` handling in `src/dashboard-heatmap.js`; retain the choice through sport changes, expose and apply it through the Heatmap keyboard-filter adapter, and pass it to route rendering and the frequency guide
- [X] T009 [P] [US1] Add the active scheme to the Heatmap control summary and export context in `src/dashboard-export.js`

**Checkpoint**: All four options render ordered colors; switching schemes and sports updates
the routes and guide together; keyboard selection and export metadata identify the active
scheme.

## Phase 4: User Story 2 - Use a Dark Fire-Style Map (Priority: P2)

**Goal**: Make Black + Fire darken the existing map tiles without darkening route colors,
the guide, tooltip, or controls; restore the standard tile appearance for other schemes.

**Independent Test**: Select Black + Fire on a populated heatmap and verify that only the
map tiles darken, route colors remain legible, and selecting another scheme restores the
standard map. Confirm the exported PNG preview reflects the active appearance.

### Tests for User Story 2

- [X] T010 [US2] Add map-layer tests for darkening only the tile layer and restoring the standard appearance on other schemes in `__tests__/dashboard-heatmap.test.js`

### Implementation for User Story 2

- [X] T011 [US2] Apply a reversible dark visual treatment only to the existing OSM tile layer for `black-fire` and restore its standard appearance for other schemes in `src/dashboard-heatmap.js`; leave route canvas, guide, tooltip, and controls outside the treatment

**Checkpoint**: Black + Fire has a dark map with a contrasting fire route ramp; other
schemes use the standard map; route interaction and map navigation remain unchanged.

## Phase 5: Polish & Cross-Cutting Validation

**Purpose**: Validate the complete feature across supported filters and the existing local
image-preview/download flow.

- [X] T012 Run the focused Jest command and complete all four-scheme browser/export scenarios in `specs/066-heatmap-color-schemes/quickstart.md`; verify the exported PNG contains the selected map and route appearance

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No setup tasks; the existing project environment is used.
- **Foundational (Phase 2)**: No additional foundational tasks are required.
- **User Story 1 (Phase 3)**: Can begin immediately; its four test tasks are independent.
- **User Story 2 (Phase 4)**: Depends on the scheme state and selector from US1, especially
  T007 and T008.
- **Polish (Phase 5)**: Depends on US1 and US2 implementation being complete.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other stories.
- **User Story 2 (P2)**: Depends on US1's active scheme selection and render state; its tile
  treatment is independently testable once those exist.

### Within Each User Story

- Add the focused tests before implementing their behavior.
- T001-T004 can run in parallel because they edit separate test files.
- After T001-T004, T005 and T007 can run in parallel because they edit separate files.
- T006 follows T005 because it extends the same utility module.
- T008 follows T005, T006, and T007 because it consumes the utility palette and selector;
  T009 follows T007 and can be developed independently of the map tile treatment.
- T010 follows US1 because it exercises the new scheme selection; T011 follows T010.
- Run final browser export validation after both stories are implemented.

### Parallel Opportunities

- **US1 tests**: T001, T002, T003, and T004 can be assigned independently.
- **US1 initial implementation**: T005 and T007 can proceed in parallel after the tests
  are in place; T009 can proceed after T007 once the selector ID is established.
- **US2**: No parallel implementation task is defined because the test and tile styling
  touch the same dashboard map lifecycle and must preserve their order.

## Parallel Example: User Story 1

```text
Task: T001 in __tests__/heatmap-utils.test.js
Task: T002 in __tests__/dashboard-heatmap.test.js
Task: T003 in __tests__/index-script-syntax.test.js
Task: T004 in __tests__/dashboard-export-download.test.js
```

## Implementation Strategy

### MVP Scope

Complete US1 and US2 for a spec-complete MVP. US1 alone provides the selector and route
palettes, but Black + Fire is not complete until US2 adds the dark map presentation.

### Incremental Delivery

1. Add and validate US1: all four route color ramps, selection state, guide, sport retention,
   keyboard support, and export context.
2. Add and validate US2: tile-only dark treatment for Black + Fire and restoration for the
   other schemes.
3. Run T012, including real-browser image capture because Jest does not validate external
   tile CORS or CSS-filter rendering in the final PNG.

## Notes

- `[P]` tasks touch separate files and have no dependency on incomplete tasks.
- Every task has a sequential ID, a story label in story phases, and an explicit file path.
- No external API contract, new map provider, persistence layer, or new visualization tab is
  part of this feature.