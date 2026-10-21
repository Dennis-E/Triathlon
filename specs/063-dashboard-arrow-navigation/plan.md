# Implementation Plan: Independent Dashboard and View Arrow Navigation

**Branch**: `063-dashboard-arrow-navigation` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/063-dashboard-arrow-navigation/spec.md`

## Summary

Make Left/Right workspace-wide dashboard navigation, independent of filter focus, and make Up/Down traverse the active visualization's complete valid filter combinations. Preserve the existing editing exceptions, Tab/Shift+Tab behavior, visual styling, filter meanings, and export workflow.

Use one arrow dispatcher in the existing dashboard orchestration, pure lazy combination traversal in the existing dual-target navigation utility, and small per-dashboard adapters at the current state owners. Apply each resulting selection as one transaction and render once; do not synthesize a sequence of filter clicks. Derive directional cues from the same action resolver and reject stale asynchronous render completions.

## Technical Context

**Language/Version**: Existing modern browser JavaScript (classic scripts and CommonJS exports); no transpilation or new runtime requirement.

**Primary Dependencies**: Existing DOM APIs, Chart.js, Leaflet, Lucide, and dashboard utilities. No new dependency, bundler, framework, or service.

**Storage**: Existing in-memory dashboard filter state only; no new persistence, network requests, or keyboard-only copy of selected filters.

**Testing**: Root Jest 30 in Node, injected document mocks and existing VM-based dashboard harnesses; real-browser keyboard and native-popup checks for behavior unavailable to Node tests.

**Target Platform**: Static desktop browser application; Chromium, Firefox, and Safari keyboard behavior requires browser validation. Existing mobile layout and cues remain intact; mobile without a physical keyboard has no new interaction.

**Project Type**: Static browser application with a separate, untouched Express API and Node export CLI.

**Performance Goals**: For 1,000 synthetic activities and up to 100 valid combinations, 95% of navigation updates within one second; cue feedback starts within 250 ms and ends within 1.5 s. Never materialize the Cartesian product or word-selection power set.

**Constraints**: Preserve browser/CommonJS bridge and public exports, exact script order, existing Tab behavior, native editing, valid empty-result views, existing Share/Export, and user changes. Handle finite stepped ranges as finite domains, not as continuous values merely because they use range inputs. Keep API/import/parsing semantics unchanged.

**Scale/Scope**: All 12 current dashboard tabs; 10 have finite filter dimensions. Wordcloud can expose 100 independent word selections; date-index ranges and dynamically generated years require lazy domains. Full traversal can be exponentially long, but a key press must not allocate all combinations or impose a silent combination cap.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Boundary | Before Research | Post-Design Evidence |
|----------------------|-----------------|----------------------|
| I. Static browser-first delivery | PASS | Existing script tags and orchestration retained; no build step or new library. |
| II. Dual-target reusable modules | PASS | Pure traversal helpers extend `src/tab-navigation.js` with CommonJS and browser exports; DOM adapters remain orchestration. |
| III. Narrowest-scope test-first verification | PASS | Focused navigation, wiring, owner, and async regression tests precede completion; browser checks cover native controls. Existing tab IDs/order stay unchanged and matching markup/dispatch/tests are updated together where navigation changes. |
| III. New-tab export rule | PASS | No tab added; existing capture targets and export flow preserved and smoke-tested. |
| IV. Faithful locale-aware parsing | PASS | No CSV, GPX, units, or sport-normalization changes. |
| V. Explicit privacy and network boundaries | PASS | Synthetic fixtures only; no raw exports, telemetry, API, or persistence additions. |
| Repository/dependency boundaries | PASS | Root frontend and tests only; service and CLI dependencies untouched. |
| Focused changes and public APIs | PASS | Existing exports retained; adapters limited to actual filter owners and async rendering that affects this behavior. |

Initial review: all gates pass. Phase 1 review: all gates still pass; no constitution exceptions are requested. Browser-popup portability and large-domain traversal remain explicit implementation acceptance gates, not assumed completed work.

## Project Structure

### Documentation (this feature)

```text
specs/063-dashboard-arrow-navigation/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  checklists/requirements.md
  contracts/keyboard-navigation.md
  contracts/filter-adapters.md
```

`tasks.md` is deliberately deferred to `/speckit-tasks`.

### Source Code (repository root)

```text
index.html
src/
  tab-navigation.js
  dashboard-tabs.js
  dashboard-state.js
  dashboard-core.js
  dashboard-equipment.js
  dashboard-scatter.js
  dashboard-distributions.js
  dashboard-workout-time.js
  dashboard-training-calendar.js
  dashboard-wordcloud.js
  dashboard-heatmap.js
  dashboard-pie-charts.js
__tests__/
  tab-navigation.test.js
  index-script-syntax.test.js
  dashboard-core.test.js
  dashboard-equipment.test.js
  dashboard-scatter-years.test.js
  dashboard-heatmap.test.js
  wordcloud-dashboard.test.js
  pie-charts-dashboard.test.js
README.md
```

**Structure Decision**: Extend existing files rather than create a new controller layer or script. Use the existing navigation test file for pure traversal, existing VM harnesses for owner transactions, and the wiring/syntax suite for script integration. Add a small VM case there if needed; do not replace behavior tests with source-text assertions. Only modify a listed owner when its filter adapter or stale-render protection needs it.

## Phase 0: Research Decisions

See [research.md](research.md) for evidence and alternatives. The controlling defect is that horizontal arrows are handled on tab buttons while vertical navigation moves focus to filter buttons. Resolve it at event routing, not by forcing focus back to the tab bar.

Design choices are resolved: a single dispatcher, current-state adapters, lazy lexicographic successor/predecessor, transactional selection application, shared cue resolution, native editing ownership, and generation-checked asynchronous rendering. No unresolved design clarification remains.

## Phase 1: Design

### Event Ownership

- Centralize only the four arrow keys in `dashboard-tabs.js`, early enough to prevent native double steps on closed finite controls. Keep the tab-button wrapper for Tab/Shift+Tab and remove its ownership of arrows without changing the public reusable helper contract.
- Resolve active workspace, current dashboard, available tabs, target, dialog state, editing ownership, modifiers, and composition before computing an action. Respect `defaultPrevented`; leave modified arrows and composition to their existing interactions.
- A visible dashboard alone does not authorize shortcuts from unrelated page controls. Require a target in its workspace; after a re-render removes the focused control, restore a stable workspace focus with `preventScroll` so the next arrow still works.
- Use the same resolver for cue availability and dispatch. No-op vertical actions suppress workspace scrolling but do not flash; a single-dashboard horizontal no-op does not claim success.

### Combination Traversal and Adapters

- Extend `tab-navigation.js` with a DOM-free lazy traversal helper. Ordered finite domains are supplied by the dashboard adapter from a candidate prefix and data snapshot; the final dimension varies fastest. Multi-selection uses ordered Boolean dimensions, never 32-bit bit masks.
- Seek the adjacent valid leaf with carry/borrow and canonical first/last suffix completion, wrapping once if needed. Use prefix constraints and domain bounds to skip impossible date pairs and dependent choices without rendering candidates. Compare canonical selections to identify a real change.
- Snapshot actual state on every action. Normalize obsolete selections through existing defaults once, then compute from the normalized selection. Do not keep a traversal cursor independent of mouse/native changes.
- Adapters identify structural validity separately from result availability. Empty data is not a reason to skip a combination. Candidate-dependent hidden or disabled filters are not independent dimensions; retained values stay fixed unless the existing owner normalizes them.
- Commit all resulting state fields through an owner batch path, reconcile dependent controls, and invoke one render. Existing manual setters and keyboard transactions share normalization; do not replay multiple `.click()` or `change` events.
- Define explicit ordered adapters for each current dashboard, including stepped activity-date ranges, native palette selects, year checkboxes, and word exclusions. Personal Bests and Lifetime Statistics provide an empty dimension list.

### Native Controls and Asynchronous Work

- Closed finite selects and checkboxes participate in workspace arrows. Expanded native choice popups, text/contenteditable inputs, modal dialogs, and continuous numeric editing own their arrows. Native popup detection uses feature-detected `:open` plus a control interaction lifecycle, never focus alone.
- Validate actual popup close/cancel/reopen behavior in target browsers. If a browser cannot reliably preserve both closed-control shortcuts and open-popup editing, treat that as a failed acceptance gate; do not silently exempt all selects or replace them with new controls.
- Give accepted navigation and data changes an increasing revision. Async renderers capture dashboard, canonical view, and data revision and check currency after each await and before delayed commits. Heatmap's lazy Leaflet loading is a concrete affected path; reuse Wordcloud's render-version pattern where appropriate.
- Horizontal changes are never blocked while a render is pending. After a successful state commit, flash its cue, retain keyboard access, and let only the current render update displayed content. Existing render failure/no-data handling remains usable for subsequent actions.

### Validation and Traceability

| Spec Coverage | Planned Evidence |
|---------------|------------------|
| FR-001, FR-002, FR-008; SC-001, SC-007 | Workspace focus matrix, Down then Right, Left wrap, unavailable/one-tab cases, one event/one action, stale-render VM cases. |
| FR-003 through FR-006; SC-002, SC-003 | Exact 2-by-3 cycles from all starts, inverse moves, manual selection, dependent periods/years, binary and large multi-selection cases, date bounds. |
| FR-007, FR-009; SC-004 | Atomic commit/render counts, unchanged scroll, valid empty-result views, prohibited combinations, other-tab state isolation, no-filter no-op. |
| FR-010 | Existing Tab tests plus browser native-popup, text, modal, numeric editing, modifier/composition, and outside-workspace checks. |
| FR-011; SC-006 | Shared availability tests, fake timers for feedback, browser cue and layout checks. |
| FR-012 | Existing syntax/load-order checks, owner tests, Share/Export smoke checks, unchanged tab identifiers and no new UI controls. |
| SC-005 | Browser timing sample with 1,000 synthetic activities and at most 100 combinations; large checkbox domains tested separately without expansion. |

See [data-model.md](data-model.md), [keyboard contract](contracts/keyboard-navigation.md), [adapter contract](contracts/filter-adapters.md), and [quickstart.md](quickstart.md). This command ends at design; no application behavior is implemented or claimed verified.

## Implementation Review 2026-10-21

The implemented code preserves all eight constitution boundaries above: static delivery, dual exports for reusable navigation, narrow and full root tests, unchanged tab/export identifiers, unchanged parsing, synthetic/local test data, unchanged API/CLI dependencies, and existing public manual-filter entrypoints. All 36 root suites and 721 tests pass. The keyboard-only Chart.js animation suppression was added after a visible-completion measurement exceeded the specified limit; defaults are restored with finally and manual interactions are unchanged.

Native Chromium interactions and local rendering/navigation checks pass. The external browser/export/cold-loading gates are not declared passed; their evidence and remaining tasks T044-T046 are recorded in [quickstart.md](quickstart.md). No constitution exception or weakening of the specification was introduced to conceal those gaps.
