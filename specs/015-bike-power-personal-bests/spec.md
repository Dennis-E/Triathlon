# Feature Specification: Bike Power Personal Bests

**Feature Branch**: `015-bike-power-personal-bests`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "What is with Watt on bike? is it implemented? why dont i see it in PR's? I think there is watt in the training data."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See bike power in Personal Bests (Priority: P1)

A cyclist viewing Personal Bests wants to see whether power data from bike activities contributes to the displayed records, so that available watt data is not hidden or mistaken for missing data.

**Why this priority**: Discoverability is the user's primary problem. The existing training data can contain power, but the Personal Bests view must make its availability and meaning visible.

**Independent Test**: Load a dataset containing bike activities with valid power values, open Personal Bests, and verify that the Bike column contains clearly labeled power information or records derived from those values.

**Acceptance Scenarios**:

1. **Given** imported bike activities contain valid power values, **When** the user opens Personal Bests, **Then** the Bike section visibly identifies the available power metric in watts.
2. **Given** imported bike activities contain no valid power values, **When** the user opens Personal Bests, **Then** the Bike section does not show fabricated power records and explains that no usable power data was found.
3. **Given** the user views a bike power record, **When** the user inspects its detail, **Then** the value is labeled in watts and the record's source context is understandable.

---

### User Story 2 - Distinguish average power from duration records (Priority: P1)

A cyclist wants to understand whether a displayed watt value is an activity average or a best effort over a defined duration, so that the Personal Bests view does not imply a false comparison.

**Why this priority**: These metrics answer different questions. Clear labeling prevents users from treating an average ride value as a five-, ten-, twenty-, or sixty-minute power record.

**Independent Test**: Load activities with only whole-activity average power, activities with duration-specific power, and a mixture of both; verify that each appears under the correct labeled category and is never silently substituted for another.

**Acceptance Scenarios**:

1. **Given** an activity has only an average power value, **When** it is shown in Personal Bests, **Then** it may contribute to an activity-average power record but is not labeled as a duration-specific best effort.
2. **Given** an activity has a valid power effort for a defined duration, **When** it is shown in Personal Bests, **Then** it contributes to the matching duration record and displays the duration and watt value.
3. **Given** a duration category has no qualifying power efforts, **When** the user views that category, **Then** it is omitted or shown as unavailable with an explanation rather than an empty or misleading chart.

---

### User Story 3 - Compare and verify power progress (Priority: P2)

A cyclist wants to compare successive power records over time and verify an individual record, so that the feature is useful for training analysis rather than only confirming that a column exists.

**Why this priority**: Once power is discoverable and correctly classified, historical progression and traceability provide the practical training value.

**Independent Test**: Load at least two dated bike activities with increasing qualifying power, inspect the relevant Personal Bests progression, and verify that the record order, dates, values, and activity identity are consistent.

**Acceptance Scenarios**:

1. **Given** multiple qualifying records exist for the same power category, **When** the user views its progression, **Then** each new best is shown in chronological order with its watt value.
2. **Given** the user selects a power record, **When** the detail is displayed, **Then** it identifies the activity date, activity name when available, category, and watt value.
3. **Given** a record has an invalid, zero, or negative power value, **When** records are calculated, **Then** that value is excluded without preventing other valid activities from appearing.

### Edge Cases

- German and English training exports may use different names for average power; supported equivalents must produce the same watt meaning.
- A dataset may contain power for running or other sports; only bike power belongs in Bike Personal Bests.
- A power value may be present without a usable activity date, duration, or identity; the record must remain traceable enough to display or be excluded with a clear reason.
- Power values may use decimal commas or decimal points; valid localized values must be interpreted consistently.
- A bike activity can have average power but no duration-specific power effort; the two data types must remain distinct.
- Power data may be present in some activities but absent in others; missing values must not suppress valid records from the rest of the dataset.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST recognize valid bike power values from the supported training-data formats and retain their watt meaning for Personal Bests.
- **FR-002**: The system MUST make the availability of bike power visible in the Personal Bests view when at least one valid bike power value exists.
- **FR-003**: The system MUST label every displayed power value in watts (`W`) and identify whether it represents an activity average or a defined-duration effort.
- **FR-004**: The system MUST provide a clearly labeled bike power record or progression for each supported duration that has at least one qualifying duration-specific effort.
- **FR-005**: The system MUST NOT present an activity-average watt value as a five-, ten-, twenty-, or sixty-minute best effort unless the data explicitly supports that duration-specific interpretation.
- **FR-006**: The system MUST exclude missing, non-numeric, zero, and negative power values from power records without discarding unrelated valid activity data.
- **FR-007**: The system MUST keep power records limited to activities categorized as Bike.
- **FR-008**: The system MUST show enough context for a user to verify a power record, including its date, category, watt value, and activity name when available.
- **FR-009**: The system MUST provide an understandable no-data state when the imported dataset contains no usable bike power values.
- **FR-010**: The system MUST preserve existing distance, pace, speed, heart-rate, elevation, and non-bike Personal Best behavior when power data is absent or incomplete.
- **FR-011**: The system MUST treat equivalent German and English power labels and supported decimal formats consistently.

### Key Entities

- **Bike Power Observation**: A valid watt value associated with a bike activity, including whether it is an activity average or a duration-specific effort.
- **Bike Power Personal Best**: The highest qualifying power value for a defined category, with its date, activity context, duration when applicable, and source classification.
- **Power Availability State**: The user-visible state describing whether usable average power, duration-specific power, both, or neither are available in the imported data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a representative dataset where at least one bike activity has a valid power value, 100% of reviewers can find a watts-labeled power result in Personal Bests without inspecting raw export files.
- **SC-002**: In test datasets containing average-only, duration-specific, and mixed power data, 100% of displayed records are classified and labeled according to their actual source type.
- **SC-003**: For a dataset with at least two qualifying records in a power category, users can identify the current best, date, and activity context within 30 seconds.
- **SC-004**: Invalid, missing, or non-bike power values produce zero misleading power records while valid bike records remain available in 100% of validation cases.
- **SC-005**: Existing non-power Personal Best results remain unchanged in all regression scenarios where no usable bike power data is present.
- **SC-006**: At least 90% of reviewers correctly explain the difference between an activity-average watt value and a duration-specific power best after viewing the Personal Bests labels and details.

## Assumptions

- “PRs” means the existing Personal Bests view and its historical progression records.
- The existing supported training exports are the source of truth; this feature does not require users to enter watt values manually.
- A watt value without duration-specific evidence is useful as an activity-average metric but is not sufficient to claim a duration-specific power best.
- The supported duration categories remain the existing bike power categories unless a later planning decision explicitly expands them.
- Power processing remains local to the browser and does not require uploading personal training data.
- Existing Personal Best filters, layouts, and export behavior remain in scope only where necessary to make the new power records understandable.