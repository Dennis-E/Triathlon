# Feature Specification: Workout Time Count, Duration, and Distance

**Feature Branch**: `TriAnalytica-dev-2` (existing branch; no new branch created)

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "in 'workout time': an additional filter for 'workout number/duration/distance'. workout number is the current view and should be standard, but people might want to change this for time duration or distance done in this time horizon."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose What Workout Time Measures (Priority: P1)

As an athlete reviewing when I train, I want to switch between the number of workouts, total workout duration, and total distance, so I can compare training volume as well as training frequency within the same time pattern.

**Why this priority**: The requested measure selector is the central capability; the existing workout-count view must remain the default.

**Independent Test**: Open Workout Time with representative activities, verify that Workout number is selected initially, then select Duration and Distance. The displayed values and units change while the selected time grouping, sport, and date range remain unchanged.

**Acceptance Scenarios**:

1. **Given** a fresh page session with imported activities, **When** the user first opens Workout Time, **Then** Workout number is selected and the chart retains the current workout-count results.
2. **Given** a populated Workout Time chart, **When** the user selects Duration or Distance, **Then** each time field shows the corresponding total and the selected measure is visibly identifiable.
3. **Given** an active sport, time grouping, and date range, **When** the user changes only the measure, **Then** those three settings and the activities eligible under them are unchanged.
4. **Given** a chosen measure, **When** the user changes another Workout Time filter or leaves and returns to the tab during the same page session, **Then** the chosen measure remains selected and is applied to the new view.
5. **Given** keyboard, pointer, or touch interaction, **When** the user changes the measure, **Then** the same options and results are available with an accessible selected state and visible keyboard focus; the measure participates in the existing finite-filter keyboard navigation.

---

### User Story 2 - Read Correct Totals For Each Time Field (Priority: P1)

As an athlete comparing training habits, I want duration and distance to represent the total recorded training in each start-time field, so missing values or unit changes do not mislead me about the workload.

**Why this priority**: A selector without precise aggregation and units would make the comparison unreliable.

**Independent Test**: Use a known history with activities sharing a time field, activities in other fields, zero values, and missing measurements. Verify count, duration, and distance against hand-calculated totals in all four existing time groupings.

**Acceptance Scenarios**:

1. **Given** three eligible workouts starting at 06:15, 07:30, and 07:45, with durations of 30 minutes, 45 minutes, and unavailable, and distances of 5 km, 10 km, and 2 km, **When** the user examines the 06:00-07:59 field, **Then** Workout number shows 3, Duration totals 75 minutes, and Distance totals 17 km; duration detail identifies that one workout has no usable duration.
2. **Given** an activity that crosses time-field boundaries or midnight, **When** any measure is displayed, **Then** its complete contribution belongs to the field determined by its recorded start time, rather than being split between fields.
3. **Given** day, week, month, or year grouping, **When** the user changes the measure, **Then** the existing two-hour start-time bands, weekdays, days of month, or months of year remain unchanged and retain their ordering, including fields with no activity.
4. **Given** eligible workouts with no usable value for the selected measure, **When** their field is inspected, **Then** that value is identified as unavailable rather than a measured zero; fields with no eligible workouts still represent an empty field.
5. **Given** a mix of usable and missing values in a field, **When** duration or distance is selected, **Then** only usable values are summed and the tooltip identifies incomplete coverage without inventing values.
6. **Given** recorded zero duration or distance that is explicitly available, **When** that measure is selected, **Then** zero is treated as a valid measurement and the workout still contributes one to Workout number.
7. **Given** a total duration exceeding 24 hours or a fractional distance, **When** the chart and tooltip are read, **Then** duration does not wrap at 24 hours, distance is not rounded before summation, and the selected measure's units remain explicit.

---

### User Story 3 - Export And Inspect The Selected Measure (Priority: P2)

As an athlete inspecting or sharing Workout Time, I want tooltips and exported images to reflect my chosen measure, so the detail I read or share has the same meaning as the chart.

**Why this priority**: Existing pinning and Share/Export must remain coherent when the chart's meaning changes.

**Independent Test**: Select each measure, inspect and pin a field, then open the export preview and download the image. Verify the measure, unit, value, and selected-field association in both outputs, including partial or unavailable data.

**Acceptance Scenarios**:

1. **Given** a hovered or pinned time field, **When** the user reads its detail, **Then** the field label, selected measure, value, and unit agree with the chart, with measurement coverage shown when needed.
2. **Given** a pinned count tooltip, **When** the user switches to Duration or Distance, **Then** the old pin is cleared before the new measure is shown or exported; a new field selection can be pinned normally.
3. **Given** any of the three measures, **When** the user exports a populated chart, **Then** preview and downloaded image preserve the selected measure and readable units; a pinned field appears through the existing speech-bubble flow with matching detail.
4. **Given** an export already requested for one measure, **When** the user changes the live measure during preparation, **Then** that export retains its original measure and selection without altering the later live choice.
5. **Given** no eligible activities or no usable measurements anywhere for Duration or Distance, **When** the user views or attempts to export the selection, **Then** a suitable no-data or unavailable-measure state is shown and no misleading populated image is produced; the user can still switch back to Workout number.

### Edge Cases

- Start-time or date unavailable: preserve existing Workout Time eligibility and exclusion rules; adding a duration or distance must not make an otherwise ineligible activity enter the chart.
- Activities spanning several two-hour bands, weekdays, or months: assign the full measure once to the recorded start-time field, preserving the existing local-time interpretation; do not infer overlap or reconstruct movement.
- Missing, explicitly unavailable, negative, or non-finite duration/distance: exclude only that measurement from its total; do not exclude an otherwise eligible workout from counting or invent a zero.
- Genuine recorded zero values: distinguish valid zero measurements from missing values and from fields with no activity.
- Some fields lack usable measurements while others have data: retain the complete field sequence and distinguish unavailable fields in their details; no false positive-volume bar is shown for an unavailable field.
- Very large or fractional totals: sum before display rounding, keep units consistent across fields, and allow duration totals greater than one day.
- No eligible activities versus eligible activities with no usable selected measure: distinguish the reason for the empty view and keep all three measure choices accessible.
- Repeated switching, tab visits, replacement imports, and page reloads: keep the current measure within the current page session, discard obsolete pins under the existing context rules, and start a fresh page session in Workout number without introducing stored preferences.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Workout Time MUST expose exactly three mutually exclusive measure choices: Workout number, Duration, and Distance, with an identifiable active selection. Workout number MUST be the initial choice in a fresh page session.
- **FR-002**: Workout number MUST preserve the existing eligibility, grouping, and one-workout-per-field counting behavior. Changing the measure MUST NOT alter the selected sport, date range, time grouping, or underlying activity eligibility.
- **FR-003**: The selected measure MUST apply to all existing groupings: day with twelve two-hour start-time bands, week with Monday through Sunday, month with days 1 through 31, and year with January through December. Existing field order and empty fields MUST be preserved.
- **FR-004**: Duration MUST sum the usable recorded workout durations of eligible activities assigned to each field. It MUST use the same recorded duration already used for workout totals elsewhere in the app, not infer elapsed time or substitute a different duration source.
- **FR-005**: Distance MUST sum the usable recorded distances of eligible activities assigned to each field. It MUST reuse existing kilometer semantics and MUST NOT recalculate distance from routes or another source.
- **FR-006**: Each eligible activity MUST contribute its complete count, duration, or distance exactly once to the field determined by its recorded local start time. Contributions MUST NOT be split across fields according to workout length or route timing.
- **FR-007**: A usable duration or distance MUST be a finite nonnegative recorded value not explicitly marked unavailable. Missing, invalid, negative, or explicitly unavailable values MUST NOT contribute to that measure's total or be presented as measured zeros; a genuine available zero MUST remain valid. Missing measurements MUST NOT change Workout number results.
- **FR-008**: A field containing both usable and unusable selected measurements MUST display the sum of usable values and identify incomplete coverage in its tooltip. A field with eligible activities but no usable selected value MUST be identified as unavailable; a field with no eligible activities MUST remain distinguishable from unavailable measurements. An all-unavailable measure MUST show an explanatory unavailable state rather than a misleading all-zero volume chart, without disabling the selector.
- **FR-009**: Chart value labels, value-axis title, and transient or pinned tooltip content MUST identify the selected measure and consistent units. Workout number uses whole workout counts, duration uses hours on the value axis and readable hour/minute/second totals in detail without wrapping at 24 hours, and distance uses kilometers with fractional values. Totals MUST be calculated before display rounding.
- **FR-010**: Changing the measure MUST refresh the displayed result without reimporting data and MUST clear any existing Workout Time pin before the new result is displayed or exported. The chosen measure MUST persist through other filter changes and tab visits within the current page session, including a replacement import; a fresh page load MUST return to Workout number.
- **FR-011**: The measure selector MUST support pointer, touch, and keyboard interaction with visible focus and an accessible selected state. It MUST participate in the existing Workout Time finite-filter navigation without breaking text/input editing or other dashboards' navigation.
- **FR-012**: Existing Share/Export MUST work for every populated measure and preserve its chart values, measure identification, and units in preview and download. Pinned detail MUST use the existing full-or-compact speech-bubble presentation with truthful selected-field association. Export request-time measure and selection MUST remain fixed even if the live measure subsequently changes. Existing no-data and all-unavailable behavior MUST prevent misleading exports.
- **FR-013**: This feature MUST preserve the Workout Time tab's identity, order, existing sport/date/grouping controls, supported import sources, source-value meaning, and other visualizations' behavior. Calculations and image preparation MUST remain local without adding transmission of activity or tooltip details; unrelated existing network behavior is unchanged.

### Key Entities *(include if feature involves data)*

- **Workout Time measure**: One of Workout number, Duration, or Distance, defining the meaning and unit of the displayed totals for the current page session.
- **Time field**: An existing ordered start-time band, weekday, day of month, or month of year, retaining its eligible workout count and the selected measure's usable total and coverage status.
- **Eligible workout**: An existing imported activity accepted by Workout Time's date/start-time, sport, and date-range rules, with optional usable recorded duration and distance.
- **Workout Time view context**: The selected measure together with grouping, sport, date range, and dataset, determining the meaning of the live chart, pinned detail, and export request snapshot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In every fresh-session acceptance case, Workout number is selected and all field counts exactly match the existing count view for the same activities and filters.
- **SC-002**: A reference history covering all four groupings, all four existing sport selections, and all three measures produces correct field totals and field ordering in all 48 combinations. The sum of field contributions equals the usable selected-measure total of the eligible activities, before display rounding.
- **SC-003**: All missing/invalid/available-zero/partial-coverage reference cases distinguish unavailable values from measured zero and preserve workout counts; none fabricate numeric contributions. The 06:00-07:59 reference case yields exactly 3 workouts, 75 minutes, and 17 km.
- **SC-004**: At 360-pixel-wide mobile and 1440-pixel-wide desktop viewports, users can select any measure with one activation without losing other filters; labels and units remain readable and the selector introduces no horizontal page overflow. Pointer, touch, and keyboard workflows all complete successfully.
- **SC-005**: For a history of 10,000 eligible activities, at least 19 of 20 measure changes finish displaying the correct new result within one second in the validation browser, without reimporting the history or requiring a second user action.
- **SC-006**: All three populated measures pass preview/download acceptance checks with matching measure, units, and pinned detail. Every measure-change case clears the obsolete pin; every delayed-export case retains its request-time measure and selection. Empty and all-unavailable cases produce zero misleading populated exports.

## Assumptions

- Workout number means count, not an activity identifier or sequence number. The new control selects the measure; it does not add another time grouping or modify the date-range horizon.
- Duration and distance represent accumulated workout totals grouped by start time, not estimated time spent or distance traveled inside each overlapping clock interval. Boundary-spanning activities are not prorated or split.
- The app's existing recorded workout duration is the duration source; this feature does not introduce a moving-time-versus-elapsed-time selector or change import parsing.
- Distance is expressed in kilometers, consistent with the existing imported data and dashboard. No new unit preference or conversion setting is introduced.
- Existing imported availability indicators remain authoritative for distinguishing a real zero from a missing measurement. Partial coverage is communicated through detail rather than inventing estimates.
- Current-page measure selection survives other view changes but is not saved across page loads. Existing pin invalidation and local export behavior remain dependencies, including the [speech-bubble export feature](../074-pinned-tooltip-callouts/spec.md).
- This is a behavior extension of the existing Workout Time tab, not a new visualization tab. Other dashboards, statistics, imports, raw files, network services, and saved preferences are outside scope.