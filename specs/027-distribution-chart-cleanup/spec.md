# Feature Specification: Distribution Chart Cleanup

**Feature Branch**: `027-distribution-chart-cleanup`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Improve the distribution visualization: make legend marker fills match the relevant line colors, remove point markers from smoothed line charts, remove units from individual x-axis labels when the axis title already contains them, use one consistent km/h unit for All Sports Pace, show clear boundary ticks instead of ranges on histogram x-axes, correct Elevation gain and Bike Power histogram axes, and make monochrome blue histograms use one medium-dark blue."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read clean histogram axes (Priority: P1)

An athlete viewing a histogram wants each x-axis tick to identify one clear bucket boundary, rather than displaying a range such as `50-100` as though it were a single value. Metric units should appear in the axis title, and the same rule should apply consistently to Length, Elevation gain, Power, Duration, and sport-specific Pace.

**Why this priority**: Incorrect or misleading x-axis labels affect the interpretation of every histogram and are especially visible for Elevation gain, Bike, and Bike Power.

**Independent Test**: Open each metric in Histogram mode for Run, Bike, and Swim where applicable, then inspect the x-axis title, ticks, and bucket/legend values.

**Acceptance Scenarios**:

1. **Given** a histogram has buckets with ranges such as `50-100`, `100-150`, and `150-200`, **When** the chart renders, **Then** the x-axis ticks show clear boundary values such as `50`, `100`, and `150` rather than range strings.
2. **Given** Length, Elevation gain, or Power is selected, **When** a histogram renders, **Then** the unit appears in the axis title (`Length (km)`, `Elevation gain (m)`, or `Power (W)`) and is not redundantly appended to every x-axis tick.
3. **Given** Elevation gain is selected for Run or Bike, **When** the histogram renders, **Then** the x-axis ticks use the actual bucket boundaries in meters and no longer collapse to misleading labels such as `1`, `2`, and `3` while the bucket descriptions show values like `20-40 m`.
4. **Given** Bike Power is selected, **When** the histogram renders, **Then** x-axis ticks use the actual watt boundaries and the axis title identifies watts.
5. **Given** a histogram has an open-ended final bucket, **When** the final tick is shown, **Then** it uses a clear boundary/open-ended label such as `50+` or `> 200` without displaying a full range as one tick.

---

### User Story 2 - Read smoothed lines without visual noise (Priority: P1)

An athlete viewing a smoothed distribution line wants the curve and its shaded area to carry the visual encoding, without a row of circular point markers at every x-axis bucket.

**Why this priority**: The point markers currently compete with the curve and make the line view look like a scatter plot instead of a smoothed distribution.

**Independent Test**: Open Line mode for a single sport and All Sports, inspect the rendered datasets, and verify that no data-point bullets are visible while the line and fill remain visible.

**Acceptance Scenarios**:

1. **Given** a single-series distribution is shown in Line mode, **When** the chart renders, **Then** the smoothed line is visible with no visible point markers at the bucket positions.
2. **Given** All Sports + Line mode is shown, **When** the chart renders, **Then** each sport's smoothed line is visible with no point markers, and each line remains distinguishable by its line color.
3. **Given** a line chart uses the active color scheme, **When** the chart renders, **Then** the selected scheme colors the line and the shaded area below it rather than relying on point-marker colors.

---

### User Story 3 - Use consistent units and meaningful colors (Priority: P1)

An athlete comparing sports wants labels and color treatments to have one clear meaning: axis titles carry units, All Sports Pace uses one shared speed unit, legends use the actual line colors, and monochrome blue histograms remain visually consistent.

**Why this priority**: Consistent units and color semantics are necessary for trustworthy comparison across sports and chart modes.

**Independent Test**: Compare single-sport and All Sports Pace charts, inspect legends for per-sport lines, and switch between `On fire` and `Monochrome blue` for histograms and lines.

**Acceptance Scenarios**:

1. **Given** a legend is displayed for All Sports lines, **When** the chart renders, **Then** each filled circular legend marker uses the same color as its corresponding line, including its fill, rather than a generic yellow fill.
2. **Given** All Sports Pace is selected, **When** the chart renders, **Then** the x-axis title is `Pace (km/h)` and all sports are represented in the same km/h unit; the title does not say `mixed units`.
3. **Given** a single-sport line chart has an axis unit in its title, **When** the chart renders, **Then** individual x-axis labels omit repeated units such as `km` or `m`.
4. **Given** `Monochrome blue` is selected in Histogram mode, **When** any metric histogram renders, **Then** all bars use one consistent medium-dark blue rather than a multi-shade gradient.
5. **Given** `Monochrome blue` is selected in Line mode, **When** any line chart renders, **Then** the line and shaded area use the selected monochrome blue treatment while point markers remain absent.

### Edge Cases

- If a histogram has two adjacent buckets with the same rounded boundary, the axis must de-duplicate the repeated tick rather than displaying duplicate labels.
- If the first or last bucket is open-ended, the chart must preserve the open-ended meaning while still using a boundary-oriented tick label.
- If a selected sport has no qualifying values, the existing explicit N/A behavior remains and no stale axis or chart is shown.
- If All Sports Pace contains Run, Swim, and Bike activities, each value must be normalized to km/h before shared buckets and line positions are displayed; no sport may retain its original min/km or min/100m unit in this view.
- If a value is too small or invalid to convert to a meaningful km/h speed, it is excluded from the All Sports Pace calculation using the existing invalid-value handling rather than shown with a misleading zero.
- If a user switches from Histogram to Line or changes the color scheme, axis boundaries, units, and numeric data remain unchanged except for the intended presentation mode or color treatment.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Histogram x-axis ticks MUST represent clear individual bucket boundaries, not full range labels such as `50-100` or `100-150`.
- **FR-002**: Histogram x-axis ticks MUST be derived from the numeric bucket boundaries and MUST remain in the metric's original units.
- **FR-003**: The x-axis title MUST carry the applicable metric unit for Length, Elevation gain, Power, Duration, and single-sport Pace; individual ticks MUST NOT repeat a unit already stated in the title.
- **FR-004**: Elevation gain histograms for Run and Bike MUST show ticks matching the actual meter boundaries used by their buckets, not compressed or unrelated small numbers.
- **FR-005**: Bike Power histograms MUST show ticks matching the actual watt boundaries used by their buckets.
- **FR-006**: Open-ended histogram buckets MUST retain an understandable boundary label, such as `50+` or `> 200`, without rendering a complete range as one tick.
- **FR-007**: Line charts MUST hide all point markers for both single-series and per-sport line datasets while retaining the smoothed line.
- **FR-008**: In Line mode, the active color scheme MUST apply to the line stroke and shaded area below the curve; point-marker colors MUST NOT be required for the visual result.
- **FR-009**: Distribution legend entries MUST use filled circular markers whose fill color matches the corresponding line color, including for each All Sports line.
- **FR-010**: All Sports Pace MUST use `km/h` as its single displayed unit, with axis title `Pace (km/h)`, and all sport values MUST be normalized to that unit before shared visualization buckets and positions are calculated.
- **FR-011**: All Sports Pace labels MUST NOT use the phrase `mixed units` or retain sport-specific `min/km` or `min/100m` labels.
- **FR-012**: In Histogram mode, `Monochrome blue` MUST render all bars in one consistent medium-dark blue color across all distribution metrics.
- **FR-013**: In Line mode, `Monochrome blue` MUST use the same medium-dark blue treatment for the line stroke and shaded area, while All Sports lines remain distinguishable through the existing sport-line identity treatment where required.
- **FR-014**: Changing line-marker visibility, axis tick presentation, unit normalization, or color treatment MUST NOT change qualifying activity counts or the underlying metric values for supported single-sport distributions.

### Key Entities

- **Histogram boundary tick**: A single numeric or open-ended x-axis label derived from a bucket boundary, distinct from the bucket's descriptive range label.
- **All Sports Pace value**: A pace value normalized to kilometers per hour so Run, Bike, and Swim can share one displayed unit and comparable axis.
- **Line visual encoding**: The smoothed line stroke and its shaded area, which carry the selected color scheme after point markers are removed.
- **Legend marker**: A filled circular marker whose fill matches the corresponding line stroke color.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Across all supported histogram metrics and sports, 100% of visible x-axis ticks are individual boundaries or explicit open-ended boundaries; 0% display a full bucket range as a single tick.
- **SC-002**: Run and Bike Elevation gain histograms and Bike Power histograms show 100% of their visible ticks on the actual meter or watt bucket boundaries.
- **SC-003**: Across single-sport distribution charts, each applicable unit appears in the axis title and appears 0 additional times in the individual x-axis tick labels.
- **SC-004**: All Sports Pace displays one axis unit, `km/h`, and 100% of qualifying sport values used in that view are normalized to that unit.
- **SC-005**: 100% of Line-mode datasets render with no visible point markers while retaining both the smoothed line and its shaded area.
- **SC-006**: 100% of visible legend marker fills match their corresponding line colors.
- **SC-007**: In Histogram mode with Monochrome blue selected, all bars use one medium-dark blue color, with no position-dependent bar shade variation.

## Assumptions

- All Sports Pace normalization uses speed in km/h as requested: Run and Swim time-per-distance values are converted to speed, and Bike speed values remain km/h. The displayed metric is therefore a shared speed representation rather than a mixed raw pace representation.
- The existing bucket range labels remain available where useful in tooltips or other descriptive contexts; this feature changes x-axis ticks to boundaries and does not require removing all range text from the interface.
- A medium-dark blue is one stable palette color for histogram bars and the primary line/fill treatment; exact color code is an implementation detail constrained by sufficient contrast.
- Existing fire behavior may continue to use an ordered gradient for histogram bars, while line charts use the selected scheme on strokes and fills. This feature changes monochrome-blue histogram bars to one flat color.
- Existing N/A behavior, date filtering, sport filtering, and bucket counts remain unchanged except for the explicit All Sports Pace normalization needed to use one unit.
- This feature changes only the Distributions visualization; it does not add metrics, sports, persistence, exports, or new network requests.
