# Data Model: Training Calendar Visual Redesign

## Scope

This feature changes the presentation of the existing derived training-calendar model. It introduces no persisted data, new activity attributes, or external entities. Imported activities remain local and are not mutated.

## Entities

### Calendar Year Model

Represents one complete calendar year in the displayed newest-to-oldest sequence.

| Field | Meaning | Validation / invariant |
|------|---------|------------------------|
| `year` | Calendar year represented | Integer; each year in the inclusive range between newest and oldest activity years appears once. |
| `activityCount` | Number of activities after the selected sport filter | Non-negative integer; may be zero for an intervening year or filter result. |
| `days` | Chronological daily summaries | Contains 365 or 366 entries according to the calendar year. |
| `weeks` | Monday-first visual weeks derived from `days` | Chronological sequence of columns; each week has seven day slots including null alignment slots outside the year. |

### Calendar Day

Represents one real date in a year model.

| Field | Meaning | Validation / invariant |
|------|---------|------------------------|
| `dateKey` | Stable local date identifier | Unique within the multi-year calendar; formatted as a local calendar date. |
| `date` | Local date used for month/week placement and display | Must belong to the parent year. |
| `activityCount` | Activities matching the current sport selection | Non-negative integer; zero means no activity at this filtered view. |
| `intensityLevel` | Relative daily intensity | `0` for no activity; `1`–`5` for active days. |
| `metricValue`, `metricKind` | Activity amount used to derive intensity | Existing aggregation precedence remains duration, then distance, then activity count. |
| `tooltipActivities`, `sports`, `bySport` | Existing detail data for a day | Derived from matching activities; absent measurements remain absent rather than becoming invented values. |

### Calendar Visual State

Presentation-only values used to render the current model.

| Field | Meaning | Validation / invariant |
|------|---------|------------------------|
| `emptyDayColor` | Fill for zero-activity day cells and legend swatch | Shared opaque dark token; rendered relative luminance contrast against the actual cell background is `> 1.0:1` and `<= 1.2:1`. |
| `palette` | Selected active-day color sequence | One of existing green, blue, or fire palettes; five ordered active colors. |
| `sport` | Current activity filter | Existing `All` or an available normalized category. |
| `weekColumn` | Horizontal position of a week | Same column is used by its month-header label and seven daily slots. |

## Relationships and transitions

- One multi-year calendar contains one year model per year in its inclusive date range, newest first.
- A year model contains chronological calendar days and week columns derived from those days.
- A day has zero or more filtered activities; changing sport filter rebuilds the derived day totals and intensity without mutating source activities.
- Palette changes affect active-day fills and the legend; they do not alter the day model or zero-activity color.
- A day can move from active to zero-activity when a filter changes. The same calendar date remains positioned and focusable, but uses the shared inactive visual state.
- The export image represents the currently displayed year models, palette, sport filter, legend, and day detail state, excluding transient tooltip overlays.

## Layout invariants

- Calendar weeks are columns ordered left to right; each column has exactly seven weekday positions.
- Month labels align with the week columns containing the first day of each month.
- All year sections are stacked newest-to-oldest. Their horizontal month header and day grid scroll together.
- One compact Less-to-More legend follows the last year grid and is included in the existing export capture area.
- Zero-activity cells are visually subtle but detectable; keyboard focus remains visible independently of the permanent cell fill.