---

description: "Task list for Workout Title Wordcloud"
---

# Tasks: Workout Title Wordcloud

**Input**: Design documents in `specs/047-workout-title-wordcloud/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`

**Tests**: Tests are included because the project constitution requires narrow automated verification for reusable modules and dashboard behavior, and the feature's acceptance criteria are testable.

**Organization**: Tasks are grouped by user story. Every task has a concrete repository path and sequential task ID.

## Phase 1: Setup

**Purpose**: Add the external browser dependency required by the cloud renderer; preserve static delivery.

- [X] T001 Add a version-pinned wordcloud2.js 1.2.3 script reference to index.html before the dashboard scripts; do not add an npm dependency or send title data to the CDN.

---

## Phase 2: Foundational

**Purpose**: Establish testable ranking logic and the new tab registration before story-level UI work.

- [X] T002 [P] Write and run synthetic-input unit tests in __tests__/wordcloud-utils.test.js so they fail before implementation; cover title fallback exclusion, German/English stop words from specs/047-workout-title-wordcloud/contracts/stop-words.md, Unicode case normalization, punctuation splitting, numeric-only token exclusion, every repeated occurrence, descending counts, alphabetical frequency ties, and ranking 5,000 generated titles in under 1 second.
- [X] T003 [P] Implement the pure CommonJS and window.wordcloudUtils module in src/wordcloud-utils.js with isolated module scope, the fixed stop-word set copied from specs/047-workout-title-wordcloud/contracts/stop-words.md, total token counts, and deterministic ranking; satisfy __tests__/wordcloud-utils.test.js.
- [X] T004 [P] Write and run Wordcloud tab-order, activation, ARIA state, panel visibility, focus, and arrow-key navigation expectations in __tests__/tab-navigation.test.js; confirm the new-tab expectations fail before implementation.
- [X] T005 [P] Register wordcloud in TAB_ORDER, TAB_BUTTON_IDS, TAB_PANEL_IDS, activation, panel toggling, and focus handling in src/tab-navigation.js; satisfy __tests__/tab-navigation.test.js.

**Checkpoint**: The data-ranking API and tab-navigation contract are ready for the Wordcloud dashboard story.

---

## Phase 3: User Story 1 - Explore frequent workout-title words (Priority: P1) 🎯 MVP

**Goal**: Show the top-N ranked title words in a responsive canvas wordcloud with a count slider and synchronized ranked list.

**Independent Test**: With synthetic activities having known titles, open the Wordcloud tab and verify occurrence-ranked words, deterministic ties, slider values 10–100 with default 30, top-N list/cloud synchronization, bounded frequency-based prominence, useful empty states, and responsive layout.

### Tests for User Story 1

- [X] T006 [P] [US1] Write and run static dashboard wiring/UI-contract assertions in __tests__/wordcloud-dashboard.test.js for canvas/list/control IDs, accessible labels, empty/dependency-failure states, unplaced-word notice, and Wordcloud render dispatch; confirm new assertions fail before implementation.
- [X] T007 [P] [US1] Extend and run __tests__/index-script-syntax.test.js to require the wordcloud2.js, wordcloud-utils.js, and dashboard-wordcloud.js scripts in dependency order and verify tab/panel ARIA wiring plus onclick="setVisualizationTab('wordcloud')" and onkeydown="handleVisualizationTabKeydown(event, 'wordcloud')" (or equivalent handlers); confirm new expectations fail before implementation.

### Implementation for User Story 1

- [X] T008 [P] [US1] Add the Wordcloud tab button with onclick="setVisualizationTab('wordcloud')" and onkeydown="handleVisualizationTabKeydown(event, 'wordcloud')" (or equivalent event handlers), ARIA-linked panel, labeled word-count slider (min 10, max 100, value 30), canvas, ranked word list, empty-state elements, and ordered utility/renderer script tags in index.html.
- [X] T009 [P] [US1] Implement initial title ranking, top-N selection, canvas sizing, bounded log-scaled word weights, stable horizontal wordcloud2.js rendering with shrinkToFit enabled, resize handling, no-data/library-unavailable messages, and a visible notice naming checked words that remain unplaced in src/dashboard-wordcloud.js; use activity names from processedActivities, pass copied renderer inputs, and keep all title-derived data in browser memory.
- [X] T010 [US1] Dispatch renderWordcloud() when wordcloud is selected and include vizTabWordcloud in openDashboardTab() focus selection in src/dashboard-tabs.js; verify behavior against __tests__/wordcloud-dashboard.test.js.

**Checkpoint**: The cloud, initial slider/list, and tab navigation work without checkbox-driven term exclusion; this is the first independently demonstrable increment.

---

## Phase 4: User Story 2 - Remove words from the cloud (Priority: P1)

**Goal**: Let users include or exclude each visible ranked word and preserve selection for words that remain in the current top-N set.

**Independent Test**: Deselect a visible term and verify only it disappears from the canvas while its checkbox remains unchecked; reselect it and verify it returns at the same frequency-derived size. Change N and verify retained terms keep their choices while newly entering terms start checked.

### Tests for User Story 2

- [X] T011 [P] [US2] Add and run unit cases for checkbox selection reconciliation in __tests__/wordcloud-utils.test.js, covering retained selections, newly admitted checked terms, dropped terms leaving the active selection set, and reintroduced terms defaulting to checked.

### Implementation for User Story 2

- [X] T012 [US2] Add a pure selection-reconciliation helper to src/wordcloud-utils.js that preserves checked state for words remaining in top-N and defaults newly admitted words to checked without changing counts.
- [X] T013 [US2] Wire checkbox changes and slider changes in src/dashboard-wordcloud.js to reconcile selection, stop any in-progress cloud layout, redraw only checked words, and retain the checkbox list when no words are selected.

**Checkpoint**: All visible ranked words can be controlled independently without changing their measured frequency or rank.

---

## Phase 5: User Story 3 - Discover Wordcloud on the landing page (Priority: P2)

**Goal**: Add the requested concise “And much more” tile without presenting a misleading image preview or a new navigation action.

**Independent Test**: Open the landing page before import and verify a responsive tile titled “And much more” contains only the “Wordcloud” and “…” bullets, with no image, description, or click action.

### Tests for User Story 3

- [X] T014 [P] [US3] Extend and run __tests__/preview-assets.test.js to verify the overview tile separately from image-backed preview cards, assert its exact title and two bullet keywords, responsive grid placement, and absence of an openDashboardTab action or preview asset; confirm the new assertions fail before implementation.

### Implementation for User Story 3

- [X] T015 [US3] Add a responsive non-interactive “And much more” overview tile with only “Wordcloud” and “…” bullet items to index.html; keep it outside the previewCard-* image-backed card count.

**Checkpoint**: Landing-page visitors can discover the Wordcloud without implying that a preview screenshot or pre-import interactive dashboard is available.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Verify the full feature, privacy boundary, responsiveness, and existing dashboard behavior.

- [X] T016 Run npx jest __tests__/wordcloud-utils.test.js __tests__/tab-navigation.test.js __tests__/wordcloud-dashboard.test.js __tests__/preview-assets.test.js __tests__/index-script-syntax.test.js, confirm the 5,000-title ranking smoke check is under 1 second, then run the root npm test suite; follow specs/047-workout-title-wordcloud/quickstart.md and fix regressions in the affected files.
- [X] T017 Validate the manual desktop/mobile, keyboard, empty-state, CDN-failure, and maximum-100-word placement scenarios in specs/047-workout-title-wordcloud/quickstart.md using synthetic or explicitly supplied local data; confirm no activity titles or derived terms are transmitted.

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) has no prerequisites; T001 provides the pinned word-cloud layout library.
- Foundational (Phase 2) follows setup. T002 precedes T003; T004 precedes T005. T002 and T004 can be developed in parallel, and T003 and T005 touch different files and can be developed in parallel after their respective tests are in place.
- User Story 1 follows the foundation. T006 and T007 can be written in parallel; T008 and T009 may proceed in parallel after tests are written and foundation is complete. T010 depends on the renderer in T009 and tab registration in T005.
- User Story 2 depends on the working cloud in User Story 1. T011 precedes T012; T013 depends on T009, T010, and T012.
- User Story 3 is independent of the dashboard renderer after the foundational phase. T014 precedes T015. It can be implemented in parallel with User Story 1 or 2 when separate contributors are available.
- Polish depends on all desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: Depends on foundational ranking and tab registration; no dependency on another user story.
- **US2 (P1)**: Extends the US1 cloud/list/slider and cannot be completed before US1.
- **US3 (P2)**: Independent landing-page content; can proceed after the shared setup/foundation and does not require US1 or US2 implementation.

### Parallel Opportunities

- T002 and T004 can run in parallel because they edit separate test files.
- After those tests exist, T003 and T005 can run in parallel because the utility and tab registry are separate modules.
- T006 and T007 can run in parallel because they cover distinct test files.
- Once US1 tests are written, T008 (index markup) and T009 (renderer script) can be implemented in parallel; T010 then connects the renderer to the registered tab.
- T014/T015 for US3 can proceed in parallel with dashboard work after the foundational phase, while respecting test-before-markup ordering within US3.

### Dependency Graph

```text
T001 → (T002 → T003) + (T004 → T005)
                         ├── US1: (T006 + T007) → (T008 + T009) → T010 → US2: T011 → T012 → T013 ──┐
                         └── US3: T014 → T015 (independent after foundation)                       ├→ T016 → T017
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete setup and foundational ranking/tab tasks (T001–T005).
2. Write US1 tests (T006–T007), then implement and connect the basic Wordcloud tab (T008–T010).
3. Validate US1 independently with synthetic known-frequency titles and the narrow Jest tests.
4. Add checkbox exclusion behavior (US2), then the landing overview tile (US3).

### Incremental Delivery

1. Deliver the top-N cloud, slider, and ranked list (US1).
2. Add user checkbox inclusion/exclusion and selection reconciliation (US2).
3. Add the concise landing feature tile (US3).
4. Run automated and manual checks from quickstart.md before calling the feature complete.
