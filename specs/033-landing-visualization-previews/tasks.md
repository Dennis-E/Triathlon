---

description: "Task list for Landing Visualization Previews"
---

# Tasks: Landing Visualization Previews

**Input**: Design documents from `specs/033-landing-visualization-previews/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui-contract.md](contracts/ui-contract.md), [quickstart.md](quickstart.md)

**Tests**: Focused HTML, asset-inventory, privacy-reference, and browser checks are included because the plan requires narrow validation of public preview behavior and private-data boundaries.

**Organization**: Tasks are grouped by user story so card coverage, realistic assets, and privacy/responsive behavior can be delivered and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the public preview asset location and focused contract-test surface.

- [X] T001 Create the approved derived-asset directory at `assets/previews/` and document that only reviewed screenshots may be stored there.
- [X] T002 Create `__tests__/preview-assets.test.js` using the repository's existing `fs`, `path`, and Jest conventions for source and asset-inventory assertions.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the complete eight-visualization catalog and privacy checks that all stories rely on.

- [X] T003 Add the eight required visualization keys and expected asset paths to `__tests__/preview-assets.test.js`: `totalDistance`, `heartratePace`, `equipment`, `equipmentTimeline`, `personalBests`, `heatmap`, `distributions`, and `workoutTime`, mapped to `assets/previews/` files.
- [X] T004 Add privacy-boundary assertions in `__tests__/preview-assets.test.js` that `index.html` does not reference `private-data/`, `export_39173135.zip`, raw CSV/GPX/FIT files, or a ZIP runtime path.

**Checkpoint**: The catalog and private-data boundary are testable before landing-page markup and asset integration begin.

## Phase 3: User Story 1 - Discover All Visualizations (Priority: P1) 🎯 MVP

**Goal**: Make all eight dashboard visualizations identifiable from the landing-page preview area, including Workout Time and Distributions.

**Independent Test**: Open the landing page without importing a file and verify eight identifiable preview cards with the two new titles and existing dashboard actions.

### Tests for User Story 1

- [X] T005 [US1] Add source-contract assertions in `__tests__/preview-assets.test.js` that `index.html` contains one preview card for every required visualization key, with visible titles for `Workout Time` and `Distributions` and relative asset references.
- [X] T006 [US1] Add assertions in `__tests__/preview-assets.test.js` that the new cards in `index.html` preserve `openDashboardTab('workoutTime')` and `openDashboardTab('distributions')` actions and retain import-required guidance references.

### Implementation for User Story 1

- [X] T007 [US1] Add a Workout Time preview card to `index.html` with `openDashboardTab('workoutTime')`, a clear title, purpose description, and `assets/previews/workout-time.png` image reference.
- [X] T008 [US1] Add a Distributions preview card to `index.html` with `openDashboardTab('distributions')`, a clear title, purpose description, and `assets/previews/distributions.png` image reference.
- [X] T009 [US1] Update the landing preview grid in `index.html` so all eight cards remain identifiable and fit the existing preview-card layout without removing or renaming existing cards.

**Checkpoint**: Visitors can discover all dashboard visualizations and select the two new cards before importing data.

## Phase 4: User Story 2 - See Realistic Training Examples (Priority: P1)

**Goal**: Generate and publish eight coherent, realistic, sanitized screenshots from the local private export.

**Independent Test**: Review every file in `assets/previews/` against its corresponding dashboard visualization and confirm plausible activity-derived content with no personal identifiers.

### Tests for User Story 2

- [X] T010 [US2] Add asset-existence and readable-format assertions in `__tests__/preview-assets.test.js` for the eight expected files under `assets/previews/`.
- [X] T011 [US2] Add a documented asset-review checklist in `specs/033-landing-visualization-previews/asset-review.md` covering realistic values, readable labels, no names/identifiers, and no exact route geometry for every screenshot.

### Implementation for User Story 2

- [X] T012 [US2] Use the local `private-data/export_39173135.zip` through the existing import flow to prepare a representative dashboard state; keep the ZIP and extracted raw files outside `assets/previews/` and out of runtime references.
- [X] T013 [P] [US2] Capture and sanitize the Total Distance screenshot as `assets/previews/total-distance.png`, preserving realistic training-volume patterns while removing identifying labels.
- [X] T014 [P] [US2] Capture and sanitize the Heartrate vs Pace screenshot as `assets/previews/heartrate-pace.png`, preserving realistic effort/pace patterns while removing identifying labels.
- [X] T015 [P] [US2] Capture and sanitize the Equipment screenshot as `assets/previews/equipment.png`, generalizing equipment labels and retaining plausible mileage context.
- [X] T016 [P] [US2] Capture and sanitize the Equipment Timeline screenshot as `assets/previews/equipment-timeline.png`, generalizing names and dates that could identify the owner.
- [X] T017 [P] [US2] Capture and sanitize the Personal Bests screenshot as `assets/previews/personal-bests.png`, preserving realistic sport progression without personal identifiers.
- [X] T018 [P] [US2] Capture and sanitize the Heatmap screenshot as `assets/previews/heatmap.png`, cropping or generalizing exact route geometry while retaining the route-density concept.
- [X] T019 [P] [US2] Capture and sanitize the Distributions screenshot as `assets/previews/distributions.png`, preserving realistic metric distributions and readable units.
- [X] T020 [P] [US2] Capture and sanitize the Workout Time screenshot as `assets/previews/workout-time.png`, preserving realistic duration patterns and readable sport context.
- [X] T021 [US2] Complete `specs/033-landing-visualization-previews/asset-review.md` for all eight assets and approve only screenshots that contain no raw export content, personal names, account identifiers, or exact identifying routes.

**Checkpoint**: All eight public preview assets are derived, coherent, readable, and privacy-approved.

## Phase 5: User Story 3 - Preserve Landingpage Usability and Privacy (Priority: P2)

**Goal**: Keep the expanded preview area responsive, actionable, and independent of a visitor's local export.

**Independent Test**: Open the landing page without a selected file at desktop and 390px mobile widths, verify every card and asset, and confirm the private ZIP is not requested or referenced.

### Tests for User Story 3

- [X] T022 [US3] Add source assertions in `__tests__/preview-assets.test.js` that preview assets are referenced as static public paths and that the existing import gate remains present for data-dependent card actions.
- [X] T023 [US3] Add responsive-content assertions in `__tests__/preview-assets.test.js` for preview-grid classes, card image sizing, readable titles, and absence of private ZIP references in landing markup.

### Implementation for User Story 3

- [X] T024 [US3] Update preview-card image sizing, alt text, and responsive classes in `index.html` so all eight screenshots remain legible without clipping or horizontal overflow at mobile widths.
- [X] T025 [US3] Preserve the existing `previewGateModal` and import guidance behavior in `index.html` for Workout Time, Distributions, and all existing dashboard preview actions.

**Checkpoint**: The landing page works without a visitor export, remains responsive, and exposes only approved static assets.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate privacy, regression safety, asset loading, and end-to-end presentation.

- [X] T026 [P] Verify `private-data/export_39173135.zip` remains ignored by `.gitignore` and is absent from `assets/previews/` and all public HTML references.
- [X] T027 [P] Verify every screenshot in `assets/previews/` has stable card-suitable dimensions, readable content, and no accidental personal identifiers using `specs/033-landing-visualization-previews/asset-review.md`.
- [X] T028 Run `npm test -- --runInBand __tests__/preview-assets.test.js __tests__/index-script-syntax.test.js` and resolve failures in `index.html`, `__tests__/preview-assets.test.js`, or preview asset references.
- [X] T029 Run the complete root Jest suite from `package.json` with `npm test` to confirm existing dashboard parsing, tab navigation, and visualization behavior remain intact.
- [X] T030 Start `python -m http.server` and verify `index.html` at desktop and 390px mobile widths without importing data; confirm all eight cards load, new cards open the existing import gate, and no horizontal overflow occurs.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001-T002 start immediately and can proceed in parallel because they create separate asset/test surfaces.
- **Foundational (Phase 2)**: T003-T004 depend on T002 and block user-story work.
- **User Stories (Phases 3-5)**: US1 depends on T003-T004; US2 depends on the card asset paths established by US1; US3 depends on the integrated cards and approved assets from US1/US2.
- **Polish (Phase 6)**: T026-T030 depend on the completed card integration, asset review, and focused tests.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 and is the MVP; it establishes the eight card/asset references.
- **User Story 2 (P1)**: Depends on the asset paths from US1 but can capture the eight files in parallel after T012.
- **User Story 3 (P2)**: Depends on US1 and US2 so responsive checks cover the final card and asset set.

### Parallel Opportunities

- T001 and T002 can run in parallel because they affect different paths.
- T013-T020 can run in parallel after T012 because each task produces a different screenshot file; T021 remains sequential as the consolidated review.
- T026 and T027 can run in parallel with each other after asset generation.
- T028, T029, and T030 are sequential validation steps: focused tests, full regression, then browser verification.

## Parallel Example: User Story 1

```text
Task: "Add Workout Time card contract assertions in __tests__/preview-assets.test.js"
Task: "Add Distributions card contract assertions in __tests__/preview-assets.test.js"
Task: "Prepare Workout Time and Distributions card markup in index.html"
```

## Parallel Example: User Story 2

```text
Task: "Capture and sanitize assets/previews/total-distance.png"
Task: "Capture and sanitize assets/previews/heartrate-pace.png"
Task: "Capture and sanitize assets/previews/equipment.png"
Task: "Capture and sanitize assets/previews/equipment-timeline.png"
Task: "Capture and sanitize assets/previews/personal-bests.png"
Task: "Capture and sanitize assets/previews/heatmap.png"
Task: "Capture and sanitize assets/previews/distributions.png"
Task: "Capture and sanitize assets/previews/workout-time.png"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T004 to establish the asset/test catalog.
2. Complete T005-T009 to add identifiable cards for all eight visualizations.
3. Run the focused card-contract checks and confirm the two new cards preserve the import gate.
4. Stop and validate discoverability before the screenshot production pass.

### Incremental Delivery

1. Deliver US1: complete eight-card landing coverage.
2. Deliver US2: generate, sanitize, and approve all eight realistic screenshots.
3. Deliver US3: finalize responsive and privacy-safe runtime behavior.
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
- The private ZIP is a local preparation input only; it must never be copied to public assets or referenced by landing-page runtime code.