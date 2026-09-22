# Research: Power PB Chart Improvements

## Decision 1: Reuse the shared floating `pbTooltip` for the all-time profile

**Decision**: Attach hover handlers to each profile point (and a transparent hit-area
per point, matching the pattern already used for duration-tile PB points) that call the
existing `showPowerPbTooltip(e, pb, rank, total, color, durationLabel)` / `movePbTooltip`
/ `hidePbTooltip` functions and the shared `#pbTooltip` DOM element.

**Rationale**: `showPowerPbTooltip` already renders duration, watts, date, and window
context in the exact shared tooltip used elsewhere in Personal Bests. Reusing it avoids
a second tooltip implementation and keeps visual/behavioral consistency (position
clamping, hide-on-mouseleave) for free.

**Alternatives considered**:

- Native SVG `<title>` tooltips: rejected because they are inconsistent with the rest
  of the PB UI (no styling control, inconsistent browser delay/positioning).
- A new profile-specific tooltip element: rejected as unnecessary duplication when the
  shared tooltip already supports the required fields.

## Decision 2: Compute min/max watts as part of the profile data, not just view code

**Decision**: Extend `buildAllTimePowerProfile` in `src/power-pb-utils.js` to return
(or a small companion helper to derive) the minimum and maximum `watts` among the
returned points, alongside the existing point list.

**Rationale**: The profile points are already the single source of truth for what gets
plotted; deriving min/max in the same reusable module keeps the y-axis label logic
trivial and testable in Jest without duplicating "which points are plotted" logic in
`index.html`.

**Alternatives considered**:

- Compute min/max inline in `index.html` from the same `profilePoints` array: rejected
  because it is trivial either way, but keeping the derivation next to
  `buildAllTimePowerProfile` (or as an exported pure helper) makes it directly unit
  testable per Constitution Principle II/III, consistent with how existing power-pb
  logic is tested.

## Decision 3: Fixed 5-minute threshold for x-axis label thinning, using existing durations

**Decision**: For the all-time profile's x-axis, always render the label for the
shortest available duration; render labels for every available duration whose
`durationSeconds >= 300` (5 minutes); hide labels for any other available duration.
Points and the connecting line remain plotted regardless of label visibility.

**Rationale**: This matches the literal, explicit rule in the request ("only show
[shortest], then starting from 5min again... leave out 5,10,20 seconds and 1 min") and
maps cleanly onto the existing supported duration set (5s, 30s, 1m, 2m, 5m, 10m, 20m,
60m): only 30s/1m/2m are hidden, 5s (shortest) and 5m-60m are labeled. It requires no
dynamic text-measurement/collision logic, keeping the change purely presentational.

**Alternatives considered**:

- Dynamic overlap detection (measure rendered label widths, hide colliding ones):
  rejected as unnecessary complexity for a fixed, known set of eight durations, and it
  would make the exact label set less predictable/testable.
- Rotating or shrinking labels instead of hiding them: rejected because the user
  explicitly asked to leave out specific labels, not to reformat them.

## Decision 4: Give duration tiles the same chart, reusing existing shared chart helpers

**Decision**: Replace each duration tile's static "Current best" value/history text
with an inline SVG chart built from the existing shared helpers already used by
`renderRecordCard` and the pace/duration PB tiles: `appendTimelineAxes`,
`appendYAxisLabel`, `appendCurrentBest`, plus per-point hit-areas wired to
`showPowerPbTooltip`/`movePbTooltip`/`hidePbTooltip`. The x-axis is time (activity
date), the y-axis is watts for that one duration, matching the axis/callout/tooltip
conventions of the other tiles exactly.

**Rationale**: This is the most direct way to satisfy "same logic and layout as the
other PB tiles" — it reuses the exact functions that define that layout today, instead
of re-implementing a visually-similar-but-different chart.

**Alternatives considered**:

- Build a separate, duration-tile-specific chart renderer: rejected because it would
  duplicate logic already proven correct and tested for the other tiles, risking visual
  drift.
- Keep the static summary and only add a sparkline: rejected because the request asks
  for the same interactive chart pattern (axes, callout, tooltip), not a decorative
  addition.

## Decision 5: Preserve the existing full-screen detail button unchanged

**Decision**: Keep `appendPbDetailButton`/`openPbDetail` wiring on each duration tile
exactly as-is; only the inline (non-full-screen) tile body changes from static text to
the shared chart.

**Rationale**: The full-screen detail view already renders a correct larger chart from
the same `allPbs` records; the spec explicitly requires it keep working. No changes to
its data or triggering are needed.

**Alternatives considered**:

- Rebuild the detail view to match the new inline chart pixel-for-pixel: rejected as
  out of scope; the detail view already satisfies its own acceptance criteria and nothing
  in the request asks to change it.
