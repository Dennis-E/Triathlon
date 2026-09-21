# Implementation Plan: Legal Imprint and Privacy Notice

**Branch**: `012-legal-imprint-privacy` | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-legal-imprint-privacy/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a static, always-visible legal footer to `index.html` containing an "Impressum" (owner name,
postal address, email — no phone) and a short "Datenschutzerklärung" stating that imported activity
data is processed locally in the browser, not stored on a server, while disclosing that CDN-loaded
libraries may still cause standard browser/network requests. The footer is placed once at the
page/body level (outside the tab-switch panels), so it is reachable regardless of which
visualization tab (`src/tab-navigation.js`) is active, with no new JavaScript module or dependency
required — plain HTML/CSS markup, matching the project's static, no-build-step architecture.

## Technical Context

**Language/Version**: HTML5, vanilla JS (ES2017+), Tailwind utility classes already used in `index.html`

**Primary Dependencies**: None new — reuses existing CDN-loaded Tailwind CSS already present in `index.html`

**Storage**: N/A (no data persisted or collected by this feature)

**Testing**: Jest (root `npm test`, `node` environment); a lightweight regex/string-based test on `index.html` markup (consistent with `__tests__/index-script-syntax.test.js` style) to assert footer text/structure is present

**Target Platform**: Static browser app served via any static file server (e.g. `python -m http.server`)

**Project Type**: Single static web app (existing `index.html` + `src/` modules)

**Performance Goals**: Negligible — static markup addition, no measurable render/perf impact

**Constraints**: Must render via plain HTML/CSS without requiring JavaScript to initialize (Constitution I); no new build step; no phone number in imprint; German-language legal text

**Scale/Scope**: Single footer section added once to `index.html`; no changes to `src/` reusable modules are required since footer visibility does not depend on tab-switch state

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS — footer is plain HTML/CSS added directly to `index.html`, no bundler, no build step, works under `python -m http.server`.
- **II. Dual-Target Reusable Modules**: N/A — no new reusable `src/` module is introduced; if any small helper (e.g., toggle expand/collapse) is added, it will follow the CommonJS + `window.*` bridge pattern.
- **III. Narrowest-Scope Test-First Verification**: PASS — this feature does not touch dashboard tabs, so `src/tab-navigation.js`/tab tests are unaffected; a new/updated Jest test will assert the footer markup, and root `npm test` will be run after the change.
- **IV. Faithful Locale-Aware Data Parsing**: N/A — no CSV/GPX parsing involved.
- **V. Explicit Privacy & Network Boundaries**: PASS (and directly reinforced) — the privacy notice text is the mechanism that keeps the app's public wording accurate: it states local-only processing of imported files while explicitly disclosing that external CDN libraries can still cause standard network requests, matching the constitution's requirement for precise privacy wording.

No violations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/012-legal-imprint-privacy/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command) — skipped, no external interface
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html               # Add a <footer> section with Impressum + Datenschutzerklärung,
                          # rendered once at body level (outside tab panels)
__tests__/
└── legal-footer.test.js # New: asserts footer markup/content is present in index.html
```

**Structure Decision**: Single static web app (existing layout, no new top-level directories).
The footer is markup-only in `index.html`; no new `src/` module is needed because visibility does
not depend on `src/tab-navigation.js` state — it sits outside the tab-panel containers. A focused
Jest test file is added under `__tests__/` following the existing regex/string-assertion style used
by `__tests__/index-script-syntax.test.js`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — table omitted.
