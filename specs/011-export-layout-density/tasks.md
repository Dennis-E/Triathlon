---

description: "Task list for export layout density"
---

# Tasks: Export Layout Density

**Input**: Design documents from `/specs/011-export-layout-density/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [export-ui.md](contracts/export-ui.md), [quickstart.md](quickstart.md)

**Tests**: Included because this feature changes reusable geometry helpers, canvas layout, typography, and user-visible export composition.

## Phase 1: Setup

**Purpose**: Establish shared layout and export-composition constants.

- [x] T001 [P] Add export layout constants for header, content, metadata, and footer-free composition regions in `src/export-utils.js`.
- [x] T002 [P] Add test fixtures for single-row, multi-row, PB, and header-only export targets in `__tests__/export-utils.test.js`.

## Phase 2: Foundational

**Purpose**: Build deterministic geometry helpers used by all stories.

- [x] T003 Implement a pure filter-row layout helper in `src/export-utils.js` that wraps controls by available width and returns each row's start, bottom, and total height including bottom padding.
- [x] T004 [P] Add Jest coverage in `__tests__/export-utils.test.js` for one-row bottom padding, multiple-row separation, long labels, narrow widths, and non-overlapping row bounds.
- [x] T005 Extend export target metadata in `src/export-utils.js` to identify PB targets and preserve a tighter content-fit mode without changing existing target kind or filename behavior.
- [x] T006 [P] Add Jest coverage in `__tests__/export-utils.test.js` for standard versus PB content-fit metadata and canonical header branding values.

## Phase 3: User Story 1 - Read all filter rows (Priority: P1)

**Goal**: Ensure one-row and multi-row filter/control blocks are fully visible and never overlap.

**Independent Test**: Generate exports with one, multiple, and long filter rows and verify every control row and its bottom padding are visible.

- [x] T007 [US1] Replace fixed available-control row advancement in `index.html` with the measured row layout helper from `src/export-utils.js`.
- [x] T008 [US1] Update `drawAvailableControls` in `index.html` to return actual row bottoms and reserve complete text baseline, pill height, and bottom padding for every row.
- [x] T009 [US1] Update filter, available-control, and legend placement in `index.html` so each block starts after the previous rendered bottom plus spacing.
- [x] T010 [P] [US1] Add inline-script assertions in `__tests__/index-script-syntax.test.js` for measured row layout, row-bottom return values, single-row padding, multi-row spacing, and dynamic legend placement.
- [x] T011 [P] [US1] Add pure layout assertions in `__tests__/export-utils.test.js` for long labels, narrow widths, one-row visibility, and multiple-row non-overlap.

## Phase 4: User Story 2 - Read a compact, legible export (Priority: P1)

**Goal**: Increase export typography and make PB charts use the available visualization region efficiently.

**Independent Test**: Compare standard and PB exports at desktop and narrow sizes for readable text and intentional chart margins.

- [x] T012 [US2] Increase canvas font sizes for headline, active filters, available controls, legend, domain, QR-adjacent labels, and supporting text in `index.html`.
- [x] T013 [US2] Apply PB-specific content bounds and contain-fit sizing in `index.html` so `pb-tile` charts occupy most of the content region without distortion or clipping.
- [x] T014 [US2] Keep standard visualization content fitting unchanged where it preserves chart readability, while using the tighter PB mode only for personal-best targets in `index.html`.
- [x] T015 [P] [US2] Add static assertions in `__tests__/index-script-syntax.test.js` for larger typography values and PB-specific content bounds.
- [x] T016 [P] [US2] Add utility assertions in `__tests__/export-utils.test.js` for PB content-fit mode, aspect-ratio preservation, and intentional margin bounds.

## Phase 5: User Story 3 - Use a header-only export composition (Priority: P1)

**Goal**: Move domain and QR code into the header and remove the separate footer completely.

**Independent Test**: Generate a preview/download and verify one header contains logo, title, domain, and QR code while no footer or repeated branding exists.

- [x] T017 [US3] Redesign the canvas header in `index.html` to contain TriAnalytica logo, title, canonical domain, and QR code without overlap.
- [x] T018 [US3] Remove footer background bands and footer logo/domain/QR draw calls from `index.html`, and shift visualization/metadata content into the freed composition space.
- [x] T019 [US3] Update the header/content/metadata bounds in `index.html` so the footer-free composition remains readable at supported desktop and narrow sizes.
- [x] T020 [P] [US3] Update static assertions in `__tests__/index-script-syntax.test.js` for header domain/QR placement, footer absence, single branding occurrence, and compact region boundaries.
- [x] T021 [P] [US3] Add export utility assertions in `__tests__/export-utils.test.js` for canonical header domain, QR asset, and no-footer layout configuration.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete dense export composition.

- [x] T022 [P] Run focused export tests with `npm test -- --runInBand --runTestsByPath __tests__/export-utils.test.js __tests__/index-script-syntax.test.js` and resolve regressions in `src/export-utils.js` or `index.html`.
- [x] T023 Run the complete root test suite defined in `package.json` with `npm test -- --runInBand` and verify no import, visualization, or navigation regressions.
- [x] T024 Serve the app with `python -m http.server 8000` and execute the single-row, multi-row, typography, PB-density, header-only, and narrow-viewport scenarios from `specs/011-export-layout-density/quickstart.md`.
- [x] T025 Review `specs/011-export-layout-density/contracts/export-ui.md` and `index.html` for exact domain, local QR behavior, no-footer composition, and privacy wording consistency.

## Dependencies

- T001-T002 can run in parallel.
- T003 must precede T004 and T007-T009; T005 must precede T006 and T013-T014.
- US1 tasks T007-T011 depend on the row-layout helper; T010-T011 can run in parallel after implementation.
- US2 tasks T012-T016 depend on the content-fit metadata; T015-T016 can run in parallel after implementation.
- US3 tasks T017-T021 depend on the shared layout bounds; T020-T021 can run in parallel after implementation.
- T022 depends on T010-T011, T015-T016, and T020-T021; T023-T025 follow focused validation.

## Parallel Execution Examples

### User Story 1

```text
Parallel after implementation: T010 and T011
```

### User Story 2

```text
Parallel after implementation: T015 and T016
```

### User Story 3

```text
Parallel after implementation: T020 and T021
```

## Implementation Strategy

1. Build and test measured row geometry first.
2. Deliver US1 as the MVP because it fixes clipping and overlap directly.
3. Increase typography and tighten PB content bounds as US2.
4. Consolidate branding/domain/QR into the header and remove the footer as US3.
5. Run focused tests, full regression tests, and browser validation at desktop and narrow sizes.

## Completion Criteria

- All tasks are checked after implementation and verification.
- Every task uses the required checkbox, sequential ID, optional `[P]`, story label where required, and exact file path.
- The final composition satisfies [export-ui.md](contracts/export-ui.md).
