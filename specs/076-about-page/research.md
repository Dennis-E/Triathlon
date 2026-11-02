# Research: Personal About Page

**Date**: 2026-11-02
**Feature**: [spec.md](spec.md)

## Research Scope and Evidence

Resolve the smallest implementation surface for the approved personal introduction. Evidence comes from `index.html` (header around line 241), `news.html` (head, styles, and header), `__tests__/news-page.test.js`, `__tests__/legal-footer.test.js`, root `package.json`, `jest.config.js`, README's existing News section, and the project constitution. A read-only research agent examined the adjacent test and documentation conventions. No implementation tests or browser runtime assertions were executed during this planning research.

## Decision 1: Standalone Static Page

**Decision**: Create root-level `about.html` containing all approved content in the initial HTML. Keep it independent of dashboard orchestration and omit application scripts.

**Rationale**: `news.html` already establishes a sibling informational-page convention. Static content needs no runtime module, router, account, import, state store, or backend. It remains meaningful without application JavaScript.

**Alternatives considered**: A dashboard tab would incorrectly tie the introduction to dashboard state and tab/export contracts. A modal would complicate direct access, history, focus, and reading. A client-rendered page adds dependencies without value.

## Decision 2: Direct Navigation Contract

**Decision**: Add `About` immediately after the existing `News` link in the main header, targeting `./about.html`. On About, retain the established linked logo and Back to dashboard destination `./index.html`, also expose News, and use `./index.html` for the final Explore your training action. Use native same-tab anchors, not click handlers or browser history.

**Rationale**: News uses explicit relative links to the existing main entry point. The same contract works on first visits and nested static hosting prefixes. It does not imply persistence of imported workouts when leaving the dashboard.

**Alternatives considered**: `history.back()` fails direct visits. A new import-specific hash or route invents an entry point. A full site-wide navigation refactor expands scope; changing `news.html` is unnecessary for the required main-site discovery path.

## Decision 3: Editorial Layout Within Existing Visual Language

**Decision**: Reuse the site's default sans-serif typography, slate base surfaces, light/muted text, amber accents, and existing logo. Use an unframed reading column around 65 characters wide, generous section spacing, fixed rem-based type sizes with breakpoint adjustments if needed, zero letter spacing, and a normal-flow header. Keep page-local essential CSS for layout, reading styles, and visible focus; the existing Tailwind CDN convention may provide the same utility styling as News.

**Rationale**: The user explicitly asks for typography alone and consistency with the existing site. Normal document flow avoids fixed-header overlap at enlarged text sizes. No new fonts, photos, gradients, cards, portraits, or decorative assets are needed. The existing brand logo is navigation, not invented biographical imagery.

**Alternatives considered**: Copying News's rounded article cards and decorative background would weaken the requested simple editorial layout. A new typeface or palette creates a separate design identity. A fixed header requires additional height compensation without improving this short page.

## Decision 4: Reflow the Actual Header Constraint

**Decision**: Keep the main header's outer wrapping and make the right-hand News/About/status group wrap internally with row and column gaps. Preserve `statusBadge`, `statusText`, and the logo button's action; allow the status text to wrap instead of forcing the entire group to a fixed minimum width. Apply equivalent min-width and wrapping constraints to the About header.

**Rationale**: The current right-hand group is a non-wrapping flex row. Adding About can overflow a 320 pixel viewport even though the outer header already wraps. This is the directly affected layout, not a reason to redesign dashboard tabs.

**Alternatives considered**: Hiding News or the status loses existing functionality. Shrinking text by viewport width harms readability. Adding a hamburger menu and script introduces unnecessary interaction states for two site destinations.

## Decision 5: Literal Content and Semantic Headings

**Decision**: Treat the spec's Content Contract as authoritative: one h1 greeting, the introductory paragraphs, three h2 sections, closing lines, and the final action. Preserve Unicode punctuation, the greeting symbol, smiley, and the supplied relative time and youth-section count. Declare UTF-8 and English document language. Do not add a visible About heading, marketing subtitle, or biographical material.

**Rationale**: Content fidelity is a primary acceptance criterion. Rendering may escape HTML characters, but decoding must recover the same words and punctuation; only presentation whitespace can differ. The action's surrounding square brackets are notation, not its visible label.

**Alternatives considered**: Paraphrasing, automatically updating "About two years ago", or splitting the copy into invented feature cards alters the approved editorial meaning. External content loading introduces failure modes and a second content-management surface.

## Decision 6: Existing Node Tests Plus Real-Browser Review

**Decision**: Add one `__tests__/about-page.test.js` using Jest's existing Node `fs`/`path` pattern. Scope assertions to header, main, and final-action regions. Compare all approved text and order, preserving punctuation while decoding relevant HTML escapes and normalizing whitespace. Reuse existing News and legal-footer suites as regressions; use browser checks for rendered behaviour.

**Rationale**: Existing informational-page tests already read HTML source without jsdom or a parser. One focused suite avoids extra helper/fixture files and dependencies. A random `./index.html` link elsewhere in the page is insufficient evidence for the final action. Regex/source assertions cannot establish computed contrast, responsive fit, or keyboard focus.

**Alternatives considered**: Adding jsdom, a parser package, or a permanent browser runner solely for this page is disproportionate. Snapshot-only tests are weak protection against accidental editorial changes. Treating static utility classes as proof of mobile/accessibility behaviour is inadequate.

## Decision 7: Privacy and Integration Boundaries

**Decision**: Load no analysis-counter, newsletter, import, or visualization application scripts on About. Add no new network services, storage, telemetry, forms, or raw-data fixtures. Reuse only existing site styling resources and logo; do not claim the whole app is network-free.

**Rationale**: The feature is an introduction, not a data-processing surface. The approved copy contains no new privacy promise or signup requirement. Shared CDN styling may still make network requests.

**Alternatives considered**: Copying all scripts from the dashboard or adding a counter/signup for consistency would introduce explicitly excluded behaviour.

## Resolution

All technical decisions needed for Phase 1 are resolved. No user clarification or external-service research is required. The exact visual fit, focus visibility, contrast ratios, and rendered copy remain implementation validation gates rather than asserted planning results.