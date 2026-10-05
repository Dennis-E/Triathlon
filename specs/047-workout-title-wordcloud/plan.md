# Implementation Plan: Workout Title Wordcloud

**Branch**: `047-workout-title-wordcloud` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/047-workout-title-wordcloud/spec.md`

## Summary

Add a Wordcloud dashboard tab based on the existing local `processedActivities[].name` titles. A pure dual-target utility will normalize and tokenize titles, exclude a fixed German/English function-word list, count every word occurrence, and produce a stable descending-frequency/alphabetical ranking. The tab will use the pinned browser-only wordcloud2.js 1.2.3 canvas layout with an adjacent responsive checkbox list and 10–100 word slider (default 30). The renderer will try to fit each checked term by shrinking, then explicitly identify any terms still unplaced while retaining them in the accessible list. Add a non-interactive “And much more” landing tile containing only “Wordcloud” and “…” bullets; it is intentionally not a preview card or preview asset.

## Technical Context

**Language/Version**: Browser JavaScript using the repository's classic-script / CommonJS-compatible ES syntax; Node.js for Jest tests.

**Primary Dependencies**: Existing static HTML, Tailwind CDN and Jest; pinned wordcloud2.js 1.2.3 browser bundle loaded via a versioned CDN script. No backend or new npm package.

**Storage**: Existing activity records and transient selection state in browser memory; no persistence.

**Testing**: Jest in the Node environment. Focused utility, tab-navigation, preview markup, dashboard wiring, and script-syntax tests, then root `npm test`; manual static-server validation at desktop/mobile widths.

**Target Platform**: Modern desktop and mobile browsers, served as the existing static browser app.

**Project Type**: Static browser frontend with CommonJS-testable utilities.

**Performance Goals**: For up to 5,000 activity titles, ranking and visible cloud/list updates complete within 1 second; slider changes reuse the ranking and only rebuild the top-N presentation.

**Constraints**: No bundler/build step; keep title text in browser memory; preserve accessibility through a labeled range input and checkbox/count list; new tab must participate in all tab registry, ARIA, keyboard, render-dispatch, and focus mappings, including its click and keydown handlers. CDN unavailability must show a clear user-facing unavailable state instead of throwing or displaying a blank canvas. At 100 checked terms, no word may disappear silently if the canvas cannot place it.

**Scale/Scope**: One new dashboard tab; at most 100 ranked terms; 5,000 activity titles in the performance acceptance target; one static landing feature tile; no export, persistence, filters, API, or preview asset.

## Constitution Check

*Gate: evaluate before and after design.*

| Principle / constraint | Status | Plan evidence |
|---|---|---|
| I. Static browser-first delivery | PASS | Classic scripts and a version-pinned CDN asset; no bundler or service. |
| II. Dual-target reusable modules | PASS | Word tokenization/ranking lives in a pure `src/wordcloud-utils.js` with CommonJS and `window.*` bridges; DOM orchestration stays in a classic dashboard script. |
| III. Test-first verification | PASS | Update tab constants, HTML button/panel and dispatch, tab tests, and focused utility/UI tests together; run narrow tests and root Jest suite. |
| IV. Locale-aware data semantics | PASS | This feature consumes normalized title text only; no CSV, distance, sport, or GPX semantics change. Unicode German characters are retained during tokenization. |
| V. Privacy/network boundaries | PASS | Activity titles are already locally imported; only the cloud layout library is fetched from the configured CDN. Neither titles nor derived terms are sent to a service. Synthetic fixtures only. |
| Dependency boundaries / focused scope | PASS | No API, CLI, root npm dependency, or unrelated visualization changes. |

No gate violations or unresolved clarification markers remain.

## Project Structure

### Documentation (this feature)

```text
specs/047-workout-title-wordcloud/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── ui-contract.md
    └── stop-words.md
```

### Source Code and Tests

```text
index.html                              # CDN loader, landing overview tile, tab button/panel, script order
src/tab-navigation.js                   # Tab key/order/button/panel registration and activation
src/dashboard-tabs.js                   # Render dispatch and open-tab focus mapping
src/dashboard-wordcloud.js              # DOM orchestration, controls, cloud rendering, empty states
src/wordcloud-utils.js                  # Pure title tokenization, stop-word filtering, counting and ranking
__tests__/tab-navigation.test.js        # Tab activation and keyboard cycle coverage
__tests__/wordcloud-utils.test.js       # Token and ranking unit coverage
__tests__/index-script-syntax.test.js   # Script loading/HTML wiring checks
__tests__/preview-assets.test.js        # Actual preview inventory plus separate overview tile assertions
__tests__/wordcloud-dashboard.test.js   # Static markup/control integration assertions where practical
```

**Structure Decision**: Extend the existing static browser app. Use a single reusable pure utility and one dashboard orchestration script, wired into the existing `index.html` tab system. Keep the “And much more” overview card distinct from data-dependent visualization preview cards so preview image inventory remains semantically accurate.

## Phase 0: Research Decisions

See [research.md](research.md) for decision records and alternatives. Confirmed choices:

- Use existing activity titles; no additional ZIP parsing or persistence.
- Use a pure utility and a fixed stop-word contract at [contracts/stop-words.md](contracts/stop-words.md).
- Use wordcloud2.js 1.2.3 from jsDelivr; it accepts `[word, weight]` pairs and supports canvas output, sizing, and rendering events. Pair canvas with a textual accessible selection list.
- Update tab wiring and tests as one coordinated change; keep landing overview tile separate from image-backed previews.

## Phase 1: Design and Contracts

- [Data model](data-model.md) defines normalized eligible words, occurrence counts, deterministic ranks, transient inclusion state, and the static overview tile.
- [UI contract](contracts/ui-contract.md) defines tab identity, accessible controls, responsive layout, state transitions, empty states, and privacy boundary.
- [Stop-word contract](contracts/stop-words.md) gives the fixed initial German/English function-word set.
- [Quickstart](quickstart.md) defines automated and browser validation, including privacy and viewport checks.

## Constitution Check (Post-Design)

| Gate | Status | Re-evaluation |
|---|---|---|
| Static browser-first | PASS | All runtime pieces remain classic browser scripts and a versioned CDN library. |
| Reusable logic testable in Node and browser | PASS | Ranking/tokenization are pure; DOM/canvas work remains dashboard orchestration. |
| Tab changes fully registered and tested | PASS | Implementation must update tab constants, matching HTML ARIA markup, dispatch/focus mappings, and tab tests in the same change. |
| Privacy and data boundaries | PASS | Word/title data stays in browser memory; tests use synthetic activity titles. |
| Focused scope / verification | PASS | No API/storage/schema changes; focused Jest and root test suite required. |

No violations; no complexity exception is required.

## Out of Scope

- Persisting checkbox or slider choices across reloads/imports.
- Sport/date filters, stemming, language detection, translation, and custom stop-word editor.
- Export/share actions, generated landing preview screenshot, or uploading workout titles/terms.
- Changes to Strava CSV import, API service, or activity title model.
