# Tasks: Training Calendar Visual Redesign

**Input**: Design documents from `specs/054-calendar-visual-redesign/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

**Tests**: Included because the project constitution requires focused verification for dashboard and reusable-module changes. For each story, add/adjust its focused assertions first and verify they fail for the expected missing behavior before implementation.

**Organization**: Tasks are grouped by the three prioritized user stories. No new project setup or foundational infrastructure is required; this work uses the existing static app, calendar model, export target, and Jest suite.

## Phase 1: Setup

**Purpose**: Establish a clean test baseline before changing the existing calendar.

- [x] T001 Run the focused calendar, page-wiring, and export baseline checks with `npm test -- --runInBand __tests__/training-calendar-utils.test.js __tests__/index-script-syntax.test.js __tests__/export-utils.test.js`; note any pre-existing failures in `specs/054-calendar-visual-redesign/quickstart.md`.

## Phase 2: Foundational

**Purpose**: No new foundational code is needed. Existing training-calendar model, browser scripts, export workflow, and Jest configuration already provide the required foundation; complete T001 before story work.

## Phase 3: User Story 1 - Trainingsfreie Tage zurücknehmen (Priority: P1) 🎯 MVP

**Goal**: Make zero-activity dates subtly visible against the dark calendar surface while ensuring active days and keyboard focus remain clear.

**Independent Test**: With synthetic data that includes empty and active days in every palette, verify that the inactive fill's rendered contrast is >1.0:1 and <=1.2:1 against its actual background, the lowest active level is at least 3:1 against the inactive state, and no permanent bright border makes empty cells prominent.

### Tests for User Story 1

- [x] T002 [US1] Add failing assertions for the zero-day color, its computed contrast against the current calendar surface, active-level contrast, and retained focus styling in `__tests__/training-calendar-utils.test.js` and `__tests__/index-script-syntax.test.js`.

### Implementation for User Story 1

- [x] T003 [P] [US1] Replace the bright translucent empty-day token with one shared opaque dark token and preserve the existing five-step green, blue, and fire palettes in `src/training-calendar-utils.js`.
- [x] T004 [P] [US1] Render zero-activity cells with the shared dark token, remove any permanent bright day-cell outline, and retain a visible keyboard focus ring in `src/dashboard-training-calendar.js`.
- [x] T005 [US1] Run the focused color and page-wiring tests in `__tests__/training-calendar-utils.test.js` and `__tests__/index-script-syntax.test.js`; adjust the token until the specified measured contrast bounds pass.

**Checkpoint**: Zero-activity dates are subdued but detectable, all active palette levels remain distinguishable, and keyboard focus remains visible.

## Phase 4: User Story 2 - Trainingsmuster in einer klaren Jahresmatrix erfassen (Priority: P1)

**Goal**: Match the reference's compact calendar hierarchy while retaining stacked newest-first years and usable horizontal scrolling.

**Independent Test**: With data spanning multiple years and a leap year, verify each year is newest-first, has a separate month header aligned to week columns, has seven day rows per week, scrolls horizontally as one aligned grid/header unit, and shows one compact Less-to-More legend below the year grids.

### Tests for User Story 2

- [x] T006 [US2] Add failing static structure assertions for month-header alignment, seven day rows, stacked-year order, horizontal scroll containment, restrained wrappers, and legend placement in `__tests__/index-script-syntax.test.js`.

### Implementation for User Story 2

- [x] T007 [P] [US2] Render each week as a column under a separate month-label header, align month starts with their week columns, retain seven chronological day slots and low-chrome horizontal-scroll year sections, and append the shared compact legend after all year grids inside `trainingCalendarYears` in `src/dashboard-training-calendar.js`.
- [x] T008 [US2] Refine the Training Calendar panel markup by removing the standalone legend placeholder while preserving the existing controls, empty state, and `trainingCalendarYears` capture container in `index.html` after T007 moves the legend into the export capture subtree.
- [x] T009 [US2] Run the layout/wiring checks in `__tests__/index-script-syntax.test.js` and manually verify month/day alignment, year order, and narrow-screen scrolling using the browser scenario in `specs/054-calendar-visual-redesign/quickstart.md`.

**Checkpoint**: Multi-year calendars follow the clarified reference hierarchy, and the month header remains aligned while the grid scrolls.

## Phase 5: User Story 3 - Aktivität, Filter und Tagesdetails zuverlässig verstehen (Priority: P2)

**Goal**: Preserve palette and sport controls, day details, no-data behavior, local processing, and the existing image preview/download export after the visual rework.

**Independent Test**: Change palettes and sports (including a filter that turns an active day into a zero-activity day), inspect mouse and keyboard day details, then export a multi-year calendar and confirm its year order, legend, selected controls, unclipped content, and absence of transient tooltips.

### Tests for User Story 3

- [x] T010 [US3] Add or update assertions for the existing Training Calendar capture target, selected palette/sport metadata, no-data blocking, tooltip suppression, and legend inclusion in `__tests__/index-script-syntax.test.js` and `__tests__/export-utils.test.js`.

### Implementation for User Story 3

- [x] T011 [US3] Preserve the established local Training Calendar export target and preview/download behavior; if browser verification shows clipped horizontally scrollable or multi-year content, adjust capture sizing without changing the target or dropping palette/sport metadata in `src/dashboard-export.js`.
- [x] T012 [US3] Verify palette/sport switching, day tooltip and keyboard behavior, empty-filter state, and full multi-year export preview against the scenarios in `specs/054-calendar-visual-redesign/quickstart.md`; fix any regressions in the responsible existing files (`src/dashboard-training-calendar.js`, `index.html`, or `src/dashboard-export.js`).

**Checkpoint**: Existing calendar interactions and export work with the redesigned layout and remain local.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Run the complete focused validation set and record the result.

- [x] T013 Run the complete focused Jest command from `specs/054-calendar-visual-redesign/quickstart.md` and confirm the manual browser checks for contrast, layout, accessibility, and export are complete; update the validation record in `specs/054-calendar-visual-redesign/quickstart.md`.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Run the pre-change focused test baseline; no dependencies.
- **Foundational (Phase 2)**: No code tasks; the existing application/test infrastructure is already in place.
- **User Story 1 (Phase 3)**: Starts after T001; delivers the highest-priority empty-day correction independently.
- **User Story 2 (Phase 4)**: Starts after US1 because both refine the same calendar renderer; can be validated independently after its layout work.
- **User Story 3 (Phase 5)**: Starts after US2 because export validation depends on final legend placement and scroll layout.
- **Polish (Phase 6)**: Starts after all selected stories are complete.

### User Story Dependencies

- **US1 (P1)**: Depends only on the baseline. No dependency on another story.
- **US2 (P1)**: Sequentially follows US1 to avoid concurrent edits to `src/dashboard-training-calendar.js`; it retains the existing date model and does not depend on US1's visual token to define its layout.
- **US3 (P2)**: Follows US2 so export tests exercise the final capture subtree and legend position. No new export system is introduced.

### Parallel Opportunities

- After T002 is written and fails as expected, T003 and T004 may run in parallel because they edit different files.
- After T006 is written and fails as expected, complete T007 before T008: the renderer first creates the aligned header/grid and moves the legend into the capture subtree, then the obsolete standalone markup is removed.
- User-story phases should remain sequential because their layout/rendering changes share the same dashboard surface.

## Parallel Example: User Story 1

```text
After T002 confirms missing behavior:
Task T003: Update the shared empty-day color token in src/training-calendar-utils.js.
Task T004: Update zero-day cell styling and focus treatment in src/dashboard-training-calendar.js.
Then run T005.
```

## Parallel Example: User Story 2

```text
Complete T006 first and confirm the new structure assertions fail as expected.
Task T007: Update the generated calendar layout in src/dashboard-training-calendar.js.
Then complete T008: Remove the now-obsolete standalone legend placeholder in index.html.
Finish with T009 after both changes are integrated.
```

## Parallel Example: User Story 3

```text
Complete T010 first so the existing export behavior is covered by focused assertions.
No independent implementation tasks are safe to parallelize in this story:
Task T011: Preserve/adjust the export capture behavior in src/dashboard-export.js.
Task T012: Verify the integrated interactions and export in the browser.
Run T011 before T012, then complete cross-cutting validation in T013.
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 baseline checks.
2. Complete T002 and T003–T005 to correct zero-activity emphasis and preserve active-day/focus distinction.
3. Stop and validate the US1 independent test before starting the layout refinement.

### Incremental Delivery

1. Deliver US1 for immediate relief from prominent zero-activity cells.
2. Add US2 to align the multi-year layout with the supplied GitHub calendar reference.
3. Add US3 to ensure existing filters, tooltips, empty states, and export remain reliable after the layout update.
4. Complete T013 and the manual browser checks before marking the feature ready.

## Notes

- Every task uses the required checkbox, sequential ID, story label where applicable, and explicit repository file path(s).
- `[P]` appears only where tasks touch different files and can proceed without unmet dependencies.
- Test tasks are included to satisfy the repository constitution; user-story test tasks precede the corresponding implementation tasks.
- Do not add a dashboard tab, API, dependency, persistent preference, or external export service for this feature.
