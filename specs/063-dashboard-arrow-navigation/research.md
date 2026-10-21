# Research: Independent Dashboard and View Arrow Navigation

**Date**: 2026-10-21
**Feature**: [spec.md](spec.md)
**Outcome**: Design questions resolved; implementation and browser acceptance checks remain future work.

## 1. Arrow Event Ownership

**Decision**: Route the four arrows through a single workspace dispatcher in `src/dashboard-tabs.js`. Keep Tab/Shift+Tab at the existing tab wrapper, and retain public utility exports for compatibility.

**Rationale**: Tab buttons in `index.html` call `handleVisualizationTabKeydown`; other controls do not. `handleDashboardFilterKeydown` moves focus to a filter after clicking it, leaving horizontal arrows without a handler. `updateNavigationCueAvailability` also requires a focused tab for horizontal cues. The defect is event ownership, not disabled tab state.

**Alternatives considered**: Returning focus to the tab bar after each filter change obscures filter interaction and fails workspace-wide navigation. Adding handlers to every filter duplicates routing and allows double actions. Separate competing document listeners make native-control behavior and cues diverge.

## 2. Filter State and Atomic Changes

**Decision**: Add small explicit adapters alongside existing dashboard filter owners. Read actual current state, resolve pure candidate domains, commit all selected fields, refresh controls, and request one render per vertical action.

**Rationale**: Existing button classes are not an authoritative model for native selects, ranges, generated years, and checkboxes. Several setters immediately render or normalize other values. Clicking a sequence of buttons would expose intermediate views and override intended suffix values.

**Alternatives considered**: DOM-only button discovery misses controls and dependencies. A second keyboard state diverges after mouse edits. A general controller framework or replacement of all setters is unnecessary; extract only the local reconciliation needed by each batch path.

## 3. Existing Finite Filter Inventory

Order follows the actual panel markup, not a new preferred filter order. Use actual IDs and labels from owners when implementing adapters; these names describe the dimensions.

| Tab | Ordered Finite Dimensions | Dependencies / Exclusions |
|-----|---------------------------|---------------------------|
| `totalDistance` | Aggregation, sport, timeframe | Timeframe choices come from `TIMEFRAME_OPTIONS[aggregation]`; 5/5/5/4 choices. |
| `paceMetrics` | Sport, metric, date start, date end, year selection, trendline | Years depend on sport, metric, and date selection. Date indices are finite; start must not exceed end. Empty year selection is permitted. |
| `equipment` | Metric, equipment category | Current distance/pace/count/average-length modes and All/Shoes/Bikes; no individual equipment selector exists. |
| `equipmentTimeline` | Timeline mode, equipment category | Existing continuous/activities modes are finite choices despite the name continuous. |
| `personalBests` | None | Opening a detail or enlarging a chart is not a filter. |
| `heatmap` | Sport | Pan, zoom, and viewport are not filter dimensions. |
| `distributions` | Metric, sport, display mode, palette, date start, date end | Histogram with All Sports and elevation with Swim are structurally unavailable. Valid missing-data views are retained. |
| `workoutTime` | Aggregation, sport, date start, date end | Discrete activity-date indices, start no later than end. |
| `trainingCalendar` | Palette, sport | Only existing sport choices; no invented year selector. |
| `wordcloud` | Word count, displayed word selections | Count 10 through 100 by 1 is finite. Visible word identity/order depends on count and current data. All words may be excluded. List collapse is layout, not a filter. |
| `pieCharts` | Category, measure, sport, palette | Existing category/measure/sport choices and native palette select. |
| `lifetimeStatistics` | None | No view-filter dimensions. |

**Decision**: Include finite stepped ranges, binary controls, native finite selects, and permitted multi-selections. Exclude arbitrary numeric editing, free text, export settings, and layout-only actions.

**Rationale**: Scatter, distribution, and workout-time date sliders select finite activity-date indices. Word count is a finite stepped value. Excluding every `input[type=range]` would contradict the feature's complete finite-combination coverage.

**Alternatives considered**: Only cycling button groups is the old incomplete behavior. Treating every possible numeric value as enumerable is unbounded. Capping the number of combinations silently violates completeness.

## 4. Complete Traversal Without Product Expansion

**Decision**: Use a lazy lexicographic successor/predecessor over candidate-dependent finite domains. Expand multi-selection into stable ordered Boolean dimensions and implement carry/borrow without integer bit masks. Complete suffixes using the first valid suffix for Down and last for Up.

**Rationale**: A 100-word multi-selection has an impractical number of combinations but an ordinary successor can be found by inspecting its Boolean vector. Dependent timeframes and years must be recomputed from the candidate prefix; consulting stale rendered controls loses valid combinations. Existing remembered timeframe values are not a substitute for canonical suffix completion.

**Alternatives considered**: Materializing a Cartesian product or power set is infeasible. A JavaScript 32-bit mask fails beyond 31 independent choices. A sequential filter-group loop never explores the complete product. Repeatedly rendering candidates is slow and exposes intermediate selections.

**Complexity**: Storage is proportional to current dimensions and a bounded backtracking stack, not total combinations. Independent domains require carry/borrow work proportional to dimensions. Date and other constraints use prefix/domain pruning. Pathological dependent constraints can require more search; do not advertise constant-time traversal or truncate valid views. Large synthetic constrained-domain tests are required.

## 5. Native Input Ownership

**Decision**: Distinguish closed finite-choice controls from an active native editing session. Feature-detect `:open` for selects and use interaction lifecycle tracking for open/close/cancel, resetting on blur and workspace changes. Preserve text/contenteditable, modal, continuous numeric, composing, and modified-key behavior.

**Rationale**: Focus alone cannot mean an open popup: FR-010 explicitly requires horizontal shortcuts on closed selects. There is no universally reliable legacy DOM property for native select openness. Synthetic key events do not prove actual operating-system popup behavior.

**Alternatives considered**: Exempting all focused selects violates the closed-control requirement. Taking all arrows unconditionally prevents accessible popup editing. Replacing native controls with custom dropdowns expands scope and introduces new accessibility work.

**Acceptance risk**: Verify mouse-opened and keyboard-opened popups, Escape, selection, cancellation, same-value selection, and immediate subsequent arrows in Chromium, Firefox, and Safari. If a browser cannot meet the contract, report the failing gate rather than silently weaken the requirement. Real OS-popup checks may require manual testing when browser automation cannot observe them.

## 6. Rendering and Revisions

**Decision**: Guard async commits with navigation and data revisions; do not serialize horizontal input behind rendering.

**Rationale**: `renderHeatmap` computes segments before awaiting lazy Leaflet loading and can finish after a view/tab change. The existing Wordcloud render-version/promise pattern is a nearby model. Accepted filter state must become authoritative synchronously; only current asynchronous work may commit visible output.

**Alternatives considered**: Waiting for every render blocks dashboard switching. Debouncing by dropping accepted key presses changes traversal. A revision increment without checks after awaits does not prevent stale commits.

## 7. Verification and Dependencies

**Decision**: Reuse Node Jest mocks and VM harnesses, with separate browser acceptance checks; add no dependency or build step.

**Rationale**: `__tests__/tab-navigation.test.js` covers order, wraparound, availability, and injected documents. `__tests__/index-script-syntax.test.js` protects classic script parsing and wiring, but its old focus-specific assertions must change rather than constrain the new behavior. Scatter and heatmap VM tests already cover generated controls and async seams. Real focus, scrolling, native popups, and shared script globals need browser checks.

**Alternatives considered**: A new frontend framework, jsdom migration, standalone test infrastructure, or API change is not needed. Source-text assertions alone cannot prove action counts or async correctness.

**Sources**: Existing `src/tab-navigation.js`, `src/dashboard-tabs.js`, `src/dashboard-core.js`, `src/dashboard-scatter.js`, `src/dashboard-distributions.js`, `src/dashboard-workout-time.js`, `src/dashboard-wordcloud.js`, `src/dashboard-heatmap.js`, `index.html`, root `package.json`, and the tests above. Read-only focused research was delegated to the Explore agent; no application files were changed.