---
description: "Implementation tasks for Social Export Readability Refinements"
---

# Tasks: Social Export Readability Refinements

**Input**: Design documents from `specs/075-social-export-readability/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/export-refinements.md`, `quickstart.md`

**Tests**: Focused tests are included because the repository constitution requires relevant tests for dashboard behavior and reusable utilities.

**Organization**: Tasks are grouped by the four user stories. All changes remain in the existing export path; there are no new tabs, APIs, dependencies, or persisted entities.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Tasks touch different files and have no dependency on unfinished work.
- **[Story]**: Required story label identifies the user journey served.
- Every task names the source, test, or validation-document path it changes.

## Phase 1: Setup

**Purpose**: Establish regression coverage and confirm that the refinement continues using the existing shared PNG export contract.

- [X] T001 Existing regression tests verify unchanged square/portrait export dimensions and identical preview/download PNG data in `__tests__/dashboard-export-download.test.js`.

---

## Phase 2: Foundational

**Purpose**: Confirm the shared export snapshot exposes a private presentation surface without mutating live dashboard state; this is prerequisite to family-specific styling.

- [X] T002 Export-snapshot tests prove cloned chart/SVG styling can change while live chart/SVG styles and selected data remain unchanged in `__tests__/dashboard-tooltips.test.js` and `__tests__/dashboard-export-download.test.js`.

**Checkpoint**: The shared preview/download capture contract and live-view isolation are covered before story-specific styling begins.

---

## Phase 3: User Story 1 - Read Workout Time axes (Priority: P1)

**Goal**: Make both Workout Time axes and units high-contrast and legible in the PNG without changing the dashboard chart or its values.

**Independent Test**: Export Day and Year Workout Time views in Square and Portrait; verify axis titles/units are correct, export text is at least 30 px and 4.5:1 contrast, preview matches PNG, and the live chart styling is unchanged.

### Tests for User Story 1

- [X] T003 [P] [US1] Tests cover Workout Time x/y titles, tick colors, and minimum tick/title font size in the private export chart configuration in `__tests__/dashboard-core.test.js` and `__tests__/dashboard-tooltips.test.js`.
- [X] T004 [P] [US1] A preview/download regression test verifies the Workout Time chart snapshot reaches final composition and the exact preview PNG is downloaded in `__tests__/dashboard-export-download.test.js`.

### Implementation for User Story 1

- [X] T005 [US1] Workout Time export-only axis styling flows through the private chart snapshot in `src/dashboard-export.js` and `src/dashboard-tooltips.js`; selected granularity, units, and dataset values remain unchanged.

**Checkpoint**: Workout Time Square and Portrait images retain exact metrics and show readable, high-contrast axis labels while the live dashboard remains unchanged.

---

## Phase 4: User Story 2 - Recognize Training Calendar years (Priority: P1)

**Goal**: Make every calendar year readable and provide a numbered, complete series when years cannot fit in one image.

**Independent Test**: Export a multi-year synthetic calendar in both formats; verify year labels are at least 30 px, each year appears exactly once, all pages use the same calendar scale, and preview/download pages and numbering agree.

### Tests for User Story 2
- [X] T006 [P] [US2] Tests cover cloned year-heading size/contrast, unchanged live labels, and read-only calendar export metadata in `__tests__/dashboard-export-download.test.js` and `__tests__/index-script-syntax.test.js`.
- [X] T007 [US2] Tests verify calendar splitting, complete unique year coverage, visible page numbering, shared scale, and consistent format in `__tests__/dashboard-export-download.test.js`.

### Implementation for User Story 2

- [X] T008 [US2] A read-only calendar export adapter and stable year identity use the existing `trainingCalendarModel.years` in `src/dashboard-training-calendar.js`.
- [X] T009 [US2] Export-only 30 px high-contrast year headings apply to cloned sections with space reserved before the calendar grid in `src/dashboard-export.js`.
- [X] T010 [US2] Calendars split only when measured readable section height exceeds format capacity; every page retains every year exactly once and the same scale, format, and page count across `src/dashboard-export.js` and `src/dashboard-training-calendar.js`.
- [X] T011 [US2] Each calendar page captures its selected cloned years and uses existing preview navigation plus one-PNG-per-download behavior in `src/dashboard-export.js` and `index.html`.

**Checkpoint**: A calendar fits in one image when readable; otherwise the user can preview/download a numbered, complete multi-image series with comparable scales.

---

## Phase 5: User Story 3 - Understand Pace vs. at a glance (Priority: P1)

**Goal**: Replace verbose field-name context with a concise, accurate summary while retaining precise axes, series labels, units, and point-size meaning.

**Independent Test**: Export Run and Bike comparisons with visible year/trend series in both formats; verify the summary uses Pace for Run and Speed for Bike, names duration point-size encoding, and axis titles/units/series colors remain correct.

### Tests for User Story 3

- [X] T012 [P] [US3] Tests cover Run/Swim Pace and Bike Speed summary copy, optional date range and point-size meaning, plus unchanged axes and values in `__tests__/dashboard-export-download.test.js` and `__tests__/dashboard-scatter-years.test.js`.

### Implementation for User Story 3
- [X] T013 [US3] Pace vs. renders a compact sport/comparison/point-size summary without redundant field prefixes while preserving exact axes, units, year legend, trend lines, and data in `src/dashboard-export.js`.

---

## Phase 6: User Story 4 - Understand a Personal Best card (Priority: P1)

**Goal**: Identify the exact PB and show a readable result and simple first-to-current summary without dense milestone text.

**Independent Test**: Export multi-record and single-record PB details in both formats; verify the `PB:` headline, prominent formatted result, concise summary only for multiple records, separate source attribution, and readable axes/point descriptions.

### Tests for User Story 4

- [X] T014 [US4] Tests cover `PB:` identity, first/current formatted values, first-record year, one-record behavior, and separate source attribution in `__tests__/dashboard-export-download.test.js`.
- [X] T015 [US4] Tests cover clone-only PB axis, result and wrapped event-description typography without changing live SVG typography in `__tests__/dashboard-export-download.test.js` and `__tests__/wordcloud-dashboard.test.js`.

### Implementation for User Story 4

- [X] T016 [US4] PB headlines use `PB: [record]`; multiple records receive a factual first-to-current summary only when values exist, with source/event attribution separate and no trend for one record in `src/dashboard-export.js` and `src/dashboard-power-pb.js`.
- [X] T017 [US4] PB SVG axis/event text is at least 36 px and results 44 px in the export clone, with long descriptions reflowed and the live SVG unchanged in `src/dashboard-export.js` and `src/dashboard-power-pb.js`.

**Checkpoint**: PB exports identify the record, show only supported progress context, retain available provenance, and remain readable in both formats.

---

## Phase 7: Polish & Cross-Cutting Validation

**Purpose**: Verify shared output guarantees and the final visual matrix without claiming unperformed user research.

- [X] T018 Updated `specs/075-social-export-readability/quickstart.md` with results for all four affected views, both formats, the calendar series, PB history variants, and 355-361 px display widths.
- [X] T019 Ran the six specified focused Jest suites successfully: 381 tests passed.
- [X] T020 Ran `npm test -- --runInBand` successfully: 42 suites and 1,117 tests passed; result recorded in `specs/075-social-export-readability/quickstart.md`.
- [X] T021 Completed Chromium validation for Workout Time, Training Calendar (including numbered series), Pace vs., and PB in Square and Portrait at about 360 px; verified preview/download identity, unchanged live chart/SVG data and styling, no overlap, and no export-time fetches; evidence recorded in `specs/075-social-export-readability/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No production-code dependencies.
- **Foundational (Phase 2)**: Depends on Setup; confirms shared capture isolation and preview/download behavior.
- **User Story 1 (Phase 3)**: Depends on Foundation; establishes final-size chart label styling.
- **User Story 2 (Phase 4)**: Depends on Foundation; calendar series uses the shared export/page-preview mechanism from Feature 074 and may be implemented independently of the Workout Time styling.
- **User Story 3 (Phase 5)**: Depends on Foundation; changes only presentation-summary generation in the shared renderer.
- **User Story 4 (Phase 6)**: Depends on Foundation; PB title/summary and clone sizing are isolated to the PB presentation path.
- **Polish (Phase 7)**: Depends on all desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2; no dependency on other stories.
- **US2 (P1)**: Can start after Phase 2; the numbered series uses the existing export-series navigation and does not depend on other story content.
- **US3 (P1)**: Can start after Phase 2; depends on existing Pace vs. metadata from Feature 074.
- **US4 (P1)**: Can start after Phase 2; depends on existing PB record metadata from Feature 074.

All four stories touch the shared export renderer or its clone configuration; implementation tasks touching `src/dashboard-export.js` must be integrated sequentially even though independent test preparation can proceed in parallel.

### Parallel Opportunities

- Phase 1/2 characterization tests in separate test files can run in parallel.
- US1 tests in `dashboard-core.test.js` and `dashboard-tooltips.test.js` can run in parallel.
- US2 tests for clone styling and series page metadata can run in parallel before implementation.
- US4 test additions in the export suite and existing PB detail suite can run in parallel.
- User stories are independently testable after Foundation; merge changes to the shared export renderer sequentially.

## Parallel Example: Calendar Story Test Preparation

```text
Task: "Test export-clone year font size and live-style isolation in __tests__/index-script-syntax.test.js"
Task: "Test calendar page completeness and shared scale in __tests__/dashboard-export-download.test.js"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2 to preserve existing export dimensions and capture/download isolation.
2. Complete US1 to make Workout Time axis labels readable in both formats.
3. Validate US1 independently; it is the smallest focused delivery increment.

### Incremental Delivery

1. Add US2 calendar year labels and numbered shared-scale series.
2. Add US3 concise Pace vs. summary while keeping axes precise.
3. Add US4 PB identity, summary, and clone-only label readability.
4. Complete T018–T021 across the four affected views and both formats.

## Format Validation

- Every task line uses `- [ ] T###`, sequential IDs, and `[P]` only for independent work.
- Every User Story task has exactly one matching `[US1]`–`[US4]` label.
- Setup, Foundation, and Polish tasks have no story label.
- Every task names its exact source, test, or validation-document path.
