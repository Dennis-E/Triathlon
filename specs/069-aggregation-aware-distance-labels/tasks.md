---

description: "Task list for aggregation-aware distance labels"
---

# Tasks: Aggregation-Aware Distance Labels

**Input**: Design documents from `specs/069-aggregation-aware-distance-labels/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/total-distance-labels.md](contracts/total-distance-labels.md), [quickstart.md](quickstart.md)

**Tests**: Focused regression tests are included because the plan and repository constitution require verification of dashboard behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label mapped to `spec.md`
- Every task includes the exact file path it changes or validates.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Use the existing static browser app and Jest setup; no project initialization, dependency, or configuration changes are required.

No setup tasks are needed.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No shared infrastructure or cross-story foundation is required for this single-story feature.

No foundational tasks are needed.

## Phase 3: User Story 1 - Match distance labels to the selected aggregation (Priority: P1) MVP

**Goal**: Make the chart title, average KPI, and peak KPI describe the active aggregation; calculate the average per visible bucket and identify the period containing the peak.

**Independent Test**: With activities in multiple daily, weekly, monthly, and yearly buckets, switch aggregation, timeframe, and sport; verify title, average label/unit/value, peak label/value/period, and that total volume, chart data, and export behavior remain unchanged.

### Tests for User Story 1

- [X] T001 [US1] Add fail-first Jest regression coverage in `__tests__/dashboard-core.test.js` for all four chart-title/peak-label pairs and peak values from the active aggregation after timeframe and sport filtering.

### Implementation for User Story 1

- [X] T002 [US1] Add stable element IDs for the Distance chart heading and Peak KPI label in `index.html`, retaining the weekly default; update the matching markup expectation in `__tests__/index-script-syntax.test.js`; depends on T001.
- [X] T003 [US1] In `src/dashboard-core.js`, set the chart heading and Peak KPI label from the selected aggregation, and calculate peak volume from the current `aggregatedList` using the active sport filter; preserve the total-volume, weekly-average, chart-bucket, and empty-state behavior; depends on T001 and T002.
- [X] T004 [US1] Run `npm test -- --runInBand __tests__/dashboard-core.test.js` and `npm test -- --runInBand __tests__/index-script-syntax.test.js` from the repository root; resolve any failures before completion.
- [X] T005 [US1] Run the browser validation in `specs/069-aggregation-aware-distance-labels/quickstart.md` with synthetic or user-supplied multi-period activity data, verifying all label pairs, sport/timeframe peak behavior, and unchanged export/KPI behavior.
- [X] T006 [US1] Extend regression coverage in `__tests__/dashboard-core.test.js` for aggregation-specific average labels, units, rounded values, and the displayed peak period, including sport/timeframe filtering.
- [X] T007 [US1] Add stable IDs for the average label/unit and peak-period detail in `index.html`, and assert these targets in `__tests__/index-script-syntax.test.js`; retain the weekly defaults.
- [X] T008 [US1] In `src/dashboard-core.js`, calculate average from filtered total divided by visible bucket count, set its aggregation-specific label/unit, and display the peak bucket's formatted period; prefix weekly periods with "Week of".
- [X] T009 [US1] Run `npm test -- --runInBand __tests__/dashboard-core.test.js` and `npm test -- --runInBand __tests__/index-script-syntax.test.js` from the repository root; resolve any failures before completion.
- [X] T010 [US1] Repeat the browser validation in `specs/069-aggregation-aware-distance-labels/quickstart.md` for average values/units and peak-period details, including active sport/timeframe filters.

**Checkpoint**: US1 is complete when all four modes show matching title, average, and peak information, filtered averages and peak values use visible buckets, and focused automated and browser checks pass.

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: No additional cross-cutting changes are required beyond the user-story validation above.

No polish tasks are needed.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; existing app and test infrastructure are reused.
- **Foundational (Phase 2)**: No tasks; there are no shared prerequisites.
- **User Story 1 (Phase 3)**: Can start after the existing feature design is available; it is the complete MVP.
- **Polish (Phase 4)**: No separate work; validation is included in US1.

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other user stories.

### Within User Story 1

- T001 must be completed first and its new regression cases must fail for the current behavior.
- T002 depends on T001; T003 depends on T001 and T002.
- T004 depends on T003; T005 depends on T004 passing.
- T004 depends on T003; T005 depends on T004 passing.
- T006 adds regression coverage for the average KPI and peak period; T007 adds the required UI targets; T008 implements their render behavior.
- T009 depends on T008; T010 depends on T009 passing.

### Dependency Graph

```text
T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007 -> T008 -> T009 -> T010
```

### Parallel Opportunities

- No tasks are safely parallelizable in this story: the test-first ordering is intentional, and the markup and dashboard render behavior form one tightly coupled update.

## Parallel Example: User Story 1

There are no parallel task groups for US1. Complete T001 through T010 in dependency order.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Add the failing aggregation-label and peak regression cases in T001 and T006.
2. Add the stable UI targets in `index.html` and implement aggregation-aware title, average, peak value, and peak period behavior in `src/dashboard-core.js`.
3. Run the focused Jest checks, then complete the browser validation in the feature quickstart.
4. Stop when US1's labels, average, peak-period behavior, and non-regression checks pass; no additional story is in scope.

## Notes

- Every task follows the required checkbox, sequential ID, story label, and file-path format.
- The peak must be calculated from the same filtered aggregation buckets shown by the chart; changing only its text is not sufficient.
- Do not add dependencies, tabs, export mechanisms, or project configuration for this feature.