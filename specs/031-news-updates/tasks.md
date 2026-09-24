---

description: "Task list for the News Updates Page"
---

# Tasks: News Updates Page

**Input**: Design documents from `specs/031-news-updates/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ui-contract.md](contracts/ui-contract.md), [quickstart.md](quickstart.md)

**Tests**: Focused HTML contract tests are included because the implementation plan and project constitution require narrow validation for user-visible behavior.

**Organization**: Tasks are grouped by user story so each increment can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the focused test surface while preserving the existing static-file project shape.

- [X] T001 Create the feature-specific HTML contract test file at `__tests__/news-page.test.js` using the repository's existing `fs`, `path`, and Jest conventions.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Provide shared document-loading helpers needed by the story-specific contract checks.

- [X] T002 Add reusable HTML-loading helpers in `__tests__/news-page.test.js` for `index.html` and `news.html`, keeping assertions independent of a browser DOM runtime.

**Checkpoint**: The static HTML test surface is ready; user-story implementation can proceed.

## Phase 3: User Story 1 - Navigate to News (Priority: P1) 🎯 MVP

**Goal**: Make the News area discoverable from the existing site header and directly reachable as a standalone page.

**Independent Test**: Run the US1 contract assertions and open the platform from a static server; the header must expose a `News` link that opens `news.html`, and the News page must link back to `index.html`.

### Tests for User Story 1

- [X] T003 [US1] Add contract assertions in `__tests__/news-page.test.js` that `index.html` contains a visible `News` link targeting relative `news.html`, and `news.html` contains keyboard-reachable relative back navigation to `index.html`.

### Implementation for User Story 1

- [X] T004 [US1] Add the visible header anchor labeled `News` with relative target `news.html` to the existing header in `index.html` without changing dashboard status behavior.
- [X] T005 [US1] Create the standalone `news.html` document shell with a TriAnalytica News document title, one primary News heading, and native-link back navigation to `index.html`.

**Checkpoint**: A visitor can discover and open the News page without importing Strava data, and can return to the dashboard.

## Phase 4: User Story 2 - Read the Alpha Launch Article (Priority: P1)

**Goal**: Publish a readable first article that communicates the alpha launch and explicitly invites athlete feedback.

**Independent Test**: Open `news.html` directly and verify the first semantic article has a title, visible publication context, readable body paragraphs, and the required alpha-launch and feedback concepts.

### Tests for User Story 2

- [X] T006 [US2] Add contract assertions in `__tests__/news-page.test.js` for one semantic article containing an article heading, visible publication context, and the concepts `alpha`, fellow athletes, feedback, suggestions, and wishes.

### Implementation for User Story 2

- [X] T007 [US2] Add the first News Article markup to `news.html` with a required article heading, visible publication context identifying the first published update, and readable body paragraphs announcing the alpha launch.
- [X] T008 [US2] Add the approved feedback invitation wording to the article body in `news.html`, stating that the author is happy if the platform interests fellow athletes and explicitly welcoming feedback, suggestions, and wishes.

**Checkpoint**: The initial article independently delivers the alpha announcement and the requested invitation for responses.

## Phase 5: User Story 3 - Recognize the News Area as Ongoing (Priority: P2)

**Goal**: Present the article as part of a clearly identified News collection that can receive future development updates through the same page.

**Independent Test**: Inspect `news.html` and verify that the page identity, article collection, and individual article semantics distinguish the existing update without claiming unpublished articles exist.

### Tests for User Story 3

- [X] T009 [US3] Add contract assertions in `__tests__/news-page.test.js` that `news.html` exposes a News page description, an ordered published-article collection, and exactly one currently published article.

### Implementation for User Story 3

- [X] T010 [US3] Organize published content in `news.html` under a clearly identified article collection with the first article represented as an individual semantic `article` entry.
- [X] T011 [US3] Add page and article metadata in `news.html` that identifies development updates and avoids implying additional unpublished articles are available.

**Checkpoint**: Future articles can be added as additional entries without changing the header link or navigation destination.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ensure responsive, accessible, documented, and verified delivery across all stories.

- [X] T012 [P] Add responsive and readable styling in `news.html` so header, page heading, article heading, publication context, and body content fit supported narrow and wide viewports without horizontal scrolling.
- [X] T013 [P] Add semantic heading order, descriptive link text, and keyboard-reachable native navigation in `news.html` while preserving the UI contract in `specs/031-news-updates/contracts/ui-contract.md`.
- [X] T014 Update `README.md` with the public News page entry point and the first alpha-launch article's feedback invitation, keeping privacy wording precise about local file processing.
- [X] T015 Run the focused validation command from `specs/031-news-updates/quickstart.md` and resolve any failures in `__tests__/news-page.test.js`, `index.html`, or `news.html`.
- [X] T016 Run the complete root Jest suite with `npm test` after the focused checks pass, confirming existing dashboard behavior remains intact.
- [X] T017 Start `python -m http.server`, manually verify News navigation and article reading at desktop and narrow mobile viewport sizes, and record any required markup fixes in `news.html` or `index.html`.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 starts immediately.
- **Foundational (Phase 2)**: T002 depends on T001 and blocks story implementation.
- **User Stories (Phases 3-5)**: Each story depends on T002; US2 depends on the `news.html` shell from T005, while US3 depends on the article structure from T007.
- **Polish (Phase 6)**: T012-T017 depend on the relevant story implementations; T015 and T016 must run after T003, T006, and T009 assertions and their implementation tasks are complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after T002; no dependency on another user story.
- **User Story 2 (P1)**: Depends on T005 from US1 because the article is published in `news.html`; its article contract and copy tasks are otherwise independently testable.
- **User Story 3 (P2)**: Depends on T007 from US2 because it organizes the already-published article; it does not require a new navigation destination.

### Parallel Opportunities

- T001 and repository-level planning review can run in parallel because T001 only creates the test surface.
- After T002, T003 and initial US1 markup work can be prepared in parallel, but T003 must be completed before implementation validation.
- Within US2, T006 can be written in parallel with copy review for T008; T007 must create the article container before T008 inserts its final body content.
- Within the final phase, T012, T013, and T014 touch different concerns/files and can run in parallel after the story structures exist.
- T015, T016, and T017 are sequential validation steps: focused Jest, full Jest, then browser verification.

## Parallel Example: User Story 1

```text
Task: "Add the News-link contract assertions in __tests__/news-page.test.js"
Task: "Add the News header anchor in index.html"
Task: "Create the news.html document shell and back link"
```

## Parallel Example: User Story 2

```text
Task: "Add the alpha article contract assertions in __tests__/news-page.test.js"
Task: "Review and prepare the approved alpha-launch article copy for news.html"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T002 to establish the static HTML contract surface.
2. Complete T003-T005 to add the header link and standalone News page.
3. Run the US1-focused assertions and browser navigation check.
4. Stop and validate the discoverability MVP before adding article content.

### Incremental Delivery

1. Add US1 and validate navigation.
2. Add US2 and validate the alpha-launch article independently.
3. Add US3 and validate the ongoing News collection structure.
4. Complete responsive/accessibility polish and full regression validation.

### Validation Commands

```powershell
npm test -- --runInBand __tests__/news-page.test.js __tests__/index-script-syntax.test.js
npm test
python -m http.server
```

## Notes

- Every task uses the required `- [ ] T###` checklist format.
- Story tasks include exactly one `[US#]` label and use concrete repository paths.
- The implementation adds no API, database, authentication, CMS, or new dependency.