# Power PB and Landing UI Contract

## All-time power profile views

The all-time power profile is one profile visualization with three presentations: compact tile, full-screen detail view, and downloaded image export.

- All presentations use the same profile points: highest watt value per available duration, ordered by duration and spaced evenly as categories on the horizontal axis.
- The horizontal axis represents duration categories, with visible labels such as `1m`, `2m`, `5m`, and `10m`; calendar years/months are not valid profile x-axis ticks.
- The vertical axis represents watts.
- Activity date/title may remain contextual information but cannot drive horizontal position or replace duration tick text.
- Full-screen detail and downloaded export depict the same profile data and duration axis as the tile.
- This profile-specific axis behavior does not change the date-based horizontal axis of chronological PB history charts, including individual power-duration tiles.
- Export continues to use the existing browser-local preview/download flow; no profile data is sent to the analysis API.
- Existing empty/limited profile behavior and PB selection remain unchanged.

## Compact tile presentation

- Hovering anywhere along a profile measurement line shows the same duration, watt, date, and activity tooltip as hovering the point marker in both the compact tile and full-screen detail view.

## Personal Bests dashboard sport header

- At wide desktop/laptop widths, the existing shared sticky Swim/Bike/Run header aligns with the three corresponding columns.
- At one-column mobile widths, hide the shared three-column header and show a sport heading immediately before that sport's PB content.
- On mobile, show sport groups in Run, Bike, Swim order, as requested; repeat a heading for each metric category row so it stays associated with the content below it.
- The Swim elevation cell retains its existing not-applicable message, preceded by the Swim heading on mobile.
- The Bike-only Watt section displays its Bike heading above its power visualization on mobile; it does not create empty Swim or Run power sections.
- Do not clip, overlap, or misassign sport headings and PB content during responsive layout changes.

## Landing Personal Bests card description

- The card description communicates that Personal Best progress covers more than distance, without claiming categories the dashboard does not support.

## Compatibility

The change does not add dashboard tabs, alter navigation or controls, modify PB calculations, add external interfaces, or change the export file format and download flow.
