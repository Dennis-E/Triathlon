# Feature Specification: Distribution Histogram Axis Units

**Feature Branch**: `028-distribution-axis-units`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "The histogram x-axis is wrong everywhere. It is labeled 0, 1, 2, 3, 4, 5, 6 etc. It must use the correct units, for example meters, min:ss, and watts."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read the actual metric on every histogram axis (Priority: P1)

An athlete viewing any distribution histogram wants the x-axis to describe the metric values themselves, not the internal position of each bar. The axis must show meaningful values in the metric's own unit, such as meters, `min:ss`, kilometers, or watts.

**Why this priority**: Numeric position labels like `0, 1, 2, 3` are misleading across every histogram and prevent athletes from interpreting the distribution.

**Independent Test**: Load a dataset with multiple buckets, open Histogram mode for every metric and applicable sport, and verify that no x-axis displays sequential category indices when metric boundaries are available.

**Acceptance Scenarios**:

1. **Given** a Length histogram with buckets covering multiple distance ranges, **When** the chart renders, **Then** the x-axis labels show kilometer boundaries such as `0`, `5`, `10`, or `50`, not bar indices such as `0`, `1`, `2`, or `3`.
2. **Given** an Elevation gain histogram for Run or Bike, **When** the chart renders, **Then** the x-axis labels show actual meter boundaries such as `0`, `20`, `40`, or `60`, matching the values described by the buckets.
3. **Given** a Duration histogram, **When** the chart renders, **Then** the x-axis labels show meaningful time boundaries in hours/minutes or `min:ss` form, not sequential bucket positions.
4. **Given** a Pace histogram, **When** the chart renders, **Then** the x-axis labels use the applicable pace/speed representation, including `min:ss` for time-based pace and `km/h` values for speed-based pace, without reverting to category indices.
5. **Given** a Bike Power histogram, **When** the chart renders, **Then** the x-axis labels show watt boundaries such as `100`, `150`, and `200`, not sequential bucket positions.

---

### User Story 2 - Keep axis labels consistent with bucket boundaries and titles (Priority: P1)

An athlete comparing histograms wants the visible axis labels to align with the boundaries used by the distribution buckets and with the unit stated in the axis title.

**Why this priority**: Correct units are only useful when the displayed ticks correspond to the actual bucket scale and do not contradict the chart title.

**Independent Test**: Compare the visible x-axis ticks with the first and last boundaries of the rendered buckets for Length, Elevation gain, Duration, Pace, and Power.

**Acceptance Scenarios**:

1. **Given** adjacent buckets have boundaries `50`, `100`, and `150`, **When** the histogram renders, **Then** the x-axis shows those boundary values in order and does not show full range labels such as `50-100` as a single tick.
2. **Given** an axis title names a unit such as `(m)`, `(km)`, `(W)`, or `(km/h)`, **When** the histogram renders, **Then** the individual tick labels use values in that same unit and do not display a different or unitless index scale.
3. **Given** the final bucket is open-ended, **When** the histogram renders, **Then** the final label remains understandable, such as `50+` or `> 200`, while regular ticks continue to show metric boundaries.
4. **Given** two adjacent boundaries round to the same displayed value, **When** the histogram renders, **Then** the duplicate visible tick is removed without changing the bucket counts.

### User Story 3 - Preserve distribution meaning while correcting labels (Priority: P2)

An athlete wants the corrected axis labels to improve interpretation without changing which activities are counted in each bucket or changing the selected metric, sport, color scheme, or display mode.

**Why this priority**: Axis labels are a presentation correction; the underlying distribution must remain stable.

**Independent Test**: Record bucket counts before and after the axis correction, then compare them across metrics and sport filters.

**Acceptance Scenarios**:

1. **Given** a histogram has a known set of bucket counts, **When** the x-axis labels are corrected, **Then** every bucket count and total activity count remains unchanged.
2. **Given** the user switches metric, sport, color scheme, or date range, **When** the histogram re-renders, **Then** the x-axis uses the correct unit for the new selection rather than retaining labels from the previous chart.
3. **Given** no qualifying data exists, **When** the histogram is selected, **Then** the existing explicit N/A state remains and no misleading numeric axis is shown.

### Edge Cases

- A histogram with a single bucket shows that bucket's actual metric boundary or value rather than `0` as a category index.
- A histogram with underflow or overflow buckets preserves their open-ended meaning while using the correct metric unit for the boundary text.
- A Pace histogram with All Sports uses the already defined shared km/h representation; a single Run or Swim Pace histogram keeps its time-based `min:ss` representation.
- Very large meter or watt values remain readable through the existing rounding rules and do not fall back to index labels.
- Missing or invalid metric values continue to be excluded and do not create placeholder axis ticks.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every distribution Histogram x-axis MUST display metric values or bucket boundaries in the selected metric's correct unit; it MUST NOT display sequential category indices such as `0, 1, 2, 3` when metric boundaries are available.
- **FR-002**: Length Histogram axes MUST show kilometer boundaries.
- **FR-003**: Elevation gain Histogram axes MUST show meter boundaries for Run and Bike.
- **FR-004**: Duration Histogram axes MUST show meaningful time boundaries using the established hours/minutes or `min:ss` display format.
- **FR-005**: Pace Histogram axes MUST show the selected Pace representation: `min:ss` for time-based Run/Swim Pace and `km/h` for Bike or the established All Sports shared representation.
- **FR-006**: Bike Power Histogram axes MUST show watt boundaries.
- **FR-007**: Visible regular ticks MUST correspond to individual bucket boundaries and MUST NOT use full range labels such as `50-100` as one tick.
- **FR-008**: Open-ended underflow and overflow buckets MUST retain understandable labels in the correct metric unit.
- **FR-009**: Duplicate visible tick labels caused by display rounding MUST be de-duplicated without altering bucket membership or counts.
- **FR-010**: Histogram axis titles and tick values MUST use the same metric unit for every supported metric and sport selection.
- **FR-011**: Correcting Histogram x-axis labels MUST NOT change bucket boundaries, bucket counts, total activity counts, filters, color scheme, or display mode.
- **FR-012**: The existing N/A state MUST remain visible for empty or unsupported histogram selections, with no misleading index-based axis.

### Key Entities

- **Histogram boundary**: The numeric start or end value of a distribution bucket in the metric's native display unit.
- **Metric axis label**: The visible x-axis value representing a histogram boundary, formatted for the selected metric.
- **Distribution bucket**: A group of qualifying activities with a numeric range, display label, and activity count.
- **Metric unit**: The display unit associated with the selected metric and sport, including km, m, min:ss, km/h, and W.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Across every supported distribution metric and sport Histogram, 100% of visible x-axis ticks represent metric values or bucket boundaries, and 0% are unexplained sequential category indices.
- **SC-002**: Elevation gain Run/Bike Histograms show 100% of visible ticks in meters, and Bike Power Histograms show 100% of visible ticks in watts.
- **SC-003**: Duration and time-based Pace Histograms show 100% of visible ticks in the established time format rather than raw bucket positions.
- **SC-004**: At least 95% of users reviewing a representative set of histograms can identify the metric scale and unit from the axis without consulting the bucket text separately.
- **SC-005**: Before-and-after comparison of representative datasets shows 0 change in bucket counts and total activity counts after the axis-label correction.
- **SC-006**: Empty and unsupported histogram selections continue to show the existing N/A state in 100% of tested cases.

## Assumptions

- The existing distribution bucket calculations and metric values are authoritative; this feature changes only the visible Histogram x-axis labels and their formatting.
- The term `min:ss` covers the existing time-based pace and duration display conventions; exact formatting follows the metric's established formatter.
- All Sports Pace continues to use the shared km/h representation defined by the preceding distribution cleanup feature.
- Full bucket ranges may remain available in tooltips or descriptive text, but they must not be used as a single x-axis tick.
- No new metric, sport, persistence mechanism, or network behavior is introduced.
