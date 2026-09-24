# Data Model: Training Calendar Refinements

## Multi-Year Calendar View

A view model containing one `YearBlock` for each represented calendar year.

| Field | Type | Rule |
|---|---|---|
| `years` | ordered array | Every integer calendar year from the newest to the oldest valid activity year, descending; current year first when present, otherwise newest available year first. |
| `palette` | `green`, `blue`, or `fire` | Exactly one shared palette for the complete view; defaults to `green`. |
| `sport` | existing sport filter | Reuses `All`, `Run`, `Bike`, `Swim`, and `Other`. |
| `emptyDayColor` | shared neutral color token | Bright neutral value independent of palette. |

No year-selection state exists in the refined view.

## YearBlock

| Field | Type | Rule |
|---|---|---|
| `year` | four-digit integer | Unique within the view and sorted descending. |
| `days` | ordered array | Contains 365 days or 366 days for leap years. |
| `weeks` | Monday-first grid | Contains alignment placeholders plus every real day exactly once. |
| `activityCount` | non-negative integer | Count after the active sport filter is applied. |
| `empty` | boolean | True when `activityCount` is zero. |

Years with no qualifying activities remain present when they fall between the newest and oldest valid activity years.

## Palette

Each palette contains exactly six visual levels: one shared empty level (`0`) and five active levels (`1` through `5`).

| Palette | Active level order |
|---|---|
| `green` | light green to dark green |
| `blue` | light blue to dark blue |
| `fire` | yellow to amber/orange to red |

The empty level is not derived from any active palette and must remain visibly brighter than level 1.

## State Transitions

1. Dataset import/replacement: derive represented years, reset palette to `green`, preserve existing default sport filter behavior.
2. Palette selection: update the shared palette and repaint all year blocks and legends without changing activity aggregation.
3. Sport selection: rebuild every YearBlock using the selected sport while retaining the selected palette.
4. No data: show an empty view state and no misleading palette controls or year blocks.
