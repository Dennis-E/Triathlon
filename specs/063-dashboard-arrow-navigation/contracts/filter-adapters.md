# Filter Adapter and Traversal Contract

**Feature**: [spec.md](../spec.md)
**Related**: [data model](../data-model.md), [keyboard contract](keyboard-navigation.md)

These are internal frontend interfaces supporting the public keyboard contract. They add no external service and preserve existing exported functions. Names below describe the intended new interface; implementation may use local names with equivalent tested behavior.

## Pure Traversal Interface

Extend the existing dual-target `src/tab-navigation.js`, exposing additions through both CommonJS and `window.dashboardTabNavigation` without removing or changing current exports.

| Operation | Input | Output / Contract |
|-----------|-------|-------------------|
| `getAdjacentFilterCombination` | Valid normalized snapshot, direction -1/+1, pure domain provider | Adjacent complete valid combination, or null when no alternative exists. |
| `resolveDashboardArrowAction` | Arrow key, ownership context, available tabs, current snapshot/provider | Pure action description: ignored, no-op, or candidate change. No DOM side effects or rendering. |

Provider errors must not leave partial state: do not commit candidates until validation succeeds. Invalid arguments return no actionable candidate; owner domain inconsistencies should be exposed by focused tests rather than handled by arbitrary cycling.

### Domain Provider

- Given a candidate prefix and immutable data snapshot, returns the next dimension's stable identity and ordered finite domain, or a terminal leaf. Candidate-dependent schemas may have different dimension counts.
- Domains support value-at-position and current-value-position without creating all combinations. Discrete ranges may use count/min/step arithmetic; Boolean domains have exactly false/true unless constrained.
- Supplies validity and prefix-completion rules. Use bound constraints and domain exclusion to avoid scanning large known-invalid regions. Total products and power sets are never arrays or numeric bit masks.
- Calls are deterministic and side-effect free for a fixed snapshot. No DOM clicks, render calls, chart mutation, import mutation, or time-dependent choices while searching.
- Successor/predecessor performs carry/borrow and canonical suffix completion. If no candidate exists beyond the boundary, wrap once to the appropriate first/last valid leaf. Return null when the only leaf is the starting one.

## Dashboard Adapter

Adapters live with the current owner state and are registered by tab ID in existing dashboard orchestration after scripts load. Registration must not depend on a later script having initialized at parse time; preserve classic-script order and avoid new global name collisions.

| Operation | Responsibility |
|-----------|----------------|
| `readSnapshot()` | Read actual state and data revision; reconcile obsolete selections through existing defaults before navigation. No separate keyboard selection. |
| `getDomainProvider(snapshot)` | Supply pure domains and structural validity for this snapshot and candidate prefixes. Generated choices derive from data/owner rules, not stale DOM controls. |
| `applySelection(candidate, revision)` | Revalidate tab/data ownership; set all finite filter fields as one batch; reconcile existing dependent state/controls; issue one render. Return whether a real change committed. |

Manual setters and keyboard application must share the owner's existing validation and labels. Extract a local batch reconciliation path only where necessary; preserve existing manual function signatures. Rendering receives only the final selection. A normalization required after import is distinct from the one accepted traversal step and must not flash a navigation cue on its own.

### Required Per-Owner Mapping

| Owner | Mapping / Constraints |
|-------|-----------------------|
| `dashboard-core.js` | Aggregation, sport, timeframe; use candidate `TIMEFRAME_OPTIONS`. Remembered timeframe values may remain existing state but cannot replace canonical suffix completion. |
| `dashboard-scatter.js` | Sport, metric, date pair, ordered generated year Booleans, trendline. Preserve year subset constraints and empty-subset semantics. |
| `dashboard-equipment.js` | Separate adapters for equipment mileage and equipment timeline, each with their existing modes/category choices. |
| `dashboard-heatmap.js` | Sport; retain map pan/zoom state and guard lazy-render completion. |
| `dashboard-distributions.js` | Metric, sport, display mode, palette, date pair; exclude structurally unsupported All+histogram and Swim+elevation choices. Do not exclude combinations merely because qualifying activity count is zero. |
| `dashboard-workout-time.js` | Aggregation, sport, finite date pair with start no later than end. |
| `dashboard-training-calendar.js` | Palette, currently available sport choices; no new year filter. |
| `dashboard-wordcloud.js` | Finite word-count range and ordered Boolean selection for displayed words. Identity must survive DOM replacement; count changes recompute candidate word domains. No power-set expansion. |
| `dashboard-pie-charts.js` | Existing category, measure, sport, and palette values; reuse current object/global owner pattern. |
| Unfiltered tabs | Empty adapter for Personal Bests and Lifetime Statistics; one unchanged view. |

Only active visible/enabled finite dimensions vary. Fixed and absent state is reconciled exactly as existing owners require. Controls in other dashboards must not change. For words removed by a smaller count, follow existing pruning/default semantics; exact inverse guarantees apply to canonical view selections, not discarded hidden owner history.

## Atomicity, Staleness, and Failure

1. Capture tab, canonical selection, and data revision before computing a candidate.
2. Compute a complete valid candidate without invoking setters or rendering intermediate candidates.
3. Before commit, confirm data and workspace ownership still match. If an import invalidated the snapshot, recompute from current state; never apply stale option identities.
4. Commit once and advance navigation revision synchronously. Refresh control presentation and cue availability from committed state.
5. Async work carries the committed tab/view/data token and verifies it after every await and before delayed DOM/chart writes. Stale results are discarded, not applied to another view.
6. On existing rendering failure, preserve the committed selection and existing error/no-data handling; keep all applicable navigation available. No new retry UI or telemetry is introduced.

## Verification Obligations

- Test exact cycles and inverses from each start for a 2-by-3 independent domain.
- Test candidate-dependent timeframes, years, and date bounds in both directions, including wrap and manual edits.
- Test constrained multi-select and at least 100 Boolean dimensions without allocation proportional to all subsets or truncation above 31 options.
- Count owner commits and renders: one each for an accepted view change, none for no-op or excluded input. Assert no intermediate invalid selection reaches a render.
- Test valid empty results separately from structurally invalid states, control replacement, and other-tab isolation.
- Hold an async map load unresolved, change view/tab, resolve it, and verify only the current token can write visible output.