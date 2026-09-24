---

description: "Task list for TriAnalytica social share branding and favicon assets"
---

# Tasks: Social Share Branding & Favicons

**Input**: Design documents from `/specs/035-social-share-branding/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/head-metadata.md](./contracts/head-metadata.md), [quickstart.md](./quickstart.md)

**Tests**: Verification tasks are included because the feature specification requires direct asset checks, metadata inspection, and preservation of the existing automated test suite.

**Organization**: Tasks are grouped by user story. Each story has an independent validation criterion.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing static-app structure and prepare the supplied binary assets without adding dependencies or a build step.

- [X] T001 Verify `index.html` is the canonical static entry point and confirm no Vite/React/layout metadata generator exists in `package.json`, `index.html`, or `src/`
- [X] T002 [P] Verify the supplied branded preview image and circular emblem source files (`assets/social-preview.png` and `assets/Square Logo.png`) are available locally
- [X] T003 [P] Verify the target asset filenames and GitHub Pages production paths against `specs/035-social-share-branding/data-model.md` and `specs/035-social-share-branding/contracts/head-metadata.md`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the static files that both the share-preview and favicon stories depend on.

- [X] T004 Copy the supplied branded artwork to `assets/social-preview.png` and resize it to the approved 1200x630 output dimensions
- [X] T005 [P] Create `favicon.ico` from the circular TriAnalytica emblem source in `assets/Square Logo.png`, including a broad-compatibility favicon representation and no wide wordmark
- [X] T006 [P] Create `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180x180), `android-chrome-192x192.png` (192x192), and `android-chrome-512x512.png` (512x512) from the circular emblem source in `assets/Square Logo.png`
- [X] T007 Verify the new root assets exist, are non-empty, have the required PNG/ICO signatures, and have the exact dimensions specified in `specs/035-social-share-branding/data-model.md`

**Checkpoint**: Static source assets are present and verified; user-story implementation can proceed.

## Phase 3: User Story 1 - Branded preview when sharing the site link (Priority: P1) 🎯 MVP

**Goal**: Link-preview scrapers receive the TriAnalytica title, product description, and the full branded 1200x630 image from the production URL.

**Independent Test**: Inspect the generated/local HTML and request `assets/social-preview.png`; confirm the exact Open Graph/Twitter values and a valid 1200x630 PNG. After deployment, confirm HTTP 200 at `https://dennis-e.github.io/Triathlon/assets/social-preview.png` and inspect the production URL in a link-preview debugger.

### Tests for User Story 1

- [X] T008 [P] [US1] Add focused metadata and asset assertions to `__tests__/preview-assets.test.js` for one canonical title/description, the required Open Graph/Twitter values, the explicit `https://dennis-e.github.io/Triathlon/` social URLs, absence of old `og:image` values, and existence/dimensions of `social-preview.png`

### Implementation for User Story 1

- [X] T009 [US1] Add the exact canonical `<meta name="description">`, Open Graph tags, and Twitter/X card tags from `specs/035-social-share-branding/contracts/head-metadata.md` to the existing `<head>` in `index.html`, keeping exactly one effective value for each required field
- [X] T010 [US1] Ensure `og:url`, `og:image`, `og:image:secure_url`, and `twitter:image` in `index.html` use the explicit production URLs under `https://dennis-e.github.io/Triathlon/`, while leaving application asset conventions and page layout unchanged
- [X] T011 [US1] Run the focused metadata/asset test in `__tests__/preview-assets.test.js`, then run `npm test` and resolve only regressions caused by this feature

**Checkpoint**: User Story 1 is independently testable and delivers the MVP share-preview experience.

## Phase 4: User Story 2 - Recognizable browser tab / bookmark icon (Priority: P2)

**Goal**: Desktop and mobile browser surfaces use the circular TriAnalytica emblem rather than a cropped wordmark or generic icon.

**Independent Test**: Inspect the icon links in `index.html`, request each public icon path under `/Triathlon/`, and verify the rendered assets visibly use the circular emblem at their declared sizes.

### Implementation for User Story 2

- [X] T012 [US2] Add the favicon and Apple touch icon `<link>` elements to the existing `<head>` in `index.html` using `/Triathlon/favicon.ico`, `/Triathlon/favicon-32x32.png`, `/Triathlon/favicon-16x16.png`, and `/Triathlon/apple-touch-icon.png`
- [X] T013 [US2] Add or update the icon manifest reference only if the existing application architecture already uses a manifest; otherwise leave layout/runtime files unchanged while retaining the Android icon files as public static assets
- [X] T014 [US2] Extend `__tests__/preview-assets.test.js` with assertions that every declared favicon path is `/Triathlon/`-scoped, every required icon file exists, and no favicon link references the wide wordmark asset
- [X] T015 [US2] Run the focused favicon assertions and `npm test`, then manually validate the browser tab and mobile/home-screen icon using the local server described in `specs/035-social-share-branding/quickstart.md`

**Checkpoint**: User Stories 1 and 2 work independently; all browser/app icon assets resolve under the GitHub Pages subpath.

## Phase 5: User Story 3 - No duplicate or conflicting metadata (Priority: P3)

**Goal**: The canonical HTML entry point contains one unambiguous value for each title, description, and social metadata field, with no legacy preview image reference.

**Independent Test**: Parse or inspect `index.html` and count exactly one `<title>`, one description, one `og:title`, one `og:description`, one `og:url`, one `og:image`, one `twitter:card`, and one `twitter:image`.

### Implementation for User Story 3

- [X] T016 [US3] Audit `index.html` for duplicate title/description/Open Graph/Twitter tags and remove only conflicting metadata while preserving the requested canonical values from `specs/035-social-share-branding/contracts/head-metadata.md`
- [X] T017 [US3] Add duplicate-count and legacy-URL checks to `__tests__/preview-assets.test.js`, including the invariant that no obsolete `og:image` value remains
- [X] T018 [US3] Run `npm test` and confirm all existing suites covering `__tests__/` remain green without application behavior changes

**Checkpoint**: All three user stories are independently verifiable and the page has one canonical metadata source.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the deployed public surface and record no unrelated changes.

- [ ] T019 [P] Validate local asset responses and dimensions with the scenarios in `specs/035-social-share-branding/quickstart.md`
- [ ] T020 [P] After GitHub Pages deployment, request `https://dennis-e.github.io/Triathlon/assets/social-preview.png` and each public favicon URL, confirming HTTP 200 and correct content types
- [ ] T021 Validate the deployed homepage source with an Open Graph/Twitter debugger and confirm title `TriAnalytica`, the requested description, the full branded image, and the `/Triathlon/` base path
- [ ] T022 Review the final diff to ensure only `index.html`, the requested root assets, and feature-specific tests/documentation were changed; do not alter upload/import behavior, analytics, charts, navigation, responsive layout, or privacy behavior

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; confirms source and target conventions.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories because metadata and icon links require verified static assets.
- **User Story 1 (Phase 3)**: Depends on T004 and T007; MVP can be implemented independently of favicon work.
- **User Story 2 (Phase 4)**: Depends on T005-T007; independent of US1 metadata values except for sharing the same `<head>`.
- **User Story 3 (Phase 5)**: Depends on US1 and US2 edits to `index.html`; validates the combined canonical source.
- **Polish (Phase 6)**: Depends on all selected user stories and deployment availability for production URL checks.

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational; no dependency on US2 or US3. Suggested MVP scope.
- **US2 (P2)**: Can start after Foundational; can be developed in parallel with US1 because it primarily adds icon assets and links.
- **US3 (P3)**: Runs after US1 and US2 because it audits the combined `<head>` and prevents duplicate metadata introduced by either story.

### Within Each User Story

- US1: T008 may be written before T009/T010; implementation precedes T011 validation.
- US2: T012-T014 must be complete before T015 validation.
- US3: T016-T017 precede T018 final regression validation.

## Parallel Execution Examples

### User Story 1

```text
Task T008: Add focused metadata and social-preview assertions in __tests__/preview-assets.test.js
Task T009/T010: Update the canonical metadata in index.html
```

T008 can be prepared in parallel with T009/T010 because the test and implementation touch different files; run T011 only after both are complete.

### User Story 2

```text
Task T005: Create favicon.ico from assets/Square Logo.png
Task T006: Create the PNG icon variants from assets/Square Logo.png
Task T012: Add icon links in index.html
Task T014: Add favicon path assertions in __tests__/preview-assets.test.js
```

T005, T006, and T014 can run in parallel after the source artwork is confirmed; T012 depends on the final filenames and T015 depends on all of them.

### Cross-story

After Phase 2, US1 and US2 can be assigned to separate implementers. US3 remains the final audit because it checks the combined metadata surface.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases, including the supplied social image.
2. Implement US1 metadata and focused regression checks.
3. Run the focused test and `npm test`.
4. Deploy and validate the homepage/image URLs with a link-preview debugger.

### Incremental Delivery

1. Add US1 for the branded social-preview MVP.
2. Add US2 for browser, bookmark, Apple, and Android icon coverage.
3. Add US3 for duplicate/legacy metadata protection.
4. Run the production URL checks and final scope review.

### Format Validation

All implementation tasks use the required checklist format: `- [ ]`, sequential `T###` ID, optional `[P]` marker only for parallelizable work, required `[US#]` labels in story phases, and an explicit repository-relative file path in every task description.
