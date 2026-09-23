---

description: "Task list for Calm Import Status"
---

# Tasks: Calm Import Status

**Input**: Design documents from `/specs/025-calm-import-status/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/import-status.md](contracts/import-status.md), [quickstart.md](quickstart.md)

**Organization**: Tasks are grouped by user story. The existing static-browser structure and Jest Node environment are reused.

## Phase 1: Setup

**Purpose**: Reuse existing project setup and dependencies.

No new setup tasks are required; no dependency or build configuration changes are planned.

## Phase 2: Foundational

**Purpose**: No shared infrastructure is needed. The existing import modal and dashboard-import orchestration remain the boundaries.

No blocking foundational tasks are required.

## Phase 3: User Story 1 - Importstatus oberhalb des Fortschritts lesen (Priority: P1) 🎯 MVP

**Goal**: Show the factual current import stage, including GPS extraction counters, in a dedicated row above the progress bar while preserving the black detail box.

**Independent Test**: Start an import and verify that `Extracting GPS tracks (n/total)...` appears above the progress bar, the progress bar remains functional, and detailed activity/error text remains in the black detail box.

### Tests for User Story 1

- [X] T001 [P] [US1] Add static markup assertions for the factual import-status element, its position before `#importProgressBar`, and the existing black detail box in `__tests__/index-script-syntax.test.js`.
- [X] T002 [P] [US1] Add source assertions that `updateImportProgress()` writes the stage to the factual status element while preserving `#importProgressDetail` for detail/error text in `__tests__/index-script-syntax.test.js`.

### Implementation for User Story 1

- [X] T003 [US1] Add a dedicated factual import-status row above the progress bar with responsive wrapping and accessible labeling in `index.html`.
- [X] T004 [US1] Update `updateImportProgress()` in `src/dashboard-import.js` to write every stage, including `Extracting GPS tracks (n/total)...`, to the new status row while leaving the black detail box behavior intact.
- [X] T005 [US1] Preserve the existing completion and error lifecycle in `src/dashboard-import.js`, ensuring the factual status remains readable and error details remain available in the black detail box.

**Checkpoint**: The import modal independently shows factual process status above the progress bar and detailed activity/error content in the black box.

## Phase 4: User Story 2 - Ruhige Visualisierungs-Previews betrachten (Priority: P1)

**Goal**: Keep each prepared visualization preview and matching humorous message visible for at least five seconds, independently of frequent import progress callbacks.

**Independent Test**: Run a sufficiently long import, verify no preview changes before 5000 milliseconds, observe a synchronized preview/message change after the interval, and verify completion/error stops future changes.

### Tests for User Story 2

- [X] T006 [P] [US2] Add static timing assertions requiring a preview interval of at least 5000 milliseconds and a timer that is independent of progress callbacks in `__tests__/index-script-syntax.test.js`.
- [X] T007 [P] [US2] Add source assertions for preview timer cleanup on completion, error, and modal close in `__tests__/index-script-syntax.test.js`.

### Implementation for User Story 2

- [X] T008 [US2] Change the preview rotation interval in `src/dashboard-import.js` from the current fast cycle to a fixed 5000-millisecond interval without resetting it from `updateImportProgress()`.
- [X] T009 [US2] Keep preview and humorous message changes synchronized in `renderImportPreview()` and preserve the first preview immediately when import starts in `src/dashboard-import.js`.
- [X] T010 [US2] Ensure completion, error, and modal close stop the preview timer without delaying the existing import completion close behavior in `src/dashboard-import.js`.

**Checkpoint**: The preview experience is calm, measurable, and independently stops in all terminal modal states.

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validate the combined modal contract, regression safety, and responsive browser behavior.

- [X] T011 [P] Update `specs/025-calm-import-status/quickstart.md` with any final selectors or timing observations discovered during implementation.
- [X] T012 Run `npm test -- --runInBand __tests__/index-script-syntax.test.js` and resolve feature-related UI contract failures in `index.html`, `src/dashboard-import.js`, and `__tests__/index-script-syntax.test.js`.
- [X] T013 Run `npm test -- --runInBand` and confirm the status-row and timer changes do not regress GPS, import, dashboard, or syntax tests.
- [X] T014 Serve the app with `python -m http.server 8000` and verify status order, five-second preview stability, terminal-state cleanup, and narrow-screen markup against `specs/025-calm-import-status/contracts/import-status.md`.
- [X] T015 [P] Review the changed import UI for accurate local-processing wording and ensure no private export data or unrelated files were added to the repository.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; no new setup work is required.
- **Foundational (Phase 2)**: No dependencies; no shared infrastructure is required.
- **User Story 1 (Phase 3)**: T001/T002 should be completed before T003-T005.
- **User Story 2 (Phase 4)**: T006/T007 should be completed before T008-T010; it shares `src/dashboard-import.js` with US1, so integrate sequentially after US1 or coordinate edits.
- **Polish (Phase 5)**: Depends on both user stories being implemented; run focused tests before the full suite and manual browser validation.

### User Story Dependencies

- **US1 (P1)**: Independent and recommended MVP; changes modal markup and factual status presentation.
- **US2 (P1)**: Independent behavior, but shares the import-modal lifecycle script with US1.

### Parallel Opportunities

- T001 and T002 can run in parallel because both are static test additions, though they target separate assertions.
- T006 and T007 can run in parallel because they validate timing and cleanup contracts separately.
- US1 test work and US2 test work can be prepared in parallel before implementation.
- T011 and T015 can run in parallel with automated validation.

## Parallel Example: User Story 1

```text
Task: T001 Add factual status markup/ordering assertions in __tests__/index-script-syntax.test.js
Task: T002 Add stage/detail separation assertions in __tests__/index-script-syntax.test.js
```

## Parallel Example: User Story 2

```text
Task: T006 Add five-second interval assertions in __tests__/index-script-syntax.test.js
Task: T007 Add completion/error/close cleanup assertions in __tests__/index-script-syntax.test.js
```

## Implementation Strategy

### MVP First

1. Complete US1 status-row tests and implementation.
2. Run the focused syntax/markup test and manually confirm status placement.
3. Complete US2 timing tests and implementation.
4. Run the full suite and browser quickstart validation.

### Incremental Delivery

1. Deliver the factual status row above the progress bar.
2. Deliver the calm five-second preview cycle.
3. Validate the combined modal lifecycle and responsive behavior.

## Notes

- Every task follows the required checkbox, sequential ID, optional `[P]`, story label, and concrete file-path format.
- Tests are included because the project constitution requires narrowest-scope verification for dashboard behavior.
- Do not commit private Strava exports; use synthetic or explicitly supplied local data only.
