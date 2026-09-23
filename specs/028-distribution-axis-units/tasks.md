---

description: "Task list for Distribution Histogram Axis Units"
---

# Tasks: Distribution Histogram Axis Units

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing Histogram renderer and test entry points.

- [X] T001 Review the existing bucket, formatter, and Chart.js category-axis flow in `src/distribution-utils.js` and `src/dashboard-distributions.js` against [data-model.md](data-model.md) and [contracts/distributions-ui.md](contracts/distributions-ui.md)
- [X] T002 [P] Confirm the focused Jest commands and static-browser validation steps in `specs/028-distribution-axis-units/quickstart.md` are runnable from the root `package.json`

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T003 [P] Add metric-specific boundary-formatting test fixtures for Length, Elevation gain, Duration, Run/Swim Pace, Bike/All Sports Pace, and Bike Power in `__tests__/distribution-utils.test.js`
- [X] T004 [P] Add renderer contract assertions that Histogram labels come from metric boundaries and not category indices in `__tests__/index-script-syntax.test.js`
- [X] T005 Define the boundary-label result contract in `src/distribution-utils.js`, preserving `rangeStart`, `rangeEnd`, `isUnderflow`, `isOverflow`, and `count` while separating visible tick text from descriptive bucket ranges
- [X] T006 Export the boundary-label helper through both CommonJS and `window.distributionUtils` in `src/distribution-utils.js`

## Phase 3: User Story 1 - Read the Actual Metric on Every Histogram Axis (Priority: P1) [MVP]

**Goal**: Replace `0, 1, 2, 3...` Histogram labels with real metric boundaries in the correct units.

**Independent Test**: Render Histogram mode for every metric and applicable sport with multi-bucket data; verify every visible tick is a metric value or boundary.

### Tests for User Story 1

- [X] T007 [P] [US1] Add utility tests for kilometer, meter, time, Pace, km/h, and watt boundary output plus open-ended labels in `__tests__/distribution-utils.test.js`
- [X] T008 [P] [US1] Add inline-script tests for the Histogram category-axis callback mapping positions to boundary labels in `__tests__/index-script-syntax.test.js`

### Implementation for User Story 1
- [X] T009 [US1] Implement a pure Histogram boundary-label helper in `src/distribution-utils.js` that formats each visible boundary using the selected metric and sport unit, never returning a full range such as `50-100` for a regular tick
- [X] T010 [US1] Format Length boundaries as km, Elevation gain boundaries as m, Bike Power boundaries as W, and Bike/All Sports Pace boundaries as km/h in `src/distribution-utils.js`
- [X] T011 [US1] Format Duration and Run/Swim Pace boundaries with the established readable time format, including `min:ss` where applicable, in `src/distribution-utils.js`
- [X] T012 [US1] Preserve understandable underflow/overflow boundary labels such as `< value`, `> value`, and `50+` in `src/distribution-utils.js`
- [X] T013 [US1] Replace Histogram category labels and callbacks in `src/dashboard-distributions.js` so Chart.js positions resolve to the precomputed metric boundary labels instead of rendering `0, 1, 2...`
- [X] T014 [US1] Ensure Histogram axis titles and visible ticks use the same metric unit for Length, Elevation gain, Duration, Pace, and Power in `src/dashboard-distributions.js`

## Phase 4: User Story 2 - Keep Axis Labels Consistent with Bucket Boundaries and Titles (Priority: P1)

**Goal**: Align visible ticks with actual bucket boundaries, remove duplicate rounded labels, and retain open-ended meaning.

**Independent Test**: Compare the first, intermediate, and final visible ticks against the corresponding bucket boundaries for every metric and sport filter.

### Tests for User Story 2

- [X] T015 [P] [US2] Add utility tests for adjacent boundaries, duplicate rounded labels, single-bucket results, and underflow/overflow buckets in `__tests__/distribution-utils.test.js`
- [X] T016 [P] [US2] Add renderer contract tests that reject full range labels and index-only ticks while preserving explicit N/A states in `__tests__/index-script-syntax.test.js`

- [X] T017 [US2] De-duplicate visible Histogram tick labels after metric formatting while keeping all original bucket objects, ranges, and counts intact in `src/distribution-utils.js`
- [X] T018 [US2] Map category positions to the de-duplicated visible tick list without shifting bar counts or bucket order in `src/dashboard-distributions.js`
- [X] T019 [US2] Handle single-bucket, underflow, overflow, and `50+` cases in the Histogram x-axis without falling back to category indices in `src/dashboard-distributions.js`
- [X] T020 [US2] Ensure metric, sport, color-scheme, and date-range changes rebuild current-unit Histogram ticks and do not retain labels from the previous chart in `src/dashboard-distributions.js`

**Checkpoint**: User Stories 1 and 2 both work independently; axes are metric-correct, boundary-aligned, and stable across edge cases.

## Phase 5: User Story 3 - Preserve Distribution Meaning While Correcting Labels (Priority: P2)

**Goal**: Prove that axis presentation changes do not alter the distribution data or N/A behavior.

- [X] T021 [P] [US3] Add regression tests proving bucket counts and total activity counts are unchanged when boundary labels are formatted in `__tests__/distribution-utils.test.js`
- [X] T022 [P] [US3] Add inline-script tests for preserving N/A cleanup and current filter state while Histogram labels are rebuilt in `__tests__/index-script-syntax.test.js`

### Implementation for User Story 3

- [X] T023 [US3] Keep bucket construction, activity filtering, color scheme state, and counts independent from visible axis-label formatting in `src/distribution-utils.js`
- [X] T024 [US3] Preserve existing empty/unsupported N/A handling and chart cleanup while applying metric boundary ticks in `src/dashboard-distributions.js`

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete axis correction in automated tests and the browser.

- [X] T025 [P] Update test names and feature references in `__tests__/distribution-utils.test.js` and `__tests__/index-script-syntax.test.js` for feature 028 without removing previous distribution coverage
- [X] T026 [P] Review `specs/028-distribution-axis-units/contracts/distributions-ui.md` and `specs/028-distribution-axis-units/data-model.md` against the final implementation and correct documentation drift
- [X] T027 Run the focused distribution Jest command from `specs/028-distribution-axis-units/quickstart.md` and resolve regressions in touched files
- [X] T028 Run the complete root suite with `npm test -- --runInBand` and record any unrelated failures without broadening scope
- [ ] T029 Run the manual browser scenarios from `specs/028-distribution-axis-units/quickstart.md` with synthetic or supplied local activity data, covering all metric units, boundary ticks, open-ended buckets, filter changes, and N/A states

## Dependencies & Execution Order
- **Setup (Phase 1)**: No implementation dependency; confirms the existing surfaces.
- **Foundational (Phase 2)**: Depends on Setup and blocks story work because every story uses the shared boundary-label contract.
- **User Story 1 (Phase 3)**: Depends on Phase 2 and is the recommended MVP.
- **User Story 2 (Phase 4)**: Depends on Phase 2 and builds on the boundary output from US1.
- **User Story 3 (Phase 5)**: Depends on Phase 2; validates preservation of the existing distribution semantics.
- **Polish (Phase 6)**: Depends on all desired user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on US2 or US3.
- **US2 (P1)**: Starts after Phase 2; consumes the boundary formatter established for US1.
- **US3 (P2)**: Starts after Phase 2; verifies that US1/US2 remain presentation-only.

### Within Each User Story

- Write and run new tests before the corresponding implementation tasks.
- Complete reusable formatting helpers before renderer integration.
- Validate each story checkpoint before moving to the next phase.

## Parallel Execution Examples

### User Story 1

```text
Task: T007 metric boundary utility tests in __tests__/distribution-utils.test.js
Task: T008 category-axis contract tests in __tests__/index-script-syntax.test.js
```

After the tests are written, T010 and T011 can proceed in parallel because they cover different metric-formatting branches; T013/T014 integrate those helpers into the renderer.

### User Story 2

```text
Task: T015 duplicate/open-ended boundary tests in __tests__/distribution-utils.test.js
Task: T016 renderer edge-case contract tests in __tests__/index-script-syntax.test.js
```

T017 can proceed in parallel with T019 after the boundary contract is stable; T018 and T020 then integrate ordering and state-refresh behavior.

### User Story 3

```text
Task: T021 count-preservation tests in __tests__/distribution-utils.test.js
Task: T022 N/A/filter contract tests in __tests__/index-script-syntax.test.js
```

T023 and T024 touch separate utility/renderer responsibilities and can be coordinated in parallel after the tests are prepared.

### MVP First (User Story 1 Only)

1. Complete Phase 1 Setup and Phase 2 Foundational tasks.
2. Complete Phase 3 User Story 1.
3. Run T027 and inspect all Histogram metrics with representative data.
4. Stop for an MVP review once no Histogram shows category indices and all units are correct.

### Incremental Delivery

1. Deliver real metric/unit labels as the MVP.
2. Add boundary de-duplication and robust open-ended/single-bucket behavior.
3. Prove counts, filters, and N/A behavior remain unchanged.
4. Complete full-suite and browser validation.

## Notes

- Every task uses the required checkbox, sequential TaskID, optional `[P]`, story label where required, and a concrete path.
- No task changes parsing, persistence, network behavior, tab navigation, or API/service dependencies.
