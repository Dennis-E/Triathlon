---
description: "Implementation tasks for Social Export Infographics"
---

# Tasks: Social Export Infographics

**Input**: Design documents from `specs/074-social-export-infographics/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/export-experience.md`, `quickstart.md`

**Tests**: Focused tests are included because the project constitution requires relevant tests for dashboard behavior and reusable utilities.

**Organization**: Tasks are grouped by user story. Complete the shared capture/layout foundation first; then deliver each independently verifiable story in priority order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Tasks touch different files and have no dependency on unfinished work.
- **[Story]**: User-story label maps to the specification.
- Every task names the file(s) to change or the validation document to update.

## Phase 1: Setup

**Purpose**: Establish test coverage for existing export entry points and deterministic output dimensions; no project scaffold or new dependencies are required.

- [X] T001 [P] Add a parameterized inventory test for every current `EXPORT_CAPTURE_TARGET_IDS` entry and personal-best detail export in `__tests__/dashboard-export-download.test.js`.
- [X] T002 [P] Add baseline square 1080 × 1080 and portrait 1080 × 1350 geometry cases in `__tests__/export-utils.test.js`.

---

## Phase 2: Foundational

**Purpose**: Implement and verify the shared request snapshot, deterministic format model, and resource lifecycle that block every story.

- [X] T003 Add tests for immutable export-request state, required-resource failure, retry after failure, and no-data download blocking in `__tests__/dashboard-export-download.test.js`.
- [X] T004 Implement square/portrait constants, deterministic content-layout helpers, and validated export metadata helpers in `src/export-utils.js`.
- [X] T005 Implement one immutable capture snapshot per export and retryable image/font readiness with user-readable errors in `src/dashboard-export.js`.

**Checkpoint**: Shared export state is deterministic; selected data is captured once; required-resource failures cannot produce a downloadable partial image.

---

## Phase 3: User Story 1 - Export a complete training story (Priority: P1)

**Goal**: Export every currently exportable view as a standalone, accurate social infographic; apply the detailed rules to the six specified visualization families.

**Independent Test**: With representative local data, export every current view using the default square format. Verify factual headline, relevant visualization and context, filter-free composition, compact logo/site footer, correct units, and each specialized family rule.

### Tests for User Story 1

- [X] T006 [P] [US1] Add total-distance, equipment ranking, and equipment timeline export assertions in `__tests__/dashboard-core.test.js` and `__tests__/dashboard-equipment.test.js`.
- [X] T007 [P] [US1] Add personal-best record/milestone and pace-versus axis/series export assertions in `__tests__/dashboard-export-download.test.js` and `__tests__/dashboard-scatter-years.test.js`.
- [X] T008 [P] [US1] Add heatmap viewport, route visibility, and attribution export assertions in `__tests__/dashboard-heatmap.test.js`.
- [X] T009 [US1] Add common headline/context, no-filter-controls, no-QR, and all-current-target coverage to `__tests__/dashboard-export-download.test.js`.

### Implementation for User Story 1

- [X] T010 [US1] Replace the current generic export header and control/filter summaries with the factual headline, applicable sport/metric/period/unit context, main visualization, and compact logo/site footer in `src/dashboard-export.js`.
- [X] T011 [US1] Implement total-distance totals, annual-bar/YTD limits, horizontal equipment rankings, Top 5/7 labels, additive-metric handling, and equipment timeline row/series rules in `src/dashboard-core.js`, `src/dashboard-equipment.js`, and `src/dashboard-export.js`.
- [X] T012 [US1] Implement personal-best result/source/date/event and distinct-milestone presentation plus correctly named pace/speed axes, groups, trend lines, and point-size explanation in `src/dashboard-power-pb.js`, `src/dashboard-scatter.js`, and `src/dashboard-export.js`.
- [X] T013 [US1] Implement heatmap route-focused presentation, quiet map background, required attribution, and omission of map controls while preserving the user-selected view in `src/dashboard-heatmap.js` and `src/dashboard-export.js`.
- [X] T014 [US1] Map factual context and retain meaningful content for training calendar, wordcloud, pie charts, lifetime statistics, media gallery, and every other current export target in `src/dashboard-training-calendar.js`, `src/dashboard-wordcloud.js`, `src/dashboard-pie-charts.js`, `src/dashboard-lifetime-statistics.js`, `src/dashboard-media.js`, and `src/dashboard-export.js`.

**Checkpoint**: Every current export target produces a complete square social post without changing filters, selected activities, aggregation, or visualization values.

---

## Phase 4: User Story 2 - Read the post in a social feed (Priority: P1)

**Goal**: Keep essential text, values, labels, and visual encodings readable and unclipped at a 360 px feed width.

**Independent Test**: Render representative square exports at 360 px wide and verify minimum type sizes, contrast, safe margins, line wrapping, and absence of overlap or clipping.

### Tests for User Story 2

- [X] T015 [US2] Add tests for 48 px safe margins, specified text-size floors, long-label wrapping, and contrast/layout metadata in `__tests__/export-utils.test.js`.

### Implementation for User Story 2

- [X] T016 [US2] Enforce export typography sizes, safe margins, readable wrapping, contrast-aware text/marks, subdued gridlines, and overflow-safe visualization layout in `src/export-utils.js` and `src/dashboard-export.js`.

**Checkpoint**: Representative default-format exports satisfy the feed-width readability criteria without shrinking text below the specification's minimum sizes.

---

## Phase 5: User Story 3 - Choose a format and inspect the result (Priority: P2)

**Goal**: Offer square and portrait choices and ensure preview/download parity, with the exact user-defined heatmap bounds in either format.

**Independent Test**: Export both formats from one data state at different application-window sizes; verify exact PNG dimensions, identical preview/download bytes, unchanged heatmap bounds, and restoration of the live map.

### Tests for User Story 3

- [X] T017 [P] [US3] Add selected-format dimension and preview/download identity tests in `__tests__/dashboard-export-download.test.js`.
- [X] T018 [P] [US3] Add exact map-bounds preservation and restore-on-error tests for both format aspect ratios in `__tests__/dashboard-heatmap.test.js`.

### Implementation for User Story 3

- [X] T019 [US3] Add an accessible segmented Square/Portrait selector with Square selected by default and format-aware preview sizing in `index.html`.
- [X] T020 [US3] Pass the selected format through the immutable request, canvas composition, preview, PNG validation, and download without rereading changed dashboard state in `src/dashboard-export.js` and `src/export-utils.js`.
- [X] T021 [US3] Capture and restore the exact Leaflet geographic bounds at either export aspect ratio, wait for visible required tiles, retain attribution, and preserve the user's live map on success or failure in `src/dashboard-heatmap.js`.

**Checkpoint**: Square and portrait exports have exact dimensions; preview and download match, and map bounds are unchanged by capture.

---

## Phase 6: User Story 4 - Add personality without changing the facts (Priority: P2)

**Goal**: Let the user show or hide a short, appropriate humorous line without changing the factual headline, selected data, or visualization.

**Independent Test**: Export the same target with humor on and off; verify only the secondary line changes and the humor-free image remains complete.

### Tests for User Story 4

- [X] T022 [US4] Add tests that humor state only affects secondary copy and that every line is at most ten words without unsupported performance claims in `__tests__/dashboard-export-download.test.js`.

### Implementation for User Story 4

- [X] T023 [US4] Add an accessible optional humor toggle, default it off, and capture its state with the export request in `index.html` and `src/dashboard-export.js`.
- [X] T024 [US4] Add concise English secondary copy for applicable visualization families and reserve/reclaim its layout space without changing factual content in `src/dashboard-export.js` and `src/export-utils.js`.

**Checkpoint**: Both humor states produce complete exports, with no factual or visualization differences.

---

## Phase 7: Polish & Cross-Cutting Validation

**Purpose**: Validate the complete target/format matrix, failure states, browser rendering, privacy boundary, and comprehension criteria.

- [ ] T025 Complete the five-person comprehension and posting-intent checks in `specs/074-social-export-infographics/quickstart.md`; results are explicitly marked NOT RUN until participants complete the study.
- [X] T026 Run the focused Jest suites for `__tests__/dashboard-export-download.test.js`, `__tests__/export-utils.test.js`, `__tests__/dashboard-heatmap.test.js`, `__tests__/dashboard-equipment.test.js`, `__tests__/dashboard-core.test.js`, `__tests__/dashboard-scatter-years.test.js`, `__tests__/power-pb-utils.test.js`, `__tests__/wordcloud-dashboard.test.js`, `__tests__/pie-charts-dashboard.test.js`, `__tests__/lifetime-statistics-dashboard.test.js`, and `__tests__/dashboard-media.test.js`.
- [X] T027 Run the full root `npm test` suite and resolve feature-related regressions; record the result in `specs/074-social-export-infographics/quickstart.md`.
- [ ] T028 Complete browser validation for all current targets in both formats, including 360 px readability, identical preview/download output, heatmap bounds, resource failures, and local-only export behavior; record evidence in `specs/074-social-export-infographics/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No production-code dependencies; T001 and T002 can run in parallel.
- **Foundational (Phase 2)**: Depends on Phase 1 test inventory; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on foundational request/layout/resource contracts; establishes the shared social composition.
- **User Story 2 (Phase 4)**: Depends on the shared composition from US1 and hardens its readability.
- **User Story 3 (Phase 5)**: Depends on US1/US2 composition; adds explicit format selection and exact map-viewport behavior.
- **User Story 4 (Phase 6)**: Depends on the stable composition and format selector; adds only optional copy.
- **Polish (Phase 7)**: Depends on the desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on another user story.
- **US2 (P1)**: Starts after US1 because it validates and adjusts the shared social composition.
- **US3 (P2)**: Starts after US1 and US2; its exact preview/download contract uses the completed composition.
- **US4 (P2)**: Starts after US3 because the humor control and state are part of the shared export request/preview flow.

### Parallel Opportunities

- Phase 1: T001 and T002 touch separate test files.
- US1 test preparation: T006, T007, and T008 touch separate family test files; T009 uses the shared export orchestration suite.
- US3 test preparation: T017 and T018 touch separate export and heatmap test files.
- User stories are intentionally sequenced after US1 because their integrations share `src/dashboard-export.js` and the export preview controls in `index.html`.

## Parallel Example: User Story 1 Test Preparation

```text
Task: "Add total-distance/equipment assertions in __tests__/dashboard-core.test.js and __tests__/dashboard-equipment.test.js"
Task: "Add PB/scatter assertions in __tests__/power-pb-utils.test.js and __tests__/dashboard-scatter-years.test.js"
Task: "Add heatmap export assertions in __tests__/dashboard-heatmap.test.js"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2 to lock down current export targets and shared request/layout behavior.
2. Complete US1 for every current target in the default square format and apply the six family-specific rules.
3. Complete US2 so the square MVP is readable at feed width and has no clipped essential content.
4. Validate that increment independently before adding portrait format and optional humor.

### Incremental Delivery

1. Phase 1 + Phase 2 establish tests and shared capture/layout foundations.
2. US1 delivers a factual, filter-free, locally generated infographic for every current export target.
3. US2 enforces legibility, contrast, and safe layout at 360 px display width.
4. US3 adds portrait format and exact heatmap viewport parity.
5. US4 adds optional humorous copy without changing facts.
6. Phase 7 validates all targets, formats, failure behavior, local processing, and user comprehension.

## Format Validation

- Every task line starts with `- [ ]`, has a sequential `T###` identifier, and uses `[P]` only when parallelizable.
- Every user-story task has exactly one `[US1]`, `[US2]`, `[US3]`, or `[US4]` label.
- Setup, foundational, and polish tasks have no story label.
- Every task names an exact source, test, or validation-document path.