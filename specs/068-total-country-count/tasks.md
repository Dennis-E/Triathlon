---
description: "Task list for Countries Visited in Lifetime Statistics"
---

# Tasks: Countries Visited in Lifetime Statistics

**Input**: Design documents from `/specs/068-total-country-count/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/total-distance-country-metric.md, quickstart.md

**Tests**: Focused tests are included because Constitution Principle III requires verification for reusable modules and dashboard behavior.

**Organization**: Tasks are grouped by user story. Story 2 builds on the country metric delivered by Story 1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with another marked task because they touch different files and have no unfinished dependencies.
- **[Story]**: User story served by the task; setup and foundational tasks have no story label.
- Every task includes the concrete file path it creates or changes.

## Phase 1: Setup

**Purpose**: Add the shared geographic input and register the reusable browser module.

- [X] T001 [P] Add a reduced Natural Earth 50m Admin 0 GeoJSON asset at `assets/country-boundaries/ne_50m_admin_0_countries.geojson`, retaining `ADM0_A3` plus valid Polygon/MultiPolygon geometry.
- [X] T002 [P] Register `src/country-count-utils.js` in `index.html` before the dashboard scripts that consume it, preserving the documented classic-script load order.

---

## Phase 2: Foundational

**Purpose**: Establish tested country matching shared by both user stories.

- [X] T003 Add failing Jest cases in `__tests__/country-count-utils.test.js` using synthetic polygons for `ADM0_A3` deduplication, repeated routes, one-point tracks, border-crossing LineStrings, invalid coordinates, and unmatched locations.
- [X] T004 Implement the dual-target country aggregation utility in `src/country-count-utils.js`, with injectable Turf geometry operations, stable `ADM0_A3` identity, distinct-country counting, and `complete`/`partial`/`unavailable` summaries; enforce that at least one valid point is required, latitude is finite and within -90..90, longitude is finite and within -180..180, and `countryCount` is null only when unavailable.

**Checkpoint**: Country matching and its data constraints are covered by passing focused utility tests before dashboard stories begin.

---

## Phase 3: User Story 1 - See countries represented in training (Priority: P1) 🎯 MVP

**Goal**: Display the distinct-country total and names for all imported sports and dates in Lifetime Statistics, including routes that cross borders.

**Independent Test**: Apply synthetic routes in two countries with one repeated route; verify Lifetime Statistics shows the count and names, and Distance has no country tile.

### Tests for User Story 1

- [X] T005 [US1] Add failing dashboard tests in `__tests__/dashboard-country-count.test.js` proving the displayed count uses all imported sports and dates, deduplicates repeated countries, and changes when a replacement dataset is applied.

### Implementation for User Story 1

- [X] T006 [US1] Calculate and cache the country summary for each active imported dataset in `src/dashboard-state.js` and `src/dashboard-import.js`; use all GPS tracks regardless of chart filters, reset the result on dataset replacement, and prevent a late result from an older dataset becoming visible.
- [X] T007 [US1] Add the Countries visited count/name tile to `src/dashboard-lifetime-statistics.js`, include it in capture and export markup, and rename the visible Distance title in `index.html` and `src/export-utils.js` without changing internal tab IDs.

**Checkpoint**: Lifetime Statistics shows the correct distinct-country count and names and refreshes on dataset replacement; Distance remains country-free.

---

## Phase 4: User Story 2 - Understand location-data coverage (Priority: P2)

**Goal**: Distinguish complete, partial, and unavailable location coverage with neutral text and include it with the country names in Lifetime Statistics Share/Export.

**Independent Test**: Compare datasets with complete, partial, and no location coverage; verify count, names, neutral status text, and Lifetime Statistics export parity.

### Tests for User Story 2

- [X] T008 [P] [US2] Extend `__tests__/dashboard-country-count.test.js` to assert complete and partial coverage with tracked/total activity counts, unavailable instead of zero when no usable route or boundary data exists, and no stale status after dataset replacement.
- [X] T009 [P] [US2] Assert in `__tests__/lifetime-statistics-dashboard.test.js` that export markup includes country names and in `__tests__/dashboard-export-download.test.js` that Distance export metadata has no country fields.

### Implementation for User Story 2

- [X] T010 [P] [US2] Render complete, partial, and unavailable neutral coverage text from the country summary in `src/dashboard-lifetime-statistics.js`; partial status must show `trackedActivityCount` of `totalActivityCount`, without GPS-route wording.
- [X] T011 [P] [US2] Refresh Lifetime Statistics capture/export areas when the country summary changes in `src/dashboard-import.js`; preserve its existing target and remove country fields from Distance export context in `src/dashboard-export.js`.

**Checkpoint**: Users can read country names and location coverage in Lifetime Statistics and its export; Distance contains no country tile or country metadata.

---

## Phase 5: Polish & Cross-Cutting Validation

**Purpose**: Verify feature behavior against the documented scenarios and project gates.

- [X] T012 Run the focused Jest command and browser scenarios in `specs/068-total-country-count/quickstart.md`; confirm the KPI does not overflow at mobile width and that no route points or derived country data are sent to a network service.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T001 and T002 can run in parallel.
- **Foundational (Phase 2)**: Starts after Setup; T003 writes tests before T004 implements the shared country-matching utility.
- **User Story 1 (Phase 3)**: Starts after Foundation; T005 is written before T006/T007 implementation.
- **User Story 2 (Phase 4)**: Depends on User Story 1 because it extends the displayed country metric; T008/T009 tests precede T010/T011 implementation.
- **Polish (Phase 5)**: Starts after both user stories are complete.

### Task Dependency Graph

```text
T001 || T002 -> T003 -> T004 -> T005 -> T006 -> T007 -> (T008 || T009) -> (T010 || T011) -> T012
```

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Setup and Foundation; independently delivers the requested country total.
- **User Story 2 (P2)**: Depends on User Story 1's country metric; adds honest coverage states and matching export metadata.

### Parallel Opportunities

- T001 and T002 touch separate files and can run in parallel.
- After User Story 1 is complete, T008 and T009 can be written in parallel because they touch separate test files.
- Once both User Story 2 tests pass, T010 and T011 can be implemented in parallel because dashboard rendering and export metadata use separate source files.
- User Stories 1 and 2 are not parallelizable: Story 2 extends the count and UI introduced by Story 1.

## Parallel Example: Setup

```text
Task T001: Add local Natural Earth country geometry in assets/country-boundaries/ne_50m_admin_0_countries.geojson
Task T002: Register the country-count utility script in index.html
```

## Execution Example: User Story 1

```text
T005: Write and run the failing dashboard tests in __tests__/dashboard-country-count.test.js
T006: Calculate/cache the country summary and reset it for new datasets in src/dashboard-state.js and src/dashboard-import.js
T007: Render the country tile in src/dashboard-lifetime-statistics.js and rename Distance in index.html/src/export-utils.js
```

These US1 tasks are intentionally sequential: the rendering depends on the dataset summary established by T006.

## Parallel Example: User Story 2

```text
Task T008: Add coverage-state tests in __tests__/dashboard-country-count.test.js
Task T009: Check Lifetime Statistics country names and Distance export exclusion in __tests__/lifetime-statistics-dashboard.test.js and __tests__/dashboard-export-download.test.js

After both tests pass:
Task T010: Render neutral coverage states in src/dashboard-lifetime-statistics.js
Task T011: Refresh Lifetime Statistics export and remove country fields from Distance export
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundation, including passing country-geometry utility tests.
2. Complete User Story 1 and verify its independent synthetic-route scenario.
3. Stop at the P1 checkpoint for an MVP with the distinct-country count.
4. Add User Story 2 before release so unavailable/partial data is not misleading and exports remain consistent.

### Incremental Delivery

1. Setup + Foundation → validated local country matching.
2. User Story 1 → visible all-time country count with dataset refresh behavior.
3. User Story 2 → coverage status and export parity.
4. Polish → focused Jest and quickstart validation.

## Notes

- `[P]` is used only for tasks that touch separate files and have no unfinished dependencies.
- Each user-story task has its required `[US1]` or `[US2]` label; setup, foundation, and polish tasks do not.
- Tests are ordered before their corresponding implementation tasks.
- The country total is global across sports and timeframes, as specified in `research.md` and `contracts/total-distance-country-metric.md`.