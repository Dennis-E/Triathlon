# Tasks: TrainingPeaks Data Import

**Input**: Design documents from `specs/053-trainingpeaks-import/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/trainingpeaks-import.md](contracts/trainingpeaks-import.md)

**Tests**: Test tasks are included because the repository constitution requires focused tests before changes to reusable import modules or dashboard behavior.

**Organization**: Tasks are grouped by the three user stories in the specification. Existing app infrastructure is sufficient; no new dependencies or server services are planned.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel without editing the same file or depending on an incomplete task.
- **[Story]**: Required for user-story tasks; omitted for setup, foundational, and polish tasks.
- All tasks name the repository file(s) they test or modify.

## Phase 1: Setup

**Purpose**: Establish the current importer test baseline before feature work.

- [X] T001 Run `npm test -- --runInBand __tests__/zip-importer.test.js __tests__/dashboard-import.test.js` and record the baseline result in [quickstart.md](quickstart.md).

---

## Phase 2: Foundational

**Purpose**: Shared blocking infrastructure required before user-story work.

The existing app has no workout database, but the data-source shift depends on verifying external parser compatibility and protecting the established analysis-counter/Firestore boundary before implementing the new import pipeline.

- [X] T002 [P] Audit existing JSZip 3.10.1, `fit-file-parser@1.10.0`, and browser `DecompressionStream` dependencies for exact load origin/version, license, known security advisories, and supported-browser compatibility; locally smoke-parse a supplied private `.FIT.gz` entry and characterize optional `.GPX.gz` companions and duplicate path/content behavior; document only aggregate outcomes and compatibility decisions in [research.md](research.md) and [quickstart.md](quickstart.md), without copying filenames/workout values/private archives into the repo.
- [X] T003 [P] Verify the import-to-counter and persistence boundary by reviewing [src/dashboard-import.js], [src/dashboard-tabs.js], [src/analysis-counter.js], and [services/api/src/app.js]; add a test in [__tests__/analysis-counter.test.js] proving the counter POST has no request body/workout fields, and inspect/test the import path for browser-persistent storage writes. Confirm Firestore remains limited to `metrics/analyses.count` and `analysisEvents.createdAt`; make no API/schema change unless evidence shows the current boundary differs.

**Checkpoint**: Dependency compatibility and the no-workout-persistence/counter boundary are documented and tested before any new import behavior is implemented.

---

## Phase 3: User Story 1 - Import TrainingPeaks history (Priority: P1) 🎯 MVP

**Goal**: Let the user select multiple TrainingPeaks ZIP files, parse FIT sessions locally, normalize supported activity data, and apply a single chronological dataset only when every selected archive succeeds.

**Independent Test**: Import two synthetic TrainingPeaks ZIPs with supported FIT sessions and confirm both periods appear chronologically; verify missing metrics remain unavailable, duplicate sessions count once, progress spans all entries, and an invalid archive leaves the currently active dataset unchanged.

### Tests for User Story 1

- [X] T004 [P] [US1] Add synthetic FIT/archive tests in [__tests__/zip-importer.test.js] for `.FIT.gz` entries, session metadata, multiple sport sessions bounded by timestamps, timestamped `.GPX.gz` route matching and ambiguity, unavailable metrics, unknown-sport skipped counts, duplicate versus distinct same-day sessions, aggregate progress, and a corrupt FIT/GZIP entry that fails the entire multi-ZIP operation while naming the archive and entry.
- [X] T005 [P] [US1] Add dashboard-import tests in [__tests__/dashboard-import.test.js] proving TrainingPeaks accepts a multi-file selection, successful normalized results apply once and trigger the existing analysis counter at most once, and cancellation/failure neither replaces the existing dataset nor triggers the counter.

### Implementation for User Story 1

- [X] T006 [US1] Extend the FIT parsing helper in [src/zip-importer.js] to expose sessions and records from the existing `fit-file-parser@1.10.0` list-mode result while preserving current Strava helper exports and record-only call behavior.
- [X] T007 [US1] Normalize each FIT session in [src/zip-importer.js] into the shared activity fields; require a valid `startTime` to create a dated activity, map only known sports to `Run`, `Bike`, or `Swim`, skip unsupported sports and increment a successful-import skipped-activity count, convert distance to kilometers once, preserve the existing numeric `0` placeholder with `distanceAvailable`/`durationAvailable` set to `false` for unavailable distance/duration, and use `null` for unavailable optional metrics; ensure consumers exclude unavailable values from aggregates and charts.
- [X] T008 [US1] Add per-session record selection and optional GPS/power enrichment in [src/zip-importer.js] so each multisport session uses only records inside its own time bounds and bike power results remain associated with that session's activity ID; parse `.GPX.gz` trackpoint timestamps and attach its route only when the time range uniquely matches one FIT session across all selected archives, otherwise leave it unattached.
- [X] T009 [US1] Implement a multi-ZIP TrainingPeaks importer in [src/zip-importer.js] that validates every selected archive, processes FIT entries sequentially, reports archive/file aggregate progress, sorts activities chronologically, deduplicates by stable source/session identity with a conservative metadata fallback, and rejects the entire operation with the archive and entry named if any archive is invalid or any contained FIT/GZIP entry cannot be read or parsed; never apply a partial dataset.
- [X] T010 [US1] Update dataset preparation/application in [src/dashboard-import.js] to keep `kind` equal to `tri-activities-v1`, accept normalized TrainingPeaks activities and their GPS/power maps, compute existing import statistics, show the skipped-unsupported-sport count in the successful import summary, keep imported data in active-session memory only, and commit the new dataset only after the multi-ZIP importer resolves successfully.
- [X] T011 [US1] Add a TrainingPeaks import action and multiple ZIP file picker in [index.html] wired to [src/dashboard-import.js]; preserve the existing Strava action and leave the active dataset unchanged when the picker is cancelled.

**Checkpoint**: US1 works independently: selecting multiple representative ZIPs builds one local dataset, and a failed selection does not partially replace dashboard state.

---

## Phase 4: User Story 2 - Continue using Strava import (Priority: P1)

**Goal**: Preserve the existing Strava ZIP workflow and its current normalized data, GPS tracks, and bike power enrichments after provider selection is added.

**Independent Test**: Import a known-good Strava fixture through the updated landing-page controls and verify the existing dataset and enrichments still load as before.

### Validation for User Story 2

- [X] T012 [US2] Run the existing Strava ZIP regression coverage in [__tests__/zip-importer.test.js] and dashboard import coverage in [__tests__/dashboard-import.test.js] after provider routing; resolve any regression in [src/zip-importer.js], [src/dashboard-import.js], or [index.html] without changing Strava CSV/`Distance` semantics.

**Checkpoint**: Both provider paths remain independently selectable; Strava's established import result is unchanged.

---

## Phase 5: User Story 3 - Find export instructions before importing (Priority: P2)

**Goal**: Make both providers discoverable from the landing page and give TrainingPeaks users clear instructions for exporting and importing more than 12 months of history.

**Independent Test**: A user can find TrainingPeaks export help, understand the 12-month archive limit, select multiple period ZIPs together, and distinguish local file processing from other app network requests.

### Tests for User Story 3

- [X] T013 [P] [US3] Add landing-page and guide assertions in [__tests__/index-script-syntax.test.js] and update data-source-neutral preview-gate expectations in [__tests__/preview-assets.test.js] for both import sources, the TrainingPeaks help link, the 12-month/multiple-ZIP guidance, and accurate local-processing privacy wording.

### Implementation for User Story 3

- [X] T014 [P] [US3] Create the source-specific export guide in [docs/trainingpeaks-export-how-to.html] with durable export concepts, the up-to-12-month archive limit, and selecting all desired period ZIPs together; do not copy private workout data into the page.
- [X] T015 [US3] Update the landing-page description and help link in [index.html] and make the import-required dashboard gate source-neutral; explain both sources, provide access to the TrainingPeaks guide, and avoid claiming the whole application is network-free.
- [X] T016 [US3] Verify the guide's exact current TrainingPeaks navigation and export labels against the provider's live export flow, then update [docs/trainingpeaks-export-how-to.html] and related assertions in [__tests__/index-script-syntax.test.js] if the provider wording differs.

**Checkpoint**: US3 is independently demonstrable from the landing page without starting an import; source-specific instructions are accurate and actionable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete privacy, documentation, and end-to-end validation across the feature.

- [X] T017 [P] Update [docs/IMPORT_FEATURE.md], [README.md], and the German/English privacy-policy copy in [index.html] to describe both providers, multi-ZIP TrainingPeaks imports, conditional visualization support, the memory-only workout-data lifecycle, and the separate counter metadata/network boundary; validate the copy in [__tests__/legal-footer.test.js].
- [X] T018 Perform manual browser validation using the scenarios and visualization matrix in [quickstart.md]; import all seven supplied private period ZIPs together (aggregate outcomes only), verify each existing dashboard against its required data/empty-state row, check FIT/GPX route matching, duplicate handling and corrupt-entry failure transaction behavior, Strava regression, no workout payload in the counter request, no browser/database persistence, and that selected workout file contents are not transmitted.
- [X] T019 Run the focused commands and full root suite listed in [quickstart.md], including `npm test -- --runInBand __tests__/zip-importer.test.js __tests__/dashboard-import.test.js __tests__/analysis-counter.test.js __tests__/index-script-syntax.test.js __tests__/legal-footer.test.js __tests__/preview-assets.test.js` and `npm test -- --runInBand`; resolve feature-related failures in the files named by those suites.

**Manual validation outcome (2026-10-12)**: All 7 supplied private archives imported successfully in the browser; 1,826 supported activities were loaded (763 Bike, 791 Run, 272 Swim), 209 unsupported sports were summarized as skipped, and 63 GPX routes were omitted as unmatched/ambiguous. Twelve of twelve dashboard tab panels displayed without a page error. The successful counter request had no body; failed corrupt-FIT import preserved the prior in-memory dataset and made no counter request. No localStorage keys or cookies were created. Outcomes are aggregate-only; no private workout data or ZIPs were committed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 establishes a test baseline.
- **Foundational (Phase 2)**: T002 dependency/source/license/security/browser/FIT smoke review and T003 privacy/database boundary tests both depend on T001 and MUST finish before US1 implementation.
- **User Story 1 (Phase 3)**: Depends on T001-T003. Tests T004-T005 should be written and confirmed failing before implementation T006-T011.
- **User Story 2 (Phase 4)**: Depends on US1 provider routing so Strava is validated through the completed selector; no separate production change is expected unless a regression is found.
- **User Story 3 (Phase 5)**: Depends on the US1 landing-page source choice. Test T013 precedes both guide creation T014 and landing-page copy/link changes T015; after T013, T014 and T015 can proceed in parallel because they modify separate files. Final provider-flow verification T016 follows the guide.
- **Polish (Phase 6)**: Depends on all desired stories; T017 documentation and T018 manual validation can proceed after feature implementation and in parallel; T019 is the final automated gate.

### User Story Dependencies

- **US1 (P1)**: Can begin after T001-T003; delivers the MVP TrainingPeaks import after dependency and persistence gates pass.
- **US2 (P1)**: Validation depends on US1 provider routing, but no feature implementation depends on US2.
- **US3 (P2)**: The landing page source choices from US1 are required; its export guide and tests are independent of the Strava regression validation.

### Within Each User Story

- Complete dependency and data-boundary gates T002-T003 before user-story implementation; write focused behavior tests first and confirm new assertions fail.
- US1 ZIP/FIT parsing and normalization tasks T006-T009 are sequential because they modify the same importer module and depend on progressively richer FIT output.
- Dataset application T010 follows the importer result contract in T009; UI wiring T011 follows the application path.
- US3 assertions T013 precede guide/copy implementation; then guide task T014, landing-page task T015, and Strava regression validation T012 can proceed independently after US1.

### Parallel Opportunities

- Foundational audits T002 and T003 can proceed in parallel: dependency research/smoke validation is separate from counter/storage tests.
- US1 test tasks T004 and T005 can proceed in parallel because they cover separate test files.
- After T011, T012 Strava regression validation and T013 landing-page test work can proceed in parallel. Once T013 is complete, T014 guide authoring and T015 landing-page implementation can proceed in parallel because they edit different files.
- T017 documentation updates and T018 manual validation can proceed in parallel after feature implementation.

---

## Parallel Example: User Story 1

```text
Task: T004 FIT archive and session behavior tests in __tests__/zip-importer.test.js
Task: T005 provider selection and dataset-application tests in __tests__/dashboard-import.test.js
```

## Parallel Example: User Story 3

After T013 passes:

```text
Task: T012 Strava regression validation in existing importer/dashboard test files
Task: T014 TrainingPeaks export guide in docs/trainingpeaks-export-how-to.html
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 and confirm the baseline.
2. Complete the dependency audit/private FIT smoke check T002 and the database/request-boundary review/tests T003; resolve compatibility or privacy findings before coding.
3. Write T004-T005 first, confirm the new tests fail, then complete T006-T011.
4. Validate the US1 independent test with two synthetic TrainingPeaks ZIP archives and a failure case.
5. **STOP and VALIDATE**: confirm local processing and dashboard rendering before moving to Strava regression and landing-page guidance.

### Incremental Delivery

1. Deliver US1 multi-ZIP TrainingPeaks import as the MVP.
2. Complete US2 regression validation to ensure Strava behavior remains unchanged.
3. Complete US3 landing-page discovery and export instructions.
4. Complete cross-cutting documentation, manual privacy checks, focused tests, and the full root test suite.

## Notes

- `[P]` tasks touch different files and have no unmet prerequisites.
- Keep raw sample ZIP archives in `private-data/`; test with synthetic FIT/session data and do not add personal exports to fixtures, logs, screenshots, or version control.
- No new dashboard visualization tab is introduced; the existing Share/Export tab rule is therefore not triggered.
- Do not silently skip a selected archive failure or classify unknown sports as Run/Bike/Swim.
