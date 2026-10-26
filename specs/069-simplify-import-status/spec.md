# Feature Specification: Simplify Import Status

**Feature Branch**: `069-simplify-import-status`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "landing page: oben rechts viel zu viele infos nach import (Imported Strava history: 2646 activities; media 1458 readable, 977 unmatched, 0 ambiguous, 0 corrupt, 0 unsupported, 3 unlisted). Immer nur simpel 'imported strava history' oder 'training peaks accordingly'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See a concise import confirmation (Priority: P1)

As an athlete who has finished importing training history, I want the confirmation in the upper-right area to identify only the import source, so that the landing page stays clear instead of repeating technical counts and media diagnostics.

**Why this priority**: The completion confirmation is the first status users see after import, and excess detail is the problem this feature addresses.

**Independent Test**: Complete one import from each supported source and inspect the upper-right completion status for a source-only label without counts or diagnostic details.

**Acceptance Scenarios**:

1. **Given** a Strava import completes successfully, **When** the completion status is shown, **Then** it reads "Imported Strava history" without activity totals or media diagnostics.
2. **Given** a TrainingPeaks import completes successfully, **When** the completion status is shown, **Then** it reads "Imported TrainingPeaks history" without additional counts or diagnostic details.
3. **Given** an import has not completed or has failed, **When** its progress or error status is shown, **Then** that status continues to communicate its current stage or failure rather than being replaced by a success label.

### Edge Cases

- A successful import with zero activities still displays the appropriate source-only completion label.
- Strava media diagnostics with any combination of readable, unmatched, ambiguous, corrupt, unsupported, or unlisted files do not appear in the completion status.
- The status remains distinguishable between Strava and TrainingPeaks imports.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: After a successful Strava import, the upper-right completion status MUST display only "Imported Strava history".
- **FR-002**: After a successful TrainingPeaks import, the upper-right completion status MUST display only "Imported TrainingPeaks history".
- **FR-003**: The successful completion status MUST NOT include activity totals, archive counts, media counts, or file-matching and file-readability diagnostics.
- **FR-004**: The completion status MUST identify the correct source for each supported import type.
- **FR-005**: Progress and failure statuses MUST continue to communicate the active import stage or failure; this change MUST NOT replace them with a success label.
- **FR-006**: This change MUST NOT remove or alter diagnostic information presented outside the upper-right successful completion status.

### Key Entities *(include if data involved)*

- **Import source**: The origin of the imported training history, either Strava or TrainingPeaks, which determines the completion label.
- **Completion status**: The concise success confirmation shown after an import finishes successfully.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of successful Strava import checks, the completion status displays exactly "Imported Strava history" and no counts or diagnostics.
- **SC-002**: In 100% of successful TrainingPeaks import checks, the completion status displays exactly "Imported TrainingPeaks history" and no counts or diagnostics.
- **SC-003**: At least 4 of 5 first-time reviewers can identify the completed import source from the status within 5 seconds.
- **SC-004**: In 100% of interrupted or failed import checks, the visible status continues to distinguish progress or failure from successful completion.

## Assumptions

- The requested simplification applies to the upper-right successful import status on the landing page, not to progress information shown while importing.
- Existing information outside that success status, including any diagnostics elsewhere in the import experience, remains unchanged.
- The source labels remain in English to match the existing product wording.