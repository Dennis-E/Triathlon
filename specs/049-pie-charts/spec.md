# Feature Specification: Pie Charts

**Feature Branch**: `049-pie-charts`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "create a new visualization \"pie charts\". here a big pie chart is shown (a beautiful one). filters are: per sport, duration/pace/equipment/length/watt and a slot for colour scheme (blue, fire), also put the export button and include it on landing page tile for \"and more\" as new bullet point"

## Clarifications

### Session 2026-10-06

- Q: Was soll die Größe eines Tortenstücks darstellen? → A: Umschaltbar zwischen Anzahl der Aktivitäten, Gesamtzeit und Gesamtdistanz pro Gruppe.
- Q: Soll „per sport“ nur ein Filter sein oder zusätzlich eine Dimension „Sport“? → A: Beides – Sport-Filter (All/Run/Bike/Swim) bleibt, zusätzlich Dimension „Sport“ mit Stücken Run/Bike/Swim.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See how my activities split up in one large pie chart (Priority: P1)

As an athlete, I want to open a Pie Charts visualization that shows one large, visually polished pie chart of my imported activities, grouped by a dimension I choose (sport, duration, pace, equipment, length, or power) and sized by a measure I choose (activities, time, or distance), so that I can see at a glance how my training is composed.

**Why this priority**: The single large pie chart with selectable grouping dimension is the core value of the feature; every other story builds on it.

**Independent Test**: Import a synthetic dataset with known values, open Pie Charts, switch through each dimension and each measure, and verify that slice labels, slice values, and percentages match the expected grouping.

**Acceptance Scenarios**:

1. **Given** activities are imported, **When** the user opens Pie Charts, **Then** one large pie chart is displayed using the default dimension (Sport), the default measure (Activities), and the default sport filter (All Sports).
2. **Given** Pie Charts is displayed, **When** the user selects Sport, Duration, Pace, Equipment, Length, or Power (Watt), **Then** the pie regroups the filtered activities into slices for that dimension and the active choice is visibly highlighted.
3. **Given** Pie Charts is displayed, **When** the user switches the measure between Activities, Time, and Distance, **Then** slice sizes and percentages are recalculated from the activity count, total moving time, or total distance of each group, while grouping and colors stay the same.
4. **Given** the pie is displayed, **When** the user looks at or hovers/taps a slice, **Then** the slice's group label, its value in the active measure (with unit), number of contributing activities, and percentage share of the total are shown.
5. **Given** the pie is displayed, **When** the user views it, **Then** slices are ordered consistently, separated clearly, and accompanied by a legend whose entries match the slice colors.
6. **Given** Sport is selected with All Sports, **When** the pie is rendered, **Then** Run, Bike, and Swim each form one slice showing their share of the active measure.
7. **Given** Equipment is selected, **When** the pie is rendered, **Then** each equipment item forms its own slice, and activities without assigned equipment form a separate clearly labelled slice.

---

### User Story 2 - Filter by sport (Priority: P1)

As an athlete, I want to limit the pie chart to All Sports, Run, Bike, or Swim, so that I can compare how each discipline is composed separately.

**Why this priority**: Mixed-sport groupings (e.g., pace or length) are of limited meaning without a sport filter; the sport filter is explicitly requested.

**Independent Test**: With a dataset containing all three sports, switch the sport filter and verify that only activities of the selected sport contribute to the slices and totals.

**Acceptance Scenarios**:

1. **Given** Pie Charts is displayed, **When** the user selects Run, Bike, or Swim, **Then** only activities of that sport are counted and the slice labels use units appropriate to that sport.
2. **Given** the user selects All Sports, **When** the pie is rendered, **Then** activities of all three supported sports are counted, using the same cross-sport convention already used by the existing Distributions visualization for pace.
3. **Given** a sport/dimension combination has no usable values (e.g., Swim with Power), **When** it is selected, **Then** a clear empty state explains that no data is available for this combination instead of an empty or broken chart.

---

### User Story 3 - Choose a colour scheme (Priority: P2)

As an athlete, I want to switch the pie between a "Monochrome blue" and an "On fire" colour scheme, so that the chart matches my taste and the look I want to share.

**Why this priority**: Improves aesthetics and shareability but the chart is usable without it.

**Independent Test**: Toggle the colour scheme and verify that all slices and legend entries switch to the selected palette while data stays unchanged.

**Acceptance Scenarios**:

1. **Given** Pie Charts is displayed, **When** the user selects a colour scheme, **Then** all slices and legend entries are recoloured using that scheme without changing slice sizes or order.
2. **Given** a scheme is selected, **When** the user changes the dimension or sport filter, **Then** the selected scheme is retained.
3. **Given** the pie has many slices, **When** either scheme is applied, **Then** adjacent slices remain visually distinguishable.

---

### User Story 4 - Export the pie chart for social sharing (Priority: P2)

As an athlete, I want an "Export for Insta / Strava" button on the Pie Charts view, so that I can share my pie chart the same way as other visualizations.

**Why this priority**: Required by the project constitution for every new visualization tab and explicitly requested.

**Independent Test**: With data shown, trigger export and verify the established local preview/download flow opens with an image of the current pie chart, including current filters and colour scheme; with no data, verify the established no-data behavior.

**Acceptance Scenarios**:

1. **Given** a pie chart with data is displayed, **When** the user clicks the export button, **Then** the existing local image preview opens showing the current pie, legend, and active selections, and the user can download it.
2. **Given** the current selection has no data, **When** the user clicks export, **Then** the same no-data behavior as other visualizations is applied.

---

### User Story 5 - Discover Pie Charts on the landing page (Priority: P3)

As a visitor, I want the existing "And much more" landing-page tile to list Pie Charts, so that I know this visualization exists before importing data.

**Why this priority**: Discovery only; small effort.

**Independent Test**: Open the landing page and verify that the "And much more" tile contains a "Pie charts" bullet point alongside the existing bullets.

**Acceptance Scenarios**:

1. **Given** a visitor opens the landing page, **When** the "And much more" tile is visible, **Then** it lists "Pie charts" as a bullet point, placed before the ellipsis placeholder, while existing bullets remain.

### Edge Cases

- No activities imported, or none matching the sport filter: clear empty state instead of a blank chart.
- Activities missing a value for the selected dimension (e.g., no power data) are excluded from that pie; with the Time or Distance measure, activities without a positive time or distance contribute nothing; the view indicates how many activities were counted.
- With All Sports and the Distance measure, distances of all sports are combined in kilometers, so long bike distances naturally dominate; this is expected and not normalized.
- Sport dimension combined with a single-sport filter: a full circle with one slice (100%) is shown, which is valid rather than an error.
- Only one group present: a full circle with a single labelled slice (100%).
- Very small slices: remain identifiable through legend and hover/tap details, even when their in-chart label is omitted for space.
- Many equipment items: the number of slices is limited so the chart stays readable; the smallest groups beyond the limit are combined into an "Other" slice.
- Pace with All Sports: follows the same cross-sport convention as the existing Distributions visualization; no unit mixing without explanation.
- Narrow screens: the pie stays as large as possible, the legend wraps below the chart, and no horizontal overflow occurs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST provide a new visualization tab named "Pie Charts" showing one large pie chart of the imported activities.
- **FR-002**: Users MUST be able to choose the grouping dimension from Sport, Duration, Pace, Equipment, Length, and Power (Watt); exactly one dimension is active at a time and is visibly highlighted.
- **FR-003**: Users MUST be able to filter by All Sports, Run, Bike, or Swim independently of the selected dimension; only activities of the selected sport(s) contribute to the chart.
- **FR-003a**: For the Sport dimension, each supported sport (Run, Bike, Swim) present in the filtered data MUST form exactly one slice.
- **FR-004**: For the numeric dimensions (Duration, Pace, Length, Power), activities MUST be grouped into ordered value ranges with human-readable labels and sport-appropriate units; for Equipment, each equipment item MUST form its own group, with a separate group for activities without equipment.
- **FR-005**: Users MUST be able to switch the slice measure between Activities (count), Time (total moving time), and Distance (total distance); each slice's size MUST represent its group's value in the active measure, and each slice MUST expose its label, value with unit, number of contributing activities, and percentage of the total.
- **FR-006**: The chart MUST include a legend matching slice colors and order, and slices MUST be ordered consistently (Run, Bike, Swim for Sport; ascending value ranges for numeric dimensions; descending value in the active measure for Equipment).
- **FR-007**: The chart MUST combine groups beyond a maximum number of slices into a single "Other" slice so that the chart remains readable.
- **FR-008**: Users MUST be able to choose a colour scheme of "Monochrome blue" or "On fire"; the choice MUST apply to all slices and legend entries and persist while changing other filters during the session.
- **FR-009**: The chart MUST be visually polished: large and centered, with clear slice separation, readable labels, and a summary of the total in the active measure and the number of counted activities.
- **FR-010**: The view MUST show a clear empty state when the current sport/dimension/measure combination has no usable values.
- **FR-011**: The view MUST provide an "Export for Insta / Strava" button using the established local image-preview and download flow, capturing the current chart, legend, and active selections, with the same no-data behavior as other visualizations.
- **FR-012**: The new tab MUST be integrated into the existing dashboard tab navigation consistently with the other visualization tabs, including keyboard navigation.
- **FR-013**: The landing-page "And much more" tile MUST include a "Pie charts" bullet point, placed before the ellipsis placeholder, without removing existing bullets.
- **FR-014**: The visualization MUST use only already imported local activity data and MUST NOT send activity data to any new external service.
- **FR-015**: The layout MUST remain usable without horizontal overflow on narrow and wide viewports.

### Key Entities *(include if feature involves data)*

- **Activity**: An imported workout with sport, duration, distance, pace, optional average power, and optional equipment.
- **Grouping dimension**: The selected attribute (Sport, Duration, Pace, Equipment, Length, Power) that determines how activities are grouped into slices.
- **Measure**: The selected quantity (Activities, Time, Distance) that determines slice size.
- **Slice**: A group of activities with a label, value in the active measure, activity count, percentage share of the total, and color from the active scheme.
- **Colour scheme**: A named palette ("Monochrome blue", "On fire") used to color slices and legend entries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of validation datasets with known values, slice values and percentages match the expected grouping for every dimension/measure/sport combination; percentages sum to 100% (± rounding).
- **SC-002**: Changing dimension, measure, sport filter, or colour scheme updates the chart within 1 second for datasets of up to 5,000 activities.
- **SC-003**: In 100% of no-data combinations, users see an explanatory empty state rather than a blank or broken chart.
- **SC-004**: In 100% of export checks with data, the exported image shows the current pie, legend, and selections matching the on-screen view.
- **SC-005**: Never more than the defined maximum number of slices is shown, and every slice is identifiable via legend or detail view.
- **SC-006**: Visitors can find the "Pie charts" bullet in the "And much more" tile on narrow and wide viewports without horizontal overflow.

## Assumptions

- Time measure uses the activity's moving time as used elsewhere in the dashboard.
- Value ranges for Duration, Pace, Length, and Power reuse the bucketing conventions and labels of the existing Distributions visualization where possible, so both views are consistent.
- "Watt" refers to the average power already available for activities; activities without power data are excluded for that dimension.
- Equipment refers to the gear assignment already available in the imported data and used by the existing equipment visualization.
- The default selection is dimension Sport, measure Activities, All Sports, and "On fire" colour scheme (consistent with the existing Distributions default scheme).
- The maximum number of separate slices is 8; remaining groups are merged into "Other".
- A date-range filter is not part of the initial release.
- Selections are not persisted across page reloads.
