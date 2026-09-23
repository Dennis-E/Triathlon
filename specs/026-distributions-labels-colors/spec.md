# Feature Specification: Distribution Labels and Color Schemes

**Feature Branch**: `026-distributions-labels-colors`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "On the distribution visualization, use filled-point legends, clarify all-sports labels and N/A behavior, show units on distribution axes, add a monochrome blue color scheme alongside the current fire scheme, and remove unnecessary decimal points from Bike pace labels."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read legends and labels at a glance (Priority: P1)

An athlete reviewing a distribution chart wants legends and axis labels to communicate the chart meaning immediately, without repeated units, ambiguous time values, or distracting formatting.

**Why this priority**: Every distribution chart depends on these labels for correct interpretation, and unclear labels affect all metrics and sports.

**Independent Test**: Open each distribution metric in both display modes and inspect the legend, x-axis title, and representative tick or bucket labels for the selected sport and All Sports.

**Acceptance Scenarios**:

1. **Given** a distribution chart has one or more legend entries, **When** the chart is rendered, **Then** each legend entry uses a filled circular point marker rather than a line marker, consistently across all distribution charts.
2. **Given** the Length metric is selected, **When** the chart is rendered, **Then** the x-axis title identifies kilometers as `Length (km)` and the axis labels remain readable.
3. **Given** the Elevation gain metric is selected, **When** the chart is rendered, **Then** the x-axis title identifies meters as `Elevation gain (m)`.
4. **Given** the Duration metric is selected, **When** the chart is rendered, **Then** bucket and tick labels express time in hours and minutes, using a consistent format such as `1h 30m` rather than raw seconds or unexplained decimal hours.
5. **Given** the Pace metric is selected for Run, Swim, or Bike, **When** the chart is rendered, **Then** the x-axis title states the applicable unit exactly once (`min/km`, `min/100m`, or `km/h`) and individual labels do not repeat that unit.
6. **Given** the Pace metric is selected for Bike, **When** the chart is rendered, **Then** x-axis labels use whole-number speed values without unnecessary decimal points.

---

### User Story 2 - Understand All Sports and unavailable distributions (Priority: P1)

An athlete comparing all sports wants the distribution controls to make clear when a combined histogram is not meaningful, while the combined line view remains useful and uses a readable upper length category.

**Why this priority**: All Sports is the broadest comparison view, so misleading mixed or empty output would undermine trust in the dashboard.

**Independent Test**: Select All Sports, switch between Line and Histogram, and verify the expected category and N/A states without changing the imported data.

**Acceptance Scenarios**:

1. **Given** All Sports and Line mode are selected for Length, **When** the distribution renders and the data reaches the highest displayed length category, **Then** the final category is labeled `50+` rather than using an open-ended decimal or an unlabeled overflow.
2. **Given** All Sports and Histogram mode are selected for any distribution metric, **When** the chart would combine the sports into one histogram, **Then** the chart area shows an explicit `N/A` state instead of a misleading combined histogram.
3. **Given** a single sport and Histogram mode are selected, **When** qualifying data exists, **Then** the corresponding histogram renders normally with the metric's correct units and labels.
4. **Given** All Sports is selected for a metric with no qualifying data, **When** the chart renders in either mode, **Then** the user sees an explicit `N/A` state rather than an empty axis that could be mistaken for zero activity.

---

### User Story 3 - Choose a color scheme (Priority: P2)

An athlete wants to choose a visual style that remains legible for their context, while retaining the existing fire palette as the default.

**Why this priority**: Color is important for reading distributions, but it supplements the more fundamental label and data-meaning corrections.

**Independent Test**: Open the color scheme control, select each option, and verify that all distribution chart elements update without changing bucket counts, labels, or selected filters.

**Acceptance Scenarios**:

1. **Given** the Distributions tab is opened for the first time, **When** the color scheme control is displayed, **Then** `On fire` is selected by default.
2. **Given** the color scheme control is open, **When** the user selects `Monochrome blue`, **Then** bars, points, and other distribution color cues use a blue monochrome scale across all metrics and display modes.
3. **Given** the user changes the color scheme, **When** the user changes metric, sport, or display mode, **Then** the selected color scheme remains active for the remainder of the session.
4. **Given** the user selects either color scheme, **When** the chart is rendered, **Then** data values, bucket counts, axis labels, and legend meaning remain unchanged; only the visual color treatment changes.

### Edge Cases

- If All Sports Histogram mode is selected while the data contains only one sport, the All Sports selection still shows `N/A`; the user can select the specific sport to view its histogram.
- If a Length dataset never reaches 50 km, the `50+` category is not added solely for display; it appears only when the configured range or overflow data requires that upper category.
- If a metric has no qualifying values, the N/A state includes the metric context and does not render stale data from the previous selection.
- If a Pace chart combines sports, the axis title identifies the units as mixed rather than falsely presenting one sport's unit as universal.
- If a Bike pace value is fractional internally, display formatting removes only the unnecessary decimal from the axis label; the underlying value and bucket calculations remain unchanged.
- If the user reloads the page, the default color scheme returns to `On fire` unless existing application behavior explicitly adds cross-session preference persistence later.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every distribution chart legend MUST represent each series with a filled circular point marker and MUST NOT use a line-only marker.
- **FR-002**: The Length distribution in All Sports + Line mode MUST label the largest open-ended length category `50+` whenever that category is present.
- **FR-003**: The distribution view MUST show an explicit `N/A` state for All Sports + Histogram mode for every distribution metric, rather than rendering a combined histogram.
- **FR-004**: Single-sport Histogram mode MUST continue to render qualifying data and MUST show an explicit `N/A` state when the selected sport has no qualifying values.
- **FR-005**: The x-axis title for Length MUST be `Length (km)`, for Elevation gain MUST be `Elevation gain (m)`, and for Power MUST identify watts as `Power (W)`.
- **FR-006**: Duration bucket and tick labels MUST use hours and minutes, with whole minutes and no raw seconds or unexplained decimal-hour values.
- **FR-007**: A single-sport Pace x-axis title MUST include exactly one applicable unit: `Pace (min/km)` for Run, `Pace (min/100m)` for Swim, or `Pace (km/h)` for Bike. Pace tick and bucket labels MUST NOT repeat the unit.
- **FR-008**: All Sports Pace charts MUST identify that the displayed values use mixed sport units and MUST NOT imply that one sport's Pace unit applies to every series.
- **FR-009**: Bike Pace x-axis labels MUST display whole-number values without unnecessary decimal points, while preserving the underlying numeric values for calculations.
- **FR-010**: The Distributions tab MUST provide a color scheme control with exactly the options `On fire` and `Monochrome blue`, with `On fire` selected by default.
- **FR-011**: Selecting `On fire` MUST apply the existing yellow-to-orange-to-red visual scale to all distribution bars, points, and relevant series cues.
- **FR-012**: Selecting `Monochrome blue` MUST apply a visually distinguishable blue monochrome scale to all distribution bars, points, and relevant series cues.
- **FR-013**: The selected color scheme MUST remain active while the user changes metric, sport, display mode, or date range during the current session.
- **FR-014**: Changing color scheme MUST NOT change distribution values, bucket boundaries, labels, selected filters, or N/A behavior.

### Key Entities

- **Distribution axis label**: The user-facing title and tick/bucket text that identifies a metric, its unit, and its value format.
- **All Sports view**: A distribution selection that includes Run, Bike, and Swim activities and distinguishes meaningful combined line comparisons from unsupported combined histograms.
- **Color scheme**: A named visual mapping applied consistently to distribution chart bars, points, and series cues; supported values are `On fire` and `Monochrome blue`.
- **N/A state**: An explicit visual indication that the selected distribution cannot be meaningfully shown for the current sport/mode/data combination.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a review of all distribution metrics and display modes, 100% of rendered legends use filled point markers and 0% use line-only markers.
- **SC-002**: In every supported single-sport chart, the x-axis title identifies the correct unit exactly once, and no Pace tick or bucket label repeats its unit.
- **SC-003**: 100% of Duration bucket and tick labels use hours-and-minutes formatting with no raw seconds or decimal-hour display.
- **SC-004**: 100% of Bike Pace x-axis labels omit unnecessary decimal points while retaining the same bucket values and activity counts.
- **SC-005**: All Sports + Histogram produces an explicit `N/A` state for 100% of the five distribution metrics, while single-sport histograms with qualifying data remain usable.
- **SC-006**: Users can switch between the two color schemes in one interaction, and the selected scheme remains visible across at least three subsequent metric or display-mode changes without altering chart data.
- **SC-007**: In usability review, users can identify the unit for Length, Duration, Elevation gain, Pace, and Power from the x-axis title without consulting external documentation.

## Assumptions

- `N/A` for All Sports + Histogram means a combined histogram is intentionally unsupported because the view is reserved for comparable single-sport distributions; selecting a specific sport remains the path to a histogram.
- The `50+` Length category is an open-ended display label for the existing upper category, not a request to force a new bucket into every dataset.
- The phrase “all labels” is interpreted as the x-axis title and its displayed bucket/tick labels; units are shown in the title where applicable and are not redundantly repeated on every Pace label.
- All Sports Pace may contain different underlying units across sports; the UI will disclose this rather than convert values as part of this feature.
- The color scheme choice is session-scoped for the current page load and is not required to persist across reloads.
- Existing activity filtering, bucket counts, and chart modes remain unchanged except where this specification explicitly defines N/A handling or display formatting.
- The feature does not add new metrics, sports, or export formats.
