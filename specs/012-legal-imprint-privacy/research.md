# Phase 0 Research: Legal Imprint and Privacy Notice

No unresolved `NEEDS CLARIFICATION` markers remained after `/speckit-specify`, and the Technical
Context in [plan.md](./plan.md) has no unknowns. This document records the small number of
implementation-approach decisions made before design.

## Decision: Footer placement in the DOM

- **Decision**: Add a single `<footer>` element as a direct child of `<body>`, after the main
  dashboard container, rendered unconditionally (not inside any `TAB_PANEL_IDS` panel).
- **Rationale**: `src/tab-navigation.js` only toggles visibility of the panels listed in
  `TAB_PANEL_IDS`. Placing the footer outside those panels means it is present regardless of the
  active tab (satisfies User Story 3) without any change to tab-navigation logic or tests.
- **Alternatives considered**: Duplicating footer markup inside each tab panel — rejected as
  redundant and error-prone to keep in sync; adding a new "legal" tab — rejected because the spec
  treats the footer as always-visible chrome, not a switchable dashboard view.

## Decision: No new JS module required

- **Decision**: Implement the footer as static HTML/CSS (Tailwind utility classes already used
  elsewhere in `index.html`). Optional expand/collapse interactivity is out of scope for v1; both
  sections are simply visible/readable by default.
- **Rationale**: Constitution I requires the app to work without a build step and function via
  plain static serving; Constitution II only requires reusable *logic* to follow the dual-target
  module pattern — there is no reusable logic here, just content markup.
- **Alternatives considered**: A collapsible `<details>`-based accordion — still plain HTML (no JS
  needed, browsers implement native disclosure), so this remains compatible with Constitution I;
  can be adopted at implementation time if it improves footer scannability, without contradicting
  this research.

## Decision: Content language and structure

- **Decision**: Imprint and privacy notice text is written in German ("Impressum",
  "Datenschutzerklärung"), matching the target audience and the common legal expectation for an
  "Impressumspflicht"-style disclosure.
- **Rationale**: Explicit user request and spec Assumption; aligns with Constitution V's demand for
  precise, accurate privacy wording for this audience.
- **Alternatives considered**: English-only text — rejected per explicit user/spec direction;
  bilingual text — deferred as unnecessary scope increase for v1.

## Decision: Placeholder handling for owner contact details

- **Decision**: Until the site operator supplies real name/address/email, implementation uses
  clearly marked placeholder values (e.g., `[Name]`, `[Adresse]`, `[E-Mail]`) in the imprint, so the
  structure and tests can be completed without blocking on that data, and the operator can do a
  simple text find-and-replace before publishing.
- **Rationale**: Spec Assumption already documents this; avoids blocking planning/implementation on
  externally supplied personal data.
- **Alternatives considered**: Blocking the whole feature on receiving real data first — rejected,
  since it would stall independently testable, low-risk implementation work.

**Output**: All Technical Context items resolved; no `NEEDS CLARIFICATION` remain.
