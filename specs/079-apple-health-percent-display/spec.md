# Feature Specification: Apple Health Progress Percentage Display

**Feature Branch**: `not-created`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "Passe die Prozentanzeige beim Import von Apple-Health-Daten an. Prozentwerte werden derzeit mit bis zu zehn Nachkommastellen dargestellt. Zeige sie stattdessen als ganze Prozentwerte ohne Nachkommastellen und mit Prozentzeichen an. Nur die Darstellung ändert sich; Berechnungen und zugrunde liegende Werte bleiben unverändert."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read Apple Health import progress (Priority: P1)

As a person importing Apple Health data, I want progress percentages to appear as whole percentages with a percent sign, so that the import status is easy to scan without unnecessary decimal places.

**Why this priority**: The progress percentage is visible throughout the import and is the specific display issue in scope.

**Independent Test**: Exercise Apple Health import progress updates with fractional and whole percentage values and verify the displayed labels and progress behavior.

**Acceptance Scenarios**:

1. **Given** an Apple Health import reports fractional progress, **When** its progress percentage is displayed, **Then** the label shows the nearest whole percentage with a `%` sign and no decimal places.
2. **Given** an Apple Health import reports 0% or 100% progress, **When** the progress percentage is displayed, **Then** the label includes the corresponding whole number and `%` sign.
3. **Given** an Apple Health import reports fractional progress, **When** its percentage label is rounded for display, **Then** progress calculations and the progress indication continue to use the unchanged underlying value.
4. **Given** another supported import source reports progress, **When** its progress percentage is displayed, **Then** its existing presentation remains unchanged.

### Edge Cases

- Values near a whole-number boundary are rounded to the nearest integer; displayed progress remains within 0% and 100%.
- When a stage update has no new numeric progress value, the existing percentage remains displayed as before.
- The percent sign is present for every numeric percentage shown during Apple Health import, including 0% and 100%.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: During Apple Health import, every displayed numeric progress percentage MUST be shown as a whole number with no decimal places and followed by a percent sign.
- **FR-002**: Fractional Apple Health progress percentages MUST be rounded to the nearest whole percentage for display.
- **FR-003**: The display change MUST NOT alter the underlying progress values, progress calculations, progress indication, or imported data.
- **FR-004**: Progress percentage presentation for import sources other than Apple Health MUST remain unchanged.
- **FR-005**: Updates without a new numeric progress value MUST retain the existing progress display behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all tested Apple Health import progress states, including 0%, fractional values, and 100%, the displayed percentage contains an integer and `%` and contains no decimal places.
- **SC-002**: For every fractional test value, the displayed integer is its nearest whole percentage while the underlying progress value and progress indication remain unchanged.
- **SC-003**: In all regression checks for non-Apple Health imports, the progress percentage presentation matches its current behavior.

## Assumptions

- The requested percentage refers only to the numeric progress label shown while an Apple Health import is in progress; completion text, diagnostic counts, and other import messages are out of scope.
- Conventional rounding to the nearest whole percentage is intended; this affects presentation only.
- Existing handling of progress boundaries, stage-only updates, and all other import sources is the baseline to preserve.