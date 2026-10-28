# UI Contract: Pace-Ansichten

## Year selection

- The year controls apply to Pace-vs-Metrics views only; other dashboard visualizations keep independent selections.
- Checking or unchecking a year updates that year's points and trend line together.
- The trend-line control remains independent: hiding trend lines does not hide points, and enabling trend lines does not show lines for disabled years.
- The selected state survives sport, metric, date-range, and temporarily empty-data views for the current import.
- A newly available year starts enabled. A new import resets year selection according to the existing import behavior.

## Legend layout

- At medium and wider viewport sizes (768 CSS pixels and above), the year and trend-line controls appear to the right of the chart.
- Below that width, controls may stack below the chart to preserve chart and label readability.
- The legend remains a semantic fieldset with its existing "Years" label, checkbox labels, color markers, and trend-line control.
- The chart remains readable, with no legend overlap, clipped entries, or reduction in its existing fixed chart height.

## Runtime boundary

This is a browser UI contract only. It adds no external endpoint, persisted preference, import format, dashboard tab, or network request.
