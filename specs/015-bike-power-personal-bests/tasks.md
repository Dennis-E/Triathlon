---

description: "Task list for Bike Power Personal Bests"
---

# Tasks: Bike Power Personal Bests

**Input**: Design documents from `/specs/015-bike-power-personal-bests/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/power-pb-ui.md](contracts/power-pb-ui.md), [quickstart.md](quickstart.md)

**Tests**: Included because the feature specification defines independently testable journeys and the constitution requires narrow Jest verification for reusable modules and dashboard behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently after the shared power model exists.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the reusable power boundary and test surfaces without changing existing user-visible behavior.

- [X] T001 [P] Create `src/power-pb-utils.js` with CommonJS exports and a `window.powerPbUtils` browser bridge for pure bike-power validation and aggregation helpers.
- [X] T002 [P] Create `__tests__/power-pb-utils.test.js` with synthetic activity and normalized FIT-record fixtures; keep all fixtures local and anonymized.
- [X] T003 Add the shared Bike power duration definitions and source labels to `src/power-pb-utils.js`, preserving the existing 5m, 10m, 20m, and 60m categories.
- [X] T004 Add `<script src="./src/power-pb-utils.js"></script>` to `index.html` before the inline dashboard script and add a matching browser-load assertion in `__tests__/index-script-syntax.test.js`.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Make both CSV average power and FIT record power available to the story-specific calculations.

- [X] T005 [P] Add utility tests in `__tests__/power-pb-utils.test.js` for positive finite watts, exclusion of missing/non-numeric/zero/negative values, strict `Bike` filtering, and the `activity-average` versus `fit-rolling` source enum from `data-model.md`.
- [X] T006 Implement normalized power-record validation and activity-average observation creation in `src/power-pb-utils.js`, retaining finite source values for calculation and rounding only at display boundaries.
- [X] T007 Extend `src/zip-importer.js` only to normalize FIT records with `tSec`, `distKm`, and `power`, preserving existing timestamp ordering, duplicate-timestamp, and non-decreasing-distance rules; leave rolling-window aggregation to T019.
- [X] T008 [P] Add `src/zip-importer.js` tests in `__tests__/zip-importer.test.js` for FIT records with valid, missing, invalid, and non-positive power fields without changing GPS track extraction behavior.

**Checkpoint**: The repository can distinguish usable CSV average watts from normalized FIT power records, and both paths have focused tests.

## Phase 3: User Story 1 - See Bike Power in Personal Bests (Priority: P1) 🎯 MVP

**Goal**: Make available bike power visible in the existing Personal Bests Bike column, including a truthful no-data state.

**Independent Test**: Import synthetic bike activities containing valid average watts, open Personal Bests, and verify a watts-labeled result with activity context; import a dataset without usable bike power and verify no fabricated power chart appears.

### Tests for User Story 1

- [X] T009 [P] [US1] Add activity-average progression and power-availability-state tests in `__tests__/power-pb-utils.test.js`, covering `none`, `average-only`, and mixed availability states.
- [X] T010 [P] [US1] Add CSV-to-activity regression cases in `__tests__/processing.test.js` for German and English power headers, decimal comma/point values, Bike-only inclusion, and invalid power exclusion.
- [X] T011 [P] [US1] Add inline markup/script assertions in `__tests__/index-script-syntax.test.js` for the Bike power section, `W` labels, activity-average wording, and no-data messaging.

### Implementation for User Story 1

- [X] T012 [US1] Implement activity-average power PB records in `src/power-pb-utils.js`, using only positive finite `avgWatts` from `Bike` activities and retaining date, activity ID, and activity name context; emit only new activity-average highs in chronological order.
- [X] T013 [US1] Update the Bike branch of `renderPbChart()` in `index.html` to render a clearly labeled activity-average power progression from the utility output without treating it as a duration-specific effort.
- [X] T014 [US1] Add the UI no-data/availability behavior in `index.html` so missing Bike power omits the power area or explains that no usable power data was found without rendering an empty chart.
- [X] T015 [US1] Preserve existing distance, elevation, longest-activity, run, and swim PB rendering in `index.html` and verify the activity-average power section does not alter their containers or filters.

**Checkpoint**: A user can see valid average Bike watts in Personal Bests, or receives a truthful no-data state, without any duration claim.

## Phase 4: User Story 2 - Distinguish Average Power from Duration Records (Priority: P1)

**Goal**: Populate duration-specific Bike power PBs from qualifying FIT power windows while keeping average power separate.

**Independent Test**: Import average-only, duration-only, and mixed synthetic datasets; verify average records appear only in the average category, qualifying FIT windows appear in their matching duration categories, and unavailable durations are omitted or explained.

### Tests for User Story 2

- [X] T016 [P] [US2] Add rolling-window tests in `__tests__/power-pb-utils.test.js` for 300, 600, 1200, and 3600 seconds, including insufficient span, missing power samples, and interval boundary handling; require every accepted window to cover at least 80% of the target duration with finite positive-power samples.
- [X] T017 [P] [US2] Add ZIP import tests in `__tests__/zip-importer.test.js` for a Bike FIT entry producing `powerEfforts` with `targetSeconds`, `avgPower`, interval timestamps, and interval distances while preserving other import results.
- [X] T018 [P] [US2] Add UI contract assertions in `__tests__/index-script-syntax.test.js` that average power is separately labeled and never used as a 5m/10m/20m/60m duration record.

### Implementation for User Story 2

- [X] T019 [US2] Implement deterministic rolling power-effort calculation in `src/power-pb-utils.js`, emitting only qualifying positive-power windows with `targetSeconds`, `avgPower`, `startSec`, `endSec`, `startKm`, and `endKm`; reject windows below the 80% finite positive-power coverage threshold from T016.
- [X] T020 [US2] Extend the FIT ZIP import flow in `src/zip-importer.js` to attach per-activity `powerEfforts` for Bike activities to `fitBestEffortsByActivityId`, while continuing to skip unreadable files without aborting the full import.
- [X] T021 [US2] Wire generated `powerEfforts` into the existing `computeBikePowerPbsForDuration()` path in `index.html`, retaining the existing supported durations and excluding average-only activities from duration PBs.
- [X] T022 [US2] Update duration power labels and unavailable states in `index.html` so every rendered duration record shows its duration and `W` unit and no unsupported empty chart is produced.

**Checkpoint**: Average and duration-specific power are both visible when supported, but are never silently substituted for one another.

## Phase 5: User Story 3 - Compare and Verify Power Progress (Priority: P2)

**Goal**: Make successive power bests chronologically comparable and individually verifiable.

**Independent Test**: Load at least two dated qualifying records in one power category, confirm only successive higher bests appear in chronological order, and inspect a record detail for date, activity, category, value, and source.

### Tests for User Story 3

- [X] T023 [P] [US3] Add chronological progression tests in `__tests__/power-pb-utils.test.js` for increasing, equal, out-of-order, and invalid watts, asserting higher-is-better PB semantics per category.
- [X] T024 [P] [US3] Add inline tooltip/detail assertions in `__tests__/index-script-syntax.test.js` for date, activity name, category/duration, watt value, and source wording.
- [X] T025 [P] [US3] Add regression coverage in `__tests__/processing.test.js` and `__tests__/index-script-syntax.test.js` proving non-power PB sections remain unchanged when Bike power is absent or incomplete.

### Implementation for User Story 3

- [X] T026 [US3] Implement shared chronological best-progression helpers in `src/power-pb-utils.js`, keeping `activity-average` and each duration category in separate progressions and retaining source context on every best.
- [X] T027 [US3] Update power PB tooltip/detail models in `index.html` to expose date, activity name, category, `W` value, and whether the source is an activity average or duration-specific effort.
- [X] T028 [US3] Preserve keyboard-accessible existing PB detail interactions and prevent dynamic power labels/tiles from overlapping adjacent Bike PB sections in `index.html`.

**Checkpoint**: Users can compare power progress over time and verify each displayed best without ambiguity.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature, privacy boundary, performance, and documentation-driven smoke scenarios.

- [X] T029 [P] Update `specs/015-bike-power-personal-bests/quickstart.md` with the final focused test selectors and any import limitations discovered during implementation.
- [X] T030 [P] Add final local-processing and no-network assertions for the power import/render path in `__tests__/index-script-syntax.test.js`.
- [X] T031 Run `npm test -- power-pb-utils processing zip-importer index-script-syntax` and resolve feature-related failures before broader validation.
- [X] T032 Run the complete root `npm test` suite and record only unrelated pre-existing failures in `specs/015-bike-power-personal-bests/quickstart.md`.
- [ ] T033 Execute the manual browser scenarios in `specs/015-bike-power-personal-bests/quickstart.md` for average-only, duration-specific, mixed, no-data, narrow-layout, and non-power regression cases.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T004 establish the reusable module boundary, browser load, and supported categories; T001 and T002 can run in parallel.
- **Foundational (Phase 2)**: Depends on Setup; T005 and T008 can begin after the relevant file scaffolds, while T006-T007 establish the shared data path. This phase blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on T006 and the existing CSV processing path; it is the MVP and can be completed independently of FIT duration extraction.
- **User Story 2 (Phase 4)**: Depends on T007-T008 and the shared utility from T006; it may be started after the foundation even if US1 is still being reviewed, but integrates with the same Bike PB renderer.
- **User Story 3 (Phase 5)**: Depends on the record shapes and rendering paths from US1 and US2; it adds verification context without changing the import contract.
- **Polish (Phase 6)**: Depends on all desired stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only; no dependency on another user story.
- **User Story 2 (P1)**: Foundation plus the shared power record model; average-only behavior remains independently testable.
- **User Story 3 (P2)**: Depends on the record outputs and Bike PB rendering established by US1 and US2.

### Parallel Opportunities

- T001 and T002 can run in parallel because they create separate files.
- T005 and T008 can run in parallel once the utility/import test boundaries are established.
- T009, T010, and T011 can run in parallel because they target separate test concerns/files.
- T016, T017, and T018 can run in parallel before US2 implementation.
- T023, T024, and T025 can run in parallel before US3 implementation.
- T029 and T030 can run in parallel during polish.
- After the foundation, separate developers can work on US1 average-power visibility and US2 FIT duration extraction in parallel, then converge before US3.

## Parallel Example: User Story 1

```text
Task: "T009 [US1] Add activity-average progression and availability-state tests in __tests__/power-pb-utils.test.js"
Task: "T010 [US1] Add CSV power regression cases in __tests__/processing.test.js"
Task: "T011 [US1] Add Bike power markup assertions in __tests__/index-script-syntax.test.js"
```

## Parallel Example: User Story 2

```text
Task: "T016 [US2] Add rolling-window tests in __tests__/power-pb-utils.test.js"
Task: "T017 [US2] Add FIT power import tests in __tests__/zip-importer.test.js"
Task: "T018 [US2] Add average-versus-duration UI contract assertions in __tests__/index-script-syntax.test.js"
```

## Implementation Strategy

### MVP First (User Stories 1 and 2)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational validation and import boundaries.
3. Complete Phase 3: User Story 1 so average watts are visible immediately.
4. Complete Phase 4: User Story 2 so duration PBs are sourced from real FIT efforts.
5. **STOP and VALIDATE**: Run the focused tests and the average-only/duration-only browser scenarios.
6. Deploy/demo the corrected Bike Power Personal Bests behavior if the smoke scenarios pass.

### Incremental Delivery

1. Setup + Foundation establish the shared power model.
2. US1 makes existing average watts discoverable as the first user-visible increment.
3. US2 adds truthful duration-specific FIT power records without changing the average category.
4. US3 adds chronological comparison and source verification.
5. Polish completes regression, privacy, performance, and browser validation.

## Notes

- Every implementation task names an exact repository path and uses the required checkbox/ID format.
- `[P]` is used only where tasks target independent files or test concerns without incomplete dependencies.
- No dashboard tab is added, so `src/tab-navigation.js` and tab navigation tests are intentionally out of scope.
- Do not add personal Strava exports to the repository; use synthetic or explicitly supplied local data only.
