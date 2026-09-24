---

description: "Task list for the Sticky News Header"
---

# Tasks: Sticky News Header

**Input**: Design documents from `specs/032-sticky-news-header/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui-contract.md](contracts/ui-contract.md), [quickstart.md](quickstart.md)

**Tests**: Focused HTML contract tests and browser viewport checks are included because the plan and project constitution require narrow validation for user-visible behavior.

**Organization**: Tasks are grouped by user story so the fixed behavior and responsive readability can be validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend the existing News-page contract surface without introducing new runtime infrastructure.

- [X] T001 Extend the existing News HTML contract test in `__tests__/news-page.test.js` with helpers/assertions for the News header and main-content relationship.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the measurable source contracts that both user stories rely on.

- [X] T002 [P] Add source-level assertions in `__tests__/news-page.test.js` that `news.html` contains a header with the existing logo and `Back to dashboard` link, and that the main content remains present below it.

**Checkpoint**: Fixed-position and responsive implementation can proceed with regression checks in place.

## Phase 3: User Story 1 - Keep News Navigation Visible (Priority: P1) 🎯 MVP

**Goal**: Keep the News header at the top of the browser viewport during vertical scrolling while preserving both navigation elements.

**Independent Test**: Open `news.html`, scroll vertically, and verify in the browser that the header's viewport top remains stable and `Back to dashboard` still targets `./index.html`.

### Tests for User Story 1

- [X] T003 [US1] Add contract assertions in `__tests__/news-page.test.js` that the News header declares top-fixed positioning, a stacking order above content, and the unchanged `./index.html` dashboard target.

### Implementation for User Story 1

- [X] T004 [US1] Update the News header element in `news.html` with fixed top positioning and an explicit stacking order above the News content, without changing the logo or dashboard link markup.
- [X] T005 [US1] Preserve the existing header visual treatment in `news.html` while ensuring the fixed header spans the available viewport width and does not alter article copy.

**Checkpoint**: After T005, the header remains visible during desktop scrolling and dashboard navigation still works.

## Phase 4: User Story 2 - Preserve Readability While Fixed (Priority: P2)

**Goal**: Keep the News content readable beneath the fixed header at the initial position and across narrow and wide viewports.

**Independent Test**: Check `news.html` at desktop and 390px-wide mobile viewports, at the top and after scrolling, and verify no content is obscured or horizontally clipped.

### Tests for User Story 2

- [X] T006 [US2] Add contract assertions in `__tests__/news-page.test.js` for a content offset below the fixed header, responsive width constraints, and preserved `News` article markup.

### Implementation for User Story 2

- [X] T007 [US2] Add sufficient top spacing to the News main content in `news.html` so the News heading and first article are not hidden behind the fixed header at page load.
- [X] T008 [US2] Keep the header and content responsive in `news.html` by preserving the existing flex behavior and preventing fixed-header-caused horizontal overflow at narrow widths.

**Checkpoint**: The fixed header remains usable without overlap, excessive blank space, or horizontal scrolling.

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Run focused and full regression checks, then verify actual browser geometry.

- [X] T009 [P] Confirm in `__tests__/news-page.test.js` that article text and the existing `Back to dashboard` destination remain unchanged apart from the intended header behavior.
- [X] T010 Run `npm test -- --runInBand __tests__/news-page.test.js` and resolve any News contract failures in `news.html` or `__tests__/news-page.test.js`.
- [X] T011 Run the complete root Jest suite with `npm test` to confirm the dashboard and existing News behavior remain intact.
- [X] T012 Start `python -m http.server`, verify fixed-header position and content visibility at desktop and 390px mobile viewports, and confirm post-scroll `Back to dashboard` navigation.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 starts immediately.
- **Foundational (Phase 2)**: T002 depends on T001 and blocks story implementation.
- **User Stories (Phases 3-4)**: US1 and US2 depend on T002; US2 can begin after the shared content/header contract exists.
- **Polish (Phase 5)**: T009-T012 depend on the relevant story implementation and focused contract tests.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after T002; no dependency on other stories. This is the MVP.
- **User Story 2 (P2)**: Can start after T002 and builds on the same `news.html` header/content elements, but is independently testable through viewport and overflow checks.

### Parallel Opportunities

- T002 can run in parallel with review of the existing `news.html` markup because it only extends the test file.
- After T002, T003 and T006 can be prepared in parallel because they add separate contract assertions in the same test file only if coordinated before implementation; implementation tasks must follow their corresponding assertions.
- T004/T005 are sequential because they both modify the same header element in `news.html`.
- T007/T008 can be implemented together after T004, but must be validated as one responsive layout change.
- T009 is parallelizable with documentation/status review because it only strengthens regression assertions.
- T010, T011, and T012 are sequential validation steps: focused Jest, full Jest, then browser checks.

## Parallel Example: User Story 1

```text
Task: "Add fixed-position and stacking-order assertions in __tests__/news-page.test.js"
Task: "Review the existing header/logo/dashboard-link markup in news.html"
```

## Parallel Example: User Story 2

```text
Task: "Add content-offset assertions in __tests__/news-page.test.js"
Task: "Prepare the responsive content spacing change in news.html"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T002 to establish the contract surface.
2. Complete T003-T005 to make the News header fixed and preserve its navigation.
3. Run the focused US1 checks and browser scroll validation.
4. Stop and validate the requested sticky-header behavior before responsive polish.

### Incremental Delivery

1. Deliver US1: fixed header and working dashboard link.
2. Deliver US2: content offset and narrow-viewport readability.
3. Complete regression and browser validation.

### Validation Commands

```powershell
npm test -- --runInBand __tests__/news-page.test.js
npm test
python -m http.server
```

## Notes

- Every task uses the required `- [ ] T###` checklist format.
- User-story tasks include exactly one `[US#]` label and a concrete repository path.
- No new module, API, dependency, dashboard change, or persisted data is required.