---

description: "Executable task list for Training Calendar Contrast and Tooltips"
---

# Tasks: Training Calendar Contrast and Tooltips

**Input**: Design documents from `/specs/038-calendar-tooltips/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/training-calendar-tooltips-ui.md](contracts/training-calendar-tooltips-ui.md), [quickstart.md](quickstart.md)

**Tests**: Included because the repository constitution requires focused tests for reusable modules and dashboard behavior.

**Organization**: Tasks are grouped by user story while preserving the existing `trainingCalendar` tab and multi-year model.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable when it touches a different file and has no dependency on incomplete work.
- **[Story]**: Maps a task to a user story from `spec.md`.
- Every task includes an exact repository file path.

## Path Conventions

Single static-browser project: `src/`, `__tests__/`, and `index.html` at repository root.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish failing contracts for stronger palettes, tooltip host, and removal of the global detail area.

- [X] T001 [P] Add palette contrast and tooltip-summary test scaffolding in `__tests__/training-calendar-utils.test.js` with synthetic activities containing names, sports, duration, distance, missing values, and multiple years.
- [X] T002 [P] Add static UI contract assertions in `__tests__/index-script-syntax.test.js` for `trainingCalendarDayTooltip`, stronger palette tokens, removal of `trainingCalendarDetails`, and preserved `trainingCalendarYears`/palette/sport controls.
- [X] T003 [P] Add renderer contract assertions in `__tests__/index-script-syntax.test.js` for mouseenter/focus tooltip behavior, close behavior, bounded scrolling, and no network calls.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the pure tooltip activity model and stable palette tokens used by all stories.

**CRITICAL**: Complete this phase before implementing user stories.

- [X] T004 [P] Strengthen the Green and Blue palette constants in `src/training-calendar-utils.js`, preserving exactly five ordered active levels and the shared `EMPTY_DAY_COLOR`.
- [X] T005 [P] Add utility tests in `__tests__/training-calendar-utils.test.js` proving all five Green/Blue levels are distinct, the empty token is exactly `#F1F5F9` rather than `#FFFFFF`, and level 1 meets the documented contrast target against the empty token.
- [X] T006 Extend `src/training-calendar-utils.js` day aggregation to produce immutable `tooltipActivities` summaries with `id`, `name`, mapped sport, and nullable valid duration/distance fields without mutating source activities.
- [X] T007 Add `trainingCalendarDayTooltip` markup inside the calendar panel in `index.html`, with a bounded scroll container and accessible live/description behavior; retain existing year/palette/sport containers.

**Checkpoint**: Palette and tooltip data contracts exist, and the panel has a local tooltip host without changing tab navigation.

## Phase 3: User Story 1 - Blue- und Green-Stufen klar erkennen (Priority: P1) MVP

**Goal**: Make every Blue and Green active level, especially level 1, visibly distinct from empty days.

**Independent Test**: With days mapped to all five intensity levels, selecting Green and Blue shows five distinguishable active colors and a clear level-1 versus empty-day contrast.

### Tests for User Story 1

- [X] T008 [P] [US1] Extend `__tests__/training-calendar-utils.test.js` with explicit Green/Blue color-order and contrast assertions, including exact `#F1F5F9` empty-cell validation and a relative luminance ratio of at least 3:1 between the empty token and level 1.
- [X] T009 [P] [US1] Extend `__tests__/index-script-syntax.test.js` to assert stronger Green/Blue token usage in cell rendering and palette legend rendering without changing the Fire palette contract.

### Implementation for User Story 1

- [X] T010 [US1] Update `src/training-calendar-utils.js` with the final stronger Green/Blue tokens and expose palette metadata for renderer and tests.
- [X] T011 [US1] Update `src/dashboard-training-calendar.js` cell and legend rendering to use the strengthened Green/Blue levels while keeping empty cells palette-independent at `#F1F5F9` and never pure white.
- [X] T012 [US1] Add or update accessible palette legend labels in `index.html` so all five active levels and the empty state remain identifiable.

**Checkpoint**: User Story 1 is independently demonstrable; Blue and Green stage 1 is clearly visible.

## Phase 4: User Story 2 - Tagesaktivitaeten direkt am Feld sehen (Priority: P1)

**Goal**: Show filtered activity details in one local tooltip anchored to the hovered or focused day cell.

**Independent Test**: Hover and keyboard-focus a day with multiple activities across a selected year/sport filter; the local tooltip lists only that day's activity rows with available values.

### Tests for User Story 2

- [X] T013 [P] [US2] Add utility tests in `__tests__/training-calendar-utils.test.js` for tooltip activity name fallback, sport mapping, multiple same-day rows, nullable duration/distance omission, and source immutability.
- [X] T014 [P] [US2] Add static contract assertions in `__tests__/index-script-syntax.test.js` for tooltip date/activity rows, mouseenter/focus handlers, missing-value omission, and multi-year day isolation.

### Implementation for User Story 2

- [X] T015 [US2] Extend `src/training-calendar-utils.js` aggregation so each filtered `TrainingDay` exposes ordered `tooltipActivities` and `hasTooltipActivities` for the exact year/sport context.
- [X] T016 [US2] Implement tooltip rendering helpers in `src/dashboard-training-calendar.js` for date heading, separate activity rows, safe fallback names, sport labels, and optional duration/distance text.
- [X] T017 [US2] Add shared tooltip lifecycle handlers in `src/dashboard-training-calendar.js` for mouseenter, mouseleave, focus, and blur; replace content and anchor whenever the active day changes.
- [X] T018 [US2] Add accessible day-to-tooltip association and keyboard behavior in `index.html`/`src/dashboard-training-calendar.js`, ensuring focus exposes the same details as hover.

**Checkpoint**: User Stories 1 and 2 work together; each day tooltip is local, complete, and isolated to its year/filter context.

## Phase 5: User Story 3 - Kein konkurrierender globaler Detailbereich (Priority: P2)

**Goal**: Remove the lower global day-detail area and ensure all day-specific details remain local to the active field.

**Independent Test**: With multiple year blocks visible, moving across cells changes only the local tooltip; no `trainingCalendarDetails` element or global day-detail update remains.

### Tests for User Story 3

- [X] T019 [P] [US3] Add static contract assertions in `__tests__/index-script-syntax.test.js` that `trainingCalendarDetails` is absent, no renderer function updates it, and `trainingCalendarDayTooltip` is the only day-specific detail surface.
- [X] T020 [P] [US3] Add multi-year isolation tests in `__tests__/training-calendar-utils.test.js` for same date keys in different years and sport-filtered tooltip activity lists.

### Implementation for User Story 3

- [X] T021 [US3] Remove the `trainingCalendarDetails` markup and any `selectTrainingCalendarDay` global-detail updates from `index.html` and `src/dashboard-training-calendar.js`.
- [X] T022 [US3] Update `src/dashboard-training-calendar.js` to close the local tooltip on pointer leave/blur when no related calendar cell remains active, without writing day details elsewhere.
- [X] T023 [US3] Verify `src/dashboard-import.js` and existing sport/palette rerender paths continue to initialize the tooltip host and preserve multi-year, sport, and palette state without global details.

**Checkpoint**: All three user stories are independently validated; day information never appears in a misleading lower global area.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate positioning, responsive behavior, performance, accessibility, privacy, and regressions.

- [X] T024 [P] Implement tooltip collision handling and panel-relative clamping in `src/dashboard-training-calendar.js` so edge cells remain visible and the tooltip stays inside the calendar panel.
- [X] T025 [P] Add max-height, overflow scrolling, narrow-viewport layout, and focus-visible styling for `trainingCalendarDayTooltip` in `index.html`.
- [X] T026 [P] Add renderer contract checks in `__tests__/index-script-syntax.test.js` for no `fetch`, `XMLHttpRequest`, or beacon calls and no serialization of unrelated source activity fields.
- [X] T027 [P] Add a performance test in `__tests__/training-calendar-utils.test.js` asserting tooltip summaries for a large multi-year dataset are prepared within the documented 300 milliseconds interaction budget.
- [X] T028 Run the focused command `npm test -- training-calendar-utils index-script-syntax tab-navigation --runInBand` and resolve regressions in `src/training-calendar-utils.js`, `src/dashboard-training-calendar.js`, `index.html`, `__tests__/training-calendar-utils.test.js`, and `__tests__/index-script-syntax.test.js`.
- [X] T029 Run the full root suite with `npm test -- --runInBand` and resolve only regressions caused by the tooltip refinement in `src/`, `index.html`, and `__tests__/`.
- [X] T030 Execute all manual scenarios in `specs/038-calendar-tooltips/quickstart.md` with `python -m http.server`, including multi-year hover, keyboard focus, edge positioning, and narrow viewport checks.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T003 can run in parallel.
- **Foundation (Phase 2)**: Depends on Setup; T004-T007 define palette, data, and tooltip host.
- **US1 (Phase 3)**: Depends on Foundation; T008-T009 can run in parallel before T010-T012.
- **US2 (Phase 4)**: Depends on tooltip-ready day data and host; T013-T014 can run in parallel before T015-T018.
- **US3 (Phase 5)**: Depends on the local tooltip from US2; T019-T020 can run in parallel before T021-T023.
- **Polish (Phase 6)**: Depends on all desired stories; T024-T027 can run in parallel before T028-T030.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundation and is the MVP; no tooltip dependency.
- **US2 (P1)**: Depends on Foundation and the existing multi-year calendar renderer; independently testable after its tooltip model and lifecycle are complete.
- **US3 (P2)**: Depends on US2's local tooltip so removing the global area does not remove day details.

### Parallel Opportunities

- Setup: T001, T002, T003.
- Foundation: T004 and T005; T006 and T007 can proceed after the model contract is agreed.
- US1 tests: T008 and T009.
- US2 tests: T013 and T014.
- US3 tests: T019 and T020.
- Polish: T024, T025, T026, T027.

## Parallel Example: User Story 1

```text
Task: "Add Green/Blue contrast tests in __tests__/training-calendar-utils.test.js"
Task: "Add palette legend contract tests in __tests__/index-script-syntax.test.js"
```

## Parallel Example: User Story 2

```text
Task: "Add tooltip summary tests in __tests__/training-calendar-utils.test.js"
Task: "Add tooltip interaction contract tests in __tests__/index-script-syntax.test.js"
```

## Parallel Example: User Story 3

```text
Task: "Add global-detail removal contract tests in __tests__/index-script-syntax.test.js"
Task: "Add multi-year isolation tests in __tests__/training-calendar-utils.test.js"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundation.
2. Strengthen Green and Blue palettes and validate level-1 visibility.
3. Run the focused tests and demonstrate the contrast improvement.
4. Stop at the US1 checkpoint before adding tooltip interaction.

### Incremental Delivery

1. Deliver US1 contrast improvements.
2. Add local day tooltips for hover and keyboard focus.
3. Remove the global bottom detail area while preserving local details.
4. Complete collision, responsive, privacy, performance, and full-suite validation.

## Notes

- `[P]` marks tasks that can touch different files without waiting on incomplete work.
- Reuse the existing `trainingCalendar` tab; no tab-navigation changes are needed.
- Tooltip rows must expose only display-safe activity fields and omit invalid metrics.
- Do not add `services/api` tasks or external dependencies.
