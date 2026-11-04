---
description: "Implementation tasks for realistic sample training data"
---

# Tasks: Realistic Sample Training Data

**Input**: Design documents from `specs/078-sample-data-realism/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

**Organization**: Tasks are grouped by the two P1 user stories. Existing tests are updated because the stories define independently verifiable data outcomes and the project constitution requires focused tests for reusable logic.

## Phase 1: Setup

**Purpose**: Project initialization and basic structure.

No setup tasks are needed; the static app, Node.js generator, sample-data folder, and Jest project already exist.

## Phase 2: Foundational

**Purpose**: Shared prerequisites that block story work.

No foundational tasks are needed; the existing sample payload contract and route catalog are reusable by both stories.

## Phase 3: User Story 1 - Explore Realistic Training Patterns (Priority: P1)

**Goal**: Make seasonal training variation and a credible recovery gap visible while retaining complete usable yearly coverage.

**Independent Test**: Check that every year has at least 15% monthly distance spread, 2023 has a gap of at least 10 consecutive days, and all existing sample-data validation passes.

### Tests for User Story 1

- [x] T001 [P] [US1] Add assertions for monthly distance spread and the 2023 recovery gap in `__tests__/sample-data-utils.test.js`.

### Implementation for User Story 1

- [x] T002 [US1] Update seasonal training volume and recovery scheduling in `scripts/generate-sample-data.js` while keeping all months, sports, yearly minimums, and route constraints valid.
- [x] T003 [US1] Regenerate `sample-data/silicon-valley-training.json` from `sample-data/routes.json` and confirm at least 1,500 activities, at least 250 per year, and at least 600 tracked activities.
- [x] T004 [US1] Run the focused sample-data test in `__tests__/sample-data-utils.test.js` and deterministic output check with `node scripts/generate-sample-data.js --check`.

**Checkpoint**: Seasonal volume and the recovery period are verifiable independently of equipment variation.

## Phase 4: User Story 2 - Compare Equipment Use (Priority: P1)

**Goal**: Classify shoes and bicycles correctly and show item-specific, occasional equipment use in summaries and timelines.

**Independent Test**: Verify shoes and bicycles appear under their correct equipment filters, an occasional trail item appears in summaries, and its use is limited by count or years.

### Tests for User Story 2

- [x] T005 [P] [US2] Add equipment-name classification cases for explicit shoe wording and existing shoe brands in `__tests__/equipment-utils.test.js`.
- [x] T006 [P] [US2] Add sample assertions for road and trail shoes, road and mountain bikes, timeline coverage, and occasional item use in `__tests__/sample-data-utils.test.js`.

### Implementation for User Story 2

- [x] T007 [US2] Update shoe-name detection without changing the existing utility API in `src/equipment-utils.js`.
- [x] T008 [US2] Assign occasional trail shoes and mountain-bike use to selected trail-route periods, and leave non-equipment swim records blank, in `scripts/generate-sample-data.js`.
- [x] T009 [US2] Regenerate `sample-data/silicon-valley-training.json` and confirm the seasonal and recovery criteria from User Story 1 remain satisfied.
- [x] T010 [US2] Run both focused suites, `__tests__/sample-data-utils.test.js` and `__tests__/equipment-utils.test.js`, and verify `node scripts/generate-sample-data.js --check`.

**Checkpoint**: Both equipment categories and varying use are visible without weakening User Story 1 coverage.

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Keep maintainer guidance and end-to-end verification aligned with the final dataset.

- [x] T011 [P] Update sample-data generation counts and seasonal/equipment notes in `sample-data/README.md` and `specs/078-sample-data-realism/quickstart.md`.
- [x] T012 Run the browser scenarios in `specs/078-sample-data-realism/quickstart.md` and confirm the regular sample dashboard identifies synthetic data and exposes seasonal trends and equipment timelines without a new tab or service.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No work required; repository structure is already initialized.
- **Foundational (Phase 2)**: No work required; existing contracts and utilities are sufficient.
- **User Story 1 (Phase 3)**: Can start immediately.
- **User Story 2 (Phase 4)**: Equipment-name tests can be prepared alongside User Story 1 tests. Generator and bundled-payload changes must follow User Story 1 because both stories modify `scripts/generate-sample-data.js` and `sample-data/silicon-valley-training.json`.
- **Polish (Phase 5)**: Depends on both stories so documentation and browser validation describe the final combined dataset.

### User Story Dependencies

- **User Story 1 (P1)**: No story dependency; establishes the seasonal and recovery baseline.
- **User Story 2 (P1)**: Depends on User Story 1's generator and payload update to avoid conflicting edits to shared files.

### Parallel Opportunities

- T001 and T005 may be prepared in parallel because they edit different test files.
- T005 and the sample-data assertion task T006 may be parallelized only after T001 is complete, because T001 and T006 both edit `__tests__/sample-data-utils.test.js`.
- T011 may run alongside final test execution once both story implementations are complete.

### Parallel Example: User Story 1

```text
T001: Add seasonal and recovery assertions in __tests__/sample-data-utils.test.js
```

### Parallel Example: User Story 2

```text
T005: Add equipment-name cases in __tests__/equipment-utils.test.js
T006: Add sample equipment-use assertions in __tests__/sample-data-utils.test.js (after T001)
```

## Implementation Strategy

### MVP First

1. Complete User Story 1 and validate the seasonal history and recovery gap.
2. Stop and verify its independent test criteria.
3. Continue with User Story 2 to add correct shoe classification and variable equipment use.

### Incremental Delivery

1. Validate the seasonal sample history as the first useful increment.
2. Add equipment categories and variation without changing the prior criteria.
3. Update maintainer documentation and run the browser scenarios against the combined dataset.
