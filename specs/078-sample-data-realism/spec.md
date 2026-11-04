# Feature Specification: Realistic Sample Training Data

**Feature Branch**: `main` (specification and implementation only; no feature branch requested)

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "Pull the oldest GitHub issue and implement it." Issue #1: Improve realism and variety in sample training and equipment data.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore Realistic Training Patterns (Priority: P1)

As a visitor exploring the sample dashboard, I can see training volume that changes with seasons and includes a credible recovery break, rather than a uniform stream of workouts.

**Why this priority**: Sample data should give visitors a trustworthy impression of how training history and its trends are analyzed.

**Independent Test**: Compare monthly sample activity volume across the available years and inspect the timeline for a sustained reduced-training or no-training period.

**Acceptance Scenarios**:

1. **Given** a sample training year, **When** I compare monthly activity volume, **Then** at least one season has a meaningfully lower volume than the higher-training season.
2. **Given** the sample history, **When** I inspect its dates, **Then** it includes at least one realistic extended break or reduced-training period.
3. **Given** the sample history, **When** I review its context, **Then** it is clearly identified as fictional and contains no personal athlete records.

### User Story 2 - Compare Equipment Use (Priority: P1)

As a visitor exploring equipment summaries, I can distinguish running shoes from bicycles and see that equipment items are used in different ways or periods.

**Why this priority**: Equipment comparisons are misleading if shoes are labeled as bikes or every item appears to have identical year-round use.

**Independent Test**: Filter the sample dashboard's equipment summaries by type and compare the activity timelines for individual items.

**Acceptance Scenarios**:

1. **Given** the sample history, **When** I view equipment, **Then** it includes both running shoes and bicycles and each is identified under the appropriate type.
2. **Given** multiple items of a sport, **When** I compare their usage over time, **Then** at least one item is used only occasionally or during a limited period rather than at a steady rate throughout the full history.
3. **Given** any represented year, **When** I compare its supported sports and equipment items, **Then** Run, Bike, and Swim remain available and each included equipment item appears in at least one usage summary.

## Edge Cases

- A longer recovery break must not remove all training from any calendar month or leave a year without any supported sport.
- Equipment used only occasionally must still appear in the relevant equipment summary and timeline.
- Empty equipment on activities that do not name a physical item must not be presented as a bicycle.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sample training volume MUST vary meaningfully by season instead of remaining approximately uniform across the timeline.
- **FR-002**: The sample history MUST include at least one extended period of reduced or no training that is consistent with recovery from illness or injury.
- **FR-003**: The sample equipment MUST represent running shoes and bicycles as distinct equipment types.
- **FR-004**: Equipment use MUST vary by item and over time; at least one item MUST be used occasionally or in a limited period rather than uniformly across the full history.
- **FR-005**: Every represented year MUST retain activities for Run, Bike, and Swim, and each included equipment item MUST appear in at least one usage summary.
- **FR-006**: Sample data MUST remain fictional and MUST NOT introduce personal training records.

### Key Entities *(include if data involved)*

- **Sample activity**: A fictional workout with a date, sport, training measurements, and optional equipment association.
- **Equipment item**: A fictional shoe or bicycle associated with some sample activities over one or more periods.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For each sample year, the highest monthly activity distance is at least 15% greater than the lowest monthly activity distance.
- **SC-002**: At least one sample recovery period spans 10 or more consecutive days without an activity.
- **SC-003**: Equipment filtering identifies at least one shoe item and one bicycle item under their correct categories.
- **SC-004**: At least one equipment item is used in fewer than 10% of the sample running activities or is limited to fewer than all represented years.
- **SC-005**: At least four of five first-time visitors can identify a seasonal training change and a recovery break when reviewing the sample history.

## Assumptions

- This change improves the existing fictional sample history; it does not change personal data import behavior or add new dashboard visualizations.
- Existing sample activities and equipment summaries remain the supported presentation of the sample dataset.
- Seasonal volume and recovery are represented by activity timing and distance, while route distances continue to reflect the named route.
- Occasional trail equipment is sufficient to demonstrate varied usage; the sample does not need to model maintenance, replacement, or a full equipment inventory.
