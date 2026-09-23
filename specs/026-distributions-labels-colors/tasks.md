---

description: "Task list for Distribution Labels and Color Schemes"
---

# Tasks: Distribution Labels and Color Schemes

**Input**: Design documents from `/specs/026-distributions-labels-colors/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/distributions-ui.md](contracts/distributions-ui.md), [quickstart.md](quickstart.md)

**Organization**: Tasks are grouped by user story so each increment can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing static-browser surfaces and test entry points before implementation.

- [X] T001 Review the Distributions implementation boundaries and existing Chart.js legend/color patterns in `src/dashboard-distributions.js`, `src/distribution-utils.js`, `index.html`, and `src/dashboard-core.js` against [plan.md](plan.md) and [contracts/distributions-ui.md](contracts/distributions-ui.md)
- [X] T002 [P] Confirm the focused Jest commands and static-server manual checks documented in `specs/026-distributions-labels-colors/quickstart.md` are available from the repository root `package.json`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared palette and rendering-state seams required by all user stories.

- [X] T003 Add session-scoped Distributions color-scheme state with default `fire` and a `setDistributionsColorScheme` handler in `src/dashboard-distributions.js`, preserving the existing metric, sport, mode, and date-range state
- [X] T004 [P] Add the reusable palette interface and monochrome-blue color stops to `src/distribution-utils.js`, preserving the existing `getFireGradientColor` output and both CommonJS and `window.distributionUtils` exports
- [X] T005 Add the color-scheme selector markup with exactly `On fire` and `Monochrome blue` options to `index.html`, defaulting to `On fire` and dispatching changes to `setDistributionsColorScheme`
- [X] T006 Add foundational inline-script assertions for color-scheme state, selector options, and palette routing in `__tests__/index-script-syntax.test.js`

**Checkpoint**: Shared color selection and palette APIs exist; user-story work can proceed in priority order.

## Phase 3: User Story 1 - Read Legends and Labels at a Glance (Priority: P1) 🎯 MVP

**Goal**: Make every supported distribution chart self-explanatory through filled-point legends, explicit axis units, readable Duration labels, unit-free Pace labels, and whole-number Bike Pace labels.

**Independent Test**: Open each metric in Histogram and Line mode for each single sport, inspect the legend marker and x-axis title/ticks, and confirm Duration, Pace, and Bike labels follow [contracts/distributions-ui.md](contracts/distributions-ui.md).

### Tests for User Story 1

- [X] T007 [P] [US1] Add utility tests for metric axis-label metadata, hours-and-minutes Duration formatting, unit-free Pace labels, and whole-number Bike Pace formatting in `__tests__/distribution-utils.test.js`
- [X] T008 [P] [US1] Add inline-script contract tests for filled circular legend configuration and metric-specific axis titles in `__tests__/index-script-syntax.test.js`

### Implementation for User Story 1

- [X] T009 [US1] Extend metric display metadata and reusable value-formatting helpers in `src/distribution-utils.js` so Duration uses whole hours/minutes, Bike Pace omits unnecessary decimals, and Pace bucket labels omit repeated units without changing numeric values
- [X] T010 [US1] Add metric-specific axis titles and mixed-unit All Sports Pace wording to the chart configuration in `src/dashboard-distributions.js`, including `Length (km)`, `Elevation gain (m)`, `Power (W)`, and the sport-specific Pace titles
- [X] T011 [US1] Add numeric x-axis tick formatting in `src/dashboard-distributions.js` that maps line-chart bucket positions to readable display labels, including hours/minutes, unit-free Pace labels, whole-number Bike Pace values, and the existing open-ended bucket text
- [X] T012 [US1] Configure the Distributions Chart.js legend in `src/dashboard-distributions.js` with filled circular point markers using `labels.usePointStyle` and `labels.pointStyle: 'circle'`, without changing series labels
- [X] T013 [US1] Route all Distributions bars and line points through the active palette interface in `src/dashboard-distributions.js` while preserving bucket counts, sport series identity, and the default fire colors

**Checkpoint**: User Story 1 is independently usable and verifiable with the focused utility and inline-script tests plus manual chart inspection.

## Phase 4: User Story 2 - Understand All Sports and Unavailable Distributions (Priority: P1)

**Goal**: Make unsupported combined histograms and empty data explicit while retaining useful All Sports line comparisons and the `50+` Length overflow label.

**Independent Test**: Select All Sports, switch between Line and Histogram for every metric, then select individual sports and no-data combinations; verify `N/A`, no stale chart, and the requested Length category.

### Tests for User Story 2

- [X] T014 [P] [US2] Add utility tests for Length overflow display as `50+` only when the existing open-ended category is present, without adding empty categories to shorter datasets, in `__tests__/distribution-utils.test.js`
- [X] T015 [P] [US2] Add inline-script contract tests for the All Sports + Histogram early N/A guard, stale-chart cleanup, and explicit N/A count/message handling in `__tests__/index-script-syntax.test.js`

### Implementation for User Story 2

- [X] T016 [US2] Update Length overflow display formatting in `src/distribution-utils.js` so the existing open-ended category can render as `50+` for the All Sports Length line view while preserving numeric range boundaries and counts
- [X] T017 [US2] Add an early All Sports + Histogram N/A branch to `src/dashboard-distributions.js` that destroys any existing chart, hides the canvas, shows the explicit N/A state, and sets the point count before filtering or rendering data
- [X] T018 [US2] Preserve and unify no-data and unsupported-combination cleanup in `src/dashboard-distributions.js` so selected-sport empty states and existing Elevation gain + Swim behavior never leave stale chart content visible
- [X] T019 [US2] Ensure All Sports + Line continues to group qualifying activities by sport and excludes unsupported Swim Elevation gain lines while exposing the Length `50+` label when applicable in `src/dashboard-distributions.js`

**Checkpoint**: User Stories 1 and 2 both remain independently testable; All Sports Histogram is explicit N/A while single-sport histograms and All Sports lines remain functional.

## Phase 5: User Story 3 - Choose a Color Scheme (Priority: P2)

**Goal**: Let users switch between the default fire palette and a monochrome blue palette without changing chart data or filter state.

**Independent Test**: Select both color schemes, change metric, sport, display mode, and date range, and verify the colors change while labels, counts, buckets, and selections remain unchanged.

### Tests for User Story 3

- [X] T020 [P] [US3] Add utility tests for monochrome-blue endpoints, ordered bucket colors, clamping, and unchanged fire colors in `__tests__/distribution-utils.test.js`
- [X] T021 [P] [US3] Add inline-script contract tests for selector dispatch, state persistence across render triggers, and palette application to bars, line points, and per-sport series in `__tests__/index-script-syntax.test.js`

### Implementation for User Story 3

- [X] T022 [US3] Implement the palette-aware color helper in `src/distribution-utils.js` with `fire` and `monochrome-blue` schemes, stable position ordering, clamping, and browser/CommonJS exports
- [X] T023 [US3] Apply the selected palette consistently to histogram bars, single-series line points, and per-sport line points in `src/dashboard-distributions.js`, while keeping legend entries distinguishable and preserving all numeric chart data
- [X] T024 [US3] Wire the color selector event path in `index.html` and `src/dashboard-distributions.js` so changing the scheme re-renders immediately and remains active across metric, sport, mode, and date-range changes during the page session

**Checkpoint**: All three user stories are independently functional and the selected color scheme does not alter distribution semantics.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature across unit contracts, the static browser, and the documented acceptance scenarios.

- [X] T025 [P] Update distribution-related test descriptions and references in `__tests__/distribution-utils.test.js` and `__tests__/index-script-syntax.test.js` to identify feature 026 behavior without removing prior 018/019/020 coverage
- [X] T026 [P] Review `specs/026-distributions-labels-colors/contracts/distributions-ui.md` and `specs/026-distributions-labels-colors/data-model.md` against the final implementation and correct any documentation drift
- [X] T027 Run the focused distribution Jest command from `specs/026-distributions-labels-colors/quickstart.md` and resolve regressions in the touched files
- [X] T028 Run the complete root Jest suite with `npm test -- --runInBand` from the repository root and record any unrelated pre-existing failures without broadening feature scope
- [ ] T029 Run the manual static-browser scenarios in `specs/026-distributions-labels-colors/quickstart.md`, including both color schemes, all metrics, All Sports Histogram N/A, single-sport histograms, legend markers, and stale-chart transitions

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No implementation dependency; establishes the repository checks.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user-story implementation because all stories share palette state and render routing.
- **User Story 1 (Phase 3)**: Depends on Phase 2 and is the recommended MVP.
- **User Story 2 (Phase 4)**: Depends on Phase 2; can be implemented after or alongside US1, but its renderer cleanup should be integrated after the shared render seams exist.
- **User Story 3 (Phase 5)**: Depends on Phase 2 and the renderer paths exercised by US1/US2; complete after those paths are stable.
- **Polish (Phase 6)**: Depends on all desired user stories being implemented.

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2; no dependency on US2 or US3 beyond the shared palette interface.
- **US2 (P1)**: Can start after Phase 2; independent of US1 at the behavior level, but should integrate with the same renderer cleanup and label helpers.
- **US3 (P2)**: Depends on Phase 2 and benefits from the chart paths established by US1 and US2; it must not change their data or state semantics.

### Within Each User Story

- Write the story's tests before its implementation tasks and confirm they fail for the missing behavior.
- Complete reusable utility changes before dashboard orchestration changes that consume them.
- Validate each story at its checkpoint before moving to the next story.

## Parallel Execution Examples

### User Story 1

```text
Task: T007 utility tests in __tests__/distribution-utils.test.js
Task: T008 inline-script contract tests in __tests__/index-script-syntax.test.js
```

After the tests are in place, T009 and T010 can be prepared in parallel only if separate contributors avoid overlapping edits; T011-T013 depend on their respective helper/configuration changes.

### User Story 2

```text
Task: T014 overflow-label tests in __tests__/distribution-utils.test.js
Task: T015 N/A contract tests in __tests__/index-script-syntax.test.js
```

T016 can proceed in parallel with T017 when the test edits are complete because they touch different source files; T018-T019 follow the renderer guard and cleanup decisions.

### User Story 3

```text
Task: T020 monochrome palette tests in __tests__/distribution-utils.test.js
Task: T021 color-selector contract tests in __tests__/index-script-syntax.test.js
```

T022 can proceed in parallel with T024 after the foundational selector/state seam exists; T023 depends on the palette helper and the chart datasets.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 Setup and Phase 2 Foundational tasks.
2. Complete Phase 3 User Story 1.
3. Run T027 and manually validate the independent US1 scenarios.
4. Stop for an MVP review: legends and metric labels are readable, units are clear, and the existing distribution data remains unchanged.

### Incremental Delivery

1. Add US1 for the core labeling and legend improvements.
2. Add US2 for explicit All Sports Histogram N/A and overflow/empty-state clarity.
3. Add US3 for the selectable monochrome-blue palette.
4. Complete Phase 6 full-suite and browser validation.

## Notes

- Every task uses the required `- [ ] [TaskID] [P?] [Story?]` checklist shape and includes a concrete repository or feature-artifact path.
- `[P]` is used only for tasks that can work on different files without depending on incomplete implementation work.
- No task changes imported data, parsing semantics, network behavior, tab navigation, or API dependencies.
