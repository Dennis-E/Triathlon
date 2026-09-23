# Research: Distribution Labels and Color Schemes

## Decision: Keep the feature inside the existing static-browser surfaces

- **Rationale**: The Distributions tab is already split between `src/distribution-utils.js` for pure formatting/bucket/color helpers, `src/dashboard-distributions.js` for render state and Chart.js orchestration, and `index.html` for the controls and chart container. This matches the repository constitution and avoids a new module or dependency.
- **Alternatives considered**: A new chart component or frontend build dependency was rejected because the repository is intentionally a static browser app with classic script loading.

## Decision: Add color-scheme state to the Distributions renderer

- **Rationale**: The renderer already calculates fire colors for bars and line points. A session-scoped selection can reuse that path and remain active when metric, sport, mode, or date range changes because those actions already call `renderDistributionsChart()` without recreating module state.
- **Alternatives considered**: Persisting the selection in local storage was rejected because the feature specifies a page-session default and the app currently keeps distribution controls in memory.

## Decision: Use Chart.js point-style legend configuration

- **Rationale**: `src/dashboard-core.js` already configures legends with `labels.usePointStyle: true` and `labels.pointStyle: 'circle'`. The same configuration is the established local pattern for filled circular legend markers.
- **Alternatives considered**: Custom HTML legends were rejected because they would duplicate Chart.js behavior and create a second legend state to maintain.

## Decision: Treat All Sports + Histogram as an explicit N/A state

- **Rationale**: The requested behavior explicitly requires N/A for the combined histogram. The renderer already has a destroy, hide-canvas, empty-state, and count-update path for unsupported combinations; the new guard can run before filtering and prevent stale charts.
- **Alternatives considered**: Rendering a combined histogram was rejected because All Sports Pace contains mixed units and a combined histogram can imply comparability that the data does not provide. Allowing a histogram when only one sport happens to be present was also rejected because the control selection, not the current sample composition, defines the view contract.

## Decision: Keep values numeric and change only display formatting

- **Rationale**: Bucket boundaries and counts must remain stable. Duration labels can use the existing hours/minutes formatter; Bike Pace labels can round only at presentation time; units belong in axis titles while Pace bucket labels stay unit-free.
- **Alternatives considered**: Converting stored values or rebuilding bucket calculations around formatted strings was rejected because it risks changing distribution semantics and breaks numeric line axes.

## Decision: Add an explicit metric-axis label map and mixed-unit Pace title

- **Rationale**: A single map makes Length, Duration, Elevation gain, Power, and sport-specific Pace units consistent. All Sports Pace must disclose mixed units rather than selecting one sport's unit.
- **Alternatives considered**: Scattering metric-specific conditionals across Chart.js options was rejected because it would make future label changes harder to audit.

## Decision: Handle the Length `50+` label at display time for the open-ended bucket

- **Rationale**: Existing bucket computation already creates an overflow bucket only when needed. The requested label changes that bucket's visible text without forcing a new category into datasets that do not reach it.
- **Alternatives considered**: Always appending a `50+` bucket was rejected because it would add empty categories and alter the visual distribution for shorter datasets.

## Risks and mitigations

- **Risk**: Line charts use numeric x-values, so bucket labels are not automatically used as tick labels. **Mitigation**: plan an x-axis tick callback or equivalent formatter that resolves the numeric bucket position back to the display label, including `50+`.
- **Risk**: All Sports + Histogram could leave stale Chart.js content visible. **Mitigation**: make the N/A branch destroy the chart, hide the canvas, show the empty state, and set the count before any data rendering.
- **Risk**: Monochrome blue could recolor sport identity strokes inconsistently. **Mitigation**: define the contract so all data-color cues use the selected palette while legend entries remain distinguishable and tests verify palette selection does not alter values or labels.
