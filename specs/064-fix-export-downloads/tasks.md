---
description: "Executable tasks for reliable local PNG export downloads"
---

# Tasks: Reliable PNG Export Downloads

**Input**: Design documents from `specs/064-fix-export-downloads/`
**Created**: 2026-10-22
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/export-download.md](contracts/export-download.md), [quickstart.md](quickstart.md).
**Tests**: Included because the specification explicitly requires export, cancellation, failure, repeat-click and actual-file acceptance tests; focused post-edit checks are also mandatory under the constitution. Extend existing tests, not a new framework.
**Organization**: Four independently verifiable story increments. Shared-file edits are serialized. No application implementation is performed by generating this list.

## Format: `[ID] [P?] [Story] Description`

- Every task has an unchecked checkbox, sequential ID and exact repository-relative file path.
- `[P]` means separate-file work with no dependency between the paired tasks once their phase prerequisites are satisfied.
- `[US1]` through `[US4]` identify story work only; setup/foundation/polish have no story label.
- After every production edit run the narrowest relevant Jest suite immediately, before another edit. Test-writing tasks run the new cases to demonstrate the expected failure before implementing their behavior.
- Do not commit, create branches, add dependencies, introduce a build step, or modify unrelated TODO items.

## Path Conventions

Use existing `src/` classic scripts, `__tests__/` Jest tests, `index.html`, and `README.md`. Record acceptance evidence in `specs/064-fix-export-downloads/quickstart.md`; keep downloaded images and private data out of Git. No new application/test files are planned.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the baseline and authorized validation inputs, not initialize a new app.

- [X] T001 Run `npm test -- --runTestsByPath __tests__/dashboard-export-download.test.js __tests__/export-utils.test.js __tests__/index-script-syntax.test.js` from the repository root and record baseline results and any unrelated pre-existing failures in `specs/064-fix-export-downloads/quickstart.md`; install root dependencies only if missing.
- [X] T002 Inspect existing export preview controls/event bindings in `index.html`, shared handlers in `src/dashboard-export.js`, and PB close/focus behavior in `src/dashboard-power-pb.js`; record the 12 tab targets, PB origin, synthetic input strategy, browser/server availability and native-dialog/Photos verification limits in `specs/064-fix-export-downloads/quickstart.md` without modifying unrelated code or using private fixtures.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prepare the existing harness and acceptance matrix before story implementation.

- [X] T003 Extend `createDownloadRuntime()` in `__tests__/dashboard-export-download.test.js` with a genuine small PNG fixture replacing `hello`, controllable picker/write/close promises, Image decode mocks, modal/action/focus state, toast timers and anchor exceptions; preserve baseline tests by asserting actual PNG bytes, run that suite, and keep assertions outside callbacks production catches.
- [X] T004 Initialize an acceptance-results section in `specs/064-fix-export-downloads/quickstart.md` listing every capture target and PB detail, both save routes, browser/version, destination, byte length, dimensions, Photos result, outcome/closure timing, FR/SC references and pass/fail/not-run status; distinguish injected restrictions from actual platform-policy reproduction and leave unperformed checks not-run.

**Checkpoint**: Existing tests still run with a valid fixture; evidence destinations and browser limitations are explicit. No story depends on unavailable private data or a new framework.

## Phase 3: User Story 1 - Save a PNG that opens in Windows (Priority: P1) - MVP

**Goal**: Preview and both download routes use the same complete, browser-decodable PNG, with recovery for invalid preparation.

**Independent Test**: Save a prepared populated visualization through native selection and ordinary downloading; inspect bytes, open each in Windows Photos and compare with the preview. Invalid image preparation opens no picker and retains selected filters/regeneration.

### Tests for User Story 1

- [X] T005 [P] [US1] Add failing pure PNG validation cases in `__tests__/export-utils.test.js` for a genuine PNG, wrong signature, empty/truncated header and zero/invalid dimensions; verify any new helper through existing CommonJS and browser bridges, then run this suite before implementation.
- [X] T006 [P] [US1] Add failing preparation/transport cases in `__tests__/dashboard-export-download.test.js` for wrong MIME, malformed base64, truncated bytes, decode rejection/nonpositive dimensions, preview-readiness gating, retained filters/regeneration and exact equality between prepared PNG bytes and native Blob/anchor content; ensure invalid preparation opens no picker and run this suite before implementation.

### Implementation for User Story 1

- [X] T007 [US1] Implement the small DOM-free PNG byte/header validator in `src/export-utils.js`, preserving all existing exports and adding it to both existing bridges; reject malformed headers without claiming signature checks fully decode PNG, then immediately run `npm test -- --runTestsByPath __tests__/export-utils.test.js`.
- [X] T008 [US1] Prepare and browser-decode the composed PNG before publishing a downloadable preview in `src/dashboard-export.js`; preserve model constraints verbatim: target is "Existing kind/key/capture context fixed for the preview.", dataUrl is "Complete PNG base64 representation for preview and ordinary download.", blob is "Non-empty PNG Blob with identical bytes for native writing.", and dimensions are "Positive browser-decoded dimensions; existing composition stays 1080-square." Enforce "Prepared fields remain immutable during an attempt." Invalid preparation retains filters and offers regeneration; immediately run the download suite.
- [X] T009 [US1] Update native writing and the existing data-URL anchor helper in `src/dashboard-export.js` to consume a local validated prepared-image snapshot instead of rereading mutable global image data, retain identical bytes/filename behavior, invoke the picker before new asynchronous work, and guard unavailable/invalid prepared data; immediately run the download suite.
- [X] T010 [US1] Run the download, export-utils and script-syntax suites for `src/dashboard-export.js` and `src/export-utils.js`, repairing only this slice and recording results in `specs/064-fix-export-downloads/quickstart.md`; verify no-data and capture composition/branding were not redesigned.
- [ ] T011 [US1] Execute the US1 native/ordinary actual-file scenarios using a populated synthetic visualization, inspect positive byte length, PNG decode and 1080-square content, open actual files in Windows Photos and compare with preview; record browser-specific evidence or explicit unavailable checks in `specs/064-fix-export-downloads/quickstart.md`, without claiming mocks prove Photos readability.

**Checkpoint**: US1 alone delivers usable image files on working save routes. Permission recovery, automatic closure and initial directory preference remain later increments.

## Phase 4: User Story 2 - Receive one accurate export outcome (Priority: P1)

**Goal**: Restriction recovery yields one valid browser handoff and coherent feedback; cancellation and genuine failure remain retryable without unsafe fallback.

**Independent Test**: Exercise unavailable/blocked picker, post-selection denied writing, quiet picker cancellation, storage/safety failure, failed fallback, duplicate clicks and retry; verify one current outcome and actual fallback file validity.

### Tests for User Story 2

- [X] T012 [US2] Add failing contract cases in `__tests__/dashboard-export-download.test.js` for picker AbortError versus write-stage AbortError, NotAllowedError/SecurityError at picker/createWritable/write/close, unknown/storage failures, failed anchor handoff, abort cleanup rejection, stale toast timeout, double click while pending and successful retry; assert at most one fallback, no deletion, no false selected-destination success and no bypass of safety rejection, then run this suite.

### Implementation for User Story 2

- [X] T013 [US2] Add attempt-local state in `src/dashboard-export.js` enforcing the model constraints "One active attempt; set before picker, released on every terminal path.", "Exactly one of saved, handed-off, cancelled, failed.", "At most one anchor handoff per attempt, represented by state/control flow.", and "Attempt-local, never persisted; stream retained for best-effort abort." Keep exception phase selecting/writing/handing-off explicit and reset ownership on all terminal paths; immediately run the download suite.
- [X] T014 [US2] Implement operation/name-based recovery in `src/dashboard-export.js`: missing picker or NotAllowedError/SecurityError can hand off once, picker AbortError is silent with no fallback, write-stage AbortError/safety failures and disk/unknown failures remain errors, and a throwing fallback is unrecovered failure; immediately run the download suite.
- [X] T015 [US2] Make native-save settlement in `src/dashboard-export.js` require successful write and close; best-effort abort any existing failed stream without masking the original cause, never close as failure cleanup and never delete a selected destination or imply rollback of an empty placeholder; immediately run the download suite.
- [X] T016 [US2] Implement coherent attempt feedback in `src/dashboard-export.js`: clear stale messages/timeouts before a fresh attempt, keep picker cancellation silent, retain preview/retry on unrecovered failure, explain unsaved selected destination and browser-managed new location after post-selection recovery, and never label anchor handoff verified disk completion; immediately run the download suite.
- [X] T017 [US2] Run all US2 contract cases in `__tests__/dashboard-export-download.test.js`, including deferred duplicate-click and retry sequences, and record named outcomes/fallback counts in `specs/064-fix-export-downloads/quickstart.md`; do not broaden repairs to unrelated failures.
- [ ] T018 [US2] Exercise the restriction/cancellation/failure browser scenarios from `specs/064-fix-export-downloads/quickstart.md`, including a real anchor file after injected createWritable denial and actual platform denial where available; record Photos validity, one handoff, accurate destination feedback, retained retry and the difference between injected and real-policy evidence in that file.

**Checkpoint**: US2 is independently verifiable against native success, permission recovery, cancellation and failure. It does not require US3 closure or US4 directory preference.

## Phase 5: User Story 3 - Return to the dashboard after download (Priority: P2)

**Goal**: Completed saves/handoffs close only owned export surfaces, without invalidating pending data or newer previews.

**Independent Test**: Download from a standard preview and PB detail origin; require closure within one second after save/handoff, not before. Cancellation/failure keeps retry; unrelated UI and newer previews remain untouched.

### Tests for User Story 3

- [X] T019 [US3] Add failing lifecycle tests in `__tests__/dashboard-export-download.test.js` for no closure before write/close, closure after native save/anchor handoff, PB-origin-only closure/focus restoration, cancellation/failure retention and a later preview surviving old completion. Start an export from PB opening A, close A, open B, then settle the old save/handoff: B and any newer preview must remain open with focus undisturbed; repeat with B showing the same PB record. Assert fresh subsequent export content and run the suite.

### Implementation for User Story 3

- [X] T020 [US3] Add success/handoff surface settlement in `src/dashboard-export.js`, snapshotting the origin before global cleanup and using existing close routines only after ownership matches. Capture a distinct identity per PB detail opening, adding narrowly scoped opening-state wiring in `src/dashboard-power-pb.js` if required; close the originating detail only for pb-tile targets whose original opening is still current. Reopening the same record must count as a new opening; retain unrelated dialogs and preserve focus only for still-owned surfaces. Immediately run the download suite and the existing PB-related suite if its source changed.
- [X] T021 [US3] Enforce preview ownership in `src/dashboard-export.js` using the constraint "Original identity/reference; late completion cannot close a newer preview." Also enforce PB ownership: "Per-opening identity captured from the originating PB detail; close and restore focus only if that exact opening remains current." Preserve pending bytes after explicit dismissal, retain retry for an undismissed failed/cancelled preview, prevent old cleanup/feedback/focus restoration from affecting a newer preview or replacement PB opening and allow a fresh subsequent export; immediately run the download suite.
- [X] T022 [US3] Verify existing Download/close/Escape bindings and pending-control behavior in `index.html` against the lifecycle contract; change markup/bindings only if needed to keep readiness and duplicate-click behavior consistent without delaying picker invocation, and run the download plus script-syntax suites immediately after any change.
- [X] T023 [US3] Run the lifecycle regression cases in `__tests__/dashboard-export-download.test.js` and `__tests__/index-script-syntax.test.js`, check native/handoff closure within one second and retained failure recovery, and record results in `specs/064-fix-export-downloads/quickstart.md`.
- [X] T024 [US3] Execute standard-preview and PB-detail closure/focus browser checks, including pending dismissal, cancelled/failed saves, unrelated dialogs and fresh later exports; record timing and ownership evidence or explicit verification limits in `specs/064-fix-export-downloads/quickstart.md`.

**Checkpoint**: US3 closes completed export surfaces without changing user-selected destination behavior or requiring Downloads support.

## Phase 6: User Story 4 - Start destination selection in Downloads (Priority: P2)

**Goal**: Suggest Downloads while preserving native user choice and browser-controlled fallback.

**Independent Test**: Inspect native initial folder where hints are honored, select a different folder/name, repeat with overridden preferences and ordinary download, and verify usable files at actual destinations.

### Tests for User Story 4

- [X] T025 [US4] Add failing option/ordering regression cases in `__tests__/dashboard-export-download.test.js` requiring startIn downloads, unchanged suggested PNG filename/type, immediate picker invocation before awaited work and a fresh handle per intentional attempt; ensure existing ordinary fallback still works without a folder guarantee and run this suite.

### Implementation for User Story 4

- [X] T026 [US4] Add `startIn: 'downloads'` to the existing picker options in `src/dashboard-export.js` without a persisted picker ID, absolute path, old file handle reuse or overridden user choices; preserve "Existing PNG generation; native user choice wins." and immediately run the download suite.
- [X] T027 [US4] Run all filename/type/activation/destination-request cases in `__tests__/dashboard-export-download.test.js` and record the result in `specs/064-fix-export-downloads/quickstart.md`; distinguish asserted option values from actual dialog-directory evidence.
- [ ] T028 [US4] Verify Edge/Chrome initial Downloads where permitted, another folder/name, remembered/policy override and Firefox/browser-managed destination behavior; inspect resulting PNGs and record actual directories, filename choice and non-guarantee feedback in `specs/064-fix-export-downloads/quickstart.md`.

**Checkpoint**: All four stories are implemented and independently testable; browser policy/user preferences still control actual destinations.

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cross-entry-point regression, privacy/compatibility acceptance and accurate user-facing documentation.

- [X] T029 [P] Update the existing export documentation in `README.md` to describe Downloads as a preference, native destination choice, ordinary-download fallback, app-owned automatic closure, cancellation/retry and handoff limits; do not claim the whole app is offline/network-free or Windows readability was verified without evidence.
- [X] T030 [P] Extend existing export regression assertions in `__tests__/export-utils.test.js` for all current tab targets plus PB detail, no-data behavior, filenames and preserved branding/context as needed for changed helpers; use existing script-syntax coverage for classic script compatibility and run the touched suites without adding a new test file/framework.
- [X] T031 Run `npm test -- --runTestsByPath __tests__/dashboard-export-download.test.js __tests__/export-utils.test.js __tests__/index-script-syntax.test.js` and any directly affected existing visualization export suite identified by a concrete failure/call-site change; record final focused results and unrelated failures in `specs/064-fix-export-downloads/quickstart.md` without blanket unrelated cleanup.
- [ ] T032 Complete the full actual-file matrix in `specs/064-fix-export-downloads/quickstart.md` for all 12 current tab targets and PB detail on native and ordinary routes, preserving filters/branding and fresh captures; inspect PNG byte length/dimensions, browser decode and Windows Photos, closure timing, supported mobile fallback and export-scoped network activity with zero image/activity uploads; record unsupported/unavailable cases as unverified, not passed.
- [X] T033 Reconcile all FR/SC evidence in `specs/064-fix-export-downloads/quickstart.md` against `specs/064-fix-export-downloads/spec.md`, document remaining native-dialog/Photos/policy/mobile gaps and reproducible defects, and update completion status in `specs/064-fix-export-downloads/tasks.md` only for work actually performed; do not mark a required acceptance check complete solely because mocks passed.

## Dependencies & Execution Order

### Phase Dependencies

Setup T001-T002 precedes foundation T003-T004. Foundation blocks all story work. Recommended integration order is US1, US2, US3, US4, then polish, following spec priority and minimizing shared-handler conflicts.

```text
Setup -> Foundation -> US1 (MVP) -> US2 -> US3 -> US4 -> Polish
                           |         |       |
                           +---------+-------+---- individual acceptance checkpoints
```

### Story Dependencies

- US1 starts after foundation and has no story prerequisite.
- US2 integrates after US1 because recovery must use the validated image snapshot; it is tested without requiring automatic closure or Downloads preference.
- US3 integrates after US2 because closure consumes its final saved/handed-off/cancelled/failed outcomes. Its tests independently exercise those outcomes and preview ownership.
- US4 has no logical dependency on US2/US3 beyond the shared baseline; it can be delivered after US1, but its handler/test-file edits must be serialized with US2/US3. The numbered execution order intentionally places it after US3.
- Final cross-cutting acceptance requires all four stories. Do not conflate logical independence of acceptance with safe concurrent editing of the same file.

### Within Each Story

Write and run relevant tests first, observe the behavior-scoped expected failures, implement the smallest slice, immediately run the narrow suite after each edit, and complete that story's own acceptance checkpoint. Browser/Photos checks cannot be replaced by Node mocks. If unavailable, document the blocker and keep the affected verification task open.

## Parallel Execution Examples

### User Story 1

After T004, T005 (`__tests__/export-utils.test.js`) and T006 (`__tests__/dashboard-export-download.test.js`) may run in parallel: both write failing tests against separate files. T007 requires T005; T008 requires both tests and T007; T009-T011 follow sequentially. Do not parallelize production edits with their first focused validation.

### User Story 2

No within-story edit pair is marked parallel: T012-T017 share the same VM harness/handler and consume prior behavior. After US1 is stable, US2 routing work can proceed while an independent reviewer inspects the already-produced US1 synthetic PNG outside the worktree; evidence-file writes remain serialized. T018 follows working recovery.

### User Story 3

No safe within-story production pair: outcome settlement and preview ownership touch the same handler, and binding changes depend on them. A reviewer may check existing focus expectations in `src/dashboard-power-pb.js` while T019 is authored, but T020-T024 integrate serially and evidence writes cannot race.

### User Story 4

T025-T028 are intentionally serial: tests precede option change and browser evidence follows it. Initial-folder inspection cannot validate a not-yet-implemented option. Once all stories are integrated, T029 (`README.md`) and T030 (`__tests__/export-utils.test.js`) can run in parallel; both precede T031-T033.

## Requirement Traceability

| Requirement | Tasks |
|-------------|-------|
| FR-001 | T003, T005-T011, T032 |
| FR-002 | T025-T028 |
| FR-003 | T009, T025-T028 |
| FR-004 | T012-T018 |
| FR-005 | T012, T014, T016-T018 |
| FR-006 | T006, T008, T012, T015-T018 |
| FR-007 | T019-T024, T032 |
| FR-008 | T009, T019-T024 |
| FR-009 | T012-T018, T029 |
| FR-010 | T009, T012-T013, T017, T019-T025 |
| FR-011 | T002, T010, T022, T030-T032 |
| FR-012 | T002, T029, T032-T033 |

SC-001 is evidenced by T011/T018/T028/T032; SC-002 by T023/T024/T032; SC-003/SC-004 by T017/T018/T023/T024; SC-005 by T027/T028; SC-006 by T017/T023/T024; SC-007 by T032. T033 consolidates evidence without upgrading unavailable checks to passes.

## Implementation Strategy

### MVP First

Complete setup, foundation and US1 (T001-T011). Stop to validate genuine files on both working save routes. This is a useful MVP fixing image integrity, but it is not completion of the reported permission, closure or directory-preference problems.

### Incremental Delivery

Add US2 for reliable outcomes and permission recovery, US3 for automatic owned-surface closure, then US4 for Downloads preference. Re-run the narrow suite after each edit and accept each increment independently. Deliver the complete requested feature only after cross-cutting matrix evidence is reconciled or remaining acceptance blockers are explicitly disclosed.

## Notes

33 tasks total: setup 2, foundation 2, US1 7, US2 7, US3 6, US4 4, polish 5. Four parallel-marked tasks form two separate-file pairs. No schema migration, external API contract, dependency installation beyond missing root packages, new project scaffolding, or unrelated refactor is needed.