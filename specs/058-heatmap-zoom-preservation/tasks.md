# Tasks: Heatmap Zoom Preservation on Sport Filter Changes

**Input**: Design documents from `specs/058-heatmap-zoom-preservation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Focused regression tests are included as required by the implementation plan and the project's dashboard test-verification principle.

**Organization**: Tasks are grouped by the two prioritized user stories. Each story's behavior is covered by its own acceptance-focused test cases.

## Phase 1: Setup

**Purpose**: Project initialization and basic structure

No setup tasks are needed. This change uses the existing static browser application, Jest configuration, and Leaflet dependency.

---

## Phase 2: Foundational

**Purpose**: Shared prerequisites blocking user-story implementation

No foundational tasks are needed; existing dashboard state, map initialization, and route canvas layer are reused.

---

## Phase 3: User Story 1 - Keep the current map view while filtering (Priority: P1) 🎯 MVP

**Goal**: Sport-filter and same-dataset heatmap renders update the route display without changing the current center or zoom, while the first non-empty render for each imported dataset retains its initial bounds fit.

**Independent Test**: With a Leaflet map at a chosen center/zoom, render routes initially, then trigger All/Run/Bike/Swim filter changes and reopen the Heatmap view. Confirm that routes/legend match the active filter and that no same-dataset rerender calls `fitBounds()` or changes center/zoom; confirm a different dataset gets one initial fit.

### Tests for User Story 1

- [X] T001 [US1] Add Leaflet-stub regression cases asserting the initial route fit is consumed once, same-dataset filter and Heatmap tab re-renders refresh routes/legend without changing center/zoom or fitting again, and a replacement dataset receives one initial fit in `__tests__/dashboard-heatmap.test.js`.

### Implementation for User Story 1

- [X] T002 [US1] Track the last observed imported dataset identity and whether its first usable route-bounds fit is pending in `src/dashboard-heatmap.js`, reusing the existing imported dataset state from `src/dashboard-state.js`.
- [X] T003 [US1] Call the real-map `fitBounds()` only when the current dataset has valid route bounds and an initial fit is pending; after that fit succeeds, mark it consumed while continuing to refresh filtered route segments and the frequency legend in `src/dashboard-heatmap.js`.

**Checkpoint**: User Story 1 passes independently: initial route framing remains, but filter changes and same-dataset tab renders preserve the current map view; replacing the dataset enables one new initial fit.

---

## Phase 4: User Story 2 - Preserve the view when a filter has no routes (Priority: P2)

**Goal**: Keep the existing empty state and current map view through an empty sport result, then show routes for a populated filter at the retained view without a pan caused by showing or resizing the map; do not consume a new dataset's pending initial fit until usable route bounds exist.

**Independent Test**: After an initial view is established, select an empty sport and then a populated sport; verify empty-state display followed by the correct routes without center/zoom changes, including during map-size invalidation. Also verify that an empty filter encountered before a new dataset's first usable route does not consume that dataset's initial fit.

### Tests for User Story 2

- [X] T004 [US2] Add empty-to-populated filter transition cases asserting the existing view remains unchanged through map hide/show and size invalidation, and a replacement dataset's initial fit remains pending until valid bounds are available, in `__tests__/dashboard-heatmap.test.js`.

### Implementation for User Story 2

- [X] T005 [US2] Keep the Leaflet map instance and pending-fit eligibility across the no-route early return, and invalidate the map's size after showing it without panning the retained viewport in `src/dashboard-heatmap.js`.

**Checkpoint**: User Story 2 passes independently for both already-fitted and not-yet-fitted dataset states, with the existing empty-state and legend behavior intact.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validate regression coverage and the actual browser behavior

- [X] T006 Run the focused Jest suites and the full root suite specified in `specs/058-heatmap-zoom-preservation/quickstart.md`, and complete its browser smoke checks for filters, tab revisit, empty results, and dataset replacement.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; existing project setup is reused.
- **Foundational (Phase 2)**: No tasks; existing map and dashboard state provide the prerequisites.
- **User Stories (Phase 3+)**: US1 is the MVP and must complete before US2 because the latter exercises the same initial-fit lifecycle for empty results. Tasks within each story execute in listed order: test, then implementation.
- **Polish (Phase 5)**: Depends on both stories completing.

### User Story Dependencies

- **User Story 1 (P1)**: No feature dependency; implements same-dataset viewport preservation and replacement-dataset initial fitting.
- **User Story 2 (P2)**: Depends on US1's fit-pending state so empty-result transitions can verify the initial-fit lifecycle.

### Parallel Opportunities

- No implementation tasks are marked `[P]`: the regression cases and renderer changes share the same test and dashboard files and are ordered test-before-implementation.
- After both stories are implemented, the focused test execution and manual browser smoke scenarios in T006 validate separate surfaces but are grouped as one completion gate.

---

## Parallel Example: User Story 1

There are no safe parallel implementation tasks for this story because its test and behavior changes are coupled to the same dashboard render lifecycle. Complete T001, then T002 and T003 in order.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Add the US1 dashboard regression cases in T001.
2. Implement dataset-fit lifecycle tracking and guarded initial fitting in T002-T003.
3. Stop and validate US1 independently using the focused suite in `quickstart.md`.

### Incremental Delivery

1. Complete US1 to preserve the map view for populated sport-filter changes and same-dataset rerenders.
2. Complete US2 to cover empty-filter transitions and delayed initial fit for newly imported datasets.
3. Complete T006 for focused/root Jest regression checks and browser smoke validation.

---

## Notes

- Every task uses the required checkbox, sequential ID, optional parallel marker, story label where applicable, and an exact repository file path.
- Do not add dependencies or alter filter controls; retain the current route update, legend, empty state, and static browser script architecture.
- Use synthetic data in automated tests; do not add personal activity exports to the repository.
