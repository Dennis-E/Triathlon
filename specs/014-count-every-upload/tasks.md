---

description: "Task list template for feature implementation"
---

# Tasks: Count Every Upload Without Browser-Persisted History

**Input**: Design documents from `/specs/014-count-every-upload/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/analysis-counter-api.md](./contracts/analysis-counter-api.md), [quickstart.md](./quickstart.md)

**Tests**: Test tasks are included because the existing suite (`__tests__/analysis-counter.test.js`) directly encodes the old, now-invalid dedup behavior and must be updated to prove FR-001/FR-002/FR-003 hold; this is required implementation work, not optional TDD scaffolding.

**Organization**: Tasks are grouped by user story (from [spec.md](./spec.md)) to enable independent verification of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths are included in each description

## Path Conventions

Single static frontend project (per [plan.md](./plan.md) Project Structure): `src/analysis-counter.js`, `__tests__/analysis-counter.test.js`. `services/api/` and `index.html` are out of scope (no changes required).

---

## Phase 1: Setup

**Purpose**: Establish a baseline before changing behavior

- [X] T001 Run `npm test -- analysis-counter` from the repo root and record the current pass/fail state as the pre-change baseline (no file changes in this task)

**Checkpoint**: Baseline confirmed; safe to begin Foundational changes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core module change that both user stories depend on — removing the permanent "recorded" gate and its persistence machinery

**⚠️ CRITICAL**: No user story phase can be completed until this phase is done.

- [X] T002 In `src/analysis-counter.js`, remove the permanent "recorded" short-circuit in `recordAnalysis()` (the `if (storedEvent && storedEvent.status === 'recorded') return storedEvent.count;` branch) together with the `STORAGE_KEY` constant and the `getStoredEvent`/`storeEvent` helper functions, so every call performs a fresh `POST /v1/analyses` request
- [X] T003 In `src/analysis-counter.js`, update `recordAnalysis()` to call `createId()` for a brand-new event ID on every invocation (never reading or reusing a previously stored ID) and remove the `storage`/`browserStorage` parameter and its `localStorage` fallback from `createAnalysisCounter({...})`, while preserving the existing public API (`createAnalysisCounter`, `isConfigured`, `getCount`, `recordAnalysis`) per constitution principle II
- [X] T004 In `src/analysis-counter.js`, remove `STORAGE_KEY` from the module's returned/exported object (`return { createAnalysisCounter, STORAGE_KEY };` → `return { createAnalysisCounter };`)
- [X] T005 In `__tests__/analysis-counter.test.js`, update the `require('../src/analysis-counter')` import to no longer destructure `STORAGE_KEY`, remove the local `createStorage()` mock helper and the `storage:` option passed into `createAnalysisCounter(...)` calls, and delete the now-invalid "does not record the same browser analysis twice" test (its behavior is superseded by the User Story 1 tests below)

**Checkpoint**: `src/analysis-counter.js` no longer persists any "already recorded" state; module compiles and existing non-dedup tests (load count, single record, API-failure rejection, not-configured) still describe correct behavior. Proceed to user stories.

---

## Phase 3: User Story 1 - Every successful upload increases the public counter (Priority: P1)

**Goal**: The publicly displayed counter increases by one for every successfully completed upload, including the second, third, etc. upload in the same browser.

**Independent Test**: In a browser that already completed one successful import, complete a second, distinct successful import and confirm the displayed counter increases by one again.

- [X] T006 [US1] In `__tests__/analysis-counter.test.js`, add a test that calls `counter.recordAnalysis()` twice in sequence against a `fetchImpl` mock returning increasing counts (e.g., 18 then 19) and asserts `fetchImpl` was called twice with method `POST` to `/v1/analyses`, and that the two calls resolve to `18` and `19` respectively (proving no short-circuit after the first success)
- [X] T007 [US1] In `__tests__/analysis-counter.test.js`, extend or add a test asserting the two sequential `recordAnalysis()` calls from T006 each carry a distinct `X-Analysis-Event-Id` header value (no ID reuse across calls)
- [X] T008 [US1] Run `npm test -- analysis-counter` and confirm the new and updated tests pass
- [ ] T009 [US1] Manually validate per [quickstart.md](./quickstart.md) "Manual/browser validation" steps 1 and 3-5: serve the app locally, complete two separate successful Strava ZIP imports in the same browser tab, and confirm the displayed counter increases for both

**Checkpoint**: User Story 1 is independently functional and testable — every successful upload counts.

---

## Phase 4: User Story 2 - No persistent local record of past analyses (Priority: P1)

**Goal**: No permanent local record in the browser (local storage, cookies, or similar) marks a prior analysis as completed; nothing carries forward across page reloads or browser restarts.

**Independent Test**: Complete a successful upload, then inspect the browser's local storage/cookies for this site and confirm no entry persists that identifies a previously completed analysis.

- [X] T010 [US2] In `__tests__/analysis-counter.test.js`, add a test confirming `createAnalysisCounter({...})` no longer accepts/uses a `storage` option (e.g., call it without any storage-related argument and confirm `recordAnalysis()` still succeeds using only `fetchImpl` and `eventIdFactory`), proving no client-side persistence is involved in recording an analysis
- [X] T011 [US2] Run `npm test -- analysis-counter` and confirm all tests pass, including T010 and the Phase 2/3 additions
- [ ] T012 [US2] Manually validate per [quickstart.md](./quickstart.md) "Manual/browser validation" steps 2 and 6: after one or more successful imports, and again after reloading the page, confirm DevTools → Application → Local Storage shows no `trianalytics:analysis-counter:recorded:v1` key (or any successor key) for the site's origin

**Checkpoint**: User Story 2 is independently functional and testable — no persisted local record of past analyses exists.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across the whole feature

- [X] T013 Run the full root suite `npm test` from the repo root and resolve any regressions in other suites caused by the `src/analysis-counter.js` public-shape change (constitution principle III)
- [X] T014 Re-read `src/analysis-counter.js` end-to-end to confirm no dead code remains referencing the removed `storage`/`STORAGE_KEY`/persisted-event concepts, matching [data-model.md](./data-model.md)'s "Removed: persisted browser record" section

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → **Phase 2 (Foundational)**: T001 has no dependencies; T002-T005 depend on T001 only as a baseline reference, not a code dependency, but must run before any user story work since they touch the same functions the stories test.
- **Phase 2 (Foundational)** blocks **Phase 3 (US1)** and **Phase 4 (US2)**: both stories test behavior that only exists once the gate/storage removal (T002-T005) is done.
- **Phase 3 (US1)** and **Phase 4 (US2)** both touch `__tests__/analysis-counter.test.js`, so they should be done sequentially (US1 then US2) even though neither depends on the other's *outcome* — this avoids conflicting edits to the same test file at the same time.
- **Phase 5 (Polish)** depends on Phases 2-4 being complete.

## Parallel Execution Examples

- Within Phase 2, T002 and T003 both edit `src/analysis-counter.js` and must be sequential (not `[P]`); T004 also edits the same file and follows T002/T003. T005 edits a different file (`__tests__/analysis-counter.test.js`) and could start once T002-T004 are far enough along that the new shape is known, but for safety is listed after them.
- Within Phase 3, T006 and T007 both edit the same test file and should be done sequentially.
- T009 (manual browser validation) has no file dependency and can be done in parallel with writing T010-T012 if a second person/session is available, since it only requires the app running with the Phase 2/3 code changes already in place.

## Implementation Strategy

**MVP scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) deliver the core fix the user reported ("counter did not increase"). Phase 4 (User Story 2) closes the explicit privacy requirement (no persisted browser record) and is already substantially satisfied by the Phase 2 removal — its tasks are primarily verification. Ship Phases 1-3 first if incremental delivery is needed, then complete Phase 4 and Phase 5 before considering the feature done, since both P1 stories are required by the spec.
