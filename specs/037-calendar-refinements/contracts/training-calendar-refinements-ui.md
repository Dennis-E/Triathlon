# UI Contract: Training Calendar Refinements

## Existing tab and panel

- Reuse tab key `trainingCalendar`, button ID `vizTabTrainingCalendar`, and panel ID `vizPanelTrainingCalendar`.
- Do not add a second visualization tab.

## Controls

- `trainingCalendarPaletteFilters`: contains exactly three controls with values `green`, `blue`, and `fire`.
- The default selected control is `green`.
- There is no `trainingCalendarYearSelect` in the refined view.
- Existing sport filter behavior remains available and applies to every year block.

## Year blocks

- `trainingCalendarYears`: contains one block for every calendar year from the newest to the oldest valid activity year, including empty intermediate years, ordered newest to oldest.
- Each block has a year heading and a complete `trainingCalendarGrid`-equivalent day grid.
- Empty year blocks remain visible when they belong to the represented year range.
- A no-data state replaces the year blocks and palette controls when no activities are imported.

## Visual levels and legends

- Empty day cells use one bright neutral style shared by all palettes.
- Active cells use exactly five levels from the selected palette.
- The legend identifies the empty state and all five active levels.
- Fire's legend and cells progress from yellow through orange to red.

## Accessibility and responsive behavior

- Palette controls expose selected state through `aria-pressed` or an equivalent accessible state.
- Year headings remain readable when the day grid scrolls horizontally.
- Every day cell retains its date label, keyboard focus behavior, and existing details behavior.
- Palette selection does not remove or reorder sport controls or day details.
