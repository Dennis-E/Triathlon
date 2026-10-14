# Data Model: Keyboard Dashboard Navigation

This feature adds transient interface state only. It does not introduce persisted user data, a server-side entity, or a change to imported activity records.

## Visualization

Represents one existing dashboard view.

| Field | Meaning | Constraints |
|---|---|---|
| `id` | Stable identity for the view | Must match one existing visualization tab/panel pair. |
| `active` | Whether the view is currently selected | Exactly one existing view is active while the dashboard is open. |
| `filterControls` | Applicable filter controls within the view | Only visible and enabled controls belonging to this view may respond to dashboard filter navigation. |

## Filter Control

Represents one existing setting that affects a visualization.

| Field | Meaning | Constraints |
|---|---|---|
| `id` | Identity of the control or choice group | Existing dashboard control identity; not a new persistent identifier. |
| `label` | User-facing filter name | Presented with the current value in the active filter summary. |
| `kind` | Interaction type | Existing control semantics are retained: discrete single-choice group, select, range control, or multi-select checkbox collection. |
| `value` | Current selected value or values | Authoritative value already used by visualization rendering. |
| `choices` | Available discrete values, when applicable | Follow visible choice order; discrete single-choice stepping wraps at both ends. |
| `available` | Whether the control can currently be used | Hidden/inactive-view and disabled controls do not receive dashboard-level stepping. |

## Active Filter Summary

Derived presentation of the active visualization's applicable filters.

- Contains each applicable filter's user-facing label and current selected value(s).
- Is displayed above the active visualization.
- Is recalculated from current control state after any accepted filter change; it is not a second source of truth.
- If the view has no filters, it is omitted or displays no filter values, without implying a filter exists.

## Directional Cue

Non-interactive presentation state for one keyboard direction.

| Field | Meaning | Constraints |
|---|---|---|
| `direction` | `left`, `right`, `up`, or `down` | Maps to visualization navigation for horizontal directions and focused-filter value changes for vertical directions. |
| `available` | Whether an action can be performed in the current context | Horizontal cues correspond to available visualization tabs; vertical cues require a focused, enabled filter with a possible value change. |
| `feedbackActive` | Whether the cue is currently flashing/emphasized | Transient; set only after successful navigation/value change and cleared after brief feedback. |

## State transitions

1. A left/right action selects the adjacent visualization in the established circular tab order; the dashboard updates its active view and cues the direction.
2. An up/down action on an eligible focused filter selects the next/previous choice (wrapping for discrete single-choice controls), then runs the existing update/render path, refreshes the active filter summary, and cues the direction.
3. A key press with no eligible action leaves filter values, visualization selection, summary, and success cue state unchanged.
