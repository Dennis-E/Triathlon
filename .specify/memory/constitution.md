<!--
Sync Impact Report
- Version change: 1.0.0 → 1.0.1
- Modified principles: II. Dual-Target Reusable Modules — added a clarifying paragraph
  scoping the CommonJS+`window.*` bridge requirement to data-processing/visualization
  utility modules, and explicitly exempting `src/`-located DOM-orchestration files that
  belong to `index.html`'s domain under Principle I (no behavioral or normative change to
  existing utility modules; clarification only)
- Added sections: none
- Removed sections: none
- Templates requiring follow-up: none found referencing outdated principle text
- Follow-up TODOs: TODO(RATIFICATION_DATE) — still unset, unchanged from prior version
-->

# TriAnalytica Constitution

## Core Principles

### I. Static Browser-First Delivery
The frontend MUST remain a static browser app with no bundler or build step:
`index.html` owns the UI, import flow, dashboard state, and chart rendering, and
third-party libraries are loaded via CDN script tags. Any new frontend capability
MUST work when served by a plain static file server (e.g. `python -m http.server`)
without introducing a compilation step. Rationale: this keeps local setup trivial for
non-commercial, privacy-sensitive use and avoids build-tooling drift across the
project's lifetime.

### II. Dual-Target Reusable Modules
Reusable logic MUST live under `src/` as CommonJS modules (`module.exports`) that also
attach a `window.*` global bridge, so the same code runs unmodified in Jest and in
`index.html`. Code MUST prefer pure functions and MUST NOT assume a DOM-only API
(e.g. `DOMParser`) when a regex- or string-based approach keeps the module usable in
Node tests; `src/tab-navigation.js`'s injectable-document pattern is the reference
implementation. Rationale: this is what makes the codebase testable without adding a
browser test runner or bundler.

This principle applies to data-processing/visualization *utility* modules (e.g.
`equipment-utils.js`, `heatmap-utils.js`). Files under `src/` whose sole purpose is DOM
orchestration on behalf of `index.html` (wiring globals, event listeners, chart bootstrap)
remain part of what Principle I assigns to `index.html`'s domain and MAY stay as classic,
non-modular global scripts, provided they contain no independently reusable business logic.

### III. Narrowest-Scope Test-First Verification (NON-NEGOTIABLE)
Every change to reusable modules or dashboard behavior MUST be validated by running the
narrowest relevant test command before considering the work done: root tests via
`npm test` (Jest, `node` environment, not `jsdom`), and API tests from `services/api`
via `npm test` when `services/api` code changes. Changing a dashboard tab MUST update,
in the same change, the tab constants/IDs in `src/tab-navigation.js`, the matching
markup and inline dispatch logic in `index.html`, and the related tab-navigation tests.
Rationale: the absence of a jsdom environment and the split test suites make it easy to
silently break the other surface; explicit, scoped verification is the only guard.

### IV. Faithful Locale-Aware Data Parsing
CSV and GPX processing MUST preserve existing Strava data semantics: support German and
English column names, keep the established duplicate `Distance`/`Distanz` meaning
(first column = kilometers, second = meters), and normalize sports strictly to `Run`,
`Bike`, or `Swim` — unknown sports MUST NOT be silently reclassified. GPX parsing MUST
continue to use regex (not `DOMParser`) so the same parsing code runs in Node tests and
the browser. Rationale: these are the load-bearing assumptions of every visualization;
silent misclassification or format drift corrupts analytics without a visible error.

### V. Explicit Privacy & Network Boundaries
Raw Strava files and personal exports MUST stay local to the browser and out of version
control; `test-data/` MUST NOT be assumed to contain real fixtures — use synthetic or
explicitly supplied local data for tests. Product and UI copy MUST be precise that
"local file processing" describes import/parsing only, not a no-network-requests
guarantee for the whole app. Any change touching the analysis API (`services/api/`)
MUST preserve its explicit origin checks, client-key validation, rate-limiting, and
Firestore behavior. Rationale: users trust this tool with personal training data; both
the codebase and its public-facing wording must stay accurate about what leaves the
browser.

## Repository & Dependency Boundaries

The repository has three independently-scoped dependency/runtime surfaces that MUST
NOT be conflated: the root static app and its Jest suite (`__tests__/`, root
`package.json`), the standalone Node CLI (`scripts/relevant-export-extractor.js`), and
the Express service in `services/api/` with its own `package.json`, dependencies,
tests, and runtime entrypoint. Root code MUST NOT depend on `services/api`
dependencies, and vice versa. Public APIs of existing reusable modules (their exported
function names and signatures) MUST be preserved unless a change explicitly intends a
breaking update, in which case all call sites in `index.html` and the module's tests
MUST be updated together.

## Development Workflow

Changes MUST be focused: touch only the files needed for the requested behavior and
avoid speculative refactors. After any edit to `src/`, `index.html`, or
`services/api/src/`, run the narrowest relevant test command (root `npm test` or
`services/api` `npm test`) and resolve failures before considering the change complete.
Documentation updates (README, `docs/IMPORT_FEATURE.md`) SHOULD accompany
user-observable behavior changes but MUST NOT be used as a substitute for the code or
test changes themselves.

## Governance

This constitution supersedes other informal practices for this repository, including
AGENTS.md, where they conflict; AGENTS.md remains the fast-reference summary and MUST
be kept consistent with this document. Amendments are made by editing this file: they
MUST update the Sync Impact Report comment, bump the version per the policy below, and
set `Last Amended` to the date of the change. Versioning follows semantic versioning
for governance text: MAJOR for backward-incompatible principle removals or
redefinitions, MINOR for new or materially expanded principles/sections, PATCH for
clarifications and wording fixes. Reviewers MUST treat a pull request that violates a
Core Principle as blocking unless the constitution is amended first; complexity or
deviation MUST be justified in the PR description.

**Version**: 1.0.1 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date not recorded | **Last Amended**: 2026-09-22
