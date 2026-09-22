---

description: "Task list for Bike Power PB Refinement"
---

# Tasks: Bike Power PB Refinement

**Input**: Design documents from `/specs/016-bike-power-pb-refinement/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/watt-pb-ui.md](contracts/watt-pb-ui.md), [quickstart.md](quickstart.md)

**Tests**: Included because the specification defines independently testable user journeys and the constitution requires focused Jest verification for reusable modules and dashboard behavior.

**Organization**: Tasks are grouped by user story and ordered so the removal, duration expansion, and profile visualization can each be validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the expanded duration taxonomy and profile data boundary.

- [X] T001 [P] Add the eight duration definitions (`5s`, `30s`, `1m`, `2m`, `5m`, `10m`, `20m`, `60m`) to `src/power-pb-utils.js`, using internal seconds `5`, `30`, `60`, `120`, `300`, `600`, `1200`, and `3600` with unambiguous labels.
- [X] T002 [P] Add synthetic short- and long-duration FIT fixtures and profile fixtures to `__tests__/power-pb-utils.test.js` without adding personal exports to the repository.
- [X] T003 Add the Watt section/profile selectors and duration labels to the inline contract assertions in `__tests__/index-script-syntax.test.js` without changing dashboard tab navigation.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the reusable data path for short FIT efforts and all-time profile points before changing presentation.

- [X] T004 [P] Add utility tests in `__tests__/power-pb-utils.test.js` for all eight duration categories, positive finite watts, invalid samples, and the existing 80% valid-power coverage threshold.
- [X] T005 [P] Add FIT importer tests in `__tests__/zip-importer.test.js` proving short-duration `powerEfforts` include `targetSeconds`, `avgPower`, interval boundaries, and source activity context.
- [X] T006 Implement short-duration rolling-effort support in `src/power-pb-utils.js`, preserving the existing `fit-rolling` source and rejecting windows with less than 80% finite positive-power coverage.
- [X] T007 Extend FIT effort generation in `src/zip-importer.js` to process all eight duration definitions for Bike activities while skipping unreadable files without aborting the ZIP import.
- [X] T008 [P] Add all-time profile helper tests in `__tests__/power-pb-utils.test.js` for unique duration points, highest-value selection, duration sorting, missing-duration omission, and no interpolation.
- [X] T009 Implement an all-time profile-point helper in `src/power-pb-utils.js` that returns at most one highest qualifying `fit-rolling` point per duration, sorted by `durationSeconds`, omitting missing durations.

**Checkpoint**: The importer and pure utilities can produce truthful short/long duration efforts and available-only all-time profile points before UI integration.

## Phase 3: User Story 1 - Organize Bike Watt PBs Clearly (Priority: P1) 🎯 MVP

**Goal**: Remove the activity-average PB display and place duration-specific Watt cards below Bike Longest.

**Independent Test**: Load Bike data with duration-specific power, open Personal Bests, and verify the Watt section appears after Longest with no activity-average progression card; verify no-power data produces no empty Watt section.

### Tests for User Story 1

- [X] T010 [P] [US1] Add inline UI assertions in `__tests__/index-script-syntax.test.js` that the Watt section is rendered after `pbBikeLongestContainer`, contains no `Activity-average power progression` text, and has no average-PB calculation call.
- [X] T011 [P] [US1] Add regression assertions in `__tests__/index-script-syntax.test.js` that Bike distance/elevation/Longest and Run/Swim PB containers remain rendered.

### Implementation for User Story 1

- [X] T012 [US1] Remove the `createActivityAveragePowerRecords()` call and activity-average power block from the Bike branch of `renderPbChart()` in `index.html`; retain `avgWatts` only for unrelated activity-detail behavior.
- [X] T013 [US1] Move the duration-specific power section in `index.html` so the dedicated heading `Watt` and its cards are appended immediately after `renderRecordCard('pbBikeLongestContainer', ...)` output for the Bike column.
- [X] T014 [US1] Add the Watt no-data state in `index.html` so zero qualifying duration efforts produce no empty chart or misleading activity-average content.
- [X] T015 [US1] Update `__tests__/index-script-syntax.test.js` to assert that duration-specific rendering uses `powerEfforts` only and remains local to the imported dataset.

**Checkpoint**: User Story 1 is independently demonstrable: Watt is a separate post-Longest section and average activity watts are absent from Personal Bests.

## Phase 4: User Story 2 - See Meaningful Power Durations (Priority: P1)

**Goal**: Show truthful duration-specific PB progressions from sprint through sustained efforts.

**Independent Test**: Provide qualifying FIT efforts for a subset and for all eight durations; verify each available duration has a correctly labeled watt progression and missing durations are omitted or unavailable.

### Tests for User Story 2

- [X] T016 [P] [US2] Add duration-label and progression tests in `__tests__/power-pb-utils.test.js` for `5s`, `30s`, `1m`, `2m`, `5m`, `10m`, `20m`, and `60m`, including chronological successive highs.
- [X] T017 [P] [US2] Add importer regression tests in `__tests__/zip-importer.test.js` verifying all eight `targetSeconds` values are generated only for Bike FIT input and average CSV watts never create duration efforts.
- [X] T018 [P] [US2] Add UI assertions in `__tests__/index-script-syntax.test.js` for visible `W` units, unambiguous duration labels, unavailable-duration handling, and the absence of fabricated values.

### Implementation for User Story 2

- [X] T019 [US2] Update the duration power-effort lookup in `index.html` to consume the eight shared duration definitions from `window.powerPbUtils` without duplicating duration constants locally, while preserving the existing PB timeline/card interaction.
- [X] T020 [US2] Update duration-specific tooltip/detail rendering in `index.html` to show the correct duration label, watt value, date, activity context, and `duration-specific effort` source wording for short and long records.
- [X] T021 [US2] Ensure `src/zip-importer.js` and `src/power-pb-utils.js` never use `avgWatts` as a fallback for missing duration efforts, including when FIT data is partial.
- [X] T022 [US2] Preserve the 80% valid-power coverage behavior for short durations in `src/power-pb-utils.js` and add explicit zero/negative/missing/insufficient-window tests in `__tests__/power-pb-utils.test.js`.

**Checkpoint**: User Story 2 is independently demonstrable: all eight supported durations are truthful, labeled, and partial data does not fabricate PBs.

## Phase 5: User Story 3 - Understand the All-Time Power Profile (Priority: P1)

**Goal**: Add a duration-versus-watts profile with one highest point per available duration.

**Independent Test**: Load at least two duration-specific PB categories, open Watt, and verify the profile has Duration on the x-axis, Power (W) on the y-axis, one point per available duration, and no estimated missing points.

### Tests for User Story 3

- [X] T023 [P] [US3] Add profile data tests in `__tests__/power-pb-utils.test.js` for duplicate-duration reduction, highest-value selection, duration sorting, missing-duration omission, zero-point output, and one-point limited data.
- [X] T024 [P] [US3] Add SVG/markup assertions in `__tests__/index-script-syntax.test.js` for the profile container, `Duration` x-axis label, `Power (W)` y-axis label, and available-points-only rendering.
- [X] T025 [P] [US3] Add no-network regression assertions in `__tests__/index-script-syntax.test.js` proving profile values are derived locally and are not sent through the analysis counter or another request path.

### Implementation for User Story 3

- [X] T026 [US3] Add the all-time profile visualization to the Watt section in `index.html` using the existing inline SVG rendering conventions, with duration on x and watts on y.
- [X] T027 [US3] Render profile points from the utility helper in duration order, connecting only available points and avoiding interpolation for missing categories.
- [X] T028 [US3] Add profile tooltips/labels in `index.html` with duration, highest watt value, date, and activity context while keeping labels readable for uneven durations and outlier values.
- [X] T029 [US3] Add zero-point and one-point profile states in `index.html` so no-data and limited-data messages replace misleading charts.
- [X] T030 [US3] Preserve keyboard accessibility, narrow-layout readability, and existing non-power PB sections while adding the profile to the Bike Watt section in `index.html`.

**Checkpoint**: User Story 3 is independently demonstrable: the all-time profile is truthful, readable, and derived only from available duration-specific PBs.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the integrated refinement, documentation, privacy boundary, and regression behavior.

- [X] T031 [P] Update `specs/016-bike-power-pb-refinement/quickstart.md` with final test selectors and any browser limitations discovered during implementation.
- [X] T032 [P] Add final implementation-contract assertions in `__tests__/index-script-syntax.test.js` for removal of activity-average PB preparation and retention of unrelated `avgWatts` activity details.
- [X] T033 Run `npm test -- power-pb-utils zip-importer index-script-syntax` and resolve all feature-related failures before the full suite.
- [X] T034 Run the complete root `npm test` suite and record only unrelated pre-existing failures in `specs/016-bike-power-pb-refinement/quickstart.md`.
- [X] T035 Execute the manual browser scenarios in `specs/016-bike-power-pb-refinement/quickstart.md` for section order, all eight durations, partial data, no-data, profile axes, narrow layout, and non-power regressions.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T003 establish duration definitions, fixtures, and UI contract anchors; T001 and T002 can run in parallel.
- **Foundational (Phase 2)**: Depends on Setup; T004, T005, and T008 can run in parallel before T006, T007, and T009. This phase blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on T001-T007 and the existing `renderPbChart()` structure; it is the first MVP increment and does not depend on the all-time profile helper.
- **User Story 2 (Phase 4)**: Depends on T006-T007 and the Watt-section structure from US1; it can be tested independently once the foundation is complete.
- **User Story 3 (Phase 5)**: Depends on T009 and the Watt section from US1; it consumes the duration outputs from US2.
- **Polish (Phase 6)**: Depends on all desired stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundation; no dependency on another story for section placement/removal.
- **User Story 2 (P1)**: Depends on Foundation and integrates with the Watt section created by US1.
- **User Story 3 (P1)**: Depends on the duration data contract, profile helper T009, and Watt section from US1/US2.

### Parallel Opportunities

- T001 and T002 can run in parallel because they target source constants and test fixtures.
- T004, T005, and T008 can run in parallel because they target independent test concerns.
- T010 and T011 can run in parallel before US1 implementation.
- T016, T017, and T018 can run in parallel before US2 implementation.
- T023, T024, and T025 can run in parallel before US3 implementation.
- T031 and T032 can run in parallel during polish.
- Separate contributors can work on the utility/import expansion and UI section removal after the foundation, but both must converge before the profile integration.

## Parallel Example: User Story 1

```text
Task: "T010 [US1] Assert Watt section order and activity-average removal in __tests__/index-script-syntax.test.js"
Task: "T011 [US1] Assert non-power PB containers remain present in __tests__/index-script-syntax.test.js"
```

## Parallel Example: User Story 2

```text
Task: "T016 [US2] Test all eight duration labels and progressions in __tests__/power-pb-utils.test.js"
Task: "T017 [US2] Test eight FIT target durations in __tests__/zip-importer.test.js"
Task: "T018 [US2] Test Watt labels and unavailable durations in __tests__/index-script-syntax.test.js"
```

## Parallel Example: User Story 3

```text
Task: "T023 [US3] Test all-time profile point shaping in __tests__/power-pb-utils.test.js"
Task: "T024 [US3] Test profile SVG/axis contract in __tests__/index-script-syntax.test.js"
Task: "T025 [US3] Test local-only profile processing in __tests__/index-script-syntax.test.js"
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational duration/profile data boundary.
3. Complete Phase 3: User Story 1, removing the misleading average progression and placing Watt below Longest.
4. **STOP and VALIDATE**: Run focused tests and the section-order/no-data browser scenario.
5. Demo the corrected information architecture before expanding the profile.

### Incremental Delivery

1. Setup + Foundation establish eight duration categories and truthful profile data.
2. US1 corrects Watt placement and removes activity-average PB presentation.
3. US2 adds short-duration PBs while preserving existing long-duration behavior.
4. US3 adds the all-time duration-versus-watts profile.
5. Polish completes regression, privacy, performance, and browser validation.

## Notes

- Every implementation task names an exact repository path and uses the required checklist/ID format.
- `[P]` is used only for tasks targeting independent files or independent test concerns.
- No dashboard tab is added, so `src/tab-navigation.js` and tab-navigation tests remain out of scope.
- Do not add personal Strava exports to the repository; use synthetic or explicitly supplied local data only.
