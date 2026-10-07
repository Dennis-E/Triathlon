# UI Contract: Lifetime Statistics

## Tab registration

| Item | Contract |
|---|---|
| Tab key | `lifetimeStatistics`, appended after the current last visualization tab. |
| Button ID | `vizTabLifetimeStatistics`, visible label “Lifetime Statistics”, `role="tab"`, `aria-controls="vizPanelLifetimeStatistics"`. |
| Panel ID | `vizPanelLifetimeStatistics`, `role="tabpanel"`, `aria-labelledby="vizTabLifetimeStatistics"`. |
| Activation | Click and the existing ArrowLeft/ArrowRight tab keyboard behavior select the view; opening it focuses the matching tab button. |
| Render dispatch | `src/dashboard-tabs.js` invokes `window.lifetimeStatisticsDashboard.render()` for this tab. |

## Content structure

- A single capture region, `#lifetimeStatisticsCaptureArea`, contains all summary content intended for export.
- A total summary presents distance, moving time, and total workout count as the first visible group.
- A sport breakdown lists only represented supported sports (`Run`, `Bike`, `Swim`) and shows workout count, distance and moving time for each.
- Supporting lifetime measures show recorded elevation, unique active days, longest activity by distance, longest activity by moving time, and separate shoe/bike counts derived from imported gear labels. Do not show gear names or a Bike equipment list.
- Country counts are not rendered.
- Do not add date-range, sport-filter, or persistence controls in this release.

## Data-state presentation

- `#lifetimeStatisticsEmptyState` has `role="status"`; show it when there is no imported activity data and hide normal metric content.
- For distance, moving-time and elevation aggregates, a complete or partial recorded total is displayed without a completeness notification; a metric with no usable source values is displayed as unavailable, not `0`.
- A genuine recorded zero is displayed as zero.
- Workout count includes all processed activity records, including records with missing distance/time values or unknown sport.
- If there are activities but no valid value for one milestone, that milestone displays an unavailable label without suppressing other metrics.
- Display “Shoes used” and “Bikes used” as counts of distinct imported gear labels associated with Run and Bike activities respectively; do not show the labels themselves.

## Responsive and accessible behavior

- Use semantic headings, readable metric labels and units, and a logical keyboard focus order.
- Keep content within the panel width; summary cards may wrap into fewer columns on narrow screens, with no horizontal scrolling.
- All meaningful summary text remains available as HTML text in the capture region; decorative icons do not carry metric meaning.

## Share/Export contract

- Export action calls the established `exportVisualizationTab('lifetimeStatistics')` flow.
- Register `lifetimeStatisticsCaptureArea` as the capture target and make export available only when imported activity data is present.
- The captured region includes the current total, sport breakdown, milestone and equipment summary. Empty state follows the existing standard no-data behavior.
- Register a human-readable tab title and filename slug in `src/export-utils.js`; do not add an external export endpoint or new network request.

## Script loading

- Load `lifetime-statistics-utils.js` before `dashboard-lifetime-statistics.js`.
- Load `dashboard-lifetime-statistics.js` before `dashboard-export.js` and `dashboard-tabs.js` in the established dashboard script sequence.
