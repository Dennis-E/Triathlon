# Keyboard Navigation Contract

**Feature**: [spec.md](../spec.md)
**Related**: [data model](../data-model.md), [adapter contract](filter-adapters.md)

This is the user-facing keyboard contract of the existing static application. It adds no HTTP endpoint or command-line interface.

## Input Ownership

| Context | Left / Right | Up / Down |
|---------|--------------|-----------|
| Active dashboard tab, chart/content, eligible filter button | Previous/next available dashboard | Previous/next valid complete filter combination |
| Closed finite select or binary filter | Same dashboard switching | Same complete-combination navigation, not one native option step |
| Finite stepped range outside native editing | Same dashboard switching | Same complete-combination navigation |
| Text field, textarea, editable content | Existing text editing | Existing text editing |
| Expanded native choice popup | Native popup interaction | Native popup interaction |
| Native continuous numeric editing | Existing control behavior | Existing control behavior |
| Open modal dialog | Existing dialog interaction; underlying workspace unchanged | Same |
| Outside dashboard workspace or workspace hidden | Existing page behavior | Existing page behavior |

Modifier combinations, composing input, and already handled events are not new shortcuts. Modal ownership applies while the modal is open, even if its focus trap has not yet moved focus. Merely focusing a closed select is not a native popup session.

## Routing Guarantees

- Exactly one dispatcher owns arrows in the workspace. Existing tab-button routes continue to handle Tab/Shift+Tab but do not execute a second arrow action.
- The existing exported `handleVisualizationTabKeydown` behavior remains backward compatible; its orchestration caller restricts tab-local routing to Tab/Shift+Tab.
- Left is previous and Right is next in available `TAB_ORDER`, with wraparound. Up and Down do not alter the dashboard. Zero/one available dashboard yields no successful horizontal switch.
- Down advances and Up reverses ordered valid filter combinations, with wraparound. Both directions start at the actual current selection after any manual edit.
- With no alternative combination, Up/Down is a no-op and prevents workspace scrolling without claiming success.
- An accepted workspace arrow prevents its browser/native default before that default could apply a second step. Editing exceptions retain defaults and do not mutate the underlying workspace.
- Navigation never requires the user to restore focus to the tab bar. If a render removes a focused control, move focus to a stable existing workspace target using `preventScroll`; ensure it can receive programmatic focus without changing normal Tab traversal.
- Each delivered unmodified keydown is one action, including repeat events. No release event or second listener repeats the same action. Input while rendering updates logical state in event order.
- Tab/Shift+Tab continues its existing tab-bar behavior; elsewhere normal focus traversal remains unchanged.

## Combination Example

Filters appear as Sport [All, Run] followed by Period [Year, Month, Week]. From All/Year, six Down actions result in:

```text
All/Month -> All/Week -> Run/Year -> Run/Month -> Run/Week -> All/Year
```

Up follows the exact inverse from every start. A successful Down followed by Up restores the selection when data and available domains have not changed. No tab switch occurs during this cycle.

## Feedback and Completion

- Cue availability uses the same ownership and action calculation as dispatch, never a focused-tab requirement. Left/Right stays available after vertical navigation when another dashboard is available.
- Flash only the direction of a committed successful action. Start within 250 ms and finish within 1.5 s; restart the timeout for repeated successes.
- Up/Down cannot scroll the page when the workspace owns input. Cues retain their current placement and must not overlap labels, chart data, controls, or exports.
- One accepted view action commits a full valid selection and renders once. Valid empty-result combinations use existing no-data content.
- Async completion from an obsolete tab, view, or data revision must not overwrite the current view. Horizontal navigation does not wait for a pending chart or map render.

## Native Popup Acceptance Gate

Feature-detect select `:open` support and supplement it with open/close/cancel lifecycle tracking. Validate mouse click, Enter/Space, Alt+Down where supported, Escape, same-value selection, blur, and workspace exit. Focus by itself is never a reliable open flag. A closed control must resume workspace arrows immediately after the popup closes.

Automation that cannot interact with an OS popup must report the check as unverified and require manual verification in that browser. A blanket exemption for focused selects does not satisfy this contract. Do not introduce replacement controls or narrow browser support silently.

## Required Observable Cases

Verify Down then Right without refocusing, one action from tab-button arrows, all six combination starts in both directions, manual selection followed by traversal, boundary wrap, no-filter no-op, one-tab no-op, generated-control replacement, modal/text/outside-workspace exclusions, and native select open/closed behavior. Also verify Share/Export still captures the selected view without directional cues obstructing it.