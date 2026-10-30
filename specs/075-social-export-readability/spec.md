# Feature Specification: Social Export Readability Refinements

**Feature Branch**: `075-social-export-readability`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: Refine social export readability and copy for Workout Time, Training Calendar, Pace vs., and Personal Best exports. Improve axis/year-label legibility and replace verbose context and milestone text with concise, factual summaries.

## Clarifications

### Session 2026-10-30

- Q: Wie soll ein Training Calendar exportiert werden, wenn mehr Jahre vorhanden sind, als in einem Bild mit lesbaren Jahreslabels Platz finden? → A: Automatisch eine nummerierte Bildserie mit allen Jahren erzeugen; alle Seiten behalten dieselbe Kalender-Skala.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read Workout Time axes (Priority: P1)

A viewer sees a Workout Time social export and needs to read its horizontal and vertical axis labels immediately, including when the image is shown in a phone feed.

**Why this priority**: Low-contrast, gray axis labels hide what the chart measures and make the visualization difficult to interpret without zooming.

**Independent Test**: Export representative Workout Time views in both formats, inspect the rendered axis labels and units at native size and 360 px display width, and compare their text contrast with the image background.

**Acceptance Scenarios**:

1. **Given** a Workout Time export, **When** it is rendered, **Then** both axes have clearly visible, high-contrast labels that identify their metric and unit.
2. **Given** the export is displayed at 360 px wide, **When** a viewer reads it without zooming, **Then** both axis labels remain legible and are not clipped or overlapped.

### User Story 2 - Recognize Training Calendar years (Priority: P1)

A viewer sees a Training Calendar export and needs to identify the years represented by its columns or sections without straining to read tiny labels.

**Why this priority**: The year labels establish the calendar's time context; when they are too small, the viewer cannot reliably compare training across years.

**Independent Test**: Export calendars with multiple years in both formats and inspect every year label at native size and 360 px display width.

**Acceptance Scenarios**:

1. **Given** a Training Calendar export with one or more years, **When** the image is composed, **Then** each displayed year uses readable, high-contrast text at or above the required axis/context minimum.
2. **Given** a calendar containing many years, **When** the image is viewed at 360 px wide, **Then** every year remains distinguishable and no labels overlap or are clipped.
3. **Given** more years than can fit while keeping labels readable, **When** the export is generated, **Then** it provides a numbered image series containing all years with the same calendar scale on every page.

### User Story 3 - Understand Pace vs. at a glance (Priority: P1)

A viewer sees a Pace vs. export and needs to understand the sport, comparison, and point-size meaning without reading a verbose list of field names.

**Why this priority**: Repeating labels such as "Sport", "Metric", "Period", "Unit", "X axis", and "Y axis" makes the summary dense and competes with the scatter plot.

**Independent Test**: Export Run and Bike comparisons with point-size encoding enabled, then inspect the short summary and verify that the axis labels still carry precise metric names and units.

**Acceptance Scenarios**:

1. **Given** a Run heart-rate-versus-pace export with duration-coded point size, **When** it is rendered, **Then** its concise summary can read "Run. Heart rate vs. Pace. Size = Duration" without verbose field prefixes.
2. **Given** a Bike heart-rate-versus-speed export, **When** it is rendered, **Then** the summary says "Speed" rather than "Pace" and names the point-size meaning when that encoding is present.
3. **Given** the selected period is not all-time, **When** period context is useful, **Then** a short date range may be appended without restoring a verbose key/value list; precise units remain on the axes.
4. **Given** a comparison with no meaningful standalone success metric, **When** it is exported, **Then** no unrelated achievement number or fitness claim is added.

### User Story 4 - Understand a Personal Best card (Priority: P1)

An athlete wants each Personal Best export to identify exactly which record it shows and summarize change over time in one simple line.

**Why this priority**: Tiny axis/data-point labels and a concatenation of first, largest-improvement, current, and source descriptions obscure the actual result.

**Independent Test**: Export a multi-record Run 5 km PB and a single-record PB in both formats; inspect headline, result, axis labels, summary line, and available source attribution.

**Acceptance Scenarios**:

1. **Given** a PB tile for a known discipline and distance, **When** its image is rendered, **Then** its headline identifies the record, for example "PB: Run 5 km".
2. **Given** multiple chronological records, **When** the image is rendered, **Then** its secondary summary uses a simple factual form such as "From 52:14 to 45:00 since 2024" and does not concatenate milestone roles, activity names, and sources into one sentence.
3. **Given** only one record is available, **When** the image is rendered, **Then** it shows that result without implying improvement or inventing a starting point.
4. **Given** source information distinguishes an official race from an activity-derived result, **When** the PB is shown, **Then** the source remains available as a concise, secondary attribution without obscuring the result.
5. **Given** the PB chart is displayed at 360 px wide, **When** a viewer reads it, **Then** axes, result labels, and any explanatory data-point descriptions remain legible without zoom or overlap.

### Edge Cases

- Run, Bike, and Swim use different performance metrics and units; Pace vs. summaries and axes must not interchange them.
- A date range may be all-time or bounded; omit redundant all-time wording, but retain a concise non-default range when needed to explain the data.
- A PB history may have one record, duplicate milestone positions, tied best values, or missing event/source names; never fabricate dates, improvement, event names, or source labels.
- Long PB event names must wrap within available bounds without shrinking text below the minimum or displacing the main result.
- Calendar exports may contain enough years to exceed one image's readable capacity; preserve the existing export's content rules and do not shrink year labels to fit.
- When calendar years exceed that capacity, export a numbered series containing every year with one shared scale rather than shrinking labels or omitting years.
- A no-data view retains its current explanation and disabled-download behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Workout Time exports MUST render both axis labels and units in high-contrast text; axis and context text MUST be at least 30 px in the final 1080 px-wide image and MUST NOT use a low-contrast gray that makes the labels difficult to read.
- **FR-002**: Training Calendar exports MUST render every displayed year label at a minimum of 30 px with at least 4.5:1 contrast against its background; labels MUST remain distinguishable, unclipped, and non-overlapping in both supported formats.
- **FR-003**: Pace vs. exports MUST use a concise factual summary instead of a verbose sequence of field-name labels. A Run heart-rate-versus-pace export with duration-coded point sizes SHOULD use "Run. Heart rate vs. Pace. Size = Duration" or an equally concise equivalent; Bike comparisons MUST identify speed, not pace.
- **FR-004**: Pace vs. axis labels MUST continue to identify the actual selected metrics and units precisely, even when the summary omits redundant "Sport", "Metric", "Unit", "X axis", or "Y axis" prefixes.
- **FR-005**: Pace vs. summaries MUST identify the point-size meaning whenever point size encodes data. A non-default period MAY be appended as a short date range; an all-time period and redundant field-name prefixes SHOULD be omitted.
- **FR-006**: Personal Best export headlines MUST identify the exact discipline/record, using the pattern "PB: [record]" (for example, "PB: Run 5 km"), and MUST keep the best result prominent.
- **FR-007**: A multi-record Personal Best export MUST summarize the change in one concise factual line using the first available and current values plus the first-record year when available (for example, "From 52:14 to 45:00 since 2024"). It MUST NOT concatenate first/largest-improvement/current milestone labels, activity names, and source descriptions into a verbose headline or summary.
- **FR-008**: A single-record Personal Best export MUST present the available result without implying a trend or inventing a comparison. Existing source distinctions, including official-race versus activity-derived records when known, MUST remain available as concise secondary attribution.
- **FR-009**: Personal Best axis labels and essential result labels MUST be at least 30 px; the principal result and key record values MUST be at least 36 px. Explanatory data-point descriptions MUST be at least 30 px and MUST wrap without clipping or overlap.
- **FR-010**: The changes in FR-001 through FR-009 MUST affect only export presentation. They MUST NOT alter selected activities, filters, aggregation, record calculation, or the underlying visualization values.
- **FR-011**: The updated export preview MUST still match its downloaded PNG, retain both existing formats, and preserve the existing local-browser export and no-data behaviors.
- **FR-012**: When all Training Calendar years cannot fit in one image with year labels at least 30 px and no overlap or clipping, the export MUST provide a numbered image series containing every year. Every page MUST retain the same calendar scale and consistent format, period, metric, and page numbering.

### Key Entities *(include if feature involves data)*

- **Export Summary**: The concise factual line displayed with a visualization, separate from precise chart axis labels.
- **Personal Best Record**: A discipline/distance-specific best result with an optional date, event name, and source classification.
- **PB History Summary**: A compact statement derived from the first available and current record; it is not a new performance calculation.
- **Axis Label**: The text and unit that define a chart dimension; it remains precise even when redundant field prefixes are removed from the summary.
- **Calendar Export Series**: A numbered set of calendar images that contains all years when one image cannot keep the year labels readable; all pages share one calendar scale.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all representative Workout Time exports, both axis labels are at least 30 px, meet 4.5:1 text contrast, and remain readable without clipping at 360 px display width.
- **SC-002**: In all representative multi-year calendar exports, year labels are at least 30 px, distinguishable at 360 px width, and have no overlap or clipping.
- **SC-003**: Run and Bike Pace vs. exports use the correct performance term and units on 100% of checked axes; the summary is no more than seven words when point size and period do not require additional context.
- **SC-004**: In 100% of multi-record PB exports, the headline identifies the PB and the summary contains only the first/current result and first-record year when available; no verbose milestone concatenation appears.
- **SC-005**: In 100% of representative PB exports, essential axis/result text meets the specified size minimums and remains unclipped and non-overlapping at 360 px display width.
- **SC-006**: Preview and downloaded PNG remain identical for all affected exports; selected data and existing PB calculations are unchanged.
- **SC-007**: When a calendar requires multiple pages, 100% of represented years appear exactly once across the numbered series, every page uses the same calendar scale, and year labels remain at least 30 px without overlap or clipping.

## Assumptions

- This specification refines Feature 074's export presentation. Import, dashboard layout, analysis calculations, and navigation remain unchanged.
- Workout Time axis labels and Training Calendar year labels are chart content, not app controls; they remain in the image and receive stronger visual hierarchy.
- "Since" in a multi-record PB summary refers to the year of the first available record. If the year is missing, omit "since" rather than inventing a date.
- PB source/event attribution remains available when known but is visually secondary to the result and concise trend summary.
- The example Pace vs. wording is a pattern; actual sport, metric, pace/speed term, point-size meaning, and units are derived from the selected data.
- The existing square/portrait sizes, typography safety margins, contrast rules, preview/download flow, and local-processing boundary from Feature 074 continue to apply.