# Feature Specification: Choose Export Download Location

**Feature Branch**: `057-export-download-location`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "On the export tiles: when the user selects download, open the file explorer to select where it should be downloaded to."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose where an export is saved (Priority: P1)

A user downloads an image from an export tile and wants to choose its destination instead of having it saved automatically to the browser's default download location.

**Why this priority**: Choosing the destination is the requested improvement and gives users direct control over where their exported image is stored.

**Independent Test**: Open an export preview, select its download action, choose a destination and filename in the system save dialog, and verify that the image is saved there and remains usable.

**Acceptance Scenarios**:

1. **Given** an export image is ready to download, **When** the user selects Download, **Then** a system save dialog lets the user choose a destination before the image is saved.
2. **Given** the save dialog is open, **When** the user confirms a destination and filename, **Then** the complete export image is saved at that destination using the chosen filename.
3. **Given** the user cancels the save dialog, **When** the dialog closes, **Then** no file is saved, the export preview remains available, and the user can try again.
4. **Given** saving fails after a destination is selected, **When** the failure is reported, **Then** the user receives a clear message and can retry without reopening or regenerating the export.
5. **Given** the browser or its settings do not permit choosing a destination, **When** the user selects Download, **Then** the existing browser download behavior remains available and the user is informed that destination selection is unavailable.

### Edge Cases

- If the user cancels the save dialog, cancellation must not be reported as a successful download or as an error.
- If the chosen destination cannot be written to, the user must receive an understandable failure message and be able to retry.
- If the user changes the suggested filename, the saved file must use the chosen name while retaining a usable image format.
- Repeated download attempts must each allow a fresh destination choice and must not reuse a stale selection.
- If the export image is not ready or contains no exportable content, the system must retain the existing no-data behavior and must not open a save dialog for an invalid file.
- Destination selection must not upload the export image or personal activity data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every export tile's Download action MUST request a save destination before saving when the browser permits destination selection.
- **FR-002**: The save dialog MUST present the export's suggested filename and allow the user to select the destination and, where supported, change the filename.
- **FR-003**: After the user confirms a destination, the system MUST save the complete export image there in its existing supported image format.
- **FR-004**: If the user cancels destination selection, the system MUST NOT save a file, MUST keep the export preview available, and MUST allow another download attempt.
- **FR-005**: A save failure MUST be communicated clearly and MUST leave the user able to retry.
- **FR-006**: If destination selection is unavailable because of browser capability or policy, the system MUST preserve the existing browser download behavior and inform the user that a location could not be chosen.
- **FR-007**: Each download attempt MUST use a fresh destination choice and MUST NOT silently reuse a destination selected for an earlier attempt.
- **FR-008**: Existing export image content, image format, no-data behavior, and local processing MUST remain unchanged; export images and personal activity data MUST NOT be uploaded as part of destination selection or saving.

### Key Entities *(include if feature involves data)*

- **Export Tile**: A visualization export surface that offers a downloadable image.
- **Download Request**: A user's attempt to save the currently prepared export, including its success, cancellation, or failure outcome.
- **Destination Choice**: The save location and optional filename explicitly confirmed by the user for one download request.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of download attempts on browsers that permit destination selection, the user can choose a destination before the file is saved.
- **SC-002**: In 100% of confirmed save tests, the image is present at the chosen destination, uses the chosen filename, and opens as a valid export.
- **SC-003**: In 100% of cancellation tests, no file is saved and the preview allows the user to retry.
- **SC-004**: In 100% of simulated save failures, the user sees a clear explanation and can initiate another attempt.
- **SC-005**: In 100% of environments where destination selection is unavailable, the existing download path remains usable and its limitation is communicated.
- **SC-006**: Destination selection and saving result in zero uploads of export images or personal activity data.

## Assumptions

- “File explorer” means the browser/system save dialog through which the user chooses a save location; the feature does not browse or expose files beyond that user-initiated choice.
- Destination selection is available only where the user's browser and policy allow a save-location dialog; otherwise, the established browser download behavior remains the fallback and the limitation is disclosed.
- The suggested filename and current image format come from the existing export flow; the user may change the filename when the save dialog allows it.
- The download action refers to each existing export tile/preview download action. Export creation, preview content, and the set of available export tiles are otherwise out of scope.
- Export generation and saving remain local to the user's browser.