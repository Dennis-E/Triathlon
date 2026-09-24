# UI Contract: Training Calendar Tooltips

## Palette contract

- Reuse `trainingCalendarPaletteFilters` with exactly `green`, `blue`, and `fire`.
- Green and Blue level 1 must be visibly distinct from the shared bright empty token.
- Empty day cells must use `#F1F5F9`, not `#FFFFFF`, in every palette.
- All five active swatches remain ordered and distinguishable.

## Local tooltip contract

- Use one local layer with ID `trainingCalendarDayTooltip` inside the Training Calendar panel.
- The tooltip is positioned relative to the hovered/focused day button and the nearest calendar panel/container.
- It contains the day date and one separate activity row per matching activity.
- Each row includes activity name and sport, plus duration/distance only when available.
- Tooltip content is replaced when a different day is entered; it must never combine activities from different years.
- Tooltip is bounded with a maximum height and scrolling for large activity lists.
- It closes on pointer leave/blur when no calendar day remains active.
- Keyboard focus exposes the same details as mouse hover.

## Removed global detail contract

- `trainingCalendarDetails` must no longer be rendered or updated.
- No lower global calendar tooltip/detail area may receive day-specific text.
- Existing empty state, sport filters, palette controls, and year blocks remain available.

## Accessibility and responsive behavior

- Day buttons retain accessible names and focus styles.
- The active tooltip is associated with the active day through an accessible description or live-region behavior.
- Tooltip placement must be clamped to the visible calendar panel and remain readable on narrow screens.
