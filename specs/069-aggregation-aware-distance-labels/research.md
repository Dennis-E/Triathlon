# Research: Aggregation-Aware Distance Labels

## Decision 1: Use the active aggregation for chart and peak labels
- **Decision**: Derive the Distance chart title, average KPI label/unit, and peak KPI label from the selected aggregation. Daily uses Daily Distance / Daily Average (km/day) / Peak Day; weekly uses Weekly Distance / Weekly Average (km/wk) / Peak Week; monthly uses Monthly Distance / Monthly Average (km/mo) / Peak Month; yearly uses Yearly Distance / Yearly Average (km/yr) / Peak Year.
- **Rationale**: The existing UI exposes all four aggregation choices, while the chart heading, average KPI, and peak KPI were fixed to non-matching wording.
- **Evidence**: `index.html` defines the Distance heading, Daily/Weekly/Monthly/Yearly controls, and Peak Week KPI. `src/dashboard-core.js` uses `getAggregatedData()` for the chart but independently recomputes peak volume by week.
- **Alternatives considered**: Change only the peak wording while leaving its value weekly. Rejected because it would make monthly and yearly peak labels inaccurate.

## Decision 2: Calculate peak from the displayed aggregate buckets

- **Decision**: Calculate the peak as the largest sport-filtered total in the `aggregatedList` already produced for the current render.
- **Decision**: Calculate the peak as the largest sport-filtered total in the `aggregatedList` already produced for the current render, and display that bucket's formatted period. Prefix weekly periods with "Week of" to make the week-start date unambiguous.
- **Rationale**: These buckets already reflect the selected aggregation and timeframe. Summing only the selected sport or all supported sports preserves current sport-filter semantics and avoids a second, divergent date-range aggregation.
- **Alternatives considered**: Add separate daily, weekly, monthly, and yearly peak aggregators. Rejected because it duplicates existing aggregation paths and creates opportunities for mismatched timeframe boundaries.

## Decision 3: Keep other KPIs and exports unchanged

- **Decision**: Keep Total Volume, chart bucket values, and the existing export mechanism unchanged. Calculate the average as filtered total distance divided by the number of visible buckets for the selected aggregation.
- **Rationale**: Total Volume remains the sum across the selected timeframe. The average must use the same visible periods as the chart, including zero-distance buckets.
- **Alternatives considered**: Rename Total Volume to "Weekly/Monthly/Yearly Distance". Rejected because the displayed value is the total across the selected timeframe, not one individual aggregation bucket.
- **Alternatives considered**: Keep the KPI as a weekly average in every mode. Rejected because its label and unit would not describe daily, monthly, or yearly views.

## Unknowns

- None. The existing UI control values, render path, and peak calculation are present in the repository and provide the required behavior context.