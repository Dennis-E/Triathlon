# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

# Implementation Plan: TriAnalytica Newsletter Signup

**Branch**: `055-newsletter-signup` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: [Feature specification](spec.md)

## Summary

Add a discoverable newsletter signup opportunity to the main app footer. Keep the Brevo form unloaded until the visitor explicitly opens it, then display the supplied hosted form in a responsive iframe. Keep signup submission, consent capture, validation, and confirmation within Brevo. Update the bilingual privacy disclosure and provide an external-form fallback. No application backend or newsletter subscriber storage is needed.

## Technical Context

**Language/Version**: HTML5 and browser JavaScript supported by current evergreen browsers; no compilation step.

**Primary Dependencies**: Existing static page and browser APIs; Brevo-hosted form at the user-provided `b7607f4e.sibforms.com` URL. No new package dependency.

**Storage**: None in TriAnalytica. Email, consent, and subscription state remain in the Brevo-managed form/service.

**Testing**: Jest 30 in the Node environment; HTML contract assertions and isolated DOM-mock interaction tests, plus a manual browser/network smoke test.

**Target Platform**: Static website served over HTTP(S), desktop and mobile browsers.

**Project Type**: Static browser application.

**Performance Goals**: Before a deliberate form-open action, the newsletter feature makes zero requests to the Brevo form origin. After the action, the form is requested once and remains usable at mobile widths.

**Constraints**: Preserve the no-bundler static deployment; do not send training files/activity data; disclose the external connection before loading the form; do not infer successful subscription from iframe load; preserve existing bilingual privacy modal behavior.

**Scale/Scope**: One footer signup entry point and one lazily created form iframe on the main app page; no new API, account system, local subscriber data, or campaign management.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery — PASS**: Changes stay in `index.html` and static test/documentation artifacts; no bundler or server dependency is added.
- **II. Dual-Target Reusable Modules — PASS / NOT APPLICABLE**: No reusable data/visualization utility is introduced; the small DOM interaction belongs to the existing page orchestration.
- **III. Narrowest-Scope Test-First Verification — PASS**: Add focused Jest coverage and run the focused tests for the page, footer, and script syntax. No dashboard tab or API changes.
- **IV. Faithful Locale-Aware Data Parsing — PASS / NOT APPLICABLE**: No training data parsing changes.
- **V. Explicit Privacy & Network Boundaries — PASS WITH PRIVACY DISCLOSURE**: The iframe is created only after an explicit visitor action; disclose Brevo and connection metadata in German and English. No activity data is sent.
- **Dependency/runtime boundaries — PASS**: No root/API dependency boundary changes.

**Gate result before research**: PASS. No constitutional violation or unresolved specification clarification blocks planning.

## Project Structure

### Documentation (this feature)

```text
specs/055-newsletter-signup/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── newsletter-signup.md
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code (repository root)

```text
index.html                         # Footer signup UI, lazy iframe interaction, bilingual privacy disclosure
__tests__/
├── legal-footer.test.js           # Existing legal/footer assertions, extended for privacy disclosure
└── newsletter-signup.test.js      # Focused lazy-load, fallback, and form-contract tests
```

**Structure Decision**: Keep this feature in the static page that owns footer/modal markup and add a narrow Node/Jest test file. Do not add a new source module for a single DOM-only event flow or modify the analysis API.

## Phase 0: Research

Research decisions and alternatives are recorded in [research.md](research.md). All specification clarifications have been resolved; the only release-time provider configuration check is verifying that Brevo requires explicit newsletter consent and presents its own validation/confirmation messaging.

## Phase 1: Design & Contracts

- [Data model](data-model.md): ephemeral page/form lifecycle and provider-owned subscription data.
- [UI contract](contracts/newsletter-signup.md): visitor interaction, lazy-request boundary, provider responsibility, and fallback behavior.
- [Quickstart](quickstart.md): focused automated and manual end-to-end validation.

### Post-design Constitution Check

- Static-only delivery, no new runtime dependencies, and no backend: **PASS**.
- Provider-origin request is user-action-gated; data disclosures are bilingual and limited to observed data flow: **PASS**, subject to pre-release review of Brevo account settings and applicable privacy disclosures.
- Testability and focused validation are included in the design: **PASS**.

**Gate result after design**: PASS. No plan-stage violations require complexity justification.

## Complexity Tracking

No constitution violations or additional architectural projects are introduced.
