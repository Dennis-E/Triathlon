# Data Model: Social Export Readability Refinements

This feature adds no persisted data and does not change analytics. It refines transient presentation derived from the currently selected visualization and record model.

## Workout Time Axis Presentation

| Field | Meaning | Rules |
|---|---|---|
| xAxisTitle | Time bucket represented on the horizontal axis | Preserve the selected day/week/month/year wording |
| yAxisTitle | Number of workouts or current measured value | Preserve the existing aggregation and unit |
| axisFontSize | Export label size | At least 30 px in the final PNG |
| axisTextColor | Export-only label color | At least 4.5:1 contrast against the export background |

The live dashboard style and chart data remain unchanged.

## Numbered Calendar Export Series

| Field | Meaning | Rules |
|---|---|---|
| pageNumber | One-based page position | Present on every series image |
| pageCount | Number of images | Consistent across the series |
| years | Calendar years assigned to the page | Every year appears exactly once across all pages |
| scale | Intensity/calendar scale | Identical on every page |
| format | Square or portrait output | Same format/dimensions for every page |

Create a series only when all year labels cannot fit at 30 px without overlap or clipping. Do not omit years or shrink the labels.

## Training Calendar Year Label

| Field | Meaning | Rules |
|---|---|---|
| year | Calendar year represented by a calendar section | Preserve the existing year value exactly |
| fontSize | Export-only year label size | At least 30 px in the final PNG |
| contrast | Year text versus its background | At least 4.5:1 |
| layoutBounds | Allocated year-heading region | Must not overlap day cells, legend, or adjacent years |

## Pace vs. Summary

| Field | Meaning | Rules |
|---|---|---|
| sport | Selected sport | Run, Bike, or Swim; must match the plotted data |
| comparedMetric | Selected vertical-axis metric | Use the existing selected metric label |
| performanceMetric | Horizontal-axis measure | Run/Swim use pace; Bike uses speed, matching actual axis metadata |
| pointSizeMeaning | Bubble-size encoding | Include "Size = Duration" when duration controls point size |
| period | Selected bounded date range, if non-default and useful | May be appended briefly; omit redundant all-time wording |
| axes | Exact x/y axis titles and units | Retain in the chart even when summary prefixes are removed |

## Personal Best Presentation

| Field | Meaning | Rules |
|---|---|---|
| recordIdentity | Discipline/distance or named record | Headline format begins `PB:` and identifies this value |
| bestValue | Current best formatted value | Prominent and unchanged from the record model |
| firstRecord | Earliest available record | Use only when a history has multiple records |
| firstRecordYear | Year of the earliest available record | Omit "since" when unavailable |
| currentRecord | Current best record and formatted value | Supplies the ending value for a multi-record summary |
| sourceType | Official race or activity-derived source when known | Separate concise attribution; do not combine with trend sentence |
| summary | First-to-current text | `From {firstValue} to {currentValue} since {firstYear}` when all fields exist |

A one-record history has no first-to-current summary and no implied improvement. Milestone role names and activity titles are not concatenated into the summary.

## Relationships

- One export target supplies the selected chart data and a presentation summary.
- Axis labels and calendar year labels remain associated with their original plotted data.
- A PB summary derives from one existing chronological record list and does not create or alter records.
- The same generated PNG remains the source for preview and download.
