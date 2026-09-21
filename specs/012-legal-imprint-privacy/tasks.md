---

description: "Task list template for feature implementation"
---

# Tasks: Legal Imprint and Privacy Notice

**Input**: Design documents from `/specs/012-legal-imprint-privacy/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md) (contracts/ intentionally skipped — no external interface)

**Tests**: Included — the spec's Independent Test criteria and Success Criteria are directly testable via Jest, consistent with Constitution III (Narrowest-Scope Test-First Verification).

**Organization**: Tasks are grouped by user story (US1 = Impressum, US2 = Datenschutzerklärung, US3 = cross-tab reachability) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single static web app (per plan.md): `index.html` at repository root, Jest tests under `__tests__/`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a known-good baseline before touching `index.html`

- [X] T001 Run `npm test` from the repository root to confirm the existing suite is green before making changes (no code change; baseline check only)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the shared, always-visible footer container that both the Impressum (US1) and Datenschutzerklärung (US2) content will live inside, placed outside all tab panels so it satisfies US3 by construction

**⚠️ CRITICAL**: No user-story content task can begin until this phase is complete

- [X] T002 Add two `<details>` subsections (Impressum and Datenschutzerklärung) to `index.html`. **Deviation**: a `<footer>` landmark already existed at body level (outside all `TAB_PANEL_IDS` panels); extended it in place instead of creating a new empty one, styled with existing Tailwind utility classes
- [X] T003 [P] Create the test file skeleton `__tests__/legal-footer.test.js` that reads `index.html` as raw text (regex/string assertions, following the style of `__tests__/index-script-syntax.test.js`) and asserts a `<footer>` element exists

**Checkpoint**: Footer scaffold exists in `index.html` and is covered by a starter test — user story content phases can now begin

---

## Phase 3: User Story 1 - View legal imprint (Priority: P1) 🎯 MVP

**Goal**: Visitors can find the site operator's name, postal address, and email in the footer, with no phone number present (FR-002, FR-003)

**Independent Test**: Open the site, scroll to the footer, open the Impressum subsection, and verify owner name, address, and email are visible and no phone number appears anywhere in the footer

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T004 [P] [US1] In `__tests__/legal-footer.test.js`, add a test asserting the rendered `index.html` footer contains an "Impressum" heading plus non-empty owner name, postal address, and email text (per data-model.md Imprint Details: `ownerName`, `address`, `email` are all required, non-empty)
- [X] T005 [P] [US1] In `__tests__/legal-footer.test.js`, add a test asserting the footer contains no phone number (per data-model.md: `phone` MUST NOT be rendered) — check for absence of a `tel:` link and of digit-heavy phone-like patterns near the Impressum section

### Implementation for User Story 1

- [X] T006 [US1] In `index.html`, inside the Impressum subsection added in T002, add the owner name, postal address, and email as plain HTML text/links (`mailto:` for email) — updated with the real operator-supplied values (Dennis Eggert, Germanenstr. 6, 53175 Bonn) and the existing `myaidevproject@gmail.com` mailto already present in the footer — do not add a phone number field at all
- [X] T007 [US1] Run `npm test -- legal-footer` and confirm T004/T005 now pass

**Checkpoint**: User Story 1 (Impressum) is fully functional and independently testable

---

## Phase 4: User Story 2 - View privacy notice (Priority: P2)

**Goal**: Visitors can read a short privacy notice stating imported data is processed locally and not stored on a server, while disclosing that CDN-loaded libraries may still trigger standard network requests (FR-004, FR-005)

**Independent Test**: Open the privacy notice section independently of the Impressum and confirm it states local browser processing, no server-side storage of imported activity data, and discloses third-party/CDN network requests

### Tests for User Story 2 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T008 [P] [US2] In `__tests__/legal-footer.test.js`, add a test asserting the footer contains a "Datenschutzerklärung" heading plus text stating that imported/uploaded activity data is processed locally in the browser and is not stored on a server operated for the app
- [X] T009 [P] [US2] In `__tests__/legal-footer.test.js`, add a test asserting the privacy notice text discloses that externally loaded libraries (CDN scripts/styles) may cause standard browser/network requests

### Implementation for User Story 2

- [X] T010 [US2] In `index.html`, inside the Datenschutzerklärung subsection added in T002, write the German-language privacy notice text covering: local browser processing of imported activity data, no server-side storage of that data, and the CDN/third-party network-request disclosure (per FR-004/FR-005 and research.md content-language decision)
- [X] T011 [US2] Run `npm test -- legal-footer` and confirm T008/T009 now pass

**Checkpoint**: User Stories 1 AND 2 both work independently (Impressum and Datenschutzerklärung both visible and correct)

---

## Phase 5: User Story 3 - Access legal information from any page/tab (Priority: P3)

**Goal**: The legal footer remains reachable regardless of which dashboard tab (`TAB_ORDER` in `src/tab-navigation.js`) is currently active

**Independent Test**: Switch between all dashboard tabs and confirm the footer with Impressum/Datenschutzerklärung is present and visible on each

### Tests for User Story 3 ⚠️

> Write this test FIRST; per the Phase 2 design (footer outside `TAB_PANEL_IDS`), it is expected to pass immediately, which itself confirms the foundational placement decision was correct

- [X] T012 [US3] In `__tests__/legal-footer.test.js`, add a test that, for every tab panel id (listed locally as `TAB_PANEL_IDS`, matching `src/tab-navigation.js`), asserts the `<footer>` markup added in T002 is NOT nested inside that tab panel's element in the `index.html` source (i.e., the footer's opening tag appears in the document after all tab-panel opening tags)

### Implementation for User Story 3

- [X] T013 [US3] Run `npm test -- legal-footer` and confirm T012 passes without further `index.html` changes — passed immediately since the footer was already positioned outside every tab-panel element

**Checkpoint**: All three user stories are independently functional — footer with correct Impressum and Datenschutzerklärung content is reachable from every tab

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across the whole feature

- [X] T014 Run `npm test` (full root suite) to confirm no regression in `__tests__/tab-navigation.test.js`, `__tests__/index-script-syntax.test.js`, or any other existing suite — 317/317 tests passed
- [ ] T015 Manually execute the scenarios in [quickstart.md](./quickstart.md) (start `python -m http.server`, verify Impressum, Datenschutzerklärung, cross-tab visibility, and no-JS resilience by viewing page source) — left for user manual sign-off
- [X] T016 [P] Update docs — skipped: neither [docs/IMPORT_FEATURE.md](../../docs/IMPORT_FEATURE.md) nor [README.md](../../README.md) references footer/legal content, so no update was needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories (footer container must exist before content is added)
- **User Stories (Phase 3-5)**: All depend on Foundational (Phase 2) completion
  - US1 (Impressum) and US2 (Datenschutzerklärung) touch the same `index.html` footer but different subsections — can proceed sequentially or with care in parallel
  - US3 is a verification story that depends on the Phase 2 placement decision already being correct; it can run any time after Phase 2, independent of US1/US2 content
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### Within Each User Story

- Tests are written first and must fail before the corresponding implementation task
- Implementation task follows, then the test-run task confirms green

### Parallel Opportunities

- T003 (test skeleton) can run in parallel with T002 (markup) since both are new additions with no interdependency until T004+ needs the skeleton to exist
- T004 and T005 (both new test cases in the same file) can be written in parallel by intent but applied to the same file — treat as logically parallel, apply sequentially to avoid edit conflicts
- T008 and T009 likewise
- T016 (docs) can run in parallel with Phase 6 test tasks

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T003)
3. Complete Phase 3: User Story 1 (T004-T007)
4. **STOP and validate**: Impressum is visible, correct, and phone-free — deployable as a minimal legal-compliance MVP
5. Deploy/demo if ready

### Incremental Delivery

1. Add Phase 4 (User Story 2 / Datenschutzerklärung) → test independently → deploy/demo
2. Add Phase 5 (User Story 3 / cross-tab reachability) → test independently → deploy/demo
3. Finish with Phase 6 (Polish) → full regression → done
