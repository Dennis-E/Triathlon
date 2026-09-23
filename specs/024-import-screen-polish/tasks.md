---

description: "Task list for Import-Screen Polish"
---

# Tasks: Import-Screen Polish

**Input**: Design documents from `/specs/024-import-screen-polish/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/import-screen.md](contracts/import-screen.md), [quickstart.md](quickstart.md)

**Organization**: Tasks are grouped by user story. Existing static-browser and Jest setup is reused; no new dependency or build setup is required.

## Phase 1: Setup

**Purpose**: Reuse the existing static app, CDN dependencies, and Jest configuration.

No project initialization tasks are required for this feature.

## Phase 2: Foundational

**Purpose**: No new shared infrastructure is required. The existing import modal, `dashboard-import.js` orchestration, and `zip-importer.js` CommonJS/browser bridge remain the integration boundaries.

No blocking foundational tasks are required.

## Phase 3: User Story 1 - Import mit Visualisierungs-Previews verfolgen (Priority: P1) 🎯 MVP

**Goal**: Während eines laufenden Imports werden vorbereitete Darstellungen bestehender TriAnalytica-Visualisierungen und wechselnde kurze Statusmeldungen angezeigt, ohne Importfortschritt oder Abschlusszustände zu beeinflussen.

**Independent Test**: Einen ausreichend langen synthetischen oder lokalen Strava-Import starten und prüfen, dass mindestens zwei vorbereitete Visualisierungen sowie zwei Statusmeldungen rotieren; danach prüfen, dass Abschluss und Fehler die Rotation stoppen.

### Tests for User Story 1

- [X] T001 [P] [US1] Add static source checks for the import preview region, preview rotation hooks, and required message examples in `__tests__/index-script-syntax.test.js`.
- [X] T002 [P] [US1] Validate preview start, rotation, and stop behavior through static import-script contract assertions in `__tests__/index-script-syntax.test.js`.

### Implementation for User Story 1

- [X] T003 [US1] Add a stable import preview region with at least two prepared existing TriAnalytica visualization representations, accessible labels, and responsive sizing in `index.html`.
- [X] T004 [US1] Add the preview/message rotation state, timer lifecycle, and short status-message list in `src/dashboard-import.js`; start it when the import modal opens and stop it on completion or error without changing import results.
- [X] T005 [US1] Connect `handleStravaIngest()` and `updateImportProgress()` in `src/dashboard-import.js` so factual progress remains separate from rotating copy and preview state is reset for each import.

**Checkpoint**: User Story 1 is independently demonstrable when a long-running import shows changing prepared previews/messages and a completed or failed import leaves no active rotation.

## Phase 4: User Story 2 - Importfortschritt eindeutig lesen (Priority: P1)

**Goal**: The import modal presents one main headline, the progress bar, and one black detail box containing the current detailed stage/activity, with no duplicate status headline.

**Independent Test**: Inspect the active modal at desktop and narrow viewport widths and verify exactly one main headline, one progress bar, and one black detail box; verify the current stage appears only in the detail box.

### Tests for User Story 2

- [X] T006 [P] [US2] Extend import modal markup assertions in `__tests__/index-script-syntax.test.js` to require one main import headline, the progress bar, the black detail box, and no second status headline.
- [X] T007 [P] [US2] Validate the `updateImportProgress()` detail-only status contract through static source assertions in `__tests__/index-script-syntax.test.js`.

### Implementation for User Story 2

- [X] T008 [US2] Remove the duplicate stage/status headline from the import modal and place the prepared preview region without disrupting the existing headline, progress bar, or black detail box in `index.html`.
- [X] T009 [US2] Update `updateImportProgress()` in `src/dashboard-import.js` so the factual stage/activity is written only to `#importProgressDetail`, while completion and error transitions preserve the existing close/error behavior.
- [X] T010 [US2] Add responsive layout constraints and accessible text/labels for the import headline, progress bar, detail box, and preview region in `index.html` so they do not overlap on desktop or mobile widths.

**Checkpoint**: User Story 2 is independently testable when the modal has exactly one headline and the detailed current activity appears only in the black box at supported viewport widths.

## Phase 5: User Story 3 - GPS-Track einmalig ausweisen (Priority: P1)

**Goal**: Each imported activity with GPS points receives exactly one track containing only its own FIT session records; multisport child activities never receive the complete source track.

**Independent Test**: Feed synthetic FIT records and five session time ranges into the importer and verify five independent track entries with no cross-session points, one entry per eligible activity, and no entry for an activity without GPS points.

### Tests for User Story 3

- [X] T011 [P] [US3] Add synthetic timestamped FIT records for Swim, T1, Bike, T2, and Run plus expected per-session GPS points in `__tests__/zip-importer.test.js`.
- [X] T012 [US3] Add failing coverage for a multisport FIT source proving each child activity receives only points within its inclusive session interval and the full source track is never copied in `__tests__/zip-importer.test.js`.
- [X] T013 [P] [US3] Add regression coverage in `__tests__/zip-importer.test.js` for one normal FIT activity, no-GPS sessions, GPX extraction, and single-pass FIT power extraction remaining unchanged.

### Implementation for User Story 3

- [X] T014 [US3] Add a reusable timestamp/session segmentation helper in `src/zip-importer.js` that accepts FIT records and activity session ranges, uses inclusive start/end boundaries, and returns only each activity's records.
- [X] T015 [US3] Derive FIT activity session ranges from the imported activity metadata in `src/zip-importer.js`, preserving normalized `Run`, `Bike`, and `Swim` values and treating unknown sports as unclassified rather than silently remapping them.
- [X] T016 [US3] Update `extractGpsAndPowerFromZip()` in `src/zip-importer.js` to segment records before simplification, create at most one `gpsTracksByActivityId` entry per activity with GPS points, and derive bike power from the appropriate records without parsing the FIT file twice.
- [X] T017 [US3] Preserve the existing GPS track shape and dashboard aggregation contract while ensuring the track counter/display consumes activity-keyed entries exactly once in `src/zip-importer.js` and the existing heatmap integration.

**Checkpoint**: User Story 3 is independently testable when normal FIT/GPX imports still work and multisport FIT records produce only their own activity segments with no duplicate GPS entries.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature across UI, import logic, responsive behavior, and existing regressions.

- [X] T018 [P] Update `specs/024-import-screen-polish/quickstart.md` with the final selectors/fixture assumptions used by the implementation and manual validation steps.
- [X] T019 Run `npm test -- --runInBand __tests__/zip-importer.test.js` and resolve any GPS segmentation or FIT regression failures in `src/zip-importer.js` and `__tests__/zip-importer.test.js`.
- [X] T020 Run `npm test -- --runInBand` and resolve only feature-related regressions in `index.html`, `src/dashboard-import.js`, `src/zip-importer.js`, `__tests__/index-script-syntax.test.js`, and `__tests__/dashboard-import.test.js`.
- [X] T021 Serve the app with `python -m http.server 8000` and validate the static page contract, preview markup, single-headline layout, and completion/error source paths against `specs/024-import-screen-polish/contracts/import-screen.md`.
- [X] T022 [P] Review changed UI copy in `index.html` and `src/dashboard-import.js` for precise local-processing/privacy wording and ensure no raw personal export is added to the repository.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; no new setup work is required.
- **Foundational (Phase 2)**: No blocking shared infrastructure is required.
- **User Story 1 (Phase 3)**: Can begin immediately; T001/T002 should be written before T003-T005.
- **User Story 2 (Phase 4)**: T006/T007 should be written before T008-T010; shares the import modal files with US1, so execute after US1 UI edits or coordinate carefully.
- **User Story 3 (Phase 5)**: Can proceed in parallel with the UI stories after T011-T013 are prepared; it owns `src/zip-importer.js` and `__tests__/zip-importer.test.js`.
- **Polish (Phase 6)**: Depends on the desired user stories being complete; run focused tests before the full suite and manual browser validation.

### User Story Dependencies

- **US1 (P1)**: Independent; establishes the preview lifecycle used by the import modal.
- **US2 (P1)**: Functionally independent, but shares `index.html` and `src/dashboard-import.js` with US1; integrate after or carefully merge with US1.
- **US3 (P1)**: Independent of UI stories; changes FIT/GPS extraction and its tests only.

### Parallel Opportunities

- T001 and T002 can run in parallel because they target separate test concerns.
- T006 and T007 can run in parallel because they target markup and progress behavior separately.
- T011 and T013 can run in parallel before T012's multisport assertions are added.
- The UI work in US1/US2 and GPS work in US3 can be developed in parallel after their test tasks are established.
- T018 and T022 can run in parallel with final automated test execution.

## Parallel Example: User Story 1

```text
Task: T001 Add import preview source checks in __tests__/index-script-syntax.test.js
Task: T002 Add preview lifecycle behavior coverage in __tests__/dashboard-import.test.js
```

## Parallel Example: User Story 3

```text
Task: T011 Add timestamped multisport FIT fixtures in __tests__/zip-importer.test.js
Task: T013 Add normal FIT/GPX/power regression coverage in __tests__/zip-importer.test.js
```

## Implementation Strategy

### MVP First

1. Complete US1 preview rotation and message behavior.
2. Validate US1 with its focused tests and a long-running import.
3. Add US2's single-headline/detail-box cleanup and validate the complete modal.
4. Add US3's FIT segmentation and GPS uniqueness correction with focused importer tests.
5. Run the full root suite and manual quickstart validation.

### Incremental Delivery

1. UI preview rotation provides the first visible import improvement.
2. Modal status cleanup removes duplicate information without changing import completion behavior.
3. FIT session segmentation corrects GPS data integrity and counter accuracy.
4. Cross-cutting validation confirms the three P1 stories work together.

## Notes

- Every task uses the required `- [ ] T### [P?] [Story?] description` checklist format and includes a concrete file path.
- Tests are included because the project constitution requires narrowest-scope verification for dashboard/importer behavior.
- Do not commit private Strava exports; use synthetic FIT records or explicitly supplied local fixtures.
