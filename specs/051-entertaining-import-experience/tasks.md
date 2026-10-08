# Tasks: Entertaining Import Experience

**Input**: Design documents from `specs/051-entertaining-import-experience/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/import-experience-ui.md, quickstart.md

**Organization**: Tasks are grouped by the three independently testable user stories. Tests are included because the specification requires focused tests for rotation, eligibility, cleanup, and progress accuracy.

## Phase 1: Setup

**Purpose**: Establish the shared message-catalog boundary without changing import behavior.

- [X] T001 Create the dual-target catalog module scaffold and its stable catalog API in `src/import-experience-catalog.js`.

## Phase 2: Foundational

**Purpose**: Wire shared feature entry points before story-specific behavior.

- [X] T002 [P] Add the catalog script tag before `dashboard-import.js` and reserve a stable message/illustration region in the existing import modal in `index.html`.
- [X] T003 [P] Add static wiring assertions for catalog-before-import script order and import experience modal anchors in `__tests__/index-script-syntax.test.js`.

**Checkpoint**: Catalog is available to the import orchestrator and the modal has testable presentation anchors; no story logic is complete yet.

## Phase 3: User Story 1 - Follow an entertaining import (Priority: P1) 🎯 MVP

**Goal**: Show the twenty triathlon messages with their matched local illustrations, randomized without repeats, while preserving the existing factual progress UI.

**Independent Test**: Run a synthetic local import that remains open for multiple message intervals; verify message/illustration pairing, a full no-repeat cycle, readable responsive presentation, reduced-motion behavior, and unchanged completion.

### Tests for User Story 1

- [X] T004 [P] [US1] Add unit tests for the 20 stable message IDs, per-session shuffled order, no-repeat behavior, and message/illustration pairing in `__tests__/import-experience.test.js`.
- [X] T005 [P] [US1] Extend static markup tests for all message illustration paths, responsive message anchors, and reduced-motion hooks in `__tests__/index-script-syntax.test.js`.

### Implementation for User Story 1

- [X] T006 [US1] Define the twenty exact humorous message strings, stable IDs `message-01` through `message-20`, visual concepts, local SVG paths, and finalization eligibility for message 20 in `src/import-experience-catalog.js`.
- [X] T007 [P] [US1] Create one locally loaded, lightweight SVG scene for each message ID `message-01` through `message-20` under `assets/import-illustrations/`; each scene must have its own relevant concept and an internal `prefers-reduced-motion: reduce` fallback.
- [X] T008 [US1] Replace the five-second preview rotation with a 7–10-second per-import shuffled no-repeat message rotation and synchronized local illustration rendering in `src/dashboard-import.js`.
- [X] T009 [P] [US1] Add stable, accessible message and illustration markup with reserved layout space and subtle opacity transition styling in `index.html`.
- [X] T010 [US1] Stop message timers and detach visibility/lifecycle handlers on import success, failure, modal close, teardown, and replacement import in `src/dashboard-import.js`.
- [X] T011 [US1] Run the focused story tests and complete the synthetic local-import, mobile layout, and reduced-motion checks from `specs/051-entertaining-import-experience/quickstart.md`.

**Checkpoint**: User Story 1 is independently usable with generic copy and matching art; import processing and its existing final/error states remain intact.

## Phase 4: User Story 2 - See personal observations based on imported data (Priority: P2)

**Goal**: Add data-personalized messages only for reliable completed import statistics, using real imported values and existing formatting conventions.

**Independent Test**: Use synthetic processed-activity arrays with complete, partial, missing, and unknown-sport metrics; compare each displayed candidate with expected values and verify unsupported candidates are omitted.

**Dependency**: Starts after US1 because the completed candidate queue/catalog and illustration pairing are extended by the personal entries.

### Tests for User Story 2

- [X] T012 [US2] Add synthetic fixture tests for activity count, complete Bike distance, earliest/latest activity-year range, distinct case-insensitive Run equipment labels, longest ride, Swim count, and suppression of missing/partial metrics in `__tests__/import-experience.test.js`.
- [X] T013 [US2] Add tests that newly available personal candidates join the remaining rotation without re-adding shown IDs or restarting the active session in `__tests__/import-experience.test.js`.

### Implementation for User Story 2

- [X] T014 [US2] Derive activity count, Swim count, inclusive calendar-year endpoints, distinct trimmed/case-insensitive non-placeholder Run equipment labels, complete Bike distance, and longest ride in one pass over the final processed activity array in `src/import-experience-catalog.js`; omit any metric whose stated source completeness rule fails.
- [X] T015 [US2] Add personal message templates using only eligible computed values and existing application number/distance formatting, and map each personal entry to the closest matching local SVG in `src/import-experience-catalog.js`.
- [X] T016 [US2] Add eligible personal candidates after CSV processing completes, without copying the activity array or re-reading ZIP/CSV/FIT/GPX data, in `src/dashboard-import.js`.
- [X] T017 [US2] Run focused personal-statistic tests and verify fixture values and missing-data suppression using `specs/051-entertaining-import-experience/quickstart.md`.

**Checkpoint**: Personal messages are optional and reliable; generic US1 rotation remains functional for datasets with no eligible personal metrics.

## Phase 5: User Story 3 - Trust progress and privacy feedback (Priority: P1)

**Goal**: Keep progress factual, provide periodic precise privacy reassurance, gate the final message on actual finalization, and stop all experience resources at every terminal state.

**Independent Test**: Exercise a synthetic successful import, an error, a short import, a finalization-phase import, and a consecutive second import; verify actual progress values, no 95%→70% regression, privacy reminder cadence, message-20 gating, no training-data transmission, and cleanup.

**Dependency**: Starts after US1 because it modifies the import modal's existing message/session lifecycle; consumes US2 humorous-message events for reminder cadence where US2 is enabled.

### Tests for User Story 3

- [X] T018 [P] [US3] Add tests that privacy reminders appear after every four humorous entries as secondary copy, do not consume message IDs, and use only the approved local-processing wording in `__tests__/import-experience.test.js`.
- [X] T019 [P] [US3] Add import orchestration tests for actual percentage retention during stage-only updates, no invented initial/CSV phase percentage, finalization-only message 20 eligibility, and timer cleanup on success/error/restart in `__tests__/dashboard-import.test.js`.

### Implementation for User Story 3

- [X] T020 [US3] Add the privacy reassurance text as a recurring secondary reminder after four generic or personalized humorous messages without replacing the current message/illustration in `src/import-experience-catalog.js`.
- [X] T021 [US3] Wire privacy cadence and explicit whole-application finalization eligibility to the current import session without using percentage thresholds in `src/dashboard-import.js`.
- [X] T022 [US3] Initialize progress at 0% before the first ZIP callback, preserve the last percentage for stage-only updates, remove the hard-coded post-ZIP 70% regression, and hide duplicate stage text in the detail box except on errors in `src/dashboard-import.js`; retain actual callback percentages and update stage text independently.
- [X] T023 [US3] Correct live-region behavior so only changing message/reminder text is announced politely and the illustration is decorative or has a concise accessible alternative in `index.html`.
- [X] T024 [US3] Run focused progress/privacy/lifecycle tests and the successful, failed, short, and consecutive-import checks in `specs/051-entertaining-import-experience/quickstart.md`.

**Checkpoint**: Progress reflects actual reported values, reminders are accurate, message 20 is phase-gated, and session resources cannot survive completion/error/restart.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify integrated performance, accessibility, privacy boundaries, and maintainability across all stories.

- [X] T025 Verify each catalog asset path resolves locally, each of the twenty SVGs has a reduced-motion fallback, and no illustration references a remote asset in `__tests__/index-script-syntax.test.js`.
- [X] T026 Run the complete focused Jest set for `__tests__/import-experience.test.js`, `__tests__/dashboard-import.test.js`, and `__tests__/index-script-syntax.test.js`.
- [X] T027 Compare a representative import with the baseline and verify the feature adds no parse pass and no more than 5% processing-duration overhead using the measurement procedure in `specs/051-entertaining-import-experience/quickstart.md`.
- [X] T028 Complete the narrow-viewport, browser-console, reduced-motion, privacy-copy, and local-network-boundary manual checks in `specs/051-entertaining-import-experience/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; creates the shared catalog boundary.
- **Foundational (Phase 2)**: Depends on T001; the script and markup anchors must exist before story integration.
- **US1 (Phase 3)**: Depends on Phase 2; delivers the first complete usable experience and is the MVP.
- **US2 (Phase 4)**: Depends on US1's catalog/session queue so eligible personal entries can be inserted without restarting the cycle.
- **US3 (Phase 5)**: Depends on US1's message/modal lifecycle. Reminder cadence also counts US2 personalized humorous entries; when implementing US3 before US2, count only generic entries and extend the same counter after US2.
- **Polish (Phase 6)**: Depends on all selected stories; representative baseline comparison requires an unchanged fixture and import path.

### User Story Completion Order

`US1 → US2 → US3 → Polish` is the recommended sequence because US1 and US3 share `dashboard-import.js` and modal markup, while US2 extends US1's candidate catalog. US1 and US3 are both P1; US1 is the MVP, and US3 is required for a complete privacy/progress release. If work is split across contributors, coordinate changes to `dashboard-import.js`, `index.html`, and `src/import-experience-catalog.js` rather than editing those same files in parallel.

### Parallel Opportunities

- T002 and T003 can proceed in parallel after T001 because they edit separate files.
- Within US1, T004 and T005 are independent tests in separate files; after those contracts are agreed, T007 (SVG assets) and T009 (modal styling/markup) are separable from pure catalog logic, but T009 shares `index.html` with T002 and therefore must follow it.
- Within US2, T012 and T013 can be written in parallel conceptually, but both target `__tests__/import-experience.test.js`; serialize actual edits to avoid file conflicts. Personal statistic tests and implementation must complete before validating templates.
- Within US3, T018 and T019 target separate test files and can be written in parallel. Privacy copy/catalog work (T020) and progress UI/controller changes (T021–T023) touch overlapping feature files and should be serialized in dependency order.
- T025 can run in parallel with focused story tests once all twenty SVG assets and catalog mappings exist.

### Dependency Graph

```text
T001 → T002, T003 → T004/T005 → T006/T007/T008/T009/T010 → T011
                                   └→ T012/T013 → T014/T015/T016 → T017
US1 complete ────────────────────────────────────────────────→ T018/T019 → T020/T021/T022/T023 → T024
US1 + US2 + US3 ───────────────────────────────────────────────────────────→ T025/T026/T027/T028
```

### Parallel Example: User Story 1

```text
After T002 is complete, work on T004 (__tests__/import-experience.test.js) and T005 (__tests__/index-script-syntax.test.js) in parallel.
After the tests define the contracts, create T007 (assets/import-illustrations/message-01.svg through message-20.svg) independently of T006 (src/import-experience-catalog.js).
T008 (src/dashboard-import.js) can be implemented after the catalog API in T006 is established; T009 (index.html) follows the modal-anchor work from T002.
```

### Parallel Example: User Story 3

```text
T018 (__tests__/import-experience.test.js) and T019 (__tests__/dashboard-import.test.js) are separate test files and may be prepared in parallel after US1.
Run T020 (src/import-experience-catalog.js) before T021 (src/dashboard-import.js), then T022 (same dashboard-import.js) and T023 (index.html) in sequence to avoid overlapping edits.
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tests before implementation.
3. Implement the twenty-message catalog, local SVG family, accessible responsive modal display, no-repeat rotation, and lifecycle cleanup.
4. **Stop and validate** against the US1 independent test and its focused Jest suite.
5. US1 is a demonstrable visual MVP; do not ship it as a complete privacy/progress feature until US3 is also done.

### Incremental Delivery

1. Setup + Foundational → catalog and UI integration boundary available.
2. US1 → entertaining generic messages and illustrations; validate independently.
3. US2 → reliable optional personalization; validate with known/missing synthetic values.
4. US3 → periodic privacy assurance, accurate progress, and explicit finalization eligibility; validate success/error/restart.
5. Polish → focused regression suite, browser accessibility pass, privacy boundary check, and performance comparison.

## Notes

- Every task uses the required `- [ ] T### [P?] [US?] Description with file path` checklist format; `[P]` appears only where file/dependency separation allows parallel work.
- Do not add React, a bundler, third-party animation packages, persistent storage, remote SVGs, or an additional data-processing pass.
- Tests use synthetic local data only; never commit personal Strava exports.
- Preserve script load order and isolate new classic-script module declarations to avoid shared-global lexical collisions.
