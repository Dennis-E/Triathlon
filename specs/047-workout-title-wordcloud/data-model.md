# Data Model: Workout Title Wordcloud

## Activity title input

| Field | Type | Source | Rules |
|---|---|---|---|
| `name` | string | Existing normalized activity model (`processedActivities`) | Use existing title text. Ignore empty/whitespace titles and generic missing-title values (`Activity`, case-insensitive). Do not mutate source activities. |

## Eligible word

| Field | Type | Rules |
|---|---|---|
| `word` | string | Normalize Unicode compatibility forms and case; split on punctuation/whitespace; preserve German letters and ß. Exclude numeric-only tokens, empty tokens, and a fixed German/English common-function-word set. |
| `count` | positive integer | Total token occurrences across all activity titles; repeated occurrences in one title count separately. |
| `rank` | positive integer | Sort by `count` descending, then normalized `word` ascending for deterministic ties. |

## Word selection state

| Field | Type | Rules |
|---|---|---|
| `word` | string | Key linking the selected state to an eligible word. |
| `included` | boolean | `true` by default when a word first enters the displayed top-N set. Preserve while it remains in the current set; words removed by reducing N leave the current selection state. |

The selected top-N list is a view over ranked eligible words, limited by slider value and available count. The cloud receives only checked terms and their original counts; filtering never recalculates or changes frequencies. Selection is transient UI state and is not persisted between page reloads or imports.

## Cloud placement outcome

| Field | Type | Rules |
|---|---|---|
| `word` | string | Identifies a checked ranked word supplied to the current cloud render. |
| `placed` | boolean | Ephemeral result from the current layout attempt. The renderer first tries to fit checked terms through responsive sizing/font shrinking. If `false`, the term is named in a visible unplaced-words notice and remains available in the ranked checkbox list. It is not removed from its rank, count, or inclusion state. |

Placement outcomes are recomputed whenever the cloud is redrawn or its responsive canvas dimensions change; they are not persisted.

## Landing feature overview tile

A static, non-interactive presentation item titled “And much more” with an ordered or unordered bullet list containing the labels `Wordcloud` and `…`. It has no activity data, navigation action, or preview asset.
