---

description: "Task list for Power PB and Landing Preview Polish"
---

# Tasks: Power PB and Landing Preview Polish

**Input**: Design documents from [specs/045-power-pb-landing-polish](.)

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/power-pb-landing-ui.md](contracts/power-pb-landing-ui.md), [quickstart.md](quickstart.md)

**Organization**: Tasks are grouped by user story. Tests are included because the project constitution requires focused verification for dashboard behavior and reusable modules.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm affected source surfaces and establish an automated baseline.

- [X] T001 [P] Inspect the all-time power profile data flow, PB detail chart renderer, and image-export capture path in `src/dashboard-power-pb.js` and `src/dashboard-export.js` against [contracts/power-pb-landing-ui.md](contracts/power-pb-landing-ui.md)
- [X] T002 [P] Inspect the shared sticky sport header, responsive PB category grid, and distance-only landing-card description in `index.html` against [spec.md](spec.md)

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Verify the existing focused test baseline before adding story changes.

- [X] T003 Run `npm test -- --runInBand power-pb-utils index-script-syntax` from the repository root and record any pre-existing failures before implementation

**Checkpoint**: Existing utility and inline-script test surfaces are understood; story work can proceed without changing shared infrastructure.

## Phase 3: User Story 1 - Read and Export the All-Time Power Profile (Priority: P1) 🎯 MVP

**Goal**: Make the compact all-time power tile legible and ensure the tile, full-screen detail view, and downloaded export show the same watt-by-duration profile.

**Independent Test**: With multiple Bike duration records, compare the compact chart size with neighboring PB charts; confirm full-screen and downloaded image views show matching duration/watt records with duration ticks rather than calendar years. Verify ordinary history charts retain date axes.

### Tests for User Story 1

- [X] T004 [P] [US1] Add regression tests in `__tests__/power-pb-utils.test.js` confirming the all-time profile still selects one highest-watt record per available duration and returns duration-sorted points without changing values or record membership
- [X] T005 [P] [US1] Add renderer/export contract assertions in `__tests__/index-script-syntax.test.js` for a duration-category all-time profile detail model, duration labels in the detail/export capture, shared profile values, and unchanged date-axis rendering for chronological PB histories

### Implementation for User Story 1

- [X] T006 [US1] Extend the all-time profile detail model and `renderPbDetailChart()` in `src/dashboard-power-pb.js` so profile points retain `durationSeconds`, `durationLabel`, and `watts`, duration categories drive the x positions/ticks, and ordinary PB detail charts keep their date/year axis
- [X] T007 [US1] Adjust the compact all-time profile SVG sizing and plot spacing in `src/dashboard-power-pb.js` so it preserves aspect ratio, stays within the profile block at 390 px and 1280 px, occupies at least 90% of inner width, avoids axis-label overlap and clipping, and draws a vertical measurement line from every point to the x-axis
- [X] T008 [US1] Run `npm test -- --runInBand power-pb-utils index-script-syntax` and resolve relevant regressions in `src/dashboard-power-pb.js`, `src/power-pb-utils.js`, and the focused test files

**Checkpoint**: User Story 1 works independently; compact, enlarged, and exported all-time power views share the correct duration/watt profile.

## Phase 4: User Story 3 - Match Sport Labels to Their Visualizations at Every Screen Width (Priority: P1)

**Goal**: Keep the shared sticky Swim/Bike/Run header aligned over the dashboard columns on desktop; on mobile, hide it and show per-category sport headings with PB content in Run/Bike/Swim order.

**Independent Test**: Review the Personal Bests dashboard at approximately 390px and 1280px viewport widths. On mobile confirm the shared header is hidden and each metric row shows Run, Bike, then Swim headings immediately before their PB content; on desktop confirm the shared sticky header aligns over the columns.

### Tests for User Story 3

- [X] T009 [US3] Add markup contract tests in `__tests__/index-script-syntax.test.js` asserting the shared sticky header is desktop-only and mobile headings precede Run/Bike/Swim PB cells in that order for each metric row

### Implementation for User Story 3

- [X] T010 [US3] Update the Personal Bests dashboard grid in `index.html` to hide its shared sticky Swim/Bike/Run header below the desktop breakpoint, show per-cell headings above mobile PB content in Run/Bike/Swim order for each metric category, and preserve the aligned desktop columns

**Checkpoint**: User Story 3 works independently at narrow and wide viewport widths without detached sport labels.

## Phase 5: User Story 2 - Understand the Breadth of Personal Bests from the Landing Page (Priority: P2)

**Goal**: Replace the distance-only Personal Bests card description with concise, accurate wording that conveys PB progress across multiple record dimensions.

**Independent Test**: Inspect the Personal Bests landing card and verify its description explicitly indicates progress beyond distance without claiming unsupported categories.

### Tests for User Story 2

- [X] T011 [US2] Add a landing-card copy contract test in `__tests__/index-script-syntax.test.js` that requires the Personal Bests description to communicate more than distance and rejects the current distance-only wording

### Implementation for User Story 2

- [X] T012 [US2] Update the Personal Bests landing-card description in `index.html` to describe progress across multiple PB dimensions accurately and concisely

**Checkpoint**: User Story 2 works independently; visitors are not led to believe Personal Bests cover distance only.

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Validate feature integration and preserve existing behavior.

- [X] T013 Run `npm test -- --runInBand` from the repository root and resolve regressions introduced by the feature without broadening scope
- [ ] T014 Follow the all-time profile export and responsive Personal Bests dashboard scenarios in [quickstart.md](quickstart.md) using synthetic Bike power records, verify the compact chart and full-screen duration axis at 390 px and 1280 px, then validate the downloaded image export and unchanged chronological PB charts

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No implementation dependency; confirms the existing change surfaces.
- **Foundational (Phase 2)**: Depends on setup and provides the focused test baseline; blocks story implementation until complete.
- **User Stories (Phases 3–5)**: Each story depends on the baseline. US1 and US3 are P1; US2 is P2. User stories are independently testable, but story work that edits `index.html` or `__tests__/index-script-syntax.test.js` should be coordinated to avoid same-file conflicts.
- **Polish (Phase 6)**: Depends on all selected stories being implemented.

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2; delivers the core power-profile correction and is the recommended MVP.
- **US3 (P1)**: Independent after Phase 2; modifies responsive sport headings and PB dashboard layout only.
- **US2 (P2)**: Independent after Phase 2; modifies landing-card copy only. It can be delivered separately from the chart and layout changes.

### Within Each User Story

- Add the focused regression/contract tests before implementing the corresponding behavior.
- Complete the duration-aware detail model/renderer before validating the export, which captures the rendered detail chart.
- Complete responsive dashboard sport headings before viewport validation; update landing-card copy independently of PB chart behavior.

## Parallel Opportunities

- T001 and T002 can proceed in parallel because they inspect separate PB/export and Personal Bests dashboard/landing-card surfaces.
- T004 and T005 can proceed in parallel because they modify separate test files.
- US1 and US3 can be implemented independently after Phase 2 if separate contributors coordinate the shared contract-test file; avoid concurrent edits to `__tests__/index-script-syntax.test.js`.
- US2 and US3 both touch `index.html`, so implement them sequentially or coordinate a single combined edit to that file.

### Parallel Example: User Story 1

```text
Task: T004 all-time power profile selection regression tests in __tests__/power-pb-utils.test.js
Task: T005 duration-axis and export renderer contracts in __tests__/index-script-syntax.test.js
```

### MVP First (User Story 1 Only)

1. Complete Setup and the focused test baseline.
2. Complete US1 tests and the compact/detail/export chart correction.
3. Run T008 and validate US1 independently using the manual power-profile scenarios in [quickstart.md](quickstart.md).
4. Deliver the MVP once the compact tile, detail view, and downloaded image show matching duration/watt data without changing other PB histories.

### Incremental Delivery

1. Deliver US1 as the all-time power profile MVP.
2. Add US3 responsive sport headings for the Personal Bests dashboard.
3. Add US2 copy correction.
4. Run the full suite and all manual browser scenarios.

## Notes

- Task IDs are sequential; every task has a checkbox, ID, and concrete repository path or runnable validation command.
- [P] is used only where tasks use separate files and have no dependency on incomplete implementation work.
- No task changes power PB qualification, API/service behavior, navigation, or external dependencies.
- T014 remains open until the downloaded image export is verified. The compact profile was checked at 390 px and 1280 px with synthetic records (eight duration points); the detail view shows duration ticks and no calendar years. No private export was opened, and `test-data/` contains no fixtures.
