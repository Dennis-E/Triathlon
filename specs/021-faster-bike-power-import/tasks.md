---

description: "Task list template for feature implementation"
---

# Tasks: Faster Bike Power Import

**Input**: Design documents from `/specs/021-faster-bike-power-import/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: Included. Constitution III (Narrowest-Scope Test-First Verification, NON-NEGOTIABLE) and FR-002/SC-003 require proving output is unchanged, so regression/characterization tests are part of each relevant story below.

**Organization**: Tasks are grouped by user story (from [spec.md](./spec.md)) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task includes an exact file path

## Path Conventions

Single project (per [plan.md](./plan.md) Structure Decision): `src/`, `__tests__/` at repository root. All work is confined to `src/zip-importer.js` and `__tests__/zip-importer.test.js`; no other module or service is touched.

## Phase 1: Setup

**Purpose**: Establish a known-good baseline before making changes

- [X] T001 Run `npm test` at the repository root and confirm all suites pass, to establish the pre-change baseline for [__tests__/zip-importer.test.js](../../__tests__/zip-importer.test.js) and [__tests__/power-pb-utils.test.js](../../__tests__/power-pb-utils.test.js)

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by all user stories

No shared infrastructure changes are required beyond Setup: this feature only restructures the internal FIT-processing control flow of `src/zip-importer.js`, and that restructuring is itself delivered as part of User Story 1 below. Proceed directly to Phase 3.

**Checkpoint**: None required — continue to User Story 1.

---

## Phase 3: User Story 1 - Faster bike power extraction during import (Priority: P1) 🎯 MVP

**Goal**: Eliminate the duplicate FIT read/decompress/parse pass for bike activities so bike power extraction is measurably faster, with identical GPS tracks, power efforts, and personal bests.

**Independent Test**: Import a ZIP with 50-200 bike activities with power data; verify the FIT parser runs once per bike activity file and the resulting GPS tracks and power efforts are unchanged versus the pre-change baseline.

### Tests for User Story 1

- [X] T002 [P] [US1] Add a test in [__tests__/zip-importer.test.js](../../__tests__/zip-importer.test.js) that spies on the FIT parsing entry point (`parseFitRecords`/`FitParserCtor.parse`) and asserts it is called exactly once per bike activity FIT file when both GPS tracks and power efforts are requested for the same import (covers FR-001/FR-006)
- [X] T003 [P] [US1] Add a test in [__tests__/zip-importer.test.js](../../__tests__/zip-importer.test.js) that imports a fixture ZIP with bike activities and asserts `gpsTracksByActivityId` output is byte-identical to the current (pre-change) `extractGpsTracksFromZip` output (covers FR-002/SC-003)
- [X] T004 [P] [US1] Add a test in [__tests__/zip-importer.test.js](../../__tests__/zip-importer.test.js) that imports the same fixture ZIP and asserts `fitBestEffortsByActivityId` output is byte-identical to the current (pre-change) `extractFitPowerEffortsFromZip` output (covers FR-002/SC-003)
- [X] T005 [P] [US1] Add a test in [__tests__/zip-importer.test.js](../../__tests__/zip-importer.test.js) covering a ZIP with no bike activities / no power data, asserting the bike power extraction path performs no extra FIT parsing and returns an empty result (covers FR-003/FR-005/SC-004, and the corrupted/missing-file edge case continuing to be skipped)

### Implementation for User Story 1

- [X] T006 [US1] In [src/zip-importer.js](../../src/zip-importer.js), extract a shared per-file helper (e.g. `readAndParseFitFile(zip, filename)`) that reads the ZIP entry bytes, gunzips via `gunzipUint8Array` when the filename ends in `.gz`, loads the FIT parser via `ensureFitParserLoaded`, and returns the parsed `records` array — reusing the existing logic currently duplicated across `extractGpsTracksFromZip` and `extractFitPowerEffortsFromZip`
- [X] T007 [US1] In [src/zip-importer.js](../../src/zip-importer.js), add a combined extraction function (e.g. `extractGpsAndPowerFromZip(zip, rawCsvText, activitySportById, reportProgress)`) that iterates the GPS-file map once, calls `readAndParseFitFile` (T006) at most once per file, derives `gpsTracksByActivityId` via the existing `extractFitTrackpoints`/`extractGpxTrackpoints`/`simplifyTrackPoints` logic, and additionally derives `fitBestEffortsByActivityId` via the existing `buildFitPowerEfforts(records)` for FIT files belonging to `Bike` activities, without re-reading or re-parsing those files
- [X] T008 [US1] In [src/zip-importer.js](../../src/zip-importer.js), update `importStravaZip` to call the new combined function (T007) once instead of calling `extractGpsTracksFromZip` and `extractFitPowerEffortsFromZip` separately, while keeping the returned shape (`{ csvText, fitBestEffortsByActivityId, gpsTracksByActivityId }`) unchanged
- [X] T009 [US1] In [src/zip-importer.js](../../src/zip-importer.js), keep `extractGpsTracksFromZip` and `extractFitPowerEffortsFromZip` exported with unchanged signatures (reimplemented in terms of the shared helper from T006 where practical) so existing standalone callers/tests of those two functions keep working per the Constitution's public-API preservation rule
- [X] T010 [US1] Run `npm test` and confirm the new tests (T002-T005) pass and all pre-existing tests in [__tests__/zip-importer.test.js](../../__tests__/zip-importer.test.js) and [__tests__/power-pb-utils.test.js](../../__tests__/power-pb-utils.test.js) still pass unchanged

**Checkpoint**: At this point, bike power import runs a single FIT parse pass per bike activity file, with verified byte-identical output — User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Accurate progress feedback during import (Priority: P2)

**Goal**: Progress percentage/stage messages advance smoothly and accurately across the now-combined GPS+power extraction loop, instead of two separately-reported phases.

**Independent Test**: Import a ZIP with multiple bike activities and observe that `reportProgress` calls advance monotonically and reach 100% on completion, with no long pause between GPS and power extraction.

### Tests for User Story 2

- [X] T011 [P] [US2] Add a test in [__tests__/zip-importer.test.js](../../__tests__/zip-importer.test.js) that captures all `reportProgress` calls during an import with bike activities and asserts the reported `percent` values are non-decreasing and end at (or above) the value reported before "Finalizing..." (covers FR-004)

### Implementation for User Story 2

- [X] T012 [US2] In [src/zip-importer.js](../../src/zip-importer.js), update the combined extraction function (T007) to call `reportProgress({ percent, stage })` once per file processed within the single combined loop, replacing the previous two separate progress ranges (~40-90% GPS, ~90-95% power) with one continuous range that reflects the actual combined work, and update the `stage` message to describe both GPS and power extraction where applicable
- [X] T013 [US2] Run `npm test` and confirm the new progress test (T011) passes and existing progress-related tests (e.g. `extractGpsTracksFromZip`'s `onProgress` test) still pass

**Checkpoint**: Progress reporting now reflects the combined extraction loop — User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Import remains responsive for large histories (Priority: P3)

**Goal**: Confirm the combined extraction loop keeps yielding control (via existing `await` points) so the browser tab stays responsive during large imports, now that redundant parsing work has been removed.

**Independent Test**: Import a large synthetic export (500+ activities, many bike activities with power data) and confirm processing completes without introducing any new synchronous, non-yielding loop over multiple files.

### Tests for User Story 3

- [X] T014 [P] [US3] Add a test in [__tests__/zip-importer.test.js](../../__tests__/zip-importer.test.js) using a fixture ZIP with a larger synthetic set of bike activities (e.g. 50+ generated FIT entries) that asserts the combined extraction function (T007) completes successfully and still reports progress for each file, as a regression guard against reintroducing a blocking all-at-once pattern

### Implementation for User Story 3

- [X] T015 [US3] Review the combined loop in [src/zip-importer.js](../../src/zip-importer.js) (T007) to confirm each file's `await` calls (ZIP read, gunzip, FIT parse) remain per-iteration `await`s rather than being batched into a single synchronous pass, preserving the existing responsiveness characteristics while removing only the duplicate parse

**Checkpoint**: All three user stories are independently functional; large imports remain responsive with no duplicated FIT parsing.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all user stories

- [X] T016 Run `npm test` at the repository root and confirm the full suite passes with no regressions (final gate per Constitution III)
- [ ] T017 Execute the manual validation steps in [quickstart.md](./quickstart.md), including the SC-001 (≥50% reduction) and SC-002 (within ~10% of GPS-only baseline) timing comparisons, using a local (non-versioned) Strava export — **requires a real, local Strava export ZIP and is left for the user to run**, per the repository's rule that personal export data stays local and out of version control
- [X] T018 [P] Update code comments in [src/zip-importer.js](../../src/zip-importer.js) only where the new combined extraction flow is not self-evident from the code (per repository comment conventions — one short line, no restating of obvious logic)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Empty for this feature - proceed directly to Phase 3
- **User Story 1 (Phase 3)**: Depends on Phase 1 only - delivers the core fix (MVP)
- **User Story 2 (Phase 4)**: Depends on Phase 3 (T007's combined loop must exist before its progress reporting can be refined)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (T007's combined loop must exist to review); independent of Phase 4
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - can ship alone as the MVP
- **User Story 2 (P2)**: Builds on the combined loop introduced by US1, but is independently testable (progress behavior can be verified without re-verifying US1's parse-count fix)
- **User Story 3 (P3)**: Builds on the combined loop introduced by US1, independently testable from US2

### Within Each User Story

- Tests (T002-T005, T011, T014) MUST be written and FAIL before their corresponding implementation tasks
- Shared helper (T006) before the combined function (T007)
- Combined function (T007) before `importStravaZip` integration (T008)
- Backward-compatible exports (T009) after the combined function exists
- Story validation (T010, T013) after that story's implementation tasks

### Parallel Opportunities

- T002, T003, T004, T005 (all US1 tests, different assertions in the same file but independent test cases) can be authored in parallel
- T011 (US2 test) and T014 (US3 test) can be authored in parallel with each other once T007 exists
- T017 and T018 (Polish) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Author all User Story 1 tests together (same file, independent test blocks):
Task: "Add FIT-parser-called-once test in __tests__/zip-importer.test.js"
Task: "Add GPS-tracks-unchanged test in __tests__/zip-importer.test.js"
Task: "Add power-efforts-unchanged test in __tests__/zip-importer.test.js"
Task: "Add no-bike-activities edge case test in __tests__/zip-importer.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline test run)
2. Phase 2: Foundational is empty - no action needed
3. Complete Phase 3: User Story 1 (shared FIT parse, combined extraction, `importStravaZip` wiring, preserved exports)
4. **STOP and VALIDATE**: Run `npm test` (T010) and manually import a bike-heavy export to confirm the "Extracting bike power" phase is visibly faster with unchanged results
5. This alone resolves the reported slowness (SC-001/SC-002/SC-003) and can ship independently

### Incremental Delivery

1. Ship User Story 1 → immediate performance fix, biggest user-visible win
2. Add User Story 2 → refined, accurate progress reporting on top of the faster loop
3. Add User Story 3 → regression guard confirming responsiveness holds for large imports
4. Finish with Phase 6 Polish → final full-suite run and manual SC-001/SC-002 timing validation
