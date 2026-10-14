# Tasks: Choose Export Download Location

**Input**: Design documents from `specs/057-export-download-location/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), and [contracts/export-download-ui.md](./contracts/export-download-ui.md)

**Organization**: Tasks are grouped by user story. The repository constitution requires focused automated verification for dashboard behavior, so this plan includes tests before the implementation task.

## Phase 1: Setup

**Purpose**: Confirm existing static-app structure and avoid unnecessary infrastructure.

No setup tasks are required: Jest and all browser/runtime dependencies already exist; this feature adds no package, build step, service, or script tag.

## Phase 2: Foundational

**Purpose**: Shared blocking prerequisites.

No foundational tasks are required. The current export preview state and download entry point already provide the shared integration surface.

---

## Phase 3: User Story 1 - Choose where an export is saved (Priority: P1) 🎯 MVP

**Goal**: Let users save the current preview PNG to a chosen location where the browser permits; preserve browser-download fallback, quiet cancellation, clear write-failure feedback, and retry.

**Independent Test**: From an export preview, confirm a destination and verify the selected file is a valid PNG matching the preview; separately cancel and verify no save/fallback occurs and retry remains possible; simulate unavailable picker and write failure to verify fallback/error behavior.

### Tests for User Story 1

- [X] T001 [US1] Add focused tests in `__tests__/dashboard-export-download.test.js` that load `src/dashboard-export.js` in a Node VM harness and verify picker invocation during the Download action, suggested PNG filename and MIME type, writing the existing preview image, `AbortError` cancellation without fallback/error, unavailable-picker fallback with notice, write-failure feedback, and a fresh retry.

### Implementation for User Story 1

- [X] T002 [US1] Update `downloadExportedImage()` in `src/dashboard-export.js` to invoke the browser save-location picker directly from the user click when available, write the existing preview PNG using its suggested filename, silently retain the preview on user cancellation, report genuine write failures while allowing retry, and use the existing anchor download plus a location-unavailable notice when destination selection cannot be used.

**Checkpoint**: The shared Download action works independently for every export tile; preview image content and target-specific PNG names remain unchanged.

---

## Phase 4: Polish & Cross-Cutting Verification

**Purpose**: Confirm focused regression coverage and end-to-end behavior without changing export composition or privacy boundaries.

- [X] T003 Run the focused suites documented in `specs/057-export-download-location/quickstart.md` (`__tests__/dashboard-export-download.test.js`, `__tests__/export-utils.test.js`, and `__tests__/index-script-syntax.test.js`); resolve any regression before completion.
- [X] T004 Validate picker confirmation/cancel/retry, unavailable-picker fallback, and local-only PNG behavior with the focused tests and an integrated browser smoke test using a stubbed picker; resolve any failure using the manual scenarios in `specs/057-export-download-location/quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No work required; existing project setup is sufficient.
- **Foundational (Phase 2)**: No work required; the export preview/download integration already exists.
- **User Story 1 (Phase 3)**: Independent and the only user story; test task T001 precedes implementation task T002.
- **Polish (Phase 4)**: Depends on T001 and T002; run automated and manual validation after implementation.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on another story; it is the MVP.

### Dependency Graph

```text
T001 → T002 → T003
             └→ T004
```

### Parallel Opportunities

- No parallel implementation tasks are identified: the focused tests and implementation touch different files, but test-first verification makes T002 depend on T001; final validation depends on both.

## Parallel Example: User Story 1

```text
No within-story parallel work is recommended. Implement T001 first, confirm the tests fail for the current anchor-only behavior, then complete T002.
```

## Implementation Strategy

### MVP First (User Story 1)

1. Confirm no setup/foundation work is needed.
2. Add and run the focused failing tests in T001.
3. Implement the user-click save picker, cancellation/error distinction, fallback, and retry in T002.
4. Complete T003 and T004; confirm the saved PNG matches the preview and remains local.

## Notes

- Every task uses the required checkbox, sequential ID, optional parallel marker, story label where applicable, and exact file path.
- No new test framework or dependency is warranted; keep dashboard orchestration in the existing classic script.
- A user-cancelled picker is not an unsupported-picker condition and must not trigger the fallback download.
- Automated/browser validation used a stubbed save picker; the native OS file dialog remains browser-controlled and was not opened during this session. Use the real chooser steps in `quickstart.md` for final manual confirmation.