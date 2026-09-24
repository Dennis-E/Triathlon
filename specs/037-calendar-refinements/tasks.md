---

description: "Executable task list for Training Calendar Refinements"
---

# Tasks: Training Calendar Refinements

**Input**: Design documents from `/specs/037-calendar-refinements/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/training-calendar-refinements-ui.md](contracts/training-calendar-refinements-ui.md), [quickstart.md](quickstart.md)

**Tests**: Included because the repository constitution requires focused tests for reusable modules and dashboard behavior.

**Organization**: Tasks are grouped by user story to support incremental delivery while preserving the existing `trainingCalendar` tab.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable when it touches a different file and has no dependency on incomplete work.
- **[Story]**: Maps a task to a user story from `spec.md`.
- Every task includes an exact repository file path.

## Path Conventions

Single static-browser project: `src/`, `__tests__/`, and `index.html` at repository root.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish refinement state and failing contracts without changing the existing tab registration.

- [X] T001 [P] Add palette and multi-year refinement test scaffolding in `__tests__/training-calendar-utils.test.js`, including synthetic activities spanning at least five years and a leap year.
- [X] T002 [P] Add failing static UI contract assertions in `__tests__/index-script-syntax.test.js` for `trainingCalendarYears`, `trainingCalendarPaletteFilters`, absence of `trainingCalendarYearSelect`, and the three palette values.
- [X] T003 [P] Add failing dashboard behavior assertions in `__tests__/index-script-syntax.test.js` for shared palette state, bright empty-cell styling, and rendering every year block.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the shared palette and multi-year model contracts used by all stories.

**CRITICAL**: Complete this phase before implementing any user story.

- [X] T004 [P] Define immutable palette metadata for `green`, `blue`, and `fire`, each with exactly five active levels plus one shared bright neutral empty level, in `src/training-calendar-utils.js`.
- [X] T005 [P] Extend `__tests__/training-calendar-utils.test.js` with palette-order tests: Green light-to-dark green, Blue light-to-dark blue, and Fire yellow-to-orange-to-red; assert that empty level 0 is palette-independent and brighter than level 1.
- [X] T006 Extend `src/dashboard-training-calendar.js` state initialization to use `green` as the default palette, retain the selected sport filter, and remove reliance on a selected year for the refined view.
- [X] T007 Replace the single-year controls in `index.html` with `trainingCalendarYears` and `trainingCalendarPaletteFilters`, keeping the existing `trainingCalendarSportFilters` and `trainingCalendarDetails` contracts intact.

**Checkpoint**: The existing Training Calendar tab still activates, but its panel now exposes the refinement shell and no year selector.

## Phase 3: User Story 1 - Alle Trainingsjahre untereinander sehen (Priority: P1) MVP

**Goal**: Render every represented year as a complete calendar block, newest first, without a year filter.

**Independent Test**: With data from three or more years, opening Training Calendar shows one complete block per represented year in descending order and no year selector; each block contains 365 or 366 real day cells.

### Tests for User Story 1

- [X] T008 [P] [US1] Add utility tests in `__tests__/training-calendar-utils.test.js` for descending year discovery, current-year-first behavior when present, newest-year fallback when current year is absent, and one block per represented year.
- [X] T009 [P] [US1] Add utility tests in `__tests__/training-calendar-utils.test.js` for 365-day and 366-day YearBlock generation, Monday-first alignment, and preserving every empty intermediate year in the inclusive newest-to-oldest year range.
- [X] T010 [P] [US1] Add UI contract tests in `__tests__/index-script-syntax.test.js` for one year heading/grid per YearBlock, descending order, and no `trainingCalendarYearSelect` markup or renderer reference.

### Implementation for User Story 1

- [X] T011 [US1] Extend `src/training-calendar-utils.js` with a multi-year model that generates every integer year between the newest and oldest valid activity years in descending order, retains the current year first when present, and creates complete YearBlocks with exactly 365 or 366 real days.
- [X] T012 [US1] Ensure the multi-year model in `src/training-calendar-utils.js` applies the existing `All`/Run/Bike/Swim/Other sport filter independently to every YearBlock without mutating source activities.
- [X] T013 [US1] Implement multi-year rendering in `src/dashboard-training-calendar.js` using `trainingCalendarYears`, with one year heading, grid, empty state, and details wiring per YearBlock.
- [X] T014 [US1] Update `src/dashboard-import.js` initialization so imported or replacement datasets rebuild all year blocks and place the current year first when available, otherwise the newest year first.

**Checkpoint**: User Story 1 is independently usable as the MVP and has no year selector.

## Phase 4: User Story 2 - Ruhetage klar von Aktivitaetstagen unterscheiden (Priority: P1)

**Goal**: Make empty days visibly bright and neutral across all year blocks and palettes.

**Independent Test**: With active and empty days visible, the empty cell is brighter than the lowest active cell in Green, Blue, and Fire; a year with no qualifying activities remains a bright full grid with a clear empty state.

### Tests for User Story 2

- [X] T015 [P] [US2] Add visual-token tests in `__tests__/training-calendar-utils.test.js` asserting one shared bright empty token, five active tokens per palette, and a relative luminance contrast ratio of at least 3:1 between empty and level 1.
- [X] T016 [P] [US2] Add static contract assertions in `__tests__/index-script-syntax.test.js` for bright empty-cell classes/tokens, full-grid empty-year rendering, and palette-independent empty styling.

### Implementation for User Story 2

- [X] T017 [US2] Update `src/training-calendar-utils.js` palette metadata and level mapping so level 0 always uses the shared bright neutral token and levels 1-5 remain distinct for every palette.
- [X] T018 [US2] Update `src/dashboard-training-calendar.js` cell rendering so empty cells use the bright neutral class/token, active cells use only selected palette levels, and empty-year blocks retain all day cells plus their empty-state message.
- [X] T019 [US2] Update `index.html` styling and legend markup so the empty swatch is bright, neutral, and visually separated from the lowest active swatch at desktop and narrow widths.

**Checkpoint**: User Stories 1 and 2 are independently demonstrable; rest days are immediately distinguishable in every year block.

## Phase 5: User Story 3 - Farbschema fuer die Kalenderdaten waehlen (Priority: P2)

**Goal**: Let users switch one shared Green, Blue, or Fire palette across all visible years without changing sport data or day details.

**Independent Test**: Selecting each of the three palette controls updates every visible year block and legend, preserves empty-cell brightness, and retains the current sport filter and day details.

### Tests for User Story 3

- [X] T020 [P] [US3] Add palette interaction tests in `__tests__/training-calendar-utils.test.js` for exact options `green`, `blue`, and `fire`, shared palette application across YearBlocks, default Green, and session-local state reset after dataset replacement.
- [X] T021 [P] [US3] Extend `__tests__/index-script-syntax.test.js` for palette button IDs, `aria-pressed` state, legend updates, Fire yellow-to-red ordering, and preservation of existing sport-filter/detail handlers.

### Implementation for User Story 3

- [X] T022 [US3] Implement palette selection and shared palette application in `src/dashboard-training-calendar.js`, repainting all YearBlocks and legends without rebuilding unrelated activity data.
- [X] T023 [US3] Add accessible Green, Blue, and Fire controls with selected-state styling and shared legend swatches in `index.html`, keeping exactly three options and no year selector.
- [X] T024 [US3] Preserve the selected palette across sport-filter rerenders and reset it to Green when a new dataset is imported in `src/dashboard-import.js`.

**Checkpoint**: All three palettes work across all visible years, while sport filters and day details remain intact.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate performance, responsive layout, accessibility, local-only behavior, and regressions.

- [X] T025 [P] Add responsive styling in `index.html` for stacked YearBlocks, readable year headings, horizontal grid scrolling, and reachable palette controls on narrow screens.
- [X] T026 [P] Add performance tests in `__tests__/training-calendar-utils.test.js` asserting at least five YearBlocks build within 2 seconds and palette/sport rerender data preparation completes within 1 second for the documented dataset size.
- [X] T027 [P] Add local-processing assertions in `__tests__/index-script-syntax.test.js` confirming the refined calendar renderer introduces no network calls and does not alter source activity sport values.
- [X] T028 Run the focused command `npm test -- training-calendar tab-navigation index-script-syntax --runInBand` and resolve refinement regressions in `src/training-calendar-utils.js`, `src/dashboard-training-calendar.js`, `index.html`, `__tests__/training-calendar-utils.test.js`, and `__tests__/index-script-syntax.test.js`.
- [X] T029 Run the full root suite with `npm test -- --runInBand` and resolve regressions caused by the refinement changes in `src/training-calendar-utils.js`, `src/dashboard-training-calendar.js`, `src/dashboard-import.js`, `index.html`, and `__tests__/`.
- [X] T030 Execute all manual scenarios in `specs/037-calendar-refinements/quickstart.md` using `python -m http.server`, including desktop/narrow viewport checks and visual contrast review.
- [X] T031 Add a browser-render benchmark in `__tests__/index-script-syntax.test.js` or the documented browser harness proving that five visible YearBlocks appear within 2 seconds after opening the calendar and remain within the 1-second rerender target after palette or sport changes.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T003 can run in parallel and establish the failing contracts.
- **Foundation (Phase 2)**: Depends on Setup; T004-T005 can run in parallel, then T006-T007 define shared state and markup.
- **US1 (Phase 3)**: Depends on Foundation; T008-T010 can run in parallel, then T011-T014 implement and integrate the multi-year MVP.
- **US2 (Phase 4)**: Depends on the YearBlock model and renderer from US1; T015-T016 can run in parallel, then T017-T019 implement the contrast behavior.
- **US3 (Phase 5)**: Depends on shared palette metadata from Foundation and visible YearBlocks from US1; T020-T021 can run in parallel, then T022-T024 wire controls and import state.
- **Polish (Phase 6)**: Depends on the desired stories; T025-T027 can run in parallel before T028-T031.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundation and is the MVP; it does not require US2 or US3.
- **US2 (P1)**: Depends on US1 YearBlocks but is independently testable through visual tokens and empty-year rendering.
- **US3 (P2)**: Depends on Foundation palette definitions and US1 rendering; it preserves US2 empty-state styling.

### Parallel Opportunities

- Setup: T001, T002, T003.
- Foundation: T004 and T005.
- US1 tests: T008, T009, T010.
- US2 tests: T015 and T016.
- US3 tests: T020 and T021.
- Polish: T025, T026, T027; T031 follows the browser harness setup and can be validated alongside T030.

## Parallel Example: User Story 1

```text
Task: "Add multi-year utility tests in __tests__/training-calendar-utils.test.js"
Task: "Add no-year-selector and YearBlock UI contract tests in __tests__/index-script-syntax.test.js"
```

## Parallel Example: User Story 2

```text
Task: "Add contrast-token tests in __tests__/training-calendar-utils.test.js"
Task: "Add bright empty-cell contract tests in __tests__/index-script-syntax.test.js"
```

## Parallel Example: User Story 3

```text
Task: "Add palette interaction tests in __tests__/training-calendar-utils.test.js"
Task: "Add palette control contract tests in __tests__/index-script-syntax.test.js"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundation.
2. Implement multi-year YearBlocks and remove the year selector.
3. Run the focused test command and validate the three-year manual scenario.
4. Stop at the US1 checkpoint before adding palette polish.

### Incremental Delivery

1. Deliver US1 with all years stacked newest first.
2. Add US2's bright neutral empty state.
3. Add US3's Green, Blue, and Fire palette selector.
4. Complete responsive, accessibility, performance, privacy, and full-suite validation.

## Notes

- `[P]` marks tasks that can touch different files without waiting on incomplete work.
- The existing `trainingCalendar` tab and tab-navigation contracts are reused; no new tab task is required.
- Palette options are exactly `green`, `blue`, and `fire`; empty level 0 is shared and palette-independent.
- Do not add `services/api` tasks or external dependencies.
