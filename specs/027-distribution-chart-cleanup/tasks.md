---

description: "Task list for Distribution Chart Cleanup"
---

# Tasks: Distribution Chart Cleanup

**Input**: Design documents from `/specs/027-distribution-chart-cleanup/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/distributions-ui.md](contracts/distributions-ui.md), [quickstart.md](quickstart.md)

**Organization**: Tasks are grouped by the three independently testable P1 user stories.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing distribution renderer, metric extractor, and test entry points before changing behavior.

- [X] T001 Review the current distribution metric extraction, bucket construction, and Chart.js dataset/axis setup in `src/distribution-utils.js` and `src/dashboard-distributions.js` against [data-model.md](data-model.md) and [contracts/distributions-ui.md](contracts/distributions-ui.md)
- [X] T002 [P] Confirm the focused Jest command and static-server browser scenarios in `specs/027-distribution-chart-cleanup/quickstart.md` are runnable from the root `package.json`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared derived-value and tick contracts used by all three stories.

- [X] T003 [P] Add a pure All Sports Pace conversion helper in `src/distribution-utils.js` using `speedKmH = distanceKm / (durationSeconds / 3600)`, excluding non-finite or non-positive source values and leaving activity objects unchanged
- [X] T004 Add All Sports-aware Pace extraction/filtering in `src/distribution-utils.js` so `sport: 'All'` returns km/h for Run, Swim, and Bike while single-sport Pace retains existing units and validation
- [X] T005 [P] Add a pure histogram-boundary-tick helper in `src/distribution-utils.js` that emits individual numeric boundaries, de-duplicates repeated rounded boundaries, preserves open-ended labels, and never emits full range text such as `50-100`
- [X] T006 Add focused foundational tests for All Sports Pace conversion, invalid-value exclusion, activity immutability, and histogram boundary tick derivation in `__tests__/distribution-utils.test.js`
- [X] T007 Add inline-script contract assertions for the new conversion/tick helpers and the All Sports Pace path in `__tests__/index-script-syntax.test.js`

**Checkpoint**: Shared normalized Pace values and boundary tick metadata are available through the existing utility/browser bridge without changing unrelated activity data.

## Phase 3: User Story 1 - Read Clean Histogram Axes (Priority: P1) 🎯 MVP

**Goal**: Make every distribution histogram use actual single bucket boundaries, correct metric units, and reliable Elevation/Power axis labels.

**Independent Test**: Import data spanning multiple buckets, inspect Histogram mode for Length, Elevation gain, Duration, Power, and each supported sport, and verify ticks are boundaries rather than ranges.

### Tests for User Story 1

- [X] T008 [P] [US1] Add utility tests for meter boundaries in Run/Bike Elevation, watt boundaries in Bike Power, open-ended overflow labels, and duplicate rounded-boundary de-duplication in `__tests__/distribution-utils.test.js`
- [X] T009 [P] [US1] Add inline-script contract tests for category histogram tick labels, metric axis titles, and removal of range labels from the x-axis in `__tests__/index-script-syntax.test.js`

### Implementation for User Story 1

- [X] T010 [US1] Implement metric-aware histogram boundary labels in `src/distribution-utils.js`, keeping bucket descriptive labels separate from x-axis tick labels and preserving actual metric units
- [X] T011 [US1] Configure Histogram x-axis labels and tick callbacks in `src/dashboard-distributions.js` to use individual boundaries, de-duplicate repeated labels, and preserve `50+` or `> value` overflow meaning
- [X] T012 [US1] Update metric axis-title and tick formatting in `src/dashboard-distributions.js` so Length uses `Length (km)`, Elevation gain uses `Elevation gain (m)`, Power uses `Power (W)`, and ticks do not repeat title units
- [X] T013 [US1] Validate and correct Elevation gain Run/Bike and Bike Power histogram coordinate mapping in `src/dashboard-distributions.js` so Chart.js category labels are not mistaken for unrelated numeric indices

**Checkpoint**: User Story 1 is independently usable; all histogram x-axes show clear boundaries and correct units.

## Phase 4: User Story 2 - Read Smoothed Lines Without Visual Noise (Priority: P1)

**Goal**: Render clean smoothed lines with no visible point bullets, while keeping line and shaded-area color semantics.

**Independent Test**: Open Line mode for a single sport and All Sports, verify no point markers are visible, and confirm lines/fills remain rendered and distinguishable.

### Tests for User Story 2

- [X] T014 [P] [US2] Add inline-script contract tests asserting `pointRadius: 0`, no visible point hover radius, retained smoothing/fill, and palette colors assigned to line/fill datasets in `__tests__/index-script-syntax.test.js`
- [X] T015 [P] [US2] Review `__tests__/distribution-utils.test.js` for pure line-style helpers; no additional utility helper is needed because line styling is Chart.js orchestration

### Implementation for User Story 2

- [X] T016 [US2] Set point and hover radii to zero and remove point-color dependencies from single-series and per-sport line datasets in `src/dashboard-distributions.js`, preserving smoothing and fill behavior
- [X] T017 [US2] Apply the active palette directly to line `borderColor` and shaded `backgroundColor` in `src/dashboard-distributions.js`, including the flat medium-dark blue line/fill treatment for Monochrome blue
- [X] T018 [US2] Preserve per-sport line distinguishability in All Sports + Line mode while ensuring every line retains `fill` and no visible point markers in `src/dashboard-distributions.js`

**Checkpoint**: User Story 2 is independently testable as a clean, smoothed line view with no bullets and visible line/fill encoding.

## Phase 5: User Story 3 - Use Consistent Units and Meaningful Colors (Priority: P1)

**Goal**: Make All Sports Pace use a shared km/h scale, synchronize legend fills with line colors, and flatten Monochrome blue histogram bars.

**Independent Test**: Compare All Sports Pace, All Sports line legends, and both color schemes across histogram and line modes; verify units, colors, and unchanged single-sport counts.

### Tests for User Story 3

- [X] T019 [P] [US3] Add utility tests for Run, Swim, and Bike All Sports Pace values normalized to km/h, invalid conversion exclusion, and unchanged single-sport Pace values in `__tests__/distribution-utils.test.js`
- [X] T020 [P] [US3] Add inline-script contract tests for exact `Pace (km/h)` labeling, absence of `mixed units`/sport-specific units in All Sports, legend fill/stroke matching, and flat histogram blue in `__tests__/index-script-syntax.test.js`

### Implementation for User Story 3

- [X] T021 [US3] Route All Sports Pace bucket extraction, labels, and line positions through the km/h metric in `src/distribution-utils.js`, retaining existing Run/Swim/Bike single-sport formatters
- [X] T022 [US3] Set the All Sports Pace axis title to exactly `Pace (km/h)` and remove mixed-unit/sport-specific unit text from All Sports tick and bucket presentation in `src/dashboard-distributions.js`
- [X] T023 [US3] Set each line dataset `backgroundColor` to the effective line stroke color and keep point-style legend options so filled legend markers match their corresponding lines in `src/dashboard-distributions.js`
- [X] T024 [US3] Make Monochrome blue Histogram datasets use one stable medium-dark blue for every bar while preserving the existing fire gradient behavior in `src/dashboard-distributions.js` and `src/distribution-utils.js`

**Checkpoint**: All three P1 stories are independently functional; shared Pace units, legend colors, line/fill colors, and histogram colors are coherent.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete chart cleanup across utilities, renderer contracts, and the browser.

- [X] T025 [P] Update distribution test names and feature references in `__tests__/distribution-utils.test.js` and `__tests__/index-script-syntax.test.js` to document feature 027 behavior without removing prior distribution coverage
- [X] T026 [P] Review `specs/027-distribution-chart-cleanup/contracts/distributions-ui.md` and `specs/027-distribution-chart-cleanup/data-model.md` against the final implementation and fix documentation drift
- [X] T027 Run the focused Jest command from `specs/027-distribution-chart-cleanup/quickstart.md` and resolve failures in touched files
- [X] T028 Run the full root suite with `npm test -- --runInBand` and record any unrelated failures without expanding scope
- [ ] T029 Run the manual browser scenarios from `specs/027-distribution-chart-cleanup/quickstart.md` with synthetic or supplied local activity data, including all histogram metrics, All Sports Pace, line marker absence, legend colors, and both color schemes

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No implementation dependency; confirms repository entry points.
- **Foundational (Phase 2)**: Depends on Setup and blocks story implementation because Pace normalization and boundary metadata are shared.
- **User Story 1 (Phase 3)**: Depends on Phase 2; recommended MVP and can be validated independently.
- **User Story 2 (Phase 4)**: Depends on Phase 2; can proceed after shared renderer seams exist and does not require US1 behavior.
- **User Story 3 (Phase 5)**: Depends on Phase 2 and the chart dataset paths used by US1/US2; validates shared unit/color semantics.
- **Polish (Phase 6)**: Depends on all desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on US2 or US3 beyond the shared tick helper.
- **US2 (P1)**: Starts after Phase 2; independent of histogram behavior except for shared color state.
- **US3 (P1)**: Starts after Phase 2; integrates with the normalized metric and dataset styling used by the other stories.

### Within Each User Story

- Write tests before the corresponding implementation and confirm the new tests fail for the missing behavior.
- Complete utility changes before renderer changes that consume them.
- Validate each story at its checkpoint before broadening scope.

## Parallel Execution Examples

### User Story 1

```text
Task: T008 utility boundary tests in __tests__/distribution-utils.test.js
Task: T009 renderer contract tests in __tests__/index-script-syntax.test.js
```

After tests are written, T010 and T012 can proceed in parallel because they primarily update utility and renderer formatting logic; T011 and T013 then integrate the Chart.js category-axis behavior.

### User Story 2

```text
Task: T014 line-render contract tests in __tests__/index-script-syntax.test.js
Task: T015 line-style utility tests in __tests__/distribution-utils.test.js
```

T016 and T017 should be coordinated because both touch the renderer dataset definitions; T018 follows once their shared dataset shape is stable.

### User Story 3

```text
Task: T019 km/h conversion tests in __tests__/distribution-utils.test.js
Task: T020 unit/color contract tests in __tests__/index-script-syntax.test.js
```

T021 and T024 can proceed in parallel in utility/palette code; T022 and T023 depend on their renderer-facing contracts.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 Setup and Phase 2 Foundational tasks.
2. Complete Phase 3 User Story 1.
3. Run T027 and validate all histogram metrics with synthetic data.
4. Stop for an MVP review once histogram boundaries and units are correct.

### Incremental Delivery

1. Deliver clean histogram axes as the MVP.
2. Add bullet-free smoothed lines and direct line/fill color encoding.
3. Add shared km/h All Sports Pace, matching legend colors, and flat blue histograms.
4. Run full regression and browser validation.

## Notes

- Every task uses the required checkbox, sequential TaskID, optional `[P]`, story label where required, and a concrete file path.
- No task changes parsing, persistence, network behavior, tab navigation, or API/service dependencies.
