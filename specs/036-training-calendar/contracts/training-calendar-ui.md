# UI Contract: Training Calendar View

## Tab registration

- Tab key: `trainingCalendar`
- Button ID: `vizTabTrainingCalendar`
- Panel ID: `vizPanelTrainingCalendar`
- Register the tab in `src/tab-navigation.js` and make it reachable through existing keyboard tab navigation.
- Add matching button, panel, ARIA attributes, and dispatch in `index.html`.

## Panel controls

- `trainingCalendarYearSelect`: selects one available calendar year.
- `trainingCalendarSportFilters`: contains `All` and only sports present in the imported data, including `Other` when applicable.
- `trainingCalendarLegend`: explains no activity and intensity levels 1 through 5.
- `trainingCalendarGrid`: contains one focusable day control per real calendar day; alignment placeholders are not interactive.
- `trainingCalendarEmptyState`: explains when the selected year/filter has no qualifying activities.
- `trainingCalendarDetails`: displays the selected or focused day's date, activity count, sports, duration, and distance when available.

## Interaction contract

- Opening the tab renders the latest available year and `All` sport filter.
- Changing year or sport immediately rebuilds the grid and details state.
- Each active day is keyboard reachable and exposes an accessible name containing its date, activity count, and intensity level.
- Hover and focus expose the same day details; focus must not rely on hover-only information.
- Empty days remain visible and expose their date plus "no activity" state.
- A year with no qualifying activities keeps the full grid and shows `trainingCalendarEmptyState`.

## Rendering contract

- Calendar is Monday-first and covers every day of the selected year.
- Intensity class/color is derived only from the utility's `intensityLevel` 0-5.
- No raw imported file data is sent to an external service by this view.
- Narrow viewports may scroll the grid horizontally, but day controls and date labels remain reachable and aligned.
