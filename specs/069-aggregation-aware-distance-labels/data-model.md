# Data Model: Aggregation-Aware Distance Labels

## Scope

No persisted data, import schema, or public model changes are required. The feature reuses the aggregation list and filters already computed during a Distance visualization render.

## Existing Render Data

### Aggregation Period

- **Values**: `daily`, `weekly`, `monthly`, `yearly`.
- **Role**: Selects the distance bucket grouping and the title/peak wording.
- **Validation**: Must be one of the existing aggregation choices.

### Distance Bucket

- **Fields**: Period date/key and distance totals for Run, Bike, and Swim.
- **Role**: Supplies chart values and peak calculation for one rendered period.
- **Validation**: A peak candidate uses the selected sport's distance when a sport is selected; otherwise it sums Run, Bike, and Swim.

### Peak Summary

- **Fields**: Maximum filtered bucket distance, its formatted period, and the label associated with the active aggregation.
- **Role**: Displays the highest daily, weekly, monthly, or yearly distance bucket and identifies when it occurred.
- **Validation**: Empty or zero-valued buckets produce the existing zero display; do not carry a peak from a prior render.

### Average Summary

- **Fields**: Filtered total distance, visible bucket count, rounded average, and aggregation-specific label/unit.
- **Role**: Displays average distance per visible day, week, month, or year.
- **Validation**: Divide by all visible buckets, including buckets with zero distance; use zero if there are no buckets.
The selected aggregation and timeframe produce the `aggregatedList`; the current sport filter determines each bucket's peak candidate. The maximum candidate and its formatted period determine the peak KPI value and detail. The filtered total divided by `aggregatedList.length` determines the average KPI. The selected aggregation also determines the chart title and both KPI labels/units.

## Relationships

The selected aggregation and timeframe produce the `aggregatedList`; the current sport filter determines each bucket's peak candidate; the maximum candidate and selected aggregation determine the peak KPI value and label. The same aggregation selects the Distance chart title.