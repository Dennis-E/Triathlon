# Research: Pace-Ansichten verfeinern

## Decision: Existing year-selection state remains the source of truth

The Pace-vs-Metrics dashboard already tracks disabled years in `disabledPaceMetricsYears` in [src/dashboard-scatter.js](../../src/dashboard-scatter.js). It preserves those choices across sport, metric, date-range, and empty-data changes, enables years that appear for the first time, and clears the state on the existing new-import reset path.

**Rationale**: The requested scope is the views within "Pace vs ...". The current behavior already matches this requirement, and [dashboard-scatter-years.test.js](../../__tests__/dashboard-scatter-years.test.js) covers those transitions. Avoid adding another store or broadening year filters to other dashboard tabs.

**Alternatives considered**: Persisting the selection across all dashboard visualizations was explicitly excluded by the user. Saving the selection across page reloads or imports is not required.

## Decision: Keep the custom DOM legend and place it beside the chart at medium widths

The chart disables the Chart.js legend and renders year checkboxes and the trend-line toggle in the separate `paceMetricsTrendControls` fieldset. Before this change, the chart and fieldset stacked below the Tailwind `lg` breakpoint and sat in a flex row above it. The implemented layout uses `md` (768 CSS pixels) for the side-by-side breakpoint and retains stacking below it. The chart wrapper uses `shrink-0` below `md` to retain its 420-pixel height and `md:flex-1` above it to share available width; the fieldset keeps its readable fixed width.

**Rationale**: The legend includes interactive year controls and a separate trend-line control, which the built-in Chart.js legend does not provide. The current `lg` breakpoint leaves the legend below the chart across a wide range of tablet and compact desktop widths.

**Alternatives considered**: Replacing the custom controls with the Chart.js legend would lose the current checkbox and trend-line interactions. Keeping the `lg` breakpoint would leave the reported below-chart layout in place for widths between 768 and 1023 pixels.

## Decision: No new interface or data-processing layer

The work is confined to the existing Pace-vs-Metrics panel, its dashboard orchestration, and validation. There is no external API, persistence layer, new tab, import change, or new dependency.

**Rationale**: The existing architecture is a static browser app, and this feature only changes the layout of an existing visualization while preserving its existing selection behavior.

**Alternatives considered**: A reusable module or service would add an abstraction without shared business logic to own.
