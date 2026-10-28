# Tasks: Export Context Cleanup

**Input**: Design documents from `/specs/073-export-context-cleanup/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/export-presentation.md`, and `quickstart.md`

**Tests**: Focused regression tests are required by the project constitution for dashboard behavior changes.

**Organization**: Tasks are grouped by the prioritized user stories in `spec.md`.

## Format

- `[P]` marks tasks that can run in parallel without editing the same files or depending on incomplete work.
- `[US1]` and `[US2]` map to User Story 1 and User Story 2 in `spec.md`.
- All task descriptions name the files to change or validate.

## Phase 1: Setup

**Purpose**: Reuse the existing static app and Jest structure; no setup or dependency changes are required.

No setup tasks.

---

## Phase 2: Foundational

**Purpose**: Use the existing shared export target, capture, and test harness; no separate foundational work blocks the stories.

No foundational tasks.

---

## Phase 3: User Story 1 - Export a clean visualization (Priority: P1) - MVP

**Goal**: Remove filter/context text, its reserved space, and outer decorative frames from every existing export without changing dashboard state or visualization data.

**Independent Test**: Preview and download representative Distance, Pace vs, PB, and GPS Heatmap exports; confirm no filter summary or outer visualization frame appears, no blank context area remains, and the live dashboard is unchanged.

### Tests for User Story 1

- [X] T001 [US1] Replace active-filter text expectations with assertions that filtered targets render no context text and use the available chart area in `__tests__/dashboard-export-download.test.js`.

### Implementation for User Story 1

- [X] T002 [US1] Update `drawExportComposition()` to omit `target.filters` text and context-height reservation while keeping aspect-preserving chart layout in `src/dashboard-export.js`.
- [X] T003 [US1] Add cloned-capture regression cases for framed Pie, PB, and Heatmap targets, asserting live target styles remain unchanged in `__tests__/dashboard-export-download.test.js`.
- [X] T004 [US1] Remove only outer decorative frame styles from each export capture root in the `onclone` handler while preserving child visualization content and live dashboard styles in `src/dashboard-export.js`.

**Checkpoint**: All existing tab and PB exports omit filter/context presentation and outer visualization frames; no blank context strip is reserved.

---

## Phase 4: User Story 2 - Keep the visualization understandable (Priority: P2)

**Goal**: Keep meaningful titles, PB results, axes, and data legends while redundant filter/configuration labels disappear.

**Independent Test**: Inspect a Run 5 km PB export and exports with Pace vs, Pie Charts, and Training Calendar legends; verify the result and explanatory legend content remain readable without `Metric: Time` or filter labels.

### Tests for User Story 2

- [X] T005 [US2] Add regression assertions for the Run 5 km title/result without `Metric: Time` and retained Pace vs, Pie Charts, and Training Calendar legends in `__tests__/dashboard-export-download.test.js`.

**Checkpoint**: The shared export changes preserve all meaningful visualization labels and legends while suppressing redundant context.

---

## Phase 5: Polish and Cross-Cutting Validation

**Purpose**: Validate the complete export surface using automated tests and real browser output.

- [X] T006 [P] Run the focused Jest suites in `__tests__/export-utils.test.js` and `__tests__/dashboard-export-download.test.js` using `npm test -- --runInBand __tests__/export-utils.test.js __tests__/dashboard-export-download.test.js`.
- [X] T007 [P] Validate preview/download parity, frame removal, readable legends, no-data behavior, and unchanged dashboard state using the scenarios in `specs/073-export-context-cleanup/quickstart.md`.

## Dependencies and Execution Order

### Phase Dependencies

- Setup and Foundational phases require no tasks because the static app, export utilities, and test harness already exist.
- User Story 1 can start immediately; its tests precede the corresponding shared composer and clone changes.
- User Story 2 depends on User Story 1 because both stories use the same export composer and cloned capture styling.
- Polish validation starts after both user stories are implemented. T006 and T007 can then run in parallel.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on another story; it is the MVP.
- **User Story 2 (P2)**: Depends on User Story 1's removal of context and frame presentation; it validates preservation of meaningful content.

### Parallel Opportunities

- **User Story 1**: No safe parallel task pair. T001 must fail before T002; T003 must fail before T004, and both test tasks update the same test file.
- **User Story 2**: T005 follows User Story 1 and has no separate implementation task because the shared P1 renderer change removes the redundant context.
- **Polish**: T006 and T007 can run in parallel after both user stories because they validate independently and do not edit the same files.

### Parallel Example: User Story 1

```text
No safe parallel batch: complete T001 before T002, then T003 before T004. Each test must fail before its implementation, and both test tasks update the same file.
```

### Parallel Example: User Story 2

```text
No safe parallel batch: start T005 only after User Story 1, because it verifies behavior delivered by the shared composer and capture changes.
```

### Parallel Example: Polish Validation

```text
Task T006: Run focused Jest suites from __tests__/export-utils.test.js and __tests__/dashboard-export-download.test.js
Task T007: Inspect representative export previews and downloads using specs/073-export-context-cleanup/quickstart.md
```

## Implementation Strategy

### MVP First

1. Complete T001 and T002 to remove filter text and unused context space.
2. Complete T003 and T004 to remove outer framing only from cloned capture targets.
3. Stop and validate User Story 1 independently using its preview/download scenarios.

### Incremental Delivery

1. Deliver User Story 1 as the MVP for filter-free, frameless exports.
2. Complete T005 to guard PB identity/results and meaningful legends for User Story 2.
3. Complete T006 and T007 for automated and browser validation across the export surface.

## Format Validation

- All tasks use unchecked checkboxes, sequential IDs, and exact repository paths.
- Story tasks include `[US1]` or `[US2]`; setup, foundational, and polish tasks do not carry story labels.
- `[P]` appears only on the two independent final validation tasks.