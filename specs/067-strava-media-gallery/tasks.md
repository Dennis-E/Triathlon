---

description: "Task list for Strava Media Gallery"
---

# Tasks: Strava Media Gallery

**Input**: Design documents from `specs/067-strava-media-gallery/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/media-gallery-ui.md`, `quickstart.md`

**Tests**: Focused tests are included because the specification requires automated verification and the project constitution requires focused verification for dashboard/tab changes.

**Organization**: Tasks are grouped by the three independently testable user stories. User Story 2 depends on the imported media library from User Story 1; User Story 3 depends on the gallery selection and preview from User Story 2.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Provide safe synthetic media import data for automated tests; private exports remain local and untracked.

- [X] T001 Create a synthetic ZIP fixture builder for activity references, media manifest rows, JPG/MP4 entries, and missing/corrupt/duplicate cases in `__tests__/fixtures/strava-media-export.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define reusable, testable media identity, status, and filter behavior before integrating ZIP and dashboard flows.

- [X] T002 Add failing unit tests for filename normalization, exact-match uniqueness, reference/file statuses, date provenance, and filter predicates in `__tests__/media-utils.test.js`
- [X] T003 Implement the dual-target media utility for exact reference reconciliation, status accounting, date provenance, and filters in `src/media-utils.js`

**Checkpoint**: The shared media rules pass in Node tests and are available to browser scripts through the established module bridge.

---

## Phase 3: User Story 1 - Strava-Medien mit einmaligem Import verfügbar machen (Priority: P1)

**Goal**: Import and validate supported Strava media once, expose readable media during the same page session, and keep training import functional when media fails.

**Independent Test**: Import a synthetic Strava ZIP once; verify every activity reference, manifest row, and discovered archive file has a status, only exact unique matches are linked, the media tab appears only when readable media exists, and invalid media do not block training activities or TrainingPeaks imports.

### Tests for User Story 1

- [X] T004 [P] [US1] Add failing ZIP importer tests for media manifest discovery, exact matches, missing/ambiguous references, unsupported/corrupt entries, and reconciled counts in `__tests__/zip-importer.test.js`
- [X] T005 [P] [US1] Add failing dataset tests for attaching Strava media, releasing resources on dataset replacement, and leaving TrainingPeaks media-free in `__tests__/dashboard-import.test.js`
- [X] T006 [P] [US1] Add failing availability tests for readable media, no readable media, and TrainingPeaks datasets in `__tests__/visualization-availability.test.js`
- [X] T007 [P] [US1] Add failing tab registry tests for the media tab IDs, visibility, and selection behavior in `__tests__/tab-navigation.test.js`
- [X] T008 [P] [US1] Add failing basic gallery tests for readable media, unassigned status, and missing/corrupt states in `__tests__/dashboard-media.test.js`

### Implementation for User Story 1

- [X] T009 [US1] Read `media.csv` and activity media references, compare complete filenames exactly, and account for every reference and archive media entry in `src/zip-importer.js`
- [X] T010 [US1] Return a session-only media inventory with lazy entry readers and a readable-media flag from `importStravaZip()` in `src/zip-importer.js`
- [X] T011 [US1] Attach the media library only to Strava datasets and release the prior library when replacing the active dataset in `src/dashboard-import.js`
- [X] T012 [US1] Gate media tab availability on at least one readable supported asset in `src/visualization-availability.js`
- [X] T013 [US1] Register the media tab order, button ID, and panel ID in `src/tab-navigation.js`
- [X] T014 [US1] Add the conditional media tab button/panel, renderer dispatch, and correct script load order in `index.html` and `src/dashboard-tabs.js`
- [X] T015 [US1] Render a basic on-demand media grid and larger local preview with readable import statuses in `src/dashboard-media.js` and `index.html`
- [X] T016 [US1] Run the User Story 1 test suites and reconcile the local reference ZIP without logging filenames, captions, or media content using `specs/067-strava-media-gallery/quickstart.md`

**Checkpoint**: A Strava user selects one ZIP, opens readable media in the same session, and retains working training views even when individual media fail validation.

---

## Phase 4: User Story 2 - Medien und zugehörige Aktivitäten durchsuchen (Priority: P1)

**Goal**: Browse media chronologically, filter by year/sport/activity, inspect media, and reach uniquely associated activity details/routes.

**Independent Test**: Use a synthetic multi-year/multi-sport library with linked, unlinked, undated, and video assets; verify filters, empty/loading/error states, activity navigation, keyboard operation, and explicit-only video playback.

### Tests for User Story 2

- [X] T017 [P] [US2] Add failing filter and date-provenance tests for year, sport, activity, unassigned, undated, and empty results in `__tests__/media-utils.test.js`
- [X] T018 [P] [US2] Add failing gallery interaction tests for keyboard controls, loading/error states, activity/route navigation, and video no-autoplay behavior in `__tests__/dashboard-media.test.js`

### Implementation for User Story 2

- [X] T019 [US2] Implement stable chronological ordering and year/sport/activity/unassigned filter predicates without inferred associations in `src/media-utils.js`
- [X] T020 [US2] Add filter controls, result counts, empty/loading/failed states, visible focus, and accessible labels to the gallery in `src/dashboard-media.js` and `index.html`
- [X] T021 [US2] Add larger media preview, uniquely linked activity/route navigation, and explicit video playback controls in `src/dashboard-media.js` and `index.html`
- [X] T022 [US2] Verify User Story 2 filter, accessibility, and 1,000-item preview performance criteria using `__tests__/dashboard-media.test.js` and `specs/067-strava-media-gallery/quickstart.md`

**Checkpoint**: Users can find and inspect media without fabricated dates or activity links, and videos never start automatically.

---

## Phase 5: User Story 3 - Jahresrückblick und Collagen lokal exportieren (Priority: P2)

**Goal**: Create selected/filter-based annual views and collages, preview them, and export locally while protecting route and photo-location privacy.

**Independent Test**: Create a recap and collage from selected assets; verify local preview/download, route exclusion by default, explicit route opt-in, and removal of embedded photo location metadata in both cases.

### Tests for User Story 3

- [X] T023 [P] [US3] Add failing media export title, filename, and output metadata tests in `__tests__/export-utils.test.js`
- [X] T024 [P] [US3] Add failing media capture/no-data/download and route-privacy tests in `__tests__/dashboard-export-download.test.js`

### Implementation for User Story 3

- [X] T025 [US3] Register media gallery export title, filename slug, and export metadata in `src/export-utils.js`
- [X] T026 [US3] Expose the existing Share/Export action and register the gallery capture target, data/no-data gate, and selected filter context in `src/dashboard-export.js` and `index.html`
- [X] T027 [US3] Add annual recap and selected/filter-based collage composition with a local preview in `src/dashboard-media.js` and `index.html`
- [X] T028 [US3] Rasterize exports locally, exclude routes by default, require explicit route inclusion, and strip embedded source-photo location metadata in `src/dashboard-export.js` and `src/dashboard-media.js`
- [X] T029 [US3] Run User Story 3 export/privacy tests and verify the downloaded image has no embedded source-photo location metadata using `__tests__/dashboard-export-download.test.js` and `specs/067-strava-media-gallery/quickstart.md`

**Checkpoint**: Recaps and collages use the established local preview/download flow, never upload source media, and do not leak embedded photo location metadata.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Document the behavior and verify regressions across the existing import/export surfaces.

- [X] T030 [P] Document supported Strava media, session-only handling, and accurate local-processing privacy wording in `docs/IMPORT_FEATURE.md`
- [X] T031 Run the full focused regression set for Strava, TrainingPeaks, tabs, exports, and script loading listed in `specs/067-strava-media-gallery/quickstart.md`
- [X] T032 Complete all manual browser scenarios and confirm the private reference ZIP and derived media remain untracked using `specs/067-strava-media-gallery/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; provides synthetic fixtures.
- **Foundational (Phase 2)**: Depends on T001 and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2; establishes import, session library, conditional tab, and basic preview.
- **User Story 2 (Phase 4)**: Depends on User Story 1's media library and basic renderer.
- **User Story 3 (Phase 5)**: Depends on User Story 2's selection and preview behavior.
- **Polish (Phase 6)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2; no dependency on another story.
- **US2 (P1)**: Requires US1's validated in-memory library and media tab.
- **US3 (P2)**: Requires US2's filters, selection, and preview.

### Parallel Opportunities

- **US1**: T004-T008 can be authored in parallel after T001/T003 because they cover separate test files and boundaries.
- **US2**: T017 and T018 can be authored in parallel after US1 because utility/filter and DOM interaction tests are separate files.
- **US3**: T023 and T024 can be authored in parallel after US2 because export utility and capture-flow tests are separate files.
- The story phases themselves are sequential because each later story consumes the previous story's media library or selection state.

## Parallel Example: User Story 1

```text
Task: T004 ZIP reconciliation tests in __tests__/zip-importer.test.js
Task: T005 dataset lifecycle tests in __tests__/dashboard-import.test.js
Task: T006 media availability tests in __tests__/visualization-availability.test.js
Task: T007 media tab registry tests in __tests__/tab-navigation.test.js
Task: T008 basic gallery tests in __tests__/dashboard-media.test.js
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Setup and Foundational phases.
2. Complete US1: strict import reconciliation, visible statuses, in-memory lifecycle, conditional tab, and basic media preview.
3. Validate US1 independently using synthetic ZIP fixtures and the focused Jest suites; then manually reconcile the private reference ZIP.
4. Stop for review before proceeding to filters and exports.

### Incremental Delivery

1. Complete US1 and validate import isolation and media availability.
2. Add US2 filters, activity context, keyboard/accessibility states, and on-demand preview; validate independently.
3. Add US3 recap/collage export and location privacy; validate PNG output locally.
4. Run regression checks for Strava, TrainingPeaks, existing tabs, and existing exports.

## Notes

- Every task follows `- [ ] T### [P?] [US#?] Description with file path`; story tasks carry their story label and setup/foundational/polish tasks do not.
- Tests precede the implementation they protect. Run focused Jest commands after each story slice; browser-only behavior is verified with the manual scenarios in `quickstart.md`.
- The private reference ZIP is a local validation input only. Do not add it or derived media to fixtures or version control.