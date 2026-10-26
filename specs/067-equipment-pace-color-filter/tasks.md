---
description: "Executable tasks for Equipment Pace color selection and progressive fire bars"
---

# Tasks: Equipment Pace Color Selection and Progressive Fire Bars

**Input**: Design documents from `specs/067-equipment-pace-color-filter/`.

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/equipment-pace-colors.md](contracts/equipment-pace-colors.md), and [quickstart.md](quickstart.md).

**Tests**: Included because the constitution mandates focused verification and the approved plan explicitly requires utility, renderer, wiring, export, and browser checks. Reuse existing Jest files and Node/VM mocks; do not add a test framework or dependency.

**Organization**: Grouped by user story. Checked tasks record completed implementation and validation; detailed evidence and the integrated-browser file-delivery limitation are recorded in quickstart.md.

## Format: `[ID] [P?] [Story] Description`

- Every task uses an unchecked checkbox, sequential T-number, optional parallel marker, and a concrete repository-relative file path.
- `[P]` means safe parallel preparation with other indicated tasks in that phase after its prerequisites complete, not permission to bypass dependencies.
- `[US1]`, `[US2]`, and `[US3]` identify story tasks; setup, foundational, and polish tasks have no story label.

## Path Conventions

- Existing static markup: `index.html`; orchestration and reusable utilities: `src/`.
- Existing root Jest suites: `__tests__/`; feature evidence and validation notes: `specs/067-equipment-pace-color-filter/quickstart.md`.
- Preserve classic script order and existing CommonJS/browser bridges. No API, CLI, import parser, new tab, build step, package, or branch changes.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing environment without scaffolding a new project.

- [X] T001 Confirm root test tooling from `package.json` and `jest.config.js`, install existing root dependencies only if missing, and run the baseline `npm test -- --runInBand __tests__/equipment-utils.test.js __tests__/dashboard-equipment.test.js __tests__/index-script-syntax.test.js __tests__/dashboard-export-download.test.js __tests__/tab-navigation.test.js __tests__/distribution-utils.test.js`; record existing failures and environment details in `specs/067-equipment-pace-color-filter/quickstart.md` without fixing unrelated issues.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared synthetic comparisons and observable chart geometry before changing behavior.

- [X] T002 Extend existing fixture builders in `__tests__/dashboard-equipment.test.js` for shoes at 6:00/5:00/4:00 min/km, bikes at 20/25/30 km/h, equal/single/invalid/empty values, and close speeds 29.9/30; use synthetic activities only and retain the existing data shape; immediately run `npm test -- --runInBand __tests__/dashboard-equipment.test.js`.
- [X] T003 Extend the existing Node/VM/Chart harness in `__tests__/dashboard-equipment.test.js` with selector elements, callable drawing hooks, `scales.x.getPixelForValue`, bar-element options, and a `createLinearGradient`/`addColorStop` recorder; keep existing tests passing with `npm test -- --runInBand __tests__/dashboard-equipment.test.js` and do not emulate DOM/canvas through a new library.

**Checkpoint**: T001-T003 complete. Existing behavior is observable without changing production behavior.

## Phase 3: User Story 1 - Choose the Equipment Pace Color Scheme (Priority: P1)

**Goal**: Offer the familiar On fire / Monochrome blue choice, retain it during the loaded session, and preserve compared data.

**Independent Test**: On Pace + Shoes and Pace + Bikes, choose both options and verify the native labeled control, blue appearance, retained choice, and unchanged names, values, units, order, and bar lengths. Progressive fire acceptance is completed in US2; US1 alone is a selector increment, not the full P1 feature.

### Tests for User Story 1

Write new behavioral assertions before production changes and run their narrow commands to demonstrate the expected failures. Parallel test authors must not edit the same file.

- [X] T004 [P] [US1] Add selector contract assertions in `__tests__/index-script-syntax.test.js` for label wrapper `equipmentColorSchemeControl`, select `equipmentColorScheme`, `fire`/`On fire`, `monochrome-blue`/`Monochrome blue`, the existing label/classes/filter-summary conventions, and `setEquipmentColorScheme(this.value)`; run `npm test -- --runInBand __tests__/index-script-syntax.test.js`.
- [X] T005 [P] [US1] Add state/palette tests in `__tests__/dashboard-equipment.test.js` for supported values `fire`, `monochrome-blue`, the model constraint "In-memory Equipment orchestration state; initial `fire`.", unsupported-input fallback to fire, blue `#2563EB`, and retention through type/metric/tab-return/data-refresh rendering; assert names, order, units, values, and bar lengths are unchanged; run `npm test -- --runInBand __tests__/dashboard-equipment.test.js`.

### Implementation for User Story 1

- [X] T006 [US1] Add the labeled native select in the existing wrapping Equipment controls in `index.html`, copying distribution/pie selector classes, option labels, and `data-filter-label="Colour scheme"`; initially hide its wrapper in ineligible views, preserve script order and navigation IDs, and immediately run `npm test -- --runInBand __tests__/index-script-syntax.test.js` (depends on T004).
- [X] T007 [US1] Add local `selectedEquipmentColorScheme` and global `setEquipmentColorScheme` in `src/dashboard-equipment.js`; normalize unsupported input to fire, retain state without storage/reset on type/metric/tab/data changes, synchronize the select and wrapper before empty-state returns, show it only for Pace + Shoes/Bikes, and use the existing blue helper for blue while preserving current fire behavior until US2; immediately run `npm test -- --runInBand __tests__/dashboard-equipment.test.js` and rerun the T006 wiring test (depends on T005-T006).
- [X] T008 [US1] Follow the selector scenarios in `specs/067-equipment-pace-color-filter/quickstart.md` on the statically served app at 375 px and 1280 px; operate the select by keyboard, check label/selected-state visibility and no overlap, and record results plus unchanged comparison values, explicitly leaving progressive-fire acceptance for T013 (depends on T007).

**Checkpoint**: Familiar color selection works independently. Do not declare the complete P1 request delivered before US2.

## Phase 4: User Story 2 - Read Meaningful Progression Within Each Fire Bar (Priority: P1)

**Goal**: Use one shared fire progression bounded by the slowest and fastest visible valid performance, independent of the zero-based bar axis.

**Independent Test**: Shoes 6:00/5:00/4:00 have speeds 10/12/15 and endpoint color positions 0/0.4/1; bikes 20/25/30 have positions 0/0.5/1. The slowest endpoint is yellow, fastest red, longer bars visibly progress, and equal x positions share colors. Single/equal sets stay yellow.

### Tests for User Story 2

- [X] T009 [P] [US2] Add failing `getEquipmentPaceColorRange` tests in `__tests__/equipment-utils.test.js` for finite numeric positive speeds, missing/null rows, zero/negative/nonfinite/string values, no coercion, no input mutation/reordering, empty/all-invalid `null`, equal bounds, tightly clustered values, shoe/bike bounds, and CommonJS/browser bridge availability; run `npm test -- --runInBand __tests__/equipment-utils.test.js`.
- [X] T010 [P] [US2] Replace old solid-fire expectations and add gradient assertions in `__tests__/dashboard-equipment.test.js`: visible-only bounds; shared gradient from x(min/max) to x(1); palette stops at 0/0.5/1; no gradient for equal/single/empty comparisons; safe geometry fallback; no stale geometry after resize or dataset change; no shared-options mutation or fire leakage into blue/All; preserve model constraints for `name` "Preserved across scheme switches.", `type` "Color comparisons never mix types.", `paceMinPerKm` "Finite and positive for valid performance.", `speedKmh` "Finite and positive; greater means faster for either type.", and `barValue` "Existing value in `(0, 1]`; independent of chosen palette."; run `npm test -- --runInBand __tests__/dashboard-equipment.test.js`.

### Implementation for User Story 2

- [X] T011 [US2] Add pure `getEquipmentPaceColorRange(rows)` to both existing exports in `src/equipment-utils.js`: `minSpeedKmh` is "Slowest finite positive speed among the supplied visible rows." and `maxSpeedKmh` is "Fastest finite positive speed among the supplied visible rows."; preserve equal bounds, return `null` without valid speeds, avoid string coercion/epsilon collapse/mutation, and keep linear time with constant auxiliary storage; immediately run `npm test -- --runInBand __tests__/equipment-utils.test.js` (depends on T009).
- [X] T012 [US2] Integrate that helper into eligible fire rendering in `src/dashboard-equipment.js`; add a chart-local `beforeDatasetsDraw` hook creating one shared CanvasGradient after layout between x(minSpeedKmh/maxSpeedKmh) and x(1), use existing fire helpers at 0/0.5/1, preserve/copy other bar options, use yellow for degenerate/missing geometry, and recompute every draw without extra DPR multiplication; validate rows before the comparative empty-state decision and preserve all existing bar values/axis/labels; immediately run `npm test -- --runInBand __tests__/dashboard-equipment.test.js` and the utility suite (depends on T007, T010-T011).
- [X] T013 [US2] Execute and record the shoe/bike, equal/single/invalid/empty/tight-range, displayed-set refresh, and resize scenarios from `specs/067-equipment-pace-color-filter/quickstart.md`; capture browser screenshots and sample interior canvas pixels for yellow origin/slowest, shared x-position color, intermediate progression, and red fastest at 375 px and 1280 px; use resolvable ranges for pixels and retain the contract's subpixel limitation rather than altering bar lengths (depends on T012).

**Checkpoint**: US1 + US2 deliver the full P1 color-choice and progression behavior. Actual canvas evidence is required in addition to mocked calls.

## Phase 5: User Story 3 - Keep Other Equipment Views and Shared Images Consistent (Priority: P2)

**Goal**: Preserve existing All/non-Pace views and export the settled selected chart through the existing local preview/download flow.

**Independent Test**: Select each scheme, pass through All and other metrics and back, then immediately share/export; type colors and other metrics remain unchanged, selection is retained, and preview/download preserve chosen colors and readable values.

### Tests for User Story 3

- [X] T014 [P] [US3] Extend `__tests__/dashboard-export-download.test.js` for Equipment with each supported scheme, retaining capture target `equipmentChartWrapper`, data/no-data gating, PNG preview/download parity, and immediate post-selection capture; use the existing pipeline and mocks, not export-only drawing; run `npm test -- --runInBand __tests__/dashboard-export-download.test.js`.
- [X] T015 [P] [US3] Extend existing wiring assertions in `__tests__/index-script-syntax.test.js` to confirm the existing Equipment ID/dispatch/share wiring stays synchronized with `src/tab-navigation.js`, no new script or tab registration is added, and the selector wrapper participates in the established hidden-summary convention; run `npm test -- --runInBand __tests__/index-script-syntax.test.js __tests__/tab-navigation.test.js`.
- [X] T016 [P] [US3] Add focused compatibility assertions in `__tests__/dashboard-equipment.test.js` for All's shoe/bike colors, unchanged non-Pace/timeline/yearly behavior, hidden inapplicable selector/retained value, no-data synchronization, and settled Pace-only animation settings without changing other metrics; run `npm test -- --runInBand __tests__/dashboard-equipment.test.js`.

### Implementation for User Story 3

- [X] T017 [US3] Settle Equipment Pace rendering by disabling animation only for Pace in `src/dashboard-equipment.js`; complete any test-demonstrated local visibility/empty-state/compatibility correction while retaining the existing `src/dashboard-export.js` capture target, preview/download behavior, filename, and global wait unchanged; make no speculative export edits and immediately rerun the affected Equipment or export suite, then confirm T014-T016 pass (depends on T012, T014-T016).
- [X] T018 [US3] Perform one synthetic import-to-export pass and each-scheme immediate export at desktop/mobile widths using `specs/067-equipment-pace-color-filter/quickstart.md`; inspect preview and downloaded PNG names/values and interior pixels for chosen blue or clipped fire progression, test return from All/non-Pace and no-data export behavior, and record evidence without private data (depends on T017).

**Checkpoint**: The complete color feature is compatible with existing views and the established local image pipeline.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete user documentation and required acceptance evidence without unrelated cleanup.

- [X] T019 [P] Update the existing Equipment section in `README.md` with the selectable schemes, slowest-to-fastest fire progression, yellow equal/single fallback, and All's unchanged type colors; describe local processing accurately and do not add network/privacy guarantees.
- [X] T020 Run the focused regression commands in `specs/067-equipment-pace-color-filter/quickstart.md` for `__tests__/equipment-utils.test.js`, `__tests__/dashboard-equipment.test.js`, `__tests__/distribution-utils.test.js`, `__tests__/index-script-syntax.test.js`, `__tests__/tab-navigation.test.js`, and `__tests__/dashboard-export-download.test.js`; record results, preserve unrelated baseline failures, and run `git diff --check` (depends on T018-T019).
- [X] T021 Measure both scheme switches with 100 synthetic equipment items as described in `specs/067-equipment-pace-color-filter/quickstart.md`; record browser/version, reference device, viewport, item count, and selection-to-settled-frame time, requiring each switch within one second; repair only evidenced local performance defects and rerun the touched focused suite (depends on T018).
- [X] T022 Reconcile recorded evidence in `specs/067-equipment-pace-color-filter/quickstart.md` against FR-001 through FR-013 and SC-001 through SC-006, including keyboard/mobile screenshots, original-canvas and exported-image pixels, timing, and no-data behavior; document any genuine blocker rather than marking acceptance complete, and report the static app URL for the user (depends on T020-T021).

## Dependencies & Execution Order

### Phase Dependencies

```text
T001 -> T002 -> T003
                    |
                    v
US1: (T004 || T005) -> T006 -> T007 -> T008
                                             |
                                             v
US2: (T009 || T010) -> T011 -> T012 -> T013
                                             |
                                             v
US3: (T014 || T015 || T016) -> T017 -> T018
                                                   |
                                                   v
Polish: T019 -> T020; T018 -> T021; (T020 + T021) -> T022
```

The graph is a conservative phase-level execution order. Task-specific prerequisites above still apply: T006 requires T004, T007 requires T005-T006, T011 requires T009, and T012 requires T007/T010/T011. T019 can run independently alongside final regression preparation after US3. Do not edit or validate the same working file concurrently.

### User Story Dependencies

- US1 starts after the foundation and is independently testable as a selector increment; its progressive-fire acceptance scenario relies on US2.
- US2 follows US1 because both change the same renderer and the gradient must respect the selected scheme. Its range helper/tests are self-contained, but the integrated story must validate against the US1 control.
- US3 follows US1 + US2 so it can verify both actual schemes and gradients rather than mocked future behavior.
- Full delivery requires all three stories plus acceptance evidence. US1 alone is not the complete requested behavior.

### Within Each User Story

Write and run new tests first to confirm the specific missing behavior. After every production edit, immediately run the narrowest applicable command before further source edits; fix only the touched slice and rerun. Test-only preparatory tasks T002-T003 must stay green. Unexpected failures must be distinguished from the baseline in T001.

### Parallel Opportunities

- T004/T005: selector wiring tests and renderer state tests are separate files.
- T009/T010: pure range tests and chart drawing tests are separate files.
- T014/T015/T016: export, markup/wiring, and renderer compatibility tests are separate files.
- T019: documentation can proceed independently of browser/performance validation after its behavior is settled.
- All changes to `src/dashboard-equipment.js` are serialized. Browser tasks that append evidence to `quickstart.md` are also serialized.

## Parallel Example: User Story 1

After T003, prepare T004 in `__tests__/index-script-syntax.test.js` alongside T005 in `__tests__/dashboard-equipment.test.js`. Once both expected failures are understood, implement markup/state in order; do not run an integration check against a half-edited source file.

## Parallel Example: User Story 2

After US1, prepare T009 in `__tests__/equipment-utils.test.js` alongside T010 in `__tests__/dashboard-equipment.test.js`. Complete the helper and its narrow check before integrating it into the renderer.

## Parallel Example: User Story 3

After US2, prepare T014 in `__tests__/dashboard-export-download.test.js`, T015 in `__tests__/index-script-syntax.test.js`, and T016 in `__tests__/dashboard-equipment.test.js` independently. Join their expectations before T017; use a single browser evidence writer for T018.

## Requirement Coverage

| Requirements / outcomes | Tasks |
|-------------------------|-------|
| FR-001, FR-002, FR-003, FR-010 | T004-T008 |
| FR-004, FR-005, FR-006, FR-007, FR-008, FR-009 | T009-T013 |
| FR-011 | T007, T015-T018 |
| FR-012 | T004, T006, T008, T018 |
| FR-013 | T014, T017-T018 |
| SC-001 | T021 |
| SC-002, SC-003 | T009-T013 |
| SC-004 | T005, T010, T016, T018 |
| SC-005 | T008, T018 |
| SC-006 | T014, T018 |

## Implementation Strategy

### MVP First

Complete setup/foundation and US1 for a demonstrable color-choice increment. Then finish US2 before presenting the requested P1 improvement as complete: US1's progressive-fire scenario is not satisfied by the old solid fire fills. US3 is a required compatibility/export gate for final delivery, not optional polish.

### Incremental Delivery

1. Establish passing fixture/harness support without source changes.
2. Deliver and validate the familiar selector with session retention and unchanged comparison values.
3. Deliver and validate visible-range normalization and shared within-bar progression.
4. Verify unaffected views and real preview/download output, settling only Pace animation as required.
5. Finish documentation, focused regression, timing, and explicit acceptance evidence.

### Parallel Team Strategy

Parallelize independent test-file preparation within each story, then integrate sequentially through the shared renderer. No additional agent delegation is required by this task list. Do not create commits or branches unless separately requested.

## Notes

- Total: 22 tasks; US1: 5, US2: 5, US3: 5; setup/foundation: 3; polish: 4. Eight tasks have `[P]` markers.
- Reuse existing files and palette helpers. Do not truncate the bar axis, apply per-bar full-spectrum gradients, compare shoes directly with bikes, or use zero as the color minimum.
- Mocked calls cannot establish actual image pixels, responsive layout, or measured timing. Record those results only after running the browser acceptance steps.
- Mark tasks complete only after their stated checks pass; preserve user changes and unrelated failing tests.