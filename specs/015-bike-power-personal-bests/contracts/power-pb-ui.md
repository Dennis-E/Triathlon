# UI Contract: Bike Power Personal Bests

## Scope

This contract describes the user-visible behavior inside the existing Personal Bests panel. It does not add a navigation tab or a network interface.

## Bike column

When the imported dataset contains at least one usable Bike power observation, the Bike column exposes a power area with a visible title that distinguishes:

- activity-average power, expressed as `Average power (W)` or equivalent wording; and
- duration-specific power, expressed with the duration and watts, such as `5m` and `W`.

When both sources are available, they appear as separate categories or clearly separate sections. A user must not need to infer the source type from a tooltip alone.

## Record details

Each visible power record exposes, directly or through the existing detail interaction:

- watt value with the `W` unit;
- category or duration;
- date;
- activity name when available; and
- source meaning: activity average or duration-specific effort.

## No-data behavior

- With no usable Bike power data, the power area is omitted or shows a concise explanatory unavailable state; it must not render an empty chart.
- With average power but no duration efforts, average power remains visible and the duration categories are marked unavailable or omitted.
- With duration efforts but no average power, duration categories remain visible without an invented average-power value.

## Data integrity

- Only `Bike` activities contribute to this area.
- Zero, negative, missing, and non-numeric power values are excluded.
- Average power must never be presented as a duration-specific best.
- Existing distance, elevation, longest-activity, run, and swim PB sections keep their current behavior.

## Accessibility and layout

Power labels and units remain readable in the existing desktop and narrow layouts. Dynamic power tiles preserve the existing keyboard-accessible detail interaction and must not overlap neighboring PB sections.
