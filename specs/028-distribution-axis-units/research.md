# Research: Distribution Histogram Axis Units

## Decision: Treat histogram bars and axis labels as separate derived views

- **Rationale**: The distribution buckets already contain numeric `rangeStart`/`rangeEnd` values and counts. The visible axis must be derived from those numeric boundaries, while the bar data continues to use the same bucket counts. This prevents category positions from becoming user-facing values.
- **Alternatives considered**: Changing bucket counts or using the category index as a metric value was rejected because it would misrepresent the underlying distribution.

## Decision: Format each boundary through the selected metric formatter

- **Rationale**: Length, elevation, power, duration, and Pace require different presentation units. A single boundary-formatting path can reuse established metric rules and omit redundant units when the axis title already names them.
- **Alternatives considered**: Formatting all ticks as generic decimals was rejected because it produces the reported mismatch for meters, watts, and `min:ss` values.

## Decision: Use metric boundary values for category-axis tick callbacks

- **Rationale**: The current Histogram chart uses a category axis, where Chart.js may pass category positions such as `0, 1, 2`. The renderer must map each category position back to the corresponding precomputed boundary label, rather than displaying the position itself.
- **Alternatives considered**: Replacing the chart with a linear axis was rejected for this focused correction because bar category alignment and existing overflow/underflow categories can remain stable with a boundary-label callback.

## Decision: Preserve bucket calculations and N/A behavior

- **Rationale**: The request identifies an axis-label defect, not a data or bucketing defect. Existing bucket boundaries, counts, filters, color schemes, and explicit N/A states remain authoritative.
- **Alternatives considered**: Recomputing bucket steps or changing the number of buckets was rejected because it would broaden scope and risk changing distribution meaning.

## Risks and mitigations

- **Risk**: A single displayed boundary can round to the same text as an adjacent boundary. **Mitigation**: de-duplicate visible labels while retaining the underlying bucket array and counts.
- **Risk**: Underflow/overflow buckets do not have two finite boundaries. **Mitigation**: preserve explicit `< value`, `> value`, or `50+` labels for those categories.
- **Risk**: Duration and time-based Pace values can be confused with numeric seconds. **Mitigation**: format visible labels through the established hours/minutes or `min:ss` formatter.
