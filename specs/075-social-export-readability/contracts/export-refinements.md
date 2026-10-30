# Export Refinements Contract

This is a user-visible export contract; it introduces no network API.

## Workout Time

- Keep the selected aggregation and data unchanged.
- Show both axis titles and units in high-contrast text.
- Export labels use at least 30 px in the final 1080 px image; essential plotted values remain at least 36 px.
- Do not use dim gray for axis labels. Gridlines remain subdued.

## Training Calendar

- Preserve all displayed years and their association with their calendars.
- Year labels use at least 30 px in the final image and at least 4.5:1 text contrast.
- If all years cannot fit without overlap or shrinking, automatically use a numbered multi-image series containing every year rather than reducing the year-label size or omitting years.
- Every series page uses the same calendar scale and consistent format/page numbering; each year appears exactly once in the series.

## Pace vs.

- Use a compact factual summary, for example: `Run. Heart rate vs. Pace. Size = Duration`.
- For Bike, say `Speed`, not `Pace`.
- Keep exact axis labels/units, visible year-series legend, and named trend lines in the visualization.
- Include point-size meaning when it encodes duration. Do not add a fitness/efficiency claim.
- Omit verbose prefixes such as `Sport:`, `Metric:`, `Unit:`, `X axis:`, and `Y axis:` from the summary. A concise non-default date range may be appended.

## Personal Best

- Headline identifies the record, e.g. `PB: Run 5 km`.
- Keep the best formatted value visually prominent.
- For multiple records, show one summary: `From 52:14 to 45:00 since 2024` (using actual first/current values and first year). Omit unavailable values and `since` if no first year is known.
- For one record, show the result without a comparison/trend sentence.
- Keep source/event attribution separate and secondary when available. Do not concatenate milestone names and activity titles into the summary.
- Axes, result labels, and explanatory point descriptions stay legible at 360 px image display width.

## Shared Behavior

- Existing square and portrait dimensions, local generation, no-data state, and preview/download identity are unchanged.
- These refinements affect export copies only and do not alter dashboard styles or analysis calculations.
