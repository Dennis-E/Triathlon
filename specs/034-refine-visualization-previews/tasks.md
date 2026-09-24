---

description: "Task list for Refine Visualization Previews"
---

# Tasks: Refine Visualization Previews

**Input**: Design documents from `specs/034-refine-visualization-previews/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui-contract.md](contracts/ui-contract.md), [capture-states.md](capture-states.md), [quickstart.md](quickstart.md)

**Tests**: Focused asset-contract tests, capture-state review, privacy review, and browser checks are included because this feature corrects public visual assets without changing dashboard runtime behavior.

**Organization**: Tasks are grouped by user story so capture-state correctness, visual legibility, and geographic/privacy validation can be completed and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend the existing preview validation surface for the seven corrected assets.

- [X] T001 Extend `__tests__/preview-assets.test.js` with named corrected-asset fixtures for `heartrate-pace.png`, `equipment.png`, `equipment-timeline.png`, `personal-bests.png`, `heatmap.png`, `distributions.png`, and `workout-time.png`.
- [X] T002 Update `specs/034-refine-visualization-previews/capture-states.md` with the capture-state checklist and review fields used during asset replacement.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Make the requested dashboard states and asset invariants explicit before recapturing images.

- [X] T003 Add source assertions in `__tests__/preview-assets.test.js` that preserve the existing public asset paths, preview-card references in `index.html`, and dashboard actions while the PNG files are replaced.
- [X] T004 Add privacy and visibility checks in `__tests__/preview-assets.test.js` and `specs/034-refine-visualization-previews/capture-states.md` for no exact routes, no unapproved equipment names, visible chart content, and readable labels/axes.

**Checkpoint**: Corrected capture states and public asset invariants are testable before new screenshots are created.

## Phase 3: User Story 1 - Use Specific Preview States (Priority: P1) 🎯 MVP

**Goal**: Capture each affected visualization with the requested filters, modes, tile, and geographic context.

**Independent Test**: Inspect the browser capture session and `capture-states.md`; each affected visualization must show the requested state before its PNG is approved.

### Tests for User Story 1

- [X] T005 [US1] Add capture-state assertions in `__tests__/preview-assets.test.js` or a focused state-contract test to require Run plus focused 2021-2026 context for Heartrate vs Pace, Bikes-only for Equipment/Timeline, Activities mode for Timeline, and a 50 km PB target for Personal Bests.

### Implementation for User Story 1

- [X] T006 [US1] Prepare the local dashboard capture session from the private export without copying raw data into the repository, recording the session details in `specs/034-refine-visualization-previews/capture-states.md`.
- [X] T007 [US1] Set the Heartrate vs Pace dashboard state to Run and the focused year range ending in 2026, interpreting the requested `201` as 2021, before capturing `assets/previews/heartrate-pace.png`.
- [X] T008 [US1] Set the Equipment dashboard state to Bikes only and capture `assets/previews/equipment.png` with readable or privacy-approved generalized Bike labels.
- [X] T009 [US1] Set the Equipment Timeline dashboard state to Bikes only and Activities mode, then capture `assets/previews/equipment-timeline.png` with visible activity bars.
- [X] T010 [US1] Select a visible 50 km Personal Best tile or equivalent 50 km detail view and capture `assets/previews/personal-bests.png` with readable PB content.

**Checkpoint**: The four state-specific captures show the requested filters and non-empty visualization content.

## Phase 4: User Story 2 - Make Every Preview Visually Legible (Priority: P1)

**Goal**: Replace the remaining defective captures with visible geographic/chart context and preserved axes.

**Independent Test**: Inspect the corrected PNGs and confirm no black/empty asset remains; Distributions and Workout Time both show x-axis labels within their crops.

### Tests for User Story 2

- [X] T011 [US2] Add asset-review assertions in `__tests__/preview-assets.test.js` for visible/non-empty PNG files and the required x-axis, Bike-bar, and 50 km PB review notes in `specs/034-refine-visualization-previews/capture-states.md`.

### Implementation for User Story 2

- [X] T012 [US2] Capture a privacy-reviewed Rheinland-area map view and replace `assets/previews/heatmap.png`, removing unrelated geography and exact identifying route detail.
- [X] T013 [US2] Recapture `assets/previews/distributions.png` from the full Distributions chart wrapper or an adjusted crop that includes visible x-axis labels and units.
- [X] T014 [US2] Recapture `assets/previews/workout-time.png` from the full Workout Time chart wrapper or an adjusted crop that includes visible x-axis labels and units.
- [X] T015 [US2] Update `specs/033-landing-visualization-previews/asset-review.md` with the corrected visibility, state, and privacy approval for all seven replaced assets.

**Checkpoint**: All seven corrected assets are visibly populated, readable, and aligned with their documented capture states.

## Phase 5: User Story 3 - Show the Correct Geographic and Data Context (Priority: P2)

**Goal**: Verify the Rheinland context and privacy boundaries without exposing exact personal geography or equipment details.

**Independent Test**: Review the Heatmap PNG and asset-review record at desktop and 390px mobile card sizes; confirm Rheinland context is visible and precise identifying routes are not.

### Tests for User Story 3

- [X] T016 [US3] Add source/reference assertions in `__tests__/preview-assets.test.js` that the corrected Heatmap asset remains linked from the existing card and the public HTML still contains no private ZIP or raw activity-file references.

### Implementation for User Story 3

- [X] T017 [US3] Perform the final privacy review of `assets/previews/heatmap.png`, `assets/previews/equipment.png`, and `assets/previews/equipment-timeline.png`, documenting approval or required redaction in `specs/033-landing-visualization-previews/asset-review.md`.
- [X] T018 [US3] Validate the seven corrected PNGs inside the existing landing-page cards at desktop and 390px mobile sizes, adjusting only the crops/assets when labels or context are clipped.

**Checkpoint**: Corrected previews communicate the requested geographic/data context while preserving the existing privacy contract.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Run focused tests, full regression, and final browser validation.

- [X] T019 [P] Verify all seven replacement PNGs retain the existing paths under `assets/previews/` and have stable, card-suitable dimensions.
- [X] T020 [P] Verify the private export remains ignored by `.gitignore` and absent from `index.html`, public assets, and runtime references.
- [X] T021 Run `npm test -- --runInBand __tests__/preview-assets.test.js __tests__/index-script-syntax.test.js` and resolve any corrected-asset contract failures.
- [X] T022 Run the complete root Jest suite with `npm test` to confirm dashboard behavior remains unchanged.
- [X] T023 Start `python -m http.server` and verify all seven corrected previews at desktop and 390px mobile widths, including no black/empty content, no clipped x-axes, no horizontal overflow, and working card links.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T002 can start immediately and affect separate test/documentation surfaces.
- **Foundational (Phase 2)**: T003-T004 depend on T001 and T002 and block capture work.
- **User Stories (Phases 3-5)**: US1 establishes the requested filter/state captures; US2 depends on those capture conventions and fixes the remaining assets; US3 depends on the final assets for privacy/responsive review.
- **Polish (Phase 6)**: T019-T023 depend on all corrected assets and reviews being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 and is the MVP; it fixes the four requested filter/tile/mode states.
- **User Story 2 (P1)**: Can start after Phase 2 and can run in parallel with US1 for Heatmap and chart-axis captures, but final asset review is shared.
- **User Story 3 (P2)**: Depends on US1 and US2 because it reviews the completed corrected assets and their landing-card presentation.

### Parallel Opportunities

- T001 and T002 can run in parallel because they touch the test file and capture documentation separately.
- T007-T010 can run in parallel after T006 because each produces a different asset/state, provided the single browser capture session is coordinated.
- T012-T014 can run in parallel after foundational capture setup because they produce separate assets.
- T019 and T020 can run in parallel before final test execution.
- T021, T022, and T023 are sequential validation steps: focused Jest, full Jest, then browser verification.

## Parallel Example: User Story 1

```text
Task: "Capture Run + 2021-2026 Heartrate vs Pace into assets/previews/heartrate-pace.png"
Task: "Capture Bikes-only Equipment into assets/previews/equipment.png"
Task: "Capture Bikes + Activities Equipment Timeline into assets/previews/equipment-timeline.png"
Task: "Capture the visible 50 km PB tile into assets/previews/personal-bests.png"
```

## Parallel Example: User Story 2

```text
Task: "Capture the privacy-reviewed Rheinland Heatmap into assets/previews/heatmap.png"
Task: "Recapture Distributions with visible x-axis into assets/previews/distributions.png"
Task: "Recapture Workout Time with visible x-axis into assets/previews/workout-time.png"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T004 to establish capture and review contracts.
2. Complete T005-T010 for the four requested filter/mode/tile corrections.
3. Run the focused state and asset checks.
4. Stop and validate the MVP capture states before replacing Heatmap and axis crops.

### Incremental Delivery

1. Deliver US1: corrected Run/year, Bikes-only, Activities, and 50 km PB captures.
2. Deliver US2: corrected Rheinland Heatmap and visible x-axis captures.
3. Deliver US3: privacy and responsive review.
4. Run focused tests, full regression, and browser validation.

### Validation Commands

```powershell
npm test -- --runInBand __tests__/preview-assets.test.js __tests__/index-script-syntax.test.js
npm test
python -m http.server
```

## Notes

- Every task uses the required `- [ ] T###` checklist format.
- Story tasks include exactly one `[US#]` label and concrete repository paths.
- No dashboard runtime logic, tab order, or public asset path should change.