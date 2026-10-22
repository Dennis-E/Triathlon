# Feature Specification: Concise TrainingPeaks Import Status

**Feature Branch**: `064-concise-trainingpeaks-status`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "When importing TrainingPeaks, the top-right status contains too much information. Show only 'Imported TrainingPeaks history' and omit details such as archive count, activity count, and unsupported or undated workouts."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Confirm a TrainingPeaks import (Priority: P1)

After a successful TrainingPeaks import, the user sees a short confirmation in the top-right status area without processing statistics or skipped-item details.

**Why this priority**: The success status is the immediate confirmation that the user's import completed. Extra counts and archive details distract from that confirmation.

**Independent Test**: Complete successful TrainingPeaks imports with different archive counts and skipped-item outcomes, then verify the top-right status text is identical in every case.

**Acceptance Scenarios**:

1. **Given** a valid TrainingPeaks archive with activities and no skipped items, **When** its import completes successfully, **Then** the top-right status reads exactly "Imported TrainingPeaks history".
2. **Given** one or more valid TrainingPeaks archives that include unsupported, undated, or unmatched items, **When** their import completes successfully, **Then** the top-right status still reads exactly "Imported TrainingPeaks history" and includes none of those counts or details.
3. **Given** a successful import from multiple TrainingPeaks archives, **When** the import completes, **Then** the top-right status does not disclose the archive count or activity count.

### Edge Cases

- If the user cancels file selection without importing, no TrainingPeaks success confirmation is shown.
- If a TrainingPeaks import fails, the existing failure feedback remains available and is not replaced by the success confirmation.
- Skipped or unmatched items do not change the wording of a successful import confirmation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: After every successful TrainingPeaks import, the top-right status MUST display exactly "Imported TrainingPeaks history".
- **FR-002**: The successful TrainingPeaks status MUST NOT include archive counts, activity counts, or counts or descriptions of unsupported, undated, or unmatched items.
- **FR-003**: The status wording MUST be identical whether the import uses one archive or multiple archives, and whether items were skipped or unmatched.
- **FR-004**: TrainingPeaks progress feedback and failure feedback MUST remain distinct from the success status and retain their existing information.
- **FR-005**: The wording of the Strava import status MUST remain unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all tested successful TrainingPeaks import scenarios, the top-right status exactly matches "Imported TrainingPeaks history".
- **SC-002**: In 100% of successful-import status checks, no archive count, activity count, or skipped/unmatched-item detail appears in the status.
- **SC-003**: Users can distinguish a successful TrainingPeaks import from a failed import in every tested success and failure scenario.

## Assumptions

- The requested text is exact, including capitalization, and should have no trailing statistics or explanatory suffix.
- This change applies only to the top-right success status for TrainingPeaks imports; progress details and the import modal are outside its scope.
- Existing TrainingPeaks import processing and Strava status behavior are otherwise unchanged.
