# Feature Specification: Export Follow-up Fixes

**Feature Branch**: `010-export-followup`

**Created**: 2026-09-18

**Status**: Draft

**Input**: User description: "The Instagram logo is no longer visible on the button; place it to the right of the text. Ensure the legend and filters do not overlap. The button on the personal-best popups does not work and shows 'Could not export visualization. Please try again.'."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recognize both sharing destinations (Priority: P1)

A user wants the export control to show both Instagram and Strava branding in the requested order, with the Instagram logo immediately to the right of the action text.

**Why this priority**: The control currently omits one of the two requested destination cues, making the action incomplete and less recognizable.

**Independent Test**: Open the dashboard with export controls visible and inspect each visualization control and the PB detail-popup control at desktop and narrow widths.

**Acceptance Scenarios**:

1. **Given** a supported visualization export control, **When** the user views it, **Then** it shows the Strava icon, the text `Export for Insta / Strava`, and the Instagram icon to the right of the text.
2. **Given** the PB detail popup is open, **When** the user views its export control, **Then** it uses the same icon-text-icon order and remains readable without clipping.
3. **Given** a narrow supported viewport, **When** the user views any export control, **Then** both icons and the complete label remain visible within the control.

### User Story 2 - Read export metadata without collisions (Priority: P1)

A user wants to understand active filters and plotted measures from the exported image without the filter summary covering or colliding with the legend.

**Why this priority**: Overlapping metadata makes the exported visualization ambiguous even when the underlying chart is correct.

**Independent Test**: Export visualizations with no legend, with a legend, and with multiple active filters; inspect the preview and downloaded image for separate readable regions.

**Acceptance Scenarios**:

1. **Given** an export with active filters and no legend, **When** the image is generated, **Then** the filter summary occupies a bounded readable region without covering the visualization or controls.
2. **Given** an export with active filters and an applicable legend, **When** the image is generated, **Then** the filters and legend are placed in separate non-overlapping regions with readable text and swatches.
3. **Given** a long filter summary or many available controls, **When** the image is generated, **Then** content wraps or is bounded predictably and does not overwrite the legend, footer, QR code, or branding.

### User Story 3 - Export the selected personal-best detail (Priority: P1)

A user opens a personal-best detail popup and expects its export button to generate a preview of that detail instead of showing a generic capture error.

**Why this priority**: The popup button is the only remaining PB export entry point, so a failure makes PB export unavailable.

**Independent Test**: Open a data-bearing PB detail popup, activate its export button, and verify that a preview opens containing the selected detail; repeat after opening a different PB tile.

**Acceptance Scenarios**:

1. **Given** a data-bearing personal-best detail popup, **When** the user selects its export button, **Then** an export preview opens successfully.
2. **Given** the popup export is activated, **When** the preview is generated, **Then** the selected detail chart and title are exported rather than the PB overview.
3. **Given** the user opens a different PB detail before exporting, **When** the user selects export, **Then** the second detail is exported and no stale first-detail target is used.
4. **Given** a PB detail has no records, **When** the popup is shown, **Then** the export action is unavailable or produces the established no-data message without a blank preview.
5. **Given** a PB export capture or asset load fails, **When** the user sees the error, **Then** the error explains the failed export without leaving the request stuck in a non-idle state.

### Edge Cases

- If the export label wraps at a narrow width, the right-hand Instagram icon must remain visible and must not be mistaken for part of the label.
- If filters require multiple rows, the legend must be positioned after the actual filter block rather than at a fixed overlapping coordinate.
- If the available-controls snapshot is taller than its reserved area, the composition must constrain or reflow it before drawing the legend and footer.
- If the PB SVG is not directly capturable in a browser, the export must capture a supported containing region or use an equivalent browser-safe representation.
- If the PB popup closes while an export is being prepared, the selected export target must remain valid for that request and must not reference a removed element.
- Repeated PB exports must reset the preview/error state and allow a subsequent export attempt.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every supported visualization export control MUST include, in order, a Strava icon, the text `Export for Insta / Strava`, and an Instagram icon placed to the right of the text.
- **FR-002**: The personal-best detail-popup export control MUST use the same Strava-icon, label, Instagram-icon order as visualization export controls.
- **FR-003**: Export controls MUST preserve both icons and the complete label within supported desktop and narrow viewport layouts.
- **FR-004**: The export composition MUST calculate the vertical position of the legend from the rendered filter and available-control content, rather than using a fixed position that can overlap metadata.
- **FR-005**: Filters, available-control snapshots, legends, TriAnalytica branding, QR code, and domain MUST occupy separate readable regions in the export image.
- **FR-006**: The personal-best detail export MUST use a browser-capturable target that contains the selected detail chart and remains available for the duration of the capture request.
- **FR-007**: A successful personal-best detail export MUST open the normal preview and preserve the selected detail in the generated image and download filename.
- **FR-008**: A failed personal-best export MUST reset the export request state to idle, show a clear user-facing error, and allow a later retry.
- **FR-009**: Personal-best no-data behavior MUST prevent blank or misleading exports.
- **FR-010**: Export processing MUST remain local to the browser and MUST NOT upload visualization data or generated images.

### Key Entities *(include if feature involves data)*

- **Export Control**: A sharing action containing ordered Strava icon, export label, and Instagram icon elements.
- **Export Metadata Layout**: The bounded, sequential regions for filters, available controls, legend, branding, domain, and QR code.
- **PB Detail Capture Target**: The currently selected and browser-capturable personal-best detail region used by the export request.
- **Export Request State**: The lifecycle state that returns to idle after success, no-data rejection, or capture failure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of inspected visualization and PB-popup controls, both destination icons are visible in the order Strava, label, Instagram.
- **SC-002**: In 100% of exports containing both filters and a legend, no filter text, control pill, legend swatch, or legend label overlaps another required element.
- **SC-003**: At least 95% of reviewers can identify the active filters and plotted measures from exports containing long filter summaries without returning to the dashboard.
- **SC-004**: In 100% of data-bearing PB detail tests, activating the popup export opens a preview instead of showing the generic capture failure message.
- **SC-005**: In 100% of repeated PB export attempts, the request can be retried after either success or failure and no stale detail is exported.
- **SC-006**: No visualization data or generated image is transmitted to a server by these corrections.

## Assumptions

- The visible control text remains exactly `Export for Insta / Strava`; only the icon placement and presence are corrected.
- The Instagram and Strava assets remain local authoritative assets and are UI-control elements only; they remain excluded from generated image content.
- The export image remains square and local; the correction may change internal metadata-region heights to prevent collisions.
- Existing preview, download, no-data, and privacy behavior remains unchanged except where required to make PB detail capture reliable.
- The PB detail chart's existing popup container is the preferred capture context if direct SVG capture is unreliable.
