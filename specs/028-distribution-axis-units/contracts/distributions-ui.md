# Distributions UI Contract

## Histogram X-Axis

- Every visible Histogram tick represents a metric value or bucket boundary.
- No Histogram displays unexplained category indices such as `0, 1, 2, 3` when metric boundaries are available.
- Regular ticks never display a full bucket range such as `50-100` as one label.
- Length ticks use km values.
- Elevation gain ticks use m values.
- Duration ticks use the established readable time format.
- Run and Swim Pace ticks use `min:ss`.
- Bike and All Sports Pace ticks use `km/h`.
- Bike Power ticks use W values.
- Open-ended buckets retain labels such as `50+` or `> 200`.

## Axis Titles

Axis titles and tick values use the same metric unit. Individual ticks do not redundantly append the unit when the title already identifies it.

## Data Preservation

Correcting the axis labels does not change bucket boundaries, bucket counts, total activity counts, filters, color scheme, display mode, or N/A behavior.
