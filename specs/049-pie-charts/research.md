# Research: Pie Charts

## R1 – Chart rendering

- **Decision**: Render with the already loaded Chart.js (`type: 'pie'`), with a slate-900 slice border (2 px) for clear separation, `hoverOffset` for emphasis, a small inline Chart.js plugin that draws percentage labels inside slices ≥ 5 %, and a custom HTML legend next to/below the chart.
- **Rationale**: Chart.js is already on the page, supports pie charts natively, provides tooltips (hover/tap), and is used by the other chart tabs, so the export flow (html2canvas) already handles its canvases. An inline plugin avoids a new CDN dependency (e.g. chartjs-plugin-datalabels).
- **Alternatives considered**: Doughnut with center total (visually attractive but the user explicitly asked for a pie); SVG hand-rendering (more code, no tooltip support); chartjs-plugin-datalabels (new CDN dependency for one feature).

## R2 – Grouping numeric dimensions

- **Decision**: Reuse `distributionUtils.computeDistributionBuckets(values, { metricKey, sport, targetBucketCount: 6 })` for Duration, Pace, Length, and Power, then assign each activity to its bucket and aggregate the active measure. Export the existing `findBucketIndexForValue` from `distribution-utils.js` (additive, non-breaking). Empty buckets (value 0) are dropped.
- **Rationale**: Keeps range boundaries and labels consistent with the Distributions tab (spec assumption) and its IQR overflow handling. A target of 6 regular buckets plus optional underflow/overflow keeps numeric pies at ≤ 8 slices without needing "Other".
- **Alternatives considered**: Fixed hand-picked ranges per sport (inconsistent with Distributions, more maintenance); quantile slices (equal-count slices make the Activities measure meaningless).

## R3 – Pace with All Sports

- **Decision**: For All Sports, use `distributionUtils.getAllSportsPaceValue` (normalized speed in km/h) and label ranges with `km/h`; for a single sport use the sport's native pace metric and units (min/km, km/h, min/100m) via `formatMetricValue`.
- **Rationale**: Matches the existing cross-sport convention (spec US2 scenario 2) and avoids mixing units in one pie. Since the normalized value is speed in km/h, labelling it with that unit is accurate.
- **Alternatives considered**: Disable Pace for All Sports (removes a valid combination); plain unitless numbers as in Distributions labels (less readable).

## R4 – Measures

- **Decision**: `count` = number of activities; `time` = sum of `activity.duration` (seconds; imported from the `Bewegungszeit`/`Moving Time` column, i.e. moving time); `distance` = sum of `activity.distance` (km). Activities with non-positive time/distance contribute 0 to that measure but are still part of the group for the count; groups whose value is 0 are dropped.
- **Rationale**: Directly maps to fields already on `processedActivities`; consistent with workout-time and equipment visualizations.
- **Alternatives considered**: Swim distance in meters (inconsistent sums across sports); elapsed time (not available separately).

## R5 – Equipment grouping and slice limit

- **Decision**: Group by trimmed `activity.equipment`; empty → "No equipment". Sort descending by value of the active measure (ties alphabetically). With more than 8 groups, keep the top 7 and merge the rest into "Other" (always last).
- **Rationale**: Satisfies FR-006/FR-007 and SC-005; deterministic ordering for tests.
- **Alternatives considered**: Exclude "No equipment" (hides share of untagged training); unlimited slices (unreadable).

## R6 – Colour schemes

- **Decision**: Slice colors are sampled evenly along a gradient: "On fire" uses `distributionUtils.getFireGradientColor(i/(n-1))`; "Monochrome blue" uses a pie-specific light-to-dark blue gradient (#BFDBFE → #3B82F6 → #1E3A8A) defined in `pie-chart-utils.js`. A single slice uses the middle of the gradient. "Other" uses neutral slate (#64748B).
- **Rationale**: The existing Distributions "monochrome-blue" is a single flat color, which cannot distinguish slices (spec US3 scenario 3). Gradient + border keeps adjacent slices distinguishable.
- **Alternatives considered**: Categorical palettes (does not match requested schemes).

## R7 – Export integration

- **Decision**: Register `pieCharts` in every map of `src/dashboard-export.js` (capture target `pieChartsCaptureArea` containing chart + legend + summary, exportable flag via `pieChartsEmptyState`, view IDs, control groups and context: Dimension, Measure, Sport, Colour scheme).
- **Rationale**: Constitution III requires working Share/Export with data/no-data behavior for every new tab.
- **Alternatives considered**: Capture canvas only (would omit legend required by FR-011).

## R8 – Tab and landing integration

- **Decision**: Tab key `pieCharts`, button `vizTabPieCharts`, panel `vizPanelPieCharts`, appended to `TAB_ORDER` after `wordcloud`. Landing: add `<li>Pie charts</li>` before `<li>…</li>` in `#andMuchMoreTile`.
- **Rationale**: Follows AGENTS.md tab-change rule and existing naming conventions.
