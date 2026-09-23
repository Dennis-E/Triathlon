---

description: "Implementation tasks for optimized bike power PB import"
---

# Tasks: Optimized Bike Power PB Import

**Input**: Design documents from `/specs/023-optimize-power-pb-import/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/power-pb-processing.md](./contracts/power-pb-processing.md), [quickstart.md](./quickstart.md)

**Tests**: Required by FR-013/FR-014, SC-002/SC-003, and Constitution III. Test tasks precede their corresponding implementation tasks.

**Organization**: Tasks are grouped by user story so each story produces an independently testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches a different file and has no dependency on an incomplete task.
- **[Story]**: Maps the task to User Story 1, 2, or 3.
- Every task includes an exact repository-relative file path.

## Path Conventions

- Reusable browser/Node utilities: `src/`
- Root Jest tests: `__tests__/`
- Synthetic benchmark CLI: `scripts/`
- Feature validation documentation: `specs/023-optimize-power-pb-import/`

## Phase 1: Setup

**Purpose**: Establish a known-good baseline before changing the rolling-power algorithm.

- [X] T001 Run `npx jest __tests__/power-pb-utils.test.js __tests__/zip-importer.test.js --runInBand` and record the passing baseline plus current synthetic four-hour timing in `specs/023-optimize-power-pb-import/quickstart.md`

---

## Phase 2: Foundational

**Purpose**: Preserve an executable oracle and shared synthetic-data builders used by all stories.

**Critical**: Complete this phase before implementing any optimization.

- [X] T002 Add a test-only copy of the current quadratic `calculateRollingPowerEfforts` behavior and reusable regular/irregular/sparse FIT-record factories in `__tests__/power-pb-utils.test.js`, then prove the oracle matches the current production function before replacing it

**Checkpoint**: The current semantics are captured independently of the implementation that will be optimized.

---

## Phase 3: User Story 1 - Import Power Histories Quickly (Priority: P1) MVP

**Goal**: Replace repeated quadratic scans with one preparation pass and approximately linear all-duration processing, including an early exit for activities with no usable power.

**Independent Test**: Generate one-second synthetic records for increasing activity lengths, verify the doubled workload stays within a 2.5x median growth ratio, verify a four-hour no-power activity returns no efforts, and run the reproducible benchmark report.

### Tests for User Story 1

- [X] T003 [US1] Add failing batch-contract, duration-order, no-power early-exit, and scaling tests using three warm-up runs plus seven measured runs for 7,201 versus 14,401 positive-integer-watt records in `__tests__/power-pb-utils.test.js`; do not assert the hard two-second browser target in Jest

### Implementation for User Story 1

- [X] T004 [US1] Implement rolling-helper record preparation in `src/power-pb-utils.js` with finite `tSec`, finite `distKm`, positive finite `power` or `null`, invalid points omitted, `usablePowerCount`, and safe-integer metadata; use a stable time sort, preserve backward-distance and duplicate-timestamp public-helper inputs, and leave existing raw FIT backward-point/deduplication behavior unchanged
- [X] T005 [US1] Implement monotonic inclusive sliding-window evaluation in `src/power-pb-utils.js` for the fixed durations 5, 30, 60, 120, 300, 600, 1200, and 3600 seconds; maintain `windowCount`, `validCount`, and `powerSum`, require at least two records and 80% coverage, track only the best effort, and return immediately when `usablePowerCount` is zero
- [X] T006 [US1] Keep `calculateRollingPowerEfforts(records, targetSeconds, coverageThreshold = 0.8)` backward-compatible and add the all-duration batch helper to both `module.exports` and `window.powerPbUtils` in `src/power-pb-utils.js`
- [X] T007 [US1] Update `buildFitPowerEfforts` in `src/zip-importer.js` to normalize/prepare once and call the batch helper once while preserving duration order and the existing `PowerPersonalBest[]` shape
- [X] T008 [P] [US1] Create `scripts/benchmark-power-pb.js` with synthetic generators, three warm-ups, seven measured runs, and median reports for the four-hour ride, doubled-size scaling ratio, four-hour no-power case, baseline comparison, and 100 two-hour activities at one record per second (720,000 records total), without reading personal files
- [X] T009 [P] [US1] Create the static browser benchmark and progress-gap harness in `docs/test-power-pb-performance.html`, loading existing browser globals without a build step and generating only synthetic positive-integer-watt activities
- [X] T010 [US1] Add `benchmark:power-pb` for `scripts/benchmark-power-pb.js` to `package.json` and run `npx jest __tests__/power-pb-utils.test.js __tests__/zip-importer.test.js --runInBand` plus `npm run benchmark:power-pb`

**Checkpoint**: Power-PB calculation scales approximately linearly, no-power activities exit quickly, and existing callers still receive the same API shapes.

---

## Phase 4: User Story 2 - Preserve Existing Power Results (Priority: P2)

**Goal**: Prove and enforce exact output compatibility for all established window, normalization, coverage, and tie rules.

**Independent Test**: Compare every output field from the optimized implementation with the test-only reference algorithm across all required fixture categories and all eight durations; no approximate assertions are allowed.

### Tests for User Story 2

- [X] T011 [US2] Add table-driven differential tests in `__tests__/power-pb-utils.test.js` for regular, irregular, sparse, exact-end-boundary, duplicate-timestamp, backward-time/distance, missing/zero/negative/non-numeric/non-finite power, short-activity, mixed-missing, and tied-best datasets across all eight durations
- [X] T012 [US2] Add exact-field differential coverage for positive non-integer power values in `__tests__/power-pb-utils.test.js`, asserting `targetSeconds`, `avgPower`, `startSec`, `endSec`, `startKm`, and `endKm` with `toEqual` rather than approximate matching
- [X] T013 [P] [US2] Add integration regressions in `__tests__/zip-importer.test.js` proving optimized bike efforts match the legacy per-duration result and GPS output plus non-bike import behavior remain byte-identical

### Implementation for User Story 2

- [X] T014 [US2] Refine `src/power-pb-utils.js` so integer FIT power uses the linear running-sum path while usable non-integer values use an exact-compatibility accumulation path; preserve duplicate normalized records, inclusive `[startSec, startSec + targetSeconds]` bounds, the exact coverage formula, valid-only averaging, and strict `>` first-window tie selection
- [X] T015 [US2] Run `npx jest __tests__/power-pb-utils.test.js __tests__/zip-importer.test.js --runInBand` and resolve every differential mismatch without weakening exact assertions in `__tests__/power-pb-utils.test.js` or `__tests__/zip-importer.test.js`

**Checkpoint**: Optimized results match the captured current behavior for 100% of fields and regression datasets.

---

## Phase 5: User Story 3 - Keep Large Imports Responsive and Understandable (Priority: P3)

**Goal**: Expose privacy-safe phase timings, retain monotonic progress, and isolate activity-file failures during large imports.

**Independent Test**: Import a synthetic mixed archive with an injected clock and timing callback, verify non-overlapping parse/GPS/power measurements and monotonic progress, corrupt one activity, and confirm all remaining valid activities complete.

### Tests for User Story 3

- [X] T016 [US3] Add failing timing-contract tests in `__tests__/zip-importer.test.js` using injected `fitDeps.now` and `fitDeps.onTiming`; assert one event per processed activity with only `activityId`, `sourceType`, `recordCount`, non-negative `parseMs`, `gpsMs`, and `powerMs`, and no coordinates, power samples, names, or file contents
- [X] T017 [US3] Add large-import progress, `.fit.gz`, and failure-isolation tests in `__tests__/zip-importer.test.js` asserting percentages never decrease, compressed FIT behavior remains unchanged, one unreadable FIT file does not abort later files, and GPS/non-bike results remain unchanged

### Implementation for User Story 3

- [X] T018 [US3] Add optional monotonic `now()` and isolated `onTiming(timing)` support to the existing `fitDeps` path in `src/zip-importer.js`, measuring non-overlapping FIT read/parse, GPS extraction/simplification, and bike power processing without changing progress payloads or required function arguments
- [X] T019 [US3] Extend `scripts/benchmark-power-pb.js` and `docs/test-power-pb-performance.html` to aggregate parse, GPS, and power-PB timings and report progress-update gaps for the 100-activity synthetic workload while emitting counts and durations only
- [X] T020 [US3] Run `npx jest __tests__/zip-importer.test.js __tests__/power-pb-utils.test.js --runInBand` and `npm run benchmark:power-pb`, confirming compressed/corrupt-file continuation, monotonic progress, separate phase totals, and no timing payload privacy regression

**Checkpoint**: Large imports provide attributable performance measurements and reliable progress without exposing activity content or failing the entire archive on one bad file.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Complete repository-wide regression and browser acceptance checks.

- [X] T021 Run the full root suite with `npm test -- --runInBand` and resolve feature-related regressions in `src/power-pb-utils.js`, `src/zip-importer.js`, `__tests__/power-pb-utils.test.js`, and `__tests__/zip-importer.test.js`
- [X] T022 Execute `docs/test-power-pb-performance.html` through the local static server and record browser/version, OS/processor, three warm-ups, seven measured runs, medians, phase timings, and longest progress gap in `specs/023-optimize-power-pb-import/quickstart.md`; verify all eight durations for 14,401 records complete within 2 seconds
- [X] T023 Evaluate the SC-007 gate using `docs/test-power-pb-performance.html`: when the longest optimized progress gap exceeds 2 seconds, implement cooperative yielding in `src/zip-importer.js` or a static worker in `src/power-pb-worker.js` plus its `index.html` wiring and tests in `__tests__/zip-importer.test.js`, then repeat the benchmark until the gap is at most 2 seconds; otherwise record that no worker is needed in `specs/023-optimize-power-pb-import/quickstart.md`
- [X] T024 Re-run `npm run benchmark:power-pb` and `npm test -- --runInBand`, then document final SC-001 through SC-008 evidence and any environment-specific caveats in `specs/023-optimize-power-pb-import/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories because it captures the correctness oracle.
- **User Story 1 (Phase 3)**: Depends on Foundational and delivers the performance MVP.
- **User Story 2 (Phase 4)**: Depends on User Story 1's optimized calculation and hardens exact compatibility.
- **User Story 3 (Phase 5)**: Depends on User Story 1's batch path; it may proceed in parallel with User Story 2 after Phase 3, but final validation requires both.
- **Polish (Phase 6)**: Depends on all selected user stories.

### User Story Dependency Graph

```text
Setup -> Foundational -> US1 (performance MVP) -> US2 (exact compatibility)
                                          \----> US3 (timing/responsiveness)
US2 + US3 -> Polish
```

### Within Each User Story

- Write and observe the story's focused tests failing before implementation.
- Implement the smallest source change that satisfies those tests.
- Run the story's focused Jest command immediately after the first source edit.
- Do not weaken exact differential assertions to make optimized output pass.
- Complete the story checkpoint before moving to dependent work.

## Parallel Opportunities

- After T007 defines the production batch path, T008 and T009 can proceed independently in `scripts/benchmark-power-pb.js` and `docs/test-power-pb-performance.html`.
- In User Story 2, T013 can proceed in `__tests__/zip-importer.test.js` while T011-T012 are developed serially in `__tests__/power-pb-utils.test.js`.
- After User Story 1, User Story 2 and User Story 3 can be assigned to separate contributors, with coordination required before both edit shared source files.
- Documentation evidence in T021-T024 begins only after all executable validation passes.

## Parallel Example: User Story 2

```text
Task A: T011-T012 differential unit tests in __tests__/power-pb-utils.test.js
Task B: T013 import integration regressions in __tests__/zip-importer.test.js
After both: T014 compatibility implementation in src/power-pb-utils.js
```

## Parallel Example: User Story 3

```text
Task A: T016-T017 timing/progress tests in __tests__/zip-importer.test.js
After tests fail: T018 instrumentation in src/zip-importer.js
After T018: T019 benchmark aggregation in scripts/benchmark-power-pb.js and docs/test-power-pb-performance.html
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational phases.
2. Complete User Story 1 through T010.
3. Validate linear growth, no-power early exit, and the benchmark command.
4. This is the smallest demonstrable increment that removes the reported import bottleneck.

### Incremental Delivery

1. **US1**: Deliver the prepared-record batch calculation and measurable speedup.
2. **US2**: Lock exact compatibility across difficult data and public-call edge cases.
3. **US3**: Add phase attribution, progress validation, and failure isolation.
4. **Polish**: Prove full-suite and browser acceptance criteria, then decide the worker escalation gate from measurements.
