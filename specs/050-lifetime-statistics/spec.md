# Feature Specification: Lifetime Statistics

**Feature Branch**: `050-lifetime-statistics`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "new feature: total lifetime km and time, something else that is relevant for lifetime? number of shows, number of bikes. something else? countries is this possible?"

## Clarifications

### Session 2026-10-07

- Q: Wie sollen Länder für die Lebenszeit-Übersicht ermittelt werden? → A: Zunächst nur ausdrücklich importierte Länderangaben verwenden und die Importquellen sorgfältig prüfen; diese mögliche Zählung wurde durch die folgende Antwort für Version 1 ausgeschlossen.
- Q: Soll die erste Version Länder zusätzlich anhand importierter GPS-Routen mit lokal gespeicherten Ländergrenzen ermitteln? → A: Nein; in der ersten Version gibt es keine Länderzählung.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lifetime totals at a glance (Priority: P1)

As an athlete, I want to see my all-time distance, training time, and total number of workouts from the activities I imported, so that I can understand the overall scale of my training history.

**Why this priority**: The lifetime totals are the core of the request and provide value even if none of the supporting breakdowns are available.

**Independent Test**: Import a small synthetic history with known distances, moving times, and activity counts, then verify the displayed all-time totals.

**Acceptance Scenarios**:

1. **Given** activities with valid distance and moving-time values are imported, **When** the user opens Lifetime Statistics, **Then** the total distance, total moving time, and total number of workouts are shown as distinct summary metrics.
2. **Given** activities span Run, Bike, and Swim, **When** the summary is displayed, **Then** users can also see distance, moving time, and activity count broken down by sport.
3. **Given** no activities have been imported, **When** the user opens the view, **Then** a clear prompt explains that activity data must be imported before lifetime totals can be shown.

### User Story 2 - Explore meaningful lifetime milestones (Priority: P2)

As an athlete, I want to see additional lifetime milestones such as elevation gained, active days, and my longest activity, so that the summary describes more than distance and time.

**Why this priority**: These measures make the overview more useful while remaining understandable and grounded in activity history.

**Independent Test**: Import activities with known elevation, dates, distances, and durations, including missing elevation values, and verify each milestone and its unavailable-data behavior.

**Acceptance Scenarios**:

1. **Given** activities include elevation gain and valid dates, **When** the overview is displayed, **Then** it shows total recorded elevation gain and the number of distinct calendar days with at least one activity.
2. **Given** multiple activities are imported, **When** the longest-activity milestones are shown, **Then** the longest activity by distance and the longest activity by moving time are identified with their values.
3. **Given** elevation values are missing or invalid, **When** totals are calculated, **Then** missing values are not treated as zero measurements or fabricated, and elevation is clearly marked as unavailable or based on recorded values only.

### User Story 3 - See shoes and bikes used (Priority: P2)

As an athlete, I want to see the total number of distinct shoes and bikes used in my imported activities, so that I can understand how much equipment appears in my training history without viewing equipment names.

**Why this priority**: These equipment totals were explicitly requested and provide a compact lifetime measure without exposing individual gear labels.

**Independent Test**: Import Run and Bike activities with repeated, distinct, blank, and placeholder equipment labels; verify distinct gear-name counts by sport and ensure names are not displayed.

**Acceptance Scenarios**:

1. **Given** Run and Bike activities have equipment labels, **When** the overview is displayed, **Then** it shows separate counts of distinct non-empty gear labels as shoes used and bikes used, excluding blank and recognized placeholder labels.
2. **Given** distinct shoe and bike counts are shown, **When** the user views the summary, **Then** individual equipment names are not displayed and the counts are identified as based on imported gear labels.

### User Story 4 - Share the lifetime overview (Priority: P2)

As an athlete, I want to export my lifetime overview as an image, so that I can share the summary using the same flow as other visualizations.

**Why this priority**: Sharing is a standard capability for new dashboard visualizations and makes the summary useful beyond the dashboard.

**Independent Test**: With imported data, trigger Share/Export and verify that the established local preview and download flow shows the visible lifetime summary.

**Acceptance Scenarios**:

1. **Given** a user views Lifetime Statistics with imported data, **When** they choose Share/Export, **Then** the existing local preview and download flow produces an image of the currently displayed lifetime summary.

### Edge Cases

- Activities with missing or invalid numeric values are excluded only from the affected metric; valid information on the same activity remains usable for other metrics.
- Activity rows with a missing or invalid required date are rejected during import and do not contribute to the workout count or lifetime metrics.
- Duplicate activities, if present in the imported data, are counted as separate records; deduplication is outside this feature.
- Activities on the same calendar day count as one active day, regardless of their number.
- Run and Bike gear labels are compared after trimming surrounding whitespace; blank, absent, or placeholder-equivalent values are not counted.
- If no activity has the values needed for an optional milestone, the interface communicates that the metric is unavailable instead of displaying a misleading zero.
- Country counting is out of scope for the first version.
- The summary remains usable on narrow screens and when an athlete has many equipment items.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST provide a Lifetime Statistics view that summarizes the currently imported activity history.
- **FR-002**: The view MUST show total distance, total moving time, and total number of workouts (the count of activity records accepted into the imported dataset); the workout count MUST include each accepted record even when its distance or moving-time value is missing or invalid. Rows rejected because the required date is missing or invalid are not counted.
- **FR-003**: The view MUST provide distance, moving-time, and activity-count totals for each supported sport (Run, Bike, and Swim) represented in the imported data.
- **FR-004**: The view MUST show total recorded elevation gain when the imported activities provide usable elevation values, and MUST identify when the value is unavailable or incomplete.
- **FR-005**: The view MUST show the number of distinct calendar days containing at least one imported activity; every accepted activity has a valid date.
- **FR-006**: The view MUST identify the longest activity by distance and the longest activity by moving time when corresponding values are available.
- **FR-007**: The view MUST show separate counts of distinct, non-empty equipment labels associated with Run activities (shoes used) and Bike activities (bikes used), excluding blank and recognized placeholder labels. The counts MUST be based on the imported gear labels and MUST NOT display individual equipment names.
- **FR-008**: The view MUST clearly distinguish unavailable or incomplete source information from a genuine zero value.
- **FR-009**: The view MUST provide a clear empty state when there are no imported activities.
- **FR-010**: The view MUST provide a discoverable Share/Export action using the established local image-preview and download flow, capturing the visible lifetime summary and following the established no-data behavior.
- **FR-011**: The view MUST use only already imported activity data and MUST NOT transmit activity data to a new external service.
- **FR-012**: The view MUST remain readable on narrow and wide viewports without horizontal overflow.

### Key Entities *(include if feature involves data)*

- **Activity**: A workout accepted into the imported dataset with a valid date and optional sport, distance, moving time, elevation gain, and equipment label.
- **Lifetime metric**: An aggregate or milestone calculated from the currently imported activities, such as total distance, active days, or a longest activity.
- **Sport summary**: Per-sport totals for distance, moving time, and activity count.
- **Equipment counts**: Separate counts of distinct imported equipment labels associated with Run activities (shoes) and Bike activities (bikes); labels themselves are not displayed, and the counts reflect assigned gear names rather than verified ownership.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every validation dataset with known inputs, lifetime distance, moving time, and total workout count match independently calculated expected totals exactly, subject only to displayed-unit rounding.
- **SC-002**: In validation datasets, all per-sport totals and active-day counts match their expected values in 100% of cases, including multiple activities on one day and absent optional values.
- **SC-003**: At least 4 of 5 first-time reviewers identify total distance, moving time, and workout count within 30 seconds of opening the view, without assistance.
- **SC-004**: In 100% of validation cases with missing or incomplete optional data, the view distinguishes unavailable information from a genuine zero value.
- **SC-005**: In 100% of export checks with imported data, the local preview image reflects the lifetime metrics currently visible in the view.
- **SC-006**: The view has no horizontal overflow at narrow mobile and desktop viewport widths.

## Assumptions

- “Number of shows” in the request means number of workouts; the total is the count of imported activity records, not only records with complete distance or time values.
- Lifetime means all activity records accepted into the current imported dataset, not all activities ever recorded by a third-party account; rows without a valid required date are excluded during import, and the available import history defines the time span.
- Moving time is used for total training time, consistent with the existing dashboard's activity metrics.
- The feature is presented as a dedicated visualization view and therefore includes the project's standard Share/Export behavior.
- Total elevation gain, active days, longest activity by distance and duration, and sport breakdowns are useful supporting lifetime measures; the initial scope does not include streaks, records, or year-by-year trend charts.
- Shoe count is based on distinct non-empty equipment labels assigned to Run activities; bike count uses those assigned to Bike activities. The UI communicates that these are counts of imported gear labels, not verified ownership.
- All results are recalculated from the current in-browser imported dataset and are not persisted separately.