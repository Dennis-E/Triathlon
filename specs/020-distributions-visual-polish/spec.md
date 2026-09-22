# Feature Specification: Distributions Visual Polish

**Feature Branch**: `020-distributions-visual-polish`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "2) on the histogram the following updates: a) start the view with the line-chart for all sports. b) on duration for all sports there are funny buckets like 17 minutes, 2h 13 min - make these clean like full 10 minutes for example c) in pace write the unit (min/km / km/h) not at every label in the x axis but on the "Pace" label for the axis. d) in swim pace we also need a bucket for "smaller than" on the left hand side as these are extreme fast swims due to current. Also inverse the scale here. e) in principle in all distributions use a colour scheme from yellow (slow / short etc.) to red on the right with the fast / long values. a "fire" colour scheme f) do not show elevation gain for swim. make it N/A"

**Note**: The user's request also included a separate item (1) about slow data-ingestion/Bike-power-extraction performance. Per explicit user decision during this session, that topic is out of scope for this spec and will be investigated/specified separately.

## Clarifications

### Session 2026-09-22

- Q: Should the new "smaller than" underflow bucket (FR-007) apply to all metrics, or only to Pace? → A: Only to Pace (Run/Swim); other metrics (Length, Duration, Elevation gain, Power) do not get an underflow bucket.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Distributions opens on the combined Line view (Priority: P1)

An athlete opening the Distributions tab for the first time wants to immediately see the overall shape of their training across all sports, rather than having to manually switch from a bar histogram to the line view every time.

**Why this priority**: This is the default first impression of the tab; getting it right affects every subsequent interaction and was explicitly called out as the desired starting state.

**Independent Test**: Open the Distributions tab on a fresh session (no prior interaction with its controls) and verify it renders with "All Sports" and "Line" display mode already selected, showing per-sport lines.

**Acceptance Scenarios**:

1. **Given** the Distributions tab has not yet been interacted with in the current session, **When** the user opens it, **Then** the sport filter is "All Sports" and the display mode is "Line", showing one line per sport with qualifying data.
2. **Given** the user manually changes the sport filter or display mode, **When** they navigate away and back to the Distributions tab within the same session, **Then** their manually chosen filter/mode is preserved (the default only applies to the tab's first render).

---

### User Story 2 - A consistent "fire" color scheme shows slow/short vs. fast/long at a glance (Priority: P1)

An athlete looking at any metric's distribution wants a consistent visual cue — cooler (yellow) colors for slower/shorter values, warmer (red) colors for faster/longer values — so they can immediately tell which end of the chart represents better performance or greater distance/duration, without reading every axis label.

**Why this priority**: This is a cross-cutting visual language applied to every chart in the tab; establishing it consistently is foundational to how all other refinements (especially the pace-axis orientation in User Story 5) read correctly.

**Independent Test**: Open Distributions for each metric and confirm bars/line points use a yellow-to-red gradient, with yellow consistently at the slower/shorter end and red consistently at the faster/longer end, in both Histogram and Line modes.

**Acceptance Scenarios**:

1. **Given** any metric is selected in Histogram mode, **When** the chart renders, **Then** bars are colored on a yellow-to-red gradient positioned so slower/shorter values are yellow and faster/longer values are red.
2. **Given** any metric is selected in Line mode with a single sport or combined series, **When** the chart renders, **Then** the line/points use the same yellow-to-red gradient convention.
3. **Given** "All Sports" + Line mode (multiple per-sport lines), **When** the chart renders, **Then** each sport's line still individually reflects the slow-to-fast/short-to-long gradient along its own points, while remaining visually distinguishable per sport (e.g., via the existing per-sport legend).

---

### User Story 3 - Duration buckets use clean, round time increments (Priority: P2)

An athlete looking at the Duration distribution wants bucket ranges like "10-20 min" or "1h-1h 10m", not odd values like "17 min-23 min" or "2h 13m-2h 41m".

**Why this priority**: Confusing bucket boundaries undermine the readability improvements already made in `019-distributions-refinements`; this is a refinement of that existing behavior rather than new functionality.

**Independent Test**: Open the Duration metric with a dataset spanning a wide range of durations and confirm every regular bucket boundary falls on a round time value (e.g., a multiple of 5, 10, 15, 30, or 60 minutes), never an arbitrary number of minutes/seconds.

**Acceptance Scenarios**:

1. **Given** the Duration metric is selected, **When** regular bucket boundaries are computed, **Then** every boundary is a round time value in minutes (e.g., a multiple of 10 minutes) rather than an arbitrary number of minutes and seconds.
2. **Given** a dataset whose duration range would naturally require larger or smaller boundaries to stay within the usual 10-15 regular buckets, **When** buckets are computed, **Then** the chosen round increment adapts (e.g., 5, 10, 15, 30, or 60 minutes) while remaining a clean, whole time value.

---

### User Story 4 - Pace's unit appears once, on the axis title (Priority: P2)

An athlete looking at the Pace distribution wants to see the unit (e.g., "min/km", "min/100m", "km/h") once, next to the "Pace" axis title, instead of repeated on every single bucket label along the x-axis.

**Why this priority**: This is a readability cleanup that reduces visual clutter on an already information-dense axis; it doesn't change what data is shown, just where the unit text appears.

**Independent Test**: Open the Pace metric and confirm the axis title reads "Pace (min/km)" (or the applicable unit) while individual bucket/tick labels along the x-axis show only the numeric/time value, not the repeated unit text.

**Acceptance Scenarios**:

1. **Given** the Pace metric is selected for a single sport, **When** the chart renders, **Then** the x-axis title includes that sport's pace/speed unit exactly once, and bucket labels along the axis omit the repeated unit text.
2. **Given** the Pace metric is selected with "All Sports" (combined, unit-less display per `018`'s FR-005a), **When** the chart renders, **Then** the axis title indicates the combined nature of the units (e.g., a generic "Pace" title) since no single unit applies across sports.

---

### User Story 5 - Extreme fast Pace values get their own "smaller than" bucket, oriented consistently with the fire color scheme (Priority: P2)

An athlete swimming with strong current assistance occasionally posts extremely fast pace values that are outliers on the low end. The athlete wants those extreme values grouped into their own "smaller than X" bucket (mirroring the existing "greater than X" overflow bucket from `019-distributions-refinements`), scoped to the Pace metric, and wants the Pace axis ordered so that faster values consistently sit on the "fast" (red) end of the fire color scheme from User Story 2, matching how Duration/Length/Elevation already put "more/longer" on the red end.

**Why this priority**: Without this, extremely fast outliers either distort the regular bucket range (the same problem `019` solved for high-end outliers) or, if unaddressed, visually contradict the fire color scheme's slow-to-fast convention for time-based pace values (where a smaller number means faster).

**Independent Test**: Import a dataset with a Swim activity whose pace is an extreme outlier on the fast end, open the Pace metric, and verify a "< X" bucket appears on the appropriate end of the chart, and that faster pace values are positioned toward the same red/fast end used by every other metric.

**Acceptance Scenarios**:

1. **Given** the Pace metric's qualifying values contain extreme low-end outliers (per the same statistical rule already used for high-end outliers in `019`), **When** buckets are computed, **Then** those outliers are grouped into one additional "smaller than [first regular boundary]" bucket instead of stretching the regular buckets to reach them.
2. **Given** the Pace metric is selected for a single sport, Run or Swim (time-per-distance units, where a smaller number means faster), **When** the chart renders, **Then** the axis order is arranged so faster (numerically smaller) values appear on the same "fast" end that the fire color scheme marks red, consistent with how Bike's pace (km/h, where a larger number means faster) already reads.
3. **Given** a dataset with no low-end outliers for Pace, **When** buckets are computed, **Then** no "smaller than" bucket is created, consistent with how the existing "greater than" overflow bucket only appears when needed.
4. **Given** any metric other than Pace (Length, Duration, Elevation gain, Power), **When** buckets are computed, **Then** no "smaller than" underflow bucket is ever created for that metric, regardless of how its low-end values are distributed.
5. **Given** the Pace metric is selected with "All Sports" (per-sport lines sharing one axis, per `019`'s design), **When** the chart renders, **Then** the axis keeps its existing, unreversed shared orientation — axis reversal only applies to a single Run or Swim sport selection, since Bike's naturally-ascending orientation cannot share one linear axis with a reversed Run/Swim orientation at the same time.

---

### User Story 6 - Elevation gain is not shown for Swim (Priority: P3)

An athlete looking at the Elevation gain distribution with Swim activities included wants to see an explicit "N/A" indication for Swim, since elevation gain isn't a meaningful concept for swimming, rather than a misleading empty or zero-filled chart.

**Why this priority**: This is a data-relevance correction affecting a single metric/sport combination; it improves clarity but doesn't block the tab's core functionality for other metrics or sports.

**Independent Test**: Select the Elevation gain metric with the sport filter set to "Swim" (or "All Sports" in Line mode, where a per-sport Swim line would otherwise appear) and verify Swim shows an explicit "N/A" indicator instead of an empty/zero chart or line.

**Acceptance Scenarios**:

1. **Given** the Elevation gain metric is selected and the sport filter is "Swim", **When** the chart renders, **Then** an explicit "N/A" message is shown instead of a chart (regardless of whether any Swim activity happens to have elevation data).
2. **Given** the Elevation gain metric is selected with "All Sports" and "Line" mode, **When** the chart renders, **Then** Run and Bike lines render normally (if they have qualifying data) while Swim is excluded from the per-sport lines and does not appear as a flat/empty line.

---

### Edge Cases

- What happens when both a "smaller than" and a "greater than" bucket are needed for the same metric (outliers on both ends)? Both bucket types appear together, each holding their respective outliers, with the regular buckets in between.
- What happens when a user reloads the page after having changed the sport/mode away from the User Story 1 default? The default (All Sports + Line) applies again on the next fresh page load, since there is no cross-session persistence beyond the current in-memory dashboard state.
- What happens when the Duration metric's data range is very narrow (e.g., all activities within a few minutes of each other)? The clean-increment rule still applies; the smallest sensible round increment (e.g., 5 minutes) is used rather than falling back to arbitrary fractional boundaries.
- What happens when a user selects "Swim" specifically for Elevation gain but also has an active date/sport combination that would otherwise show an empty state for a different reason? The N/A message takes precedence for Elevation gain + Swim, since that combination is never meaningful regardless of filters.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Distributions tab MUST default to the "All Sports" sport filter and "Line" display mode the first time it is rendered in a session, showing per-sport lines.
- **FR-002**: Once a user manually changes the sport filter or display mode, the system MUST NOT reset those choices back to the User Story 1 default for the remainder of the session (the default only governs the tab's initial render).
- **FR-003**: Every chart in the Distributions tab (all metrics, both Histogram and Line modes) MUST use a consistent yellow-to-red "fire" color gradient, with yellow representing slower/shorter values and red representing faster/longer values.
- **FR-004**: The fire color gradient from FR-003 MUST apply consistently within each per-sport line when "All Sports" + "Line" mode shows multiple lines, while still keeping each sport's line visually distinguishable (e.g., via the existing legend).
- **FR-005**: The "Duration" metric's regular bucket boundaries MUST be whole, human-friendly time increments (e.g., multiples of 5, 10, 15, 30, or 60 minutes), never an arbitrary number of minutes and seconds.
- **FR-006**: The Pace metric's axis title MUST display the applicable unit (e.g., "Pace (min/km)", "Pace (min/100m)", "Pace (km/h)") exactly once; individual bucket/tick labels along the axis MUST NOT repeat that unit text.
- **FR-007**: The bucket-boundary algorithm MUST support a "smaller than [first regular boundary]" underflow bucket for the Pace metric only, computed using the same statistical outlier rule already used for the existing "greater than" overflow bucket (per `019-distributions-refinements`), applied to the low end of Pace's qualifying values; other metrics (Length, Duration, Elevation gain, Power) MUST NOT use an underflow bucket.
- **FR-008**: For the Pace metric, when the sport filter is a single sport, Run or Swim (time-per-distance units where a smaller number means a faster pace), the system MUST order the axis so faster (numerically smaller) values are positioned on the same end marked "fast"/red by the fire color scheme, consistent with how Bike's pace (km/h, where a larger number means faster) is already oriented. When the sport filter is "All Sports", the axis MUST keep its existing, unreversed shared orientation from `019-distributions-refinements` (reversal is not applied, since Bike's naturally-ascending orientation cannot share one linear axis with a reversed Run/Swim orientation at the same time).
- **FR-009**: When the Elevation gain metric is selected and the sport filter is "Swim", the system MUST show an explicit "N/A" indicator instead of a chart, regardless of whether any Swim activity has elevation data.
- **FR-010**: When the Elevation gain metric is selected with "All Sports" and "Line" mode, the system MUST exclude Swim from the per-sport lines shown (Run and Bike still render normally if they have qualifying data).

### Key Entities

- **Fire color scale**: A yellow-to-red gradient mapping applied to bucket/point positions across every metric's chart, oriented so the "slow/short" end is yellow and the "fast/long" end is red.
- **Underflow bucket**: A new counterpart to the existing "Overflow bucket" (from `019-distributions-refinements`), collecting the small number of extreme low-end outlier values below the first regular bucket's boundary, labeled "smaller than [boundary]", available only for the Pace metric.
- **Axis orientation**: Per-metric setting describing whether increasing raw values map to the "left-to-right" or reversed "right-to-left" chart direction, used so Pace's time-per-distance values (Run, Swim) align with the fire color scheme the same way Bike's speed value already does.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening the Distributions tab for the first time in a session always shows "All Sports" + "Line" mode without any additional user interaction.
- **SC-002**: Across all five metrics and both display modes, chart colors consistently range from yellow (slow/short) to red (fast/long), with no metric using an inconsistent or arbitrary color assignment.
- **SC-003**: For a Duration dataset spanning multiple hours, 100% of regular bucket boundaries are whole time increments (multiples of 5, 10, 15, 30, or 60 minutes).
- **SC-004**: The Pace axis title always includes the applicable unit exactly once, and no individual bucket/tick label repeats that unit text.
- **SC-005**: For a dataset containing a low-end pace outlier (e.g., a current-assisted swim), the chart shows exactly one "smaller than" bucket without distorting the regular bucket boundaries, and — when a single Run or Swim sport is selected — the fastest values are positioned on the same side as every other metric's "fast/long" (red) end; "All Sports" Pace keeps its existing unreversed shared axis.
- **SC-006**: Selecting Elevation gain with Swim (directly or via "All Sports" + Line) never shows a misleading empty/zero chart or line for Swim; it always shows an explicit "N/A" indicator instead.

## Assumptions

- The User Story 1 default (All Sports + Line) applies only to the Distributions tab's first render in a given browser session/page load; it is not persisted across page reloads or separately configurable per user.
- "Clean" Duration bucket increments follow the same general "nice number" convention already established in `019-distributions-refinements`, restricted to a minutes-based step set (5, 10, 15, 30, 60) rather than the generic 1/2/5×10^n sequence, since raw-second-based "nice" steps produced the odd values called out in this request.
- The underflow ("smaller than") bucket generalizes the existing IQR-based overflow-bucket mechanism from `019-distributions-refinements` symmetrically (a lower fence computed the same way as the existing upper fence), but is scoped only to the Pace metric per clarification; Length, Duration, Elevation gain, and Power do not get an underflow bucket in this feature.
- Reversing the Pace axis order to match the fire color scheme applies to both Run and Swim (both are time-per-distance units where smaller means faster) when a single sport is selected, not only Swim, since the fire color scheme's consistency (User Story 2) requires both to orient the same way; Bike's pace (km/h) already orients correctly without changes. This reversal only applies to a single-sport Pace selection: "All Sports" Pace keeps its existing unreversed shared axis from `019-distributions-refinements`, because a shared per-sport axis cannot be reversed for Run/Swim while Bike's naturally-ascending values stay correctly oriented on the same axis.
- The exact yellow-to-red gradient colors and interpolation are an implementation detail left to the planning phase; this spec only requires the slow/short-to-fast/long semantic direction and visual consistency across metrics/modes.
- This feature only changes the Distributions tab's default state, color scheme, bucket-boundary rules, axis labeling/orientation, and Swim/Elevation handling; it does not add new metrics, filters, or display modes beyond what `018-activity-distributions` and `019-distributions-refinements` already introduced.
- The data-ingestion/Bike-power-extraction performance concern raised alongside this request is explicitly out of scope for this spec, per user decision, and will be addressed separately.
