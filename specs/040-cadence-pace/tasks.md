---

description: "Task list for the Cadence versus Pace Visualization"
---

# Tasks: Cadence versus Pace Visualization

**Input**: Design documents from `/specs/040-cadence-pace/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [cadence-pace-ui.md](contracts/cadence-pace-ui.md), and [quickstart.md](quickstart.md)

**Tests**: Jest tasks are included because the project constitution requires focused verification for reusable modules and dashboard behavior.

**Organization**: Tasks are grouped by user story so that each story is independently deliverable after the shared parsing foundation is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks in the same phase when their dependencies are satisfied.
- **[Story]**: User story served by the task (`US1`, `US2`, or `US3`).
- Every task includes its exact target path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing static-browser integration contract before changing it.

- [X] T001 Review the current dashboard script order and tab integration contract in `specs/022-modularize-inline-script/contracts/script-load-order.md` and `index.html` before adding `src/dashboard-cadence-scatter.js`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Retain the new source values consistently in both activity normalizers. All user stories depend on this phase.

- [X] T002 [P] Add German and English CSV parser tests for `avgCadence` and `totalSteps` in `__tests__/processing.test.js`, including localized numbers and missing or zero values.
- [X] T003 Extend both normalizers in `src/dashboard-utils.js` and `src/dashboard-import.js` to retain `avgCadence` as a finite number greater than zero or `null`, and `totalSteps` as a finite number greater than zero or `null` only for `Run`, recognizing `Average Cadence` / `Durchschnittliche Trittfrequenz` and `Total Steps` / `Schritte insgesamt` without changing duplicate `Distance` / `Distanz` handling.
- [X] T004 Run `npm test -- --runInBand __tests__/processing.test.js` and resolve failures caused by the normalization changes in `__tests__/processing.test.js`.

**Checkpoint**: Imported activity objects have stable, locale-aware cadence and optional Run step fields without affecting existing metrics.

---

## Phase 3: User Story 1 - Laufkadenz und Pace vergleichen (Priority: P1) MVP

**Goal**: An athlete can inspect one bubble per qualifying Run activity, compare step cadence with pace, and see reported total steps in the point detail.

**Independent Test**: Import at least two qualifying Run activities, including one with total steps; the chart shows both without zero-value points and only the qualifying point exposes total steps.

- [X] T005 [P] [US1] Add pure-model tests in `__tests__/scatter-utils.test.js` for Run cadence points, date filtering, invalid or zero cadence exclusion, invalid pace exclusion, and preserving optional `totalSteps`.
- [X] T006 [US1] Implement `getCadencePacePoints` and Run sport-availability selection in `src/scatter-utils.js`; a qualifying activity must have `sport` exactly `Run`, `Bike`, or `Swim`, `avgCadence` finite and greater than zero, and a valid existing sport performance metric, while failed rules produce no point.
- [X] T007 [US1] Create `src/dashboard-cadence-scatter.js` with isolated cadence-chart state and a Chart.js Run renderer that uses `getCadencePacePoints`, keeps one qualifying activity as one bubble, groups points and optional trend lines by year, and renders Run tooltips with activity, date, step cadence, pace, distance, duration, and `Total steps` only when supplied.
- [X] T008 [P] [US1] Extend tab navigation tests in `__tests__/tab-navigation.test.js` with `cadencePace`, including tab order, keyboard cycling, active ARIA state, focus, and panel visibility.
- [X] T009 [US1] Register `cadencePace` in `src/tab-navigation.js` and add the Cadence vs Pace tab button, tab panel, Run canvas, explanatory empty state, and `openDashboardTab` mapping in `index.html` according to `specs/040-cadence-pace/contracts/cadence-pace-ui.md`.
- [X] T010 [US1] Add Cadence vs Pace render dispatch in `src/dashboard-tabs.js`, load `src/dashboard-cadence-scatter.js` after `src/dashboard-scatter.js` and before `src/dashboard-export.js` in `index.html`, and initialize the first available cadence sport after an import in `src/dashboard-import.js`.
- [X] T011 [US1] Run `npm test -- --runInBand __tests__/processing.test.js __tests__/scatter-utils.test.js __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js` and fix User Story 1 regressions in the affected files.

**Checkpoint**: User Story 1 is independently usable as the MVP.

---

## Phase 4: User Story 2 - Radkadenz und Geschwindigkeit vergleichen (Priority: P2)

**Goal**: An athlete with measured cycling cadence can select Bike and compare pedal cadence with speed, without mixing in running steps.

**Independent Test**: Import at least two qualifying Bike activities and select Bike; both appear with pedal-cadence terminology and speed, while a Bike point exposes no total-step value.

- [X] T012 [P] [US2] Add Bike-specific point-model and availability tests in `__tests__/scatter-utils.test.js`, covering `speed_bike`, exclusion of invalid Bike cadence, and no `totalSteps` in Bike point details.
- [X] T013 [US2] Extend sport presentation metadata and selector behavior in `src/dashboard-cadence-scatter.js` so Bike is offered only when qualifying points exist, is labelled `Average pedal cadence`, compares against Speed, and never renders a step row.
- [X] T014 [US2] Update the Bike acceptance coverage in `__tests__/scatter-utils.test.js` and rerun `npm test -- --runInBand __tests__/scatter-utils.test.js`.

**Checkpoint**: User Story 2 is independently usable whenever a sensor-exported Bike cadence exists.

---

## Phase 5: User Story 3 - Schwimmrhythmus nutzen, wenn gemessen (Priority: P3)

**Goal**: An athlete with cadence-bearing swim activities can compare a neutrally named swim rhythm against swim pace without unsupported stroke claims.

**Independent Test**: Import qualifying Swim activities and select Swim; each appears with swim-rhythm and pace labels, while an import without qualifying swim values does not offer Swim.

- [X] T015 [P] [US3] Add Swim-specific point-model and availability tests in `__tests__/scatter-utils.test.js`, covering `pace_swim`, invalid cadence and pace exclusion, and stable Run-Bike-Swim availability ordering.
- [X] T016 [US3] Extend sport presentation metadata and selector behavior in `src/dashboard-cadence-scatter.js` so Swim is offered only when qualifying points exist, is labelled `Average swim rhythm`, compares against Pace, and never claims a stroke type, stroke count, or Zugfrequenz.
- [X] T017 [US3] Run `npm test -- --runInBand __tests__/scatter-utils.test.js` and resolve Swim behavior regressions in `src/scatter-utils.js` or `src/dashboard-cadence-scatter.js`.

**Checkpoint**: All three sports have correct, data-dependent vocabulary and units.

---

## Phase 6: Polish and Cross-Cutting Concerns

**Purpose**: Verify loading, privacy, empty states, responsiveness, and regressions across the completed feature.

- [X] T018 Update `specs/022-modularize-inline-script/contracts/script-load-order.md` with `src/dashboard-cadence-scatter.js` after `src/dashboard-scatter.js` and before `src/dashboard-heatmap.js`, including the chart-domain dependency rule.
- [X] T019 Update `__tests__/index-script-syntax.test.js` to include `src/dashboard-cadence-scatter.js` and assert its script tag order after `src/dashboard-scatter.js` and before `src/dashboard-heatmap.js` in `index.html`.
- [X] T020 Add a synthetic 3,000-activity cadence dataset and a timing check in `__tests__/scatter-utils.test.js` that verifies `getCadencePacePoints` completes within one second on the local test environment.
- [X] T021 Run `npm test -- --runInBand __tests__/processing.test.js __tests__/scatter-utils.test.js __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js` and fix only feature-related failures in the files under test.
- [ ] T022 Serve `index.html` with `python -m http.server` and execute every scenario in `specs/040-cadence-pace/quickstart.md`, including Run, Bike, Swim, no-data, keyboard navigation, console, local-data-boundary, chart-render timing, and the documented moderated Usability-Check.
- [X] T023 Run `npm test -- --runInBand` from the repository root and record any unrelated pre-existing failures separately from cadence-feature results in `specs/040-cadence-pace/quickstart.md`.

---

## Dependencies and Execution Order

```text
Phase 1: Setup
    |
Phase 2: Foundational parser work
    |
    +--> US1 (P1, MVP) --> US2 (P2) --> US3 (P3) --> Polish
```

- US1 requires the Phase 2 normalized fields and establishes the new tab and chart shell.
- US2 requires the shared point model and chart shell delivered by US1, but its Bike labels and tests are otherwise isolated.
- US3 requires the shared point model and chart shell delivered by US1, but its Swim labels and tests are otherwise isolated.
- Polish starts after all desired user stories are complete.

## Parallel Opportunities

### Foundational Phase

- T002 can be drafted independently before T003, then serves as the focused check for that implementation.

### User Story 1

- T005 and T008 touch independent test files and can proceed in parallel.
- T007 can begin after T006; T009 can prepare static markup after T008 but must finish before T010 wires the renderer.

### User Story 2

- T012 can be written in parallel with the planning of T013; T014 follows both.

### User Story 3

- T015 can be written in parallel with the planning of T016; T017 follows both.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T004 to retain trustworthy cadence and step fields.
2. Complete T005-T011 to deliver the Run chart, step tooltip, tab integration, and focused verification.
3. Manually import qualifying Run data and verify the MVP before broadening sports.

### Incremental Delivery

1. Add Bike wording and behavior through T012-T014.
2. Add conservative Swim rhythm wording and behavior through T015-T017.
3. Complete T018-T023 for static-script, performance, browser, privacy, usability, and full-regression confidence.