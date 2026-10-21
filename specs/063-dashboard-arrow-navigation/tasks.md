---
description: "Executable tasks for independent dashboard and view arrow navigation"
---

# Tasks: Independent Dashboard and View Arrow Navigation

**Input**: Design documents from `specs/063-dashboard-arrow-navigation/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [keyboard contract](contracts/keyboard-navigation.md), [adapter contract](contracts/filter-adapters.md), [quickstart.md](quickstart.md).

**Tests**: Required by the design contracts' verification obligations and constitution III. Add the relevant failing behavior tests before changing their implementation. Reuse existing Node Jest document mocks and VM harnesses; do not introduce jsdom or another test framework.

**Organization**: Six phases, grouped by user story. Checked tasks have completed local evidence in quickstart.md; unchecked tasks remain acceptance gaps and are not certified by other passing checks.

## Format: `[ID] [P?] [Story] Description`

- `[P]` identifies tasks that may run in parallel with the other tasks in their documented wave once its prerequisites are complete; it does not waive prerequisites.
- `[US1]`, `[US2]`, and `[US3]` map to the three specification stories. Setup, foundation, and polish have no story label.
- Paths are repository-relative. Preserve existing public exports, tab IDs/order, classic script order, manual filter semantics, user changes, and Share/Export behavior.
- After each substantive implementation edit, run the narrowest executable check for that file before editing another slice. Add a regression before fixing a discovered local defect. Do not postpone all validation until a phase checkpoint.
- Use synthetic data only. Do not add dependencies, a build step, persisted keyboard state, filter-summary bubbles, new controls, API changes, or raw exports.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing static-app environment and record a reproducible baseline; no project scaffolding is needed.

- [X] T001 Confirm root dependency/runtime availability against package.json and jest.config.js, preserve the current git worktree, and record the current navigation baseline in specs/063-dashboard-arrow-navigation/quickstart.md by running `npm test -- --runInBand __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js`; distinguish pre-existing failures without fixing unrelated behavior.
- [X] T002 Inventory the actual control IDs, displayed order, permitted values, finite steps, and normalization functions in index.html and the owner files listed in specs/063-dashboard-arrow-navigation/contracts/filter-adapters.md; update only that contract if an implementation-facing identifier needs documenting, without inventing filters or changing the approved scope.

**Checkpoint**: Baseline recorded and all 12 tabs mapped, including the two unfiltered tabs.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the small shared action/snapshot contract before story implementation, without changing existing keyboard routing yet.

- [X] T003 Add shared contract cases in __tests__/tab-navigation.test.js for dimension/domain validation, normalized snapshots, and navigation actions: enforce `kind` "`single`, `boolean`, or `stepped`; multi-select is an ordered group of Boolean dimensions.", `direction` "-1 for Left/Up; +1 for Right/Down.", `axis` "`dashboard` or `view`.", `outcome` "`ignored`, `noop`, or `changed`.", and "Stepped domains require finite min/max and a positive finite step with valid integral step positions."; verify the new cases fail before T004.
- [X] T004 Extend src/tab-navigation.js with DOM-free validation/equality and context/action support used by later resolver and traversal operations, exporting additions through CommonJS and window.dashboardTabNavigation without changing old signatures; preserve `tabId` "Existing `TAB_ORDER` value; unique and unchanged.", `panelId` "Existing `TAB_PANEL_IDS[tabId]`.", `activeTabId` "Current available dashboard, or null.", `availableTabs` "Available IDs in canonical tab order.", `inputOwner` "`workspace`, `text`, `dialog`, `nativePopup`, `continuousNumeric`, or `outside`.", and `canonicalKey` "Structural serialization of typed ordered pairs for equality; not a 32-bit mask or an array of every possible view."; run the T003 tests immediately.
- [X] T005 Define transient navigation/data revision state and render-token capture/currency helpers in src/dashboard-state.js, with focused VM assertions in __tests__/index-script-syntax.test.js before implementing them; enforce `navigationRevision` "Monotonically increasing revision for accepted state changes.", `dataRevision` "Revision of imported/processed data and resulting domain availability.", and token fields "`tabId`, `canonicalKey`, `navigationRevision`, and `dataRevision`"; do not create a second selected-filter store or connect new event handlers yet.
- [X] T006 Establish the adapter registration and current-owner snapshot access points in src/dashboard-tabs.js using the existing script lifecycle, preserving `adapter` "Owner of finite filter domains and transactional application, including an empty adapter for unfiltered tabs.", `workspaceOwnsInput` "Dashboard workspace is active and contains the input target; an open modal or editing session may override this.", and `available` "Existing availability calculation, independent of the current filtered result."; add VM coverage in __tests__/index-script-syntax.test.js for late-safe registration and unchanged script load order, without enabling the new dispatcher yet.

**Checkpoint**: Shared contracts pass. Foundation blocks all stories; traversal and workspace arrow behavior are deliberately completed within their owning stories.

## Phase 3: User Story 1 - Switch Dashboards from Any View (Priority: P1) - MVP

**Goal**: Left/Right works throughout the eligible dashboard workspace, including immediately after a filter change, while editing and Tab behavior remain usable.

**Independent Test**: With at least two available tabs, focus a filter, press Down using the currently available vertical behavior, then Right without refocusing. Verify exactly one dashboard switch. Repeat Left/Right from content, tab buttons, closed finite selects, and binary controls; verify wrap and excluded editing contexts.

### Tests for User Story 1

- [X] T007 [P] [US1] Add horizontal resolver contract tests in __tests__/tab-navigation.test.js for canonical available-tab order, skipped unavailable tabs, wrap, zero/one-tab no-op, invalid context, and `target` "Available tab ID or complete valid view combination; absent for no-op/ignored."; retain existing public helper and Tab/Shift+Tab tests.
- [X] T008 [P] [US1] Add executable dispatcher VM cases in __tests__/index-script-syntax.test.js for Down-then-Right without refocus, tab/filter/chart focus, closed select/checkbox/range controls, text/contenteditable/modal/native-editing exclusions, already-handled/composing/modified input, hidden/outside workspace, key repeat, and one action per keydown; retain syntax/load-order checks and replace only obsolete focus-restriction assertions.

### Implementation for User Story 1

- [X] T009 [US1] Implement the horizontal branch of resolveDashboardArrowAction in src/tab-navigation.js using existing getNextVisualizationTab and canonical availability; enforce `preventDefault` "True for workspace-owned arrows, including vertical no-ops; false for excluded interactions." and `cue` "Matching direction only for a successful committed change."; distinguish an unchanged one-tab result from success and rerun __tests__/tab-navigation.test.js.
- [X] T010 [US1] Implement common ownership resolution and native-select interaction tracking in src/dashboard-tabs.js: distinguish closed finite controls from expanded popups with feature-detected `:open` and lifecycle tracking; preserve open dialogs even during focus transition, text editing, continuous numeric editing, modifiers/composition, and outside-workspace behavior; reset native-session state on close/cancel/blur/workspace changes and validate with T008 cases.
- [X] T011 [US1] Connect exactly one workspace arrow dispatcher in src/dashboard-tabs.js and restrict the orchestration tab wrapper used by index.html to Tab/Shift+Tab while retaining the exported utility's backward-compatible arrow behavior; route horizontal arrows centrally before native default steps, leave the existing vertical implementation as the temporary US1 route, and prove no tab/button listener can execute a second arrow action.
- [X] T012 [US1] Keep horizontal cues accurate after filter focus and restore a stable programmatically focusable workspace target with `preventScroll` when controls disappear in src/dashboard-tabs.js and index.html; preserve normal Tab traversal and current cue appearance, do not force focus back to the tab bar, and cover the next immediate Left/Right in __tests__/index-script-syntax.test.js.
- [X] T013 [US1] Run the focused navigation/wiring suites and the independent focus matrix from specs/063-dashboard-arrow-navigation/quickstart.md in an available real browser, including closed/open select behavior, native close/cancel/same-value selection, Left/Right wrap, and zero/one-tab cases; record browser/version, evidence, and unverified platform cases in that guide rather than treating synthetic events as proof of OS-popup behavior.

**Checkpoint**: US1 can be delivered alone as the MVP. It does not yet claim complete filter-combination navigation or the final shared cue computation.

## Phase 4: User Story 2 - Explore Every Filter Combination (Priority: P1)

**Goal**: Up/Down traverses every valid complete view in both directions, from actual current selections, without product expansion, double filter changes, page scrolling, or loss of horizontal navigation.

**Independent Test**: In a synthetic 2-by-3 domain, verify the exact six-view cycle from all six starts, wrap, reverse sequence, and both inverse pairs. In each real filtered tab, manually choose a view, press Up/Down, then immediately Left/Right; confirm one committed view/render and no extra focus action.

### Tests for User Story 2

- [X] T014 [P] [US2] Add traversal contract tests in __tests__/tab-navigation.test.js for all-start 2-by-3 cycles, carry/borrow, wrap, manual selection, candidate-dependent dimension counts, prefix pruning, fixed/no dimensions, invalid inputs, and canonical equality; quote and enforce "Single-choice values follow displayed order, not alphabetical or numeric re-sorting.", "Boolean values order false before true; flatten multi-selection in displayed option order, with the last Boolean varying fastest.", and "A one-choice domain is fixed. No eligible dimensions represent one unchanged view, not an error."; include 100 Boolean dimensions and finite stepped ranges without materialized products or 32-bit masks.
- [X] T015 [P] [US2] Add total-distance owner tests in __tests__/dashboard-core.test.js for a readSnapshot/getDomainProvider/applySelection adapter, 5/5/5/4 aggregation-dependent timeframe domains, canonical first/last suffix completion instead of remembered timeframe values, manual edits, and one final render per keyboard transaction.
- [X] T016 [P] [US2] Add separate mileage/timeline adapter tests in __tests__/dashboard-equipment.test.js for displayed mode/category order, real owner selections, preservation of existing manual setters, and exactly one render with unchanged inactive-dashboard filters.
- [X] T017 [P] [US2] Extend __tests__/dashboard-scatter-years.test.js with sport/metric/date/year/trendline adapter cases, candidate-derived year identity/order, permitted empty year subset, and the constraint "Date start/end dimensions permit only start no later than end. Use candidate start to bound the end domain rather than scanning all invalid pairs."; verify both directions and control regeneration.
- [X] T018 [P] [US2] Add word-count and word-selection adapter tests in __tests__/wordcloud-dashboard.test.js for count 10 through 100 by step 1, stable word identities, candidate-dependent visible words, all-excluded validity, and choices above index 31; enforce "Word-selection dimensions derive from the candidate word count and underlying words. Hidden/removed selection state follows existing owner reconciliation; it is not an additional enumerated choice." without retaining a hidden keyboard cursor.
- [X] T019 [P] [US2] Add pie-chart adapter tests in __tests__/pie-charts-dashboard.test.js for existing category/measure/sport/palette order, native palette values, current object/global state, and one atomic reconciliation/render without changing export state.
- [X] T020 [P] [US2] Add heatmap sport-adapter tests in __tests__/dashboard-heatmap.test.js for actual sport selection order and one final render; assert map pan/zoom is not enumerated or reset by keyboard view selection.
- [X] T021 [P] [US2] Reuse the VM machinery in __tests__/index-script-syntax.test.js for distributions, workout-time, and training-calendar adapter behavior: finite date bounds, current palette/sport choices, absence of an invented calendar year selector, and separation of invalid All+histogram/Swim+elevation from valid zero-activity results; also assert whole-view commits, no synthetic click chains, no-filter no-op, and no page-scroll request.

### Implementation for User Story 2

- [X] T022 [US2] Implement getAdjacentFilterCombination and the vertical resolver branch in src/tab-navigation.js using lazy carry/borrow, candidate-prefix domains, canonical first/last suffix completion, one wrap, and bounded backtracking storage; preserve `domain(prefix, snapshot)` "Finite ordered domain valid for this candidate prefix and fixed data snapshot. Enumerate options lazily where necessary.", `selection` "Ordered dimension-ID/value pairs for the complete current or candidate view.", `fixedState` "Existing owner state that is not independently enumerable, retained according to owner rules.", and snapshot `dataRevision` "Fixed data generation used to resolve all candidate domains."; satisfy T014 without caching all combinations, truncating traversal, or rendering candidates.
- [X] T023 [US2] Add the totalDistance adapter and local batch reconciliation in src/dashboard-core.js using existing TIMEFRAME_OPTIONS, aggregation/sport/timeframe state, and manual normalization; implement actual readSnapshot/getDomainProvider/applySelection behavior, normalize obsolete current values once, and use candidate domains for suffixes before one final render; validate T015 immediately.
- [X] T024 [P] [US2] Add separate equipment/equipmentTimeline adapters in src/dashboard-equipment.js with the existing mileage metrics, timeline modes, and equipment categories; share existing local reconciliation without changing manual APIs or introducing individual-equipment filters; validate T016 immediately.
- [X] T025 [P] [US2] Add the paceMetrics adapter in src/dashboard-scatter.js for sport, metric, finite activity-date pair, generated ordered year Booleans, and trendline; compute candidate-year domains without DOM mutation, enforce valid date bounds, normalize obsolete selections, and apply the full result in one batch/render; validate T017 immediately.
- [X] T026 [P] [US2] Add the distributions adapter in src/dashboard-distributions.js for metric, sport, mode, palette, and finite activity-date pair; prune structurally invalid combinations and preserve valid empty results without inspecting rendered N/A text; keep candidate search pure and commit/render once; run its T021 VM cases immediately.
- [X] T027 [P] [US2] Add the workoutTime adapter in src/dashboard-workout-time.js for aggregation, sport, and finite start/end date-index domains with start no later than end; preserve actual owner bounds and defaults, commit both ends atomically, and run its T021 VM cases immediately.
- [X] T028 [P] [US2] Add the trainingCalendar adapter in src/dashboard-training-calendar.js for displayed palette and existing available sports only; preserve its current availability rules, apply one complete selection/render, and run its T021 VM cases immediately.
- [X] T029 [P] [US2] Add the wordcloud adapter in src/dashboard-wordcloud.js for finite word count and displayed Boolean word selections with `id` "Stable key within its dashboard, independent of DOM node replacement. Generated years use year keys; words use existing stable word identity."; retain existing pruning/default semantics, avoid power-set allocation, and validate T018 immediately.
- [X] T030 [P] [US2] Add the pieCharts adapter to the existing owner pattern in src/dashboard-pie-charts.js for category, measure, sport, and palette, preserving current setters and Share/Export selection; apply one complete candidate/render and validate T019 immediately.
- [X] T031 [P] [US2] Add the heatmap sport adapter in src/dashboard-heatmap.js, applying one final sport selection through the current rendering path without modifying map viewport/zoom behavior; validate T020 immediately, leaving stale-async rejection for US3.
- [X] T032 [US2] Register all 10 filtered-tab adapters plus empty personalBests/lifetimeStatistics adapters in src/dashboard-tabs.js and connect Up/Down to the shared resolver and one atomic owner commit, removing the temporary focused-filter/native-key vertical routes; enforce `currentValue` "Actual owner selection; not inferred solely from button styling.", `order` "Position in visible panel filter order, preserving option order.", and `visibility/enabled` "Determined from owner rules for the candidate prefix; ineligible fields do not independently vary."; prevent native second steps and workspace scrolling even for vertical no-ops, retain immediate horizontal actions, and test regenerated-control focus without adding controls.
- [X] T033 [US2] Run all modified owner suites plus __tests__/tab-navigation.test.js and __tests__/index-script-syntax.test.js, then perform complete/reverse/manual-selection browser scenarios from specs/063-dashboard-arrow-navigation/quickstart.md on every filtered tab; record all 12 adapter mappings, exact synthetic cycles, render counts, inactive-tab isolation, stepped-range coverage, and any unresolved failures in that guide.

**Checkpoint**: US2 is complete when all eligible filter types and owners participate, including native palettes, discrete ranges, binary/year/word selections, and unfiltered no-op tabs. A button-only subset is not completion.

## Phase 5: User Story 3 - Handle Changing Choices and Show Accurate Cues (Priority: P2)

**Goal**: Reconcile changing domains safely, reject obsolete asynchronous output, and show directional availability and success feedback that match actual navigation rather than focus.

**Independent Test**: Use dependent timeframes/years, a valid empty view, and an unfiltered dashboard. Change tabs while a map render is pending. Verify valid current selections, no stale overwrite, correct no-op behavior, and accurate four-direction cues after filter focus.

### Tests for User Story 3

- [X] T034 [P] [US3] Extend executable VM/fake-timer cases in __tests__/index-script-syntax.test.js for current-domain refresh after manual changes/import, invalid-selection default normalization without a success flash, candidate/provider failure with no partial commit, focus-independent cue availability, no-op feedback suppression, and successful repeated feedback starting within 250 ms and ending within 1.5 s.
- [X] T035 [P] [US3] Extend __tests__/dashboard-heatmap.test.js with controllably delayed Leaflet loading, rapid view/tab changes, new data generations, and render failures; assert stale results cannot update current visible output and pending renders never block horizontal input.
- [X] T036 [P] [US3] Extend __tests__/wordcloud-dashboard.test.js with delayed render completion after changed words/count, tab changes, and imports; assert only the matching tab/canonical-view/navigation/data token can commit and a failed render leaves applicable navigation available.

### Implementation for User Story 3

- [X] T037 [P] [US3] Apply render-token currency checks in src/dashboard-heatmap.js after every await and before delayed map/chart/DOM commits, reusing the shared revision helpers while preserving lazy loading and map viewport; discard obsolete output without blocking later arrows and satisfy T035.
- [X] T038 [P] [US3] Align src/dashboard-wordcloud.js render-version/promise handling with tab/view/data token checks, including completion after control replacement or changed word domains; retain existing failure behavior and satisfy T036 without duplicating selected-filter state.
- [X] T039 [US3] Connect revision invalidation and current-domain reconciliation to accepted tab/view changes, manual selections, refreshVisualizationTabs/import-driven data changes, workspace exit, and native-editing lifecycle in src/dashboard-tabs.js and src/dashboard-state.js; recheck tab/data ownership before adapter commit, recompute invalidated candidates from actual current state, and validate T034-T036 with no normalization-only cue flashes.
- [X] T040 [US3] Replace remaining focus-specific cue logic in src/dashboard-tabs.js with shared resolver-based availability for both axes, retaining existing placement/styles and timer duration; flash only after a real successful commit, restart timers on repeated successes, and refresh on focus/native ownership/data/tab/filter changes without expanding large domains or flashing for no-ops; satisfy T034 timing and availability cases.
- [X] T041 [US3] Run the changed navigation/wiring/heatmap/wordcloud suites and current-data invalidation tests referenced in specs/063-dashboard-arrow-navigation/quickstart.md; verify deterministic token rejection, structural-invalid versus valid-empty handling, zero/one-tab and no-filter cases, input ordering, and error recovery, recording results in that guide.
- [X] T042 [US3] Execute dependent-filter, empty-result, pending-render, scroll-preservation, regenerated-focus, and cue-feedback browser scenarios from specs/063-dashboard-arrow-navigation/quickstart.md; record that Left/Right stays immediately usable after vertical actions and that no-op directions neither flash nor scroll the workspace.

**Checkpoint**: All three stories pass their own acceptance cases; remaining cross-browser, layout/export, performance, and full-suite checks are release gates below.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Document the user-visible change and complete cross-story release evidence without unrelated cleanup.

- [X] T043 [P] Update README.md keyboard-navigation wording to describe independent horizontal dashboard switches, full reversible vertical combinations, wraparound, and native editing exceptions; retain precise privacy wording and avoid claiming global no-network operation or new persistence.
- [ ] T044 Preserve shared-global syntax/script-order checks in __tests__/index-script-syntax.test.js, run relevant existing export checks including __tests__/dashboard-export-download.test.js, and smoke-test existing Share/Export for representative chart/map/wordcloud views plus current no-data behavior; record desktop/mobile-sized cue overlap checks and capture/download outcomes in specs/063-dashboard-arrow-navigation/quickstart.md without adding a new tab, capture target, or export UI.
- [ ] T045 Complete the native open/closed-select, text/modal/continuous-editing, Tab/Shift+Tab, outside-workspace, and one-event/one-action matrix in Chromium, Firefox, and Safari per specs/063-dashboard-arrow-navigation/quickstart.md; record browser versions and actual popup close/cancel/same-value-selection evidence, treat unavailable platforms or OS interactions as explicitly unverified, and do not silently exempt closed selects or reduce browser support.
- [ ] T046 Measure at least 40 visible-completion arrow actions using 1,000 synthetic activities and at most 100 valid combinations per specs/063-dashboard-arrow-navigation/quickstart.md; require at least 95% within one second, separately confirm cue start within 250 ms and end within 1.5 s, and retain separate 100-Boolean lazy-traversal evidence rather than substituting a pure-function benchmark for visible completion.
- [X] T047 Run the full root suite with `npm test -- --runInBand`, recheck all constitution gates in specs/063-dashboard-arrow-navigation/plan.md against the actual changed files, and finalize pass/fail/unverified evidence in specs/063-dashboard-arrow-navigation/quickstart.md; confirm no API/CLI/import-parsing/dependency drift and leave release-blocking failures or unverified requirements explicit rather than marking them passed.

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1: T001-T002
  -> Phase 2: T003 -> T004 -> T005 -> T006
    -> US1: T007-T008 -> T009 -> T010 -> T011 -> T012 -> T013
      -> US2: T014-T021 -> T022 -> T023-T031 -> T032 -> T033
        -> US3: T034-T036 -> T037-T038 -> T039 -> T040 -> T041 -> T042
          -> Polish: T043-T047
```

This graph gives the default dependency-safe execution order; test waves may run in parallel where files differ. A red test establishes its local implementation target, not a reason to keep unrelated edits running before focused validation.

### User Story Completion Order

- **US1 (P1)** depends only on Setup/Foundation and is the recommended independently deliverable MVP. Its focused acceptance can use the existing single-filter vertical route.
- **US2 (P1)** builds on US1's tested dispatcher/ownership behavior and replaces that temporary vertical route. Its traversal and individual owner adapters are independently testable through synthetic snapshots and VM harnesses, without US3 feedback work.
- **US3 (P2)** builds on US1/US2 for integrated data invalidation and four-direction feedback; its async owner cases are independently reproducible with delayed promises and fake timers.
- Whole story phases are not parallel: they share src/tab-navigation.js, src/dashboard-tabs.js, and wiring tests. Parallelize only the listed independent task waves, then integrate once.
- T032 waits for T022 and all owner adapters T023-T031. T039 waits for T037/T038 so revision wiring and renderer rejection are tested together. T047 waits for all acceptance evidence; unavailable browser checks remain gaps, not completed proof.

### Parallel Opportunities

| Wave | Tasks | Prerequisites / Boundaries |
|------|-------|----------------------------|
| US1 contract tests | T007, T008 | Foundation complete; separate test files. |
| US2 traversal/owner tests | T014-T021 | US1 complete; eight distinct test files; keep each file owned by one worker. |
| US2 owner adapters | T023-T031 | T022 complete, respective failing tests written, and adapter contract stable. T024-T031 are marked parallelizable; all owners use different source files and shared interfaces stay frozen until T032. |
| US3 regression tests | T034-T036 | US2 complete; distinct VM test files. |
| US3 async protection | T037, T038 | T035/T036 regression cases exist; independent heatmap and wordcloud owners using already-defined token helpers. |
| Documentation | T043 | After story behavior is stable; README.md can be edited alongside T044 validation without concurrent edits to evidence in quickstart.md. |

Do not run writers to the same file concurrently. A parallelizable task still runs its own focused validation immediately after its source change; integration failures are resolved before the next dependent wave.

## Parallel Example: User Story 1

```text
After T006, write T007 in __tests__/tab-navigation.test.js
alongside T008 in __tests__/index-script-syntax.test.js.
Then execute T009-T013 in order; do not race dispatcher and wrapper edits.
```

## Parallel Example: User Story 2

```text
After US1, write T015 owner tests alongside T017 and T018 in separate files.
After T022 and all relevant red tests, implement T024 in dashboard-equipment.js
alongside T025 in dashboard-scatter.js and T029 in dashboard-wordcloud.js.
Run each owner's focused tests, then wait for all adapters before T032.
```

## Parallel Example: User Story 3

```text
After US2, write T034 wiring/timer cases alongside T035 heatmap races
and T036 wordcloud races. Implement T037 and T038 in separate owners.
Then serialize shared revision/cue integration in T039-T040.
```

## Requirement Coverage

| Requirement / Outcome | Implementing and Verifying Tasks |
|-----------------------|----------------------------------|
| FR-001, FR-002; SC-001 | T007-T013, T032-T033, T045 |
| FR-003, FR-005; SC-002 | T014, T022, T023, T032-T033 |
| FR-004; SC-003 | T014-T031, T033 |
| FR-006 | T015, T017-T018, T022-T023, T025, T029, T034, T039, T042 |
| FR-007; SC-004 | T008, T014-T021, T023-T033, T042 |
| FR-008; SC-007 | T005, T008-T013, T032-T042, T045 |
| FR-009 | T017-T021, T025-T029, T032-T034, T041-T042 |
| FR-010 | T007-T013, T032, T045 |
| FR-011; SC-006 | T012, T034, T039-T042, T044, T046 |
| FR-012 | T001-T002, T006, T019-T020, T030-T031, T043-T045, T047 |
| SC-005 | T014, T018, T022, T029, T046 |

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundation, validating each changed slice.
2. Complete US1 tests, ownership, routing, focus continuity, and its browser check.
3. Stop at T013 for an independently testable dashboard-switching MVP. Describe Up/Down as existing behavior until US2 lands; do not claim the whole feature complete.

### Incremental Delivery

1. After US1, implement pure traversal and all owner adapters, then integrate US2 once and prove completeness/reversibility.
2. Add US3 token safety, domain refresh, and shared cue availability without changing filter meanings or adding UI.
3. Complete documentation and release evidence, including real native-popups, desktop/mobile layout, export, visible timing, and full root tests.
4. Mark an implementation task complete only when its relevant focused check passes. Record any environment-limited acceptance checks explicitly and do not certify unperformed tests.

## Notes

- Total: 47 tasks. Setup: 2; Foundation: 4; US1: 7; US2: 20; US3: 9; Polish: 5.
- No commits or branches are requested by these tasks. Do not revert pre-existing changes or fix unrelated failing tests.
- Native-popup portability is an acceptance gate, not permission to exempt all focused selects. Large domains are a traversal-design constraint, not permission to cap reachable combinations.
- Implementation status: 44 tasks completed; T044-T046 remain open for the external export, browser-platform, and cold-loading checks described in quickstart.md. No spec-quality checklist markers were changed.