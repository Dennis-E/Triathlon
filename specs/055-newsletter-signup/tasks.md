# Tasks: TriAnalytica Newsletter Signup

**Input**: Design documents from [specs/055-newsletter-signup](.)

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/newsletter-signup.md](contracts/newsletter-signup.md), [quickstart.md](quickstart.md)

**Tests**: Included because the implementation plan specifies focused Jest and browser/network verification.

**Organization**: Tasks are grouped by the two user stories in [spec.md](spec.md). Setup and foundational work are empty because the existing static app, test runner, and footer/privacy infrastructure already provide the required foundation; this feature adds no shared server or package dependencies.

## Phase 1: Setup

**Purpose**: Initialize project structure and dependencies.

No setup tasks are required; the static app and Jest project are already initialized.

---

## Phase 2: Foundational

**Purpose**: Shared blocking infrastructure for all stories.

No foundational tasks are required; the work needs no new shared service, dependency, or storage.

**Checkpoint**: Existing app foundation is ready; story work can proceed. Tasks touching `index.html` are ordered to avoid edit conflicts.

---

## Phase 3: User Story 1 - Discover and join the newsletter (Priority: P1) 🎯 MVP

**Goal**: Visitors can find the signup opportunity, intentionally open the Brevo form, and use Brevo's validation/confirmation flow or its direct-link fallback.

**Independent Test**: Verify that the initial page has no Brevo form iframe/request source; activating the signup action loads exactly one responsive iframe to the supplied fixed HTTPS URL and leaves an accessible direct link. Verify that the application does not infer subscription success from iframe load.

### Tests for User Story 1

- [X] T001 [P] [US1] Add focused page/interaction assertions in `__tests__/newsletter-signup.test.js` for the footer action, no Brevo iframe or remote source before activation, fixed provider URL after activation, single-iframe behavior, and direct-link fallback.

### Implementation for User Story 1

- [X] T002 [US1] Add an accessible newsletter invitation, Brevo connection notice, privacy-policy link, and explicit open-form action to the footer in `index.html`; on activation create or reveal one responsive iframe using the fixed URL in `contracts/newsletter-signup.md`, explain that the embed may be unavailable and show its direct-link fallback, and never display an app-generated subscription-success state.
- [X] T003 [US1] Run the focused newsletter/signup and inline-script tests documented in `quickstart.md` and fix any regressions in `index.html` or `__tests__/newsletter-signup.test.js`.

**Checkpoint**: The P1 signup journey works independently, and no provider form request is initiated before an explicit action.

---

## Phase 4: User Story 2 - Understand signup and data handling (Priority: P2)

**Goal**: Visitors can understand the Brevo data flow, distinguish newsletter details from local training files, and access the disclosure in either privacy-policy language.

**Independent Test**: Verify the privacy modal discloses Brevo and the form-triggered connection in German and English, links to the existing privacy information from the signup invitation, and makes no claim that training files are sent.

### Tests for User Story 2

- [X] T004 [P] [US2] Add German/English Brevo recipient and newsletter data-flow assertions in `__tests__/legal-footer.test.js`, including separation from imported training data and reachability of the privacy policy from the signup invitation.

### Implementation for User Story 2

- [X] T005 [US2] Update both language sections of the privacy policy in `index.html` to identify Brevo, explain that opening the form creates a direct provider connection and may expose technical connection data, describe email/consent processing for signup, and state that this feature does not send training files or activity data.
- [X] T006 [US2] Run `__tests__/legal-footer.test.js` and `__tests__/index-script-syntax.test.js` using the command in `quickstart.md`; correct any mismatched policy copy or page-script issues in `index.html` and `__tests__/legal-footer.test.js`.

**Checkpoint**: The privacy and data-handling journey is testable independently from successful newsletter enrollment.

---

## Phase 5: Polish & Cross-Cutting Validation

**Purpose**: Verify responsive behavior, external-provider configuration, and the complete feature contract.

- [X] T007 Perform the browser and network scenarios in `quickstart.md`; verify no request to `sibforms.com` before activation, one request after activation, mobile usability, and the direct-link fallback, then record the outcome in `quickstart.md`.
- [ ] T008 Verify Brevo duplicate-address and valid-submission/confirmation behavior, and review its legal role and account-specific data terms before making legal-role claims; record these remaining results in `specs/055-newsletter-signup/quickstart.md` (required affirmative newsletter consent and invalid-input feedback are already verified).
- [X] T009 Run the complete focused test command from `quickstart.md` and confirm the contract, legal footer, and inline-script suites pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; existing project initialization is sufficient.
- **Foundational (Phase 2)**: No tasks; no shared infrastructure is needed.
- **User Stories (Phase 3+)**: Depend only on the existing app foundation. User stories are functionally independent. Because both story implementations edit `index.html`, integrate T002 and T005 serially to avoid merge/edit conflicts; their separate test-file additions may proceed in parallel.
- **Polish (Phase 5)**: Depends on both stories being implemented and their focused tests passing.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other stories; MVP signup flow.
- **User Story 2 (P2)**: No behavioral dependency on US1; its policy disclosure can be validated separately. Final integration shares `index.html` with US1, so implementation edits should be serial.

### Within Each User Story

- Add the story's assertions before the corresponding implementation.
- Implement the story's page/policy behavior only after its assertions are in place.
- Run the focused test command before marking the story complete.
- Provider-side consent and confirmation behavior must be verified in Brevo; it cannot be inferred from the embed URL or iframe `load` event.

### Parallel Opportunities

- T001 and T004 can be authored in parallel because they modify different test files.
- The US1 and US2 workstreams can be developed independently, but their `index.html` implementation edits should be integrated sequentially.
- Within the US1 phase, T002 depends on T001; T003 follows T002.
- Within the US2 phase, T005 depends on T004; T006 follows T005.

### Parallel Example: Story Test Setup

```text
Task: T001 in __tests__/newsletter-signup.test.js
Task: T004 in __tests__/legal-footer.test.js
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 and T002 to add failing-then-passing signup interaction coverage and the lazy Brevo form.
2. Complete T003 and verify the signup journey independently.
3. Deliver/demo the core newsletter signup experience only after confirming its privacy notice and provider consent configuration are ready for release.

### Incremental Delivery

1. Implement and validate User Story 1 as the core signup MVP.
2. Implement User Story 2 to clarify the bilingual privacy disclosure and data boundary.
3. Complete browser/network and Brevo configuration checks in Phase 5 before release.

---

## Notes

- Every task follows `- [ ] Tnnn [P?] [Story?] Description with file path`; story tasks carry the required story label.
- `[P]` appears only on independent work in distinct test files.
- The app cannot inspect the cross-origin form response; an iframe load event is not a subscription result.
- No changes are planned to the analysis API, training-data pipeline, or dependency manifests.
