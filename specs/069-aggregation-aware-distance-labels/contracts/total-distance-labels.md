# Total Distance UI Contract

## Scope

This contract covers the existing Distance visualization's chart heading and Peak KPI only. It does not change aggregation controls, chart values, Total Volume, Weekly Average, or export behavior.

## Aggregation Mapping

| Selected aggregation | Chart heading | Average KPI | Average unit | Peak KPI label |
|---|---|---|---|---|
| Daily | Daily Distance | Daily Average | km/day | Peak Day |
| Weekly | Weekly Distance | Weekly Average | km/wk | Peak Week |
| Monthly | Monthly Distance | Monthly Average | km/mo | Peak Month |
| Yearly | Yearly Distance | Yearly Average | km/yr | Peak Year |

## Average Value

- The average is the selected-sport total distance (or all-sport total when All Sports is selected) divided by the number of visible buckets.
- All visible buckets count in the divisor, including periods with zero distance.
- Rounding remains one decimal place.

## Peak Value

- The peak is the maximum bucket total in the current rendered aggregation.
- The peak is the maximum bucket total in the current rendered aggregation, and the card displays the formatted period from that same bucket.
- With All Sports selected, a bucket total is Run + Bike + Swim.
- With a single sport selected, a bucket total is that sport's distance only.
- The visible timeframe is already reflected in the bucket list and MUST constrain the peak.
- Switching aggregation, timeframe, or sport refreshes the peak value and label in the same dashboard render.
- Daily period detail uses the existing day label; weekly detail is shown as "Week of [week-start date]"; monthly detail uses month and year; yearly detail uses the year.
- If multiple buckets tie for the maximum, the first visible bucket is displayed.
- Switching aggregation, timeframe, or sport refreshes the average label/unit/value and peak value/label/period in the same dashboard render.
- Empty data retains the existing zero/empty-state behavior and does not retain an earlier peak.