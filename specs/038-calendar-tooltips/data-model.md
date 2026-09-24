# Data Model: Training Calendar Contrast and Tooltips

## Palette

- `green`: five ordered active color tokens with visibly stronger level 1 than the previous palette.
- `blue`: five ordered active color tokens with visibly stronger level 1 than the previous palette.
- `fire`: existing five-step yellow-to-red palette, preserved.
- `empty`: shared very-light-gray token `#F1F5F9`, independent of palette and distinct from pure white `#FFFFFF`.

Each active level remains an integer from 1 through 5; empty days remain level 0.

## TooltipActivity

A filtered, display-safe summary derived from one source activity:

| Field | Type | Rule |
|---|---|---|
| `id` | string | Stable within the imported dataset when available; otherwise a deterministic day-local fallback is allowed. |
| `name` | string | Activity name, with a safe fallback label when absent. |
| `sport` | `Run`, `Bike`, `Swim`, or `Other` | Uses the existing calendar sport mapping. |
| `durationSeconds` | non-negative number or null | Included only when the source value is valid. |
| `distanceKm` | non-negative number or null | Included only when the source value is valid. |

Null duration/distance fields are omitted from rendered text rather than displayed as zero.

## TrainingDay Extension

Each day retains the existing aggregate fields and adds:

- `tooltipActivities`: ordered `TooltipActivity[]` for activities matching that day, year, and active sport filter.
- `hasTooltipActivities`: true when at least one matching activity exists.

The source activity records remain immutable.

## Local Tooltip State

- `activeDayKey`: date key of the currently hovered/focused day, or null.
- `activeYear`: year block containing the active day, used to prevent cross-year collisions.
- `anchorElement`: current day button used for positioning.
- `visible`: whether the local tooltip is open.

State transitions:

1. Enter/focus active day: build or retrieve its tooltip summary and show the local layer.
2. Move between days: replace content and anchor without updating any global bottom details.
3. Leave/blur day with no related calendar focus: close the local layer.
4. Empty day: show date and no-activity message only, or keep the tooltip closed according to the interaction contract.
