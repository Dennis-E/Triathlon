---

description: "Task list for Wordcloud Sharing and Controls"
---

# Tasks: Wordcloud Sharing and Controls

**Input**: Design documents in `specs/048-wordcloud-refinements/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`

**Tests**: Test tasks are included because the project constitution requires focused verification for changes to reusable utilities, dashboard behavior, and every new visualization Share/Export path.

**Organization**: Tasks are grouped by user story. Within each story, regression/contract tests precede implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks marked `[P]` that touch different files and have no incomplete dependencies.
- **[Story]**: User story label for story-specific tasks.
- Every task description identifies the exact file path to create or change.

## Phase 1: Setup

**Purpose**: Confirm that the existing static app already has the required libraries and export workflow; no new package or service is needed.

- [X] T001 Verify the pinned wordcloud2.js and html2canvas browser scripts and the existing branded preview/download UI in index.html; do not add dependencies to package.json or create a remote share service.

---

## Phase 2: Foundational

**Purpose**: Add regression coverage for the export registration requirement before implementing the Wordcloud export path.

- [X] T002 [P] Extend __tests__/index-script-syntax.test.js to verify Wordcloud has a Share/Export button and capture target mapping, and that every current visualization tab represented by a share button has an export target; run the test and confirm Wordcloud fails before implementation.

**Checkpoint**: Export coverage tests define the registration boundary for the Wordcloud-specific user story.

---

## Phase 3: User Story 1 - Share the current Wordcloud (Priority: P1) 🎯 MVP

**Goal**: Provide the current Wordcloud with a working, private, branded local preview and download action, and wait for the current cloud render before capture.

**Independent Test**: Render a synthetic cloud, change its included terms, wait for rendering, and activate Share/Export. Verify the preview captures only the current cloud, downloads locally, and refuses no-data, unsupported-renderer, or incomplete-render states.

### Tests for User Story 1

- [X] T003 [P] [US1] Add Wordcloud title, filename slug, and valid/invalid export-target tests to __tests__/export-utils.test.js; confirm the new Wordcloud metadata expectations fail before implementation.
- [X] T004 [P] [US1] Extend __tests__/wordcloud-dashboard.test.js to verify the Share/Export action, canvas-only target, no-data state, and current-render completion contract; run the new assertions before implementation.

### Implementation for User Story 1

- [X] T005 [US1] Add the Wordcloud display title and filename slug to the existing tab export maps in src/export-utils.js, and test their export-target/filename behavior with __tests__/export-utils.test.js.
- [X] T006 [US1] Expose current-generation render-completion and exportability state from src/dashboard-wordcloud.js; invalidate completion on every redraw, resolve the current render after wordclouddrawn/wordcloudstop or abort, and identify the cloud canvas as the sole visualization capture content.
- [X] T007 [US1] Register Wordcloud canvas capture ID, completed-render/data availability check, Wordcloud view/control context, and await-current-render-before-capture behavior in src/dashboard-export.js; keep unsupported, empty, aborted, and in-progress clouds non-exportable.
- [X] T008 [US1] Add the branded Share/Export button with an accessible Wordcloud label to the visualization header and wire it to exportVisualizationTab('wordcloud') in index.html; the target is the existing Wordcloud canvas and no new export modal is introduced.

**Checkpoint**: Wordcloud sharing works independently of the one-letter filter and collapsible ranked list, using the existing export preview and download behavior.

---

## Phase 4: User Story 2 - Focus the cloud on meaningful words (Priority: P1)

**Goal**: Exclude single-letter Unicode tokens and make 50 words the initial display limit while retaining the current slider bounds.

**Independent Test**: Use synthetic titles with single Latin/accented/combining-mark terms, eligible multi-letter terms, and fewer than 50 eligible terms; verify token eligibility and the initial effective list/cloud count.

### Tests for User Story 2

- [X] T009 [P] [US2] Add __tests__/wordcloud-utils.test.js cases that exclude single-letter ASCII, German diacritic, supplementary Unicode, and decomposed accented tokens while retaining two-letter words and preserving occurrence ranks.
- [X] T010 [P] [US2] Extend __tests__/wordcloud-dashboard.test.js and __tests__/index-script-syntax.test.js to assert initial slider/output value 50, unchanged 10–100 bounds, and accurate effective count with fewer than 50 eligible words; confirm new expectations fail before implementation.

### Implementation for User Story 2

- [X] T011 [US2] Update src/wordcloud-utils.js token eligibility to require at least two Unicode letter code points after the existing normalization/case-folding while treating combining marks as part of a letter rather than a separate letter; satisfy __tests__/wordcloud-utils.test.js.
- [X] T012 [US2] Change the initial range value and displayed count in index.html from 30 to 50 without changing the existing min/max or responsive Wordcloud panel structure.

**Checkpoint**: One-letter tokens cannot influence the ranked list, canvas, or Share/Export image; the initial view uses the larger 50-word selection when available.

---

## Phase 5: User Story 3 - Maximize the Wordcloud area (Priority: P2)

**Goal**: Let users collapse the ranked list while keeping a visible, accessible re-open control and preserving the current word/slider state.

**Independent Test**: Start on Wordcloud and confirm the list is expanded. Collapse and expand at desktop and mobile widths, verify layout/no overflow and preserved selections, then switch tabs away and back and confirm the list resets expanded.

### Tests for User Story 3

- [X] T013 [P] [US3] Add __tests__/wordcloud-dashboard.test.js assertions for the accessible collapse/expand control, aria-expanded/aria-controls state, expanded-on-tab-activation behavior, retained selections on collapse/expand, and desktop/mobile layout hooks; run the new assertions before implementation.

### Implementation for User Story 3

- [X] T014 [US3] Add the accessible ranked-list collapse/expand button and responsive right-side rail/mobile compact-control markup in index.html, keeping the default list expanded and its current word list/collapse targets addressable.
- [X] T015 [US3] Implement expanded/collapsed state, `aria-expanded` updates, expanded reset on every Wordcloud activation, selection/count preservation, and ResizeObserver-driven canvas reflow in src/dashboard-wordcloud.js and src/dashboard-tabs.js; satisfy __tests__/wordcloud-dashboard.test.js.

**Checkpoint**: The ranking remains reachable in either layout; the canvas uses the reclaimed space, and returning to Wordcloud opens the list again without resetting slider or checkbox selections.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Verify export privacy, layout, render completion, and regression safety across the app.

- [X] T016 Run npx jest __tests__/wordcloud-utils.test.js __tests__/wordcloud-dashboard.test.js __tests__/export-utils.test.js __tests__/index-script-syntax.test.js --runInBand, then run npm test -- --runInBand; follow specs/048-wordcloud-refinements/quickstart.md and fix any regressions.
- [X] T017 Validate desktop/mobile collapse, tab-return reset, current cloud capture after async rendering, no-data/aborted render behavior, local download, and privacy scenarios from specs/048-wordcloud-refinements/quickstart.md using synthetic titles; record browser validation results.

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) checks existing runtime prerequisites; it adds no package/service.
- Foundational T002 defines the Wordcloud export coverage contract before the story implementations.
- User Story 1 follows T002. T003 and T004 are parallel test-writing tasks in separate files; then T005–T008 register metadata, render readiness, export mapping, and markup in dependency order.
- User Story 2 follows the export integration. T009 and T010 can run in parallel because they edit separate test files; T011 changes the utility and T012 changes HTML after tests are in place.
- User Story 3 follows both P1 stories because its test/markup/renderer work shares the Wordcloud dashboard and HTML files. T013 precedes T014 and T015; changes to the shared renderer file run sequentially.
- Polish depends on all three user stories.

### User Story Dependencies

- **US1 (P1)**: Depends on foundational export coverage T002; otherwise independent. This is the MVP because it delivers the missing sharing capability.
- **US2 (P1)**: Independent behaviorally, but sequenced after US1 to avoid overlapping the shared `index.html` panel and dashboard test files.
- **US3 (P2)**: Depends on the existing Wordcloud panel and state from US1/US2; no new data/import dependency.

### Parallel Opportunities

- T003 and T004 can be written in parallel (different test files).
- T009 and T010 can be written in parallel (utility tests vs. dashboard/HTML tests).
- Within implementation, T005 export metadata and T006 renderer state touch different files after their tests, so they can be parallelized if both prerequisites are complete; T007 waits for T006.
- T014 markup and T015 behavior share IDs/state, so complete them sequentially rather than editing shared index/dashboard files concurrently.

### Dependency Graph

```text
T001 → T002
         └→ (T003 + T004) → T005 + T006 → T007 → T008
                                           └→ US2: (T009 + T010) → T011 → T012
                                                                    └→ US3: T013 → T014 → T015
                                                                                     └→ T016 → T017
```

## Parallel Example: User Story 1

```text
Task: Extend __tests__/export-utils.test.js with Wordcloud title/slug and export-target cases.
Task: Extend __tests__/wordcloud-dashboard.test.js with export readiness and canvas capture assertions.
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Verify existing dependencies and add export coverage tests (T001–T004).
2. Register Wordcloud export metadata and render-completion readiness (T005–T007).
3. Add the Share/Export action and capture wiring (T008).
4. **Stop and validate US1 independently** using the quickstart export scenarios.

### Incremental Delivery

1. Deliver Share/Export (US1) and validate local preview/download plus empty/in-progress guards.
2. Exclude single-letter tokens and change the starting count to 50 (US2).
3. Add the responsive collapsible ranked list (US3).
4. Run focused Jest and the complete root suite, then complete browser checks from quickstart.md.
