# Data Model: Heatmap Hover Count Threshold

This feature adds no persisted data or new domain entity. It changes presentation of the existing heatmap tooltip model.

## Existing entities

### Route segment

- `key`: stable identity for a matched route segment.
- `activityIds`: distinct imported activity identifiers contributing to the segment.
- `count`: number of distinct contributing activities; the displayed threshold source is the corresponding tooltip model's `totalCount`.

### Activity tooltip model

- `segmentKey`: identity of the route segment represented by the tooltip.
- `totalCount`: number of distinct contributing activity IDs, including IDs whose activity summary is unavailable.
- `availableCount`: number of those IDs with a usable activity summary.
- `sampled`: whether the number of available summaries exceeds the display limit.
- `heading`: existing activity-count or sampling explanation.
- `activities`: all available summaries up to the limit, or the selected sample when over the limit.

## Presentation rule

- When `totalCount > 10`, show the top label `# of tracks: N`, where `N` is `totalCount`.
- When the model is sampled, retain its existing `Random 10 of N activities` explanation beneath the top label.
- When `totalCount <= 10` or no valid count is available, show neither count heading; retain the activity rows and other applicable tooltip details.
- Tooltip state is transient and scoped to the currently hovered route segment; no storage or lifecycle changes are introduced.
