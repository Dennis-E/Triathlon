# Data Model: Dashboard Arrow Navigation

**Feature**: [spec.md](spec.md)
**Contracts**: [Keyboard](contracts/keyboard-navigation.md), [filter adapters](contracts/filter-adapters.md)

All entities are in-memory descriptions of existing frontend state. There is no database, migration, persisted traversal cursor, or new network payload.

## Dashboard

| Field | Meaning / Validation |
|-------|----------------------|
| `tabId` | Existing `TAB_ORDER` value; unique and unchanged. |
| `panelId` | Existing `TAB_PANEL_IDS[tabId]`. |
| `available` | Existing availability calculation, independent of the current filtered result. |
| `adapter` | Owner of finite filter domains and transactional application, including an empty adapter for unfiltered tabs. |

Only available dashboards participate in horizontal navigation. Zero dashboards yields no action; one yields no successful switch.

## Navigation Context

| Field | Meaning / Validation |
|-------|----------------------|
| `activeTabId` | Current available dashboard, or null. |
| `availableTabs` | Available IDs in canonical tab order. |
| `workspaceOwnsInput` | Dashboard workspace is active and contains the input target; an open modal or editing session may override this. |
| `inputOwner` | `workspace`, `text`, `dialog`, `nativePopup`, `continuousNumeric`, or `outside`. |
| `navigationRevision` | Monotonically increasing revision for accepted state changes. |
| `dataRevision` | Revision of imported/processed data and resulting domain availability. |

Resolve this context for each event and cue refresh. Ignore composing/modified input and already handled events; do not let a focused tab alone decide ownership.

## Filter Dimension

| Field | Meaning / Validation |
|-------|----------------------|
| `id` | Stable key within its dashboard, independent of DOM node replacement. Generated years use year keys; words use existing stable word identity. |
| `order` | Position in visible panel filter order, preserving option order. |
| `kind` | `single`, `boolean`, or `stepped`; multi-select is an ordered group of Boolean dimensions. |
| `domain(prefix, snapshot)` | Finite ordered domain valid for this candidate prefix and fixed data snapshot. Enumerate options lazily where necessary. |
| `currentValue` | Actual owner selection; not inferred solely from button styling. |
| `visibility/enabled` | Determined from owner rules for the candidate prefix; ineligible fields do not independently vary. |

Stepped domains require finite min/max and a positive finite step with valid integral step positions. Date-index bounds, word count, and choice arrays use existing owner values; do not infer a new range from raw timestamps.

### Domain Rules

- Single-choice values follow displayed order, not alphabetical or numeric re-sorting.
- Boolean values order false before true; flatten multi-selection in displayed option order, with the last Boolean varying fastest.
- A one-choice domain is fixed. No eligible dimensions represent one unchanged view, not an error.
- Date start/end dimensions permit only start no later than end. Use candidate start to bound the end domain rather than scanning all invalid pairs.
- Total-distance timeframe domains derive from candidate aggregation. Scatter year identities derive from candidate sport, metric, and date window.
- Word-selection dimensions derive from the candidate word count and underlying words. Hidden/removed selection state follows existing owner reconciliation; it is not an additional enumerated choice.
- Structural impossibility is invalid. A valid combination returning zero activities remains valid.

## Filter Snapshot and View Combination

| Field | Meaning / Validation |
|-------|----------------------|
| `tabId` | Owning dashboard. |
| `dataRevision` | Fixed data generation used to resolve all candidate domains. |
| `selection` | Ordered dimension-ID/value pairs for the complete current or candidate view. |
| `fixedState` | Existing owner state that is not independently enumerable, retained according to owner rules. |
| `canonicalKey` | Structural serialization of typed ordered pairs for equality; not a 32-bit mask or an array of every possible view. |

Each complete valid leaf has one canonical identity. Distinct multi-selection subsets are distinct views even when resulting chart data happen to match. Preserve owner state for absent dimensions according to existing defaults without adding hidden duplicate leaves.

### Traversal Transition

1. Read the active owner's real state and current data revision.
2. Normalize invalid current selections through existing defaults and record the resulting valid snapshot.
3. For Down, seek the next lexicographic valid leaf; for Up, the previous. Carry/borrow starts at the last varying dimension.
4. After a prefix changes, derive its domains and fill the suffix with the first valid suffix for Down or last for Up. Backtrack without rendering when no completion exists.
5. Wrap once when the boundary is crossed. If the resulting canonical key equals the start or no alternative exists, return no change.
6. Recheck ownership and data revision, commit one full selection, reconcile controls, and request one render. Refresh cue availability from committed state.

Traversal does not increment a separate stored combination index. Manual changes are immediately visible to the next navigation action. Complete traversal may be exponentially long; working state must remain proportional to current dimensions, not product size.

## Navigation Action

| Field | Meaning / Validation |
|-------|----------------------|
| `axis` | `dashboard` or `view`. |
| `direction` | -1 for Left/Up; +1 for Right/Down. |
| `outcome` | `ignored`, `noop`, or `changed`. |
| `target` | Available tab ID or complete valid view combination; absent for no-op/ignored. |
| `preventDefault` | True for workspace-owned arrows, including vertical no-ops; false for excluded interactions. |
| `cue` | Matching direction only for a successful committed change. |

One event produces at most one action. Horizontal input never changes a filter selection; vertical input never changes the active tab. Existing Tab behavior remains a separate route.

## Render Token and Cue State

A render token contains `tabId`, `canonicalKey`, `navigationRevision`, and `dataRevision`. A renderer checks currency after every await and before a delayed output commit. Tokens are transient and do not replace the owner selection. A tab switch or new import invalidates incompatible pending work; current render failures retain existing failure handling and do not block new input.

Each existing cue stores availability, an active feedback state, and its timeout. Successful repeated actions restart the existing feedback interval. A no-op cannot start feedback. Refresh availability after focus/editing ownership changes, tab changes, filter changes, and data import; cues use the same action resolution rules as navigation.