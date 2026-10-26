# Feature Specification: Aggregation-Aware Distance Labels

**Feature Branch**: `069-aggregation-aware-distance-labels`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "In der ersten Visualisierung bleibt es bei Peak Week / Weekly Distance, auch wenn man Monat und Jahr nutzt. Passe dies an: Bei Monatsansicht soll Monthly Distance usw. angezeigt werden."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Match distance labels to the selected aggregation (Priority: P1)

As an athlete viewing the Distance visualization, I want its title, average, and peak summary to match the selected daily, weekly, monthly, or yearly view, and I want to know which period produced the peak.

**Why this priority**: Labels that remain weekly while the chart displays monthly or yearly data are misleading and reduce confidence in the visualization.

**Independent Test**: With activity data spanning multiple days, weeks, months, and years, switch the Distance visualization between all aggregation options and verify that the chart title and peak card use the selected period and the peak equals the largest visible bucket.

**Acceptance Scenarios**:

1. **Given** the Distance visualization is set to the daily view, **When** its chart and KPI cards are displayed, **Then** the title is "Daily Distance", the average is "Daily Average" in km/day, and the peak is labeled "Peak Day" with its date.
2. **Given** the Distance visualization is set to the weekly view, **When** its chart and KPI cards are displayed, **Then** the title is "Weekly Distance", the average is "Weekly Average" in km/wk, and the peak is labeled "Peak Week" with the week identified.
3. **Given** the Distance visualization is set to the monthly view, **When** its chart and KPI cards are displayed, **Then** the title is "Monthly Distance", the average is "Monthly Average" in km/mo, and the peak is labeled "Peak Month" with its month and year.
4. **Given** the Distance visualization is set to the yearly view, **When** its chart and KPI cards are displayed, **Then** the title is "Yearly Distance", the average is "Yearly Average" in km/yr, and the peak is labeled "Peak Year" with its year.
5. **Given** activities in multiple visible buckets, **When** the user changes the aggregation, **Then** the average equals total filtered distance divided by the number of visible buckets and the peak amount and period identify the same largest bucket.
6. **Given** the user changes aggregation, timeframe, or sport, **When** the visualization updates, **Then** all three KPI descriptions, units, values, and peak period update in the same render without requiring a page reload.

### Edge Cases

- When no data is available for the selected aggregation, the existing empty-state behavior remains unchanged and labels still describe the selected period.
- When the user switches between periods repeatedly, neither label nor peak value may retain state from a previously selected period.
- The existing weekly wording remains unchanged when the weekly view is active.
- The sport filter and selected timeframe apply to the buckets used to calculate the peak.
- The sport filter and selected timeframe apply consistently to average and peak calculations.
- If all visible buckets have zero distance for the selected sport, no peak period is claimed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Distance visualization MUST show a chart title and peak label that match its currently selected daily, weekly, monthly, or yearly aggregation.
- **FR-001**: The Distance visualization MUST show a chart title, average label and unit, and peak label that match the selected daily, weekly, monthly, or yearly aggregation.
- **FR-002**: Daily aggregation MUST use "Daily Distance", "Daily Average", "Peak Day", and km/day.
- **FR-003**: Weekly aggregation MUST use "Weekly Distance", "Weekly Average", "Peak Week", and km/wk.
- **FR-004**: Monthly aggregation MUST use "Monthly Distance", "Monthly Average", "Peak Month", and km/mo.
- **FR-005**: Yearly aggregation MUST use "Yearly Distance", "Yearly Average", "Peak Year", and km/yr.
- **FR-006**: Changing aggregation, timeframe, or sport MUST update the title, average label/unit/value, peak label/value, and peak period in the same view update without a page reload.
- **FR-007**: The peak value MUST equal the largest distance bucket in the selected aggregation, timeframe, and sport filter, and MUST identify that bucket's period.
- **FR-008**: The average value MUST equal the filtered total distance divided by the number of buckets displayed for the selected aggregation and timeframe; zero-distance buckets MUST count in the divisor.
- **FR-009**: This change MUST NOT alter aggregation choices, total-volume calculation, chart bucket values, or existing empty-state and export behavior.

## Key Entities *(include if data is involved)*

- **Aggregation period**: The currently selected time grouping (daily, weekly, monthly, or yearly) that determines the chart buckets and period-specific labels.
- **Distance bucket**: The distance total for one day, week, month, or year after applying the active timeframe and sport filter.
- **Peak summary**: The largest distance bucket for the active aggregation period, timeframe, and sport filter.
- **Average summary**: Filtered total distance divided by the number of visible buckets for the active aggregation and timeframe.
- **Peak summary**: The largest distance bucket and its period for the active aggregation, timeframe, and sport filter.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of checks for daily, weekly, monthly, and yearly views, the chart title and peak label correspond to the active aggregation period.
- **SC-001**: In 100% of checks for daily, weekly, monthly, and yearly views, the title, average label/unit, and peak label correspond to the active aggregation.
- **SC-002**: In 100% of aggregation changes, the title, average, peak, and peak period update in the same view update without a page reload.
- **SC-003**: In 100% of test datasets, the average equals the filtered total divided by visible bucket count and the peak amount/period match the same maximum bucket.
- **SC-004**: Total-volume and chart-bucket behavior and existing empty-state/export behavior remain unchanged.

## Assumptions

- The existing Distance visualization supports daily, weekly, monthly, and yearly aggregation; all four options use matching chart and peak labels.
- "Weekly Distance" refers to the chart title, not the Total Volume KPI, which continues to represent the sum across the selected timeframe.
- Existing English label style is retained, and the peak metric follows the active aggregation so the label remains accurate.
- Existing English label style is retained; peak periods reuse the corresponding bucket's existing formatted label, with weekly periods identified by their Monday start date.
- No aggregation options are added or removed; total-volume and chart-bucket calculations remain unchanged. The average is normalized by the number of displayed buckets.