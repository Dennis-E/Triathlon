# Feature Specification: Instagram-Ready Visualization Export

**Feature Branch**: `007-instagram-export-button`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "i want an export button for instagram. this button should create a picture with a screenshot of the current visualization tab. this screenshot should be shown in a pop-up window and there should be possibility to 'mail to' it somewhere, to download it This button should be integrated into every visualization."

## Clarifications

### Session 2026-09-17

- Q: Since browser 'mailto:' links cannot attach files automatically, how should the 'mail to' action actually hand off the image? → A: Drop the email/"mail to" action entirely; ship download-only for now.
- Q: When exporting, should the captured image include only the chart/graphic itself, or the whole visualization panel (including its title, filters, and captions)? → A: Chart/graphic only, plus a meaningful title (no filters/controls).
- Q: What exact aspect ratio should the exported image use to be 'Instagram-ready'? → A: 1:1 square.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture the current visualization as an image (Priority: P1)

A user is looking at one of the dashboard's visualization tabs (e.g., Total Distance, Heart Rate & Pace, Equipment, Equipment Timeline, Personal Bests, or Heatmap) and wants a shareable image of exactly what they see, without having to take a manual system screenshot.

**Why this priority**: This is the core value of the feature — without a working capture step, there is nothing to preview, download, or share.

**Independent Test**: Can be fully tested by opening any visualization tab, clicking its export button, and confirming an image representing that tab's current content is produced and shown to the user.

**Acceptance Scenarios**:

1. **Given** a visualization tab with data rendered (chart, timeline, or heatmap), **When** the user clicks that tab's export button, **Then** an image capturing the visible visualization content is generated and displayed in a pop-up preview.
2. **Given** a visualization tab that has no data loaded yet (e.g., before import), **When** the user clicks the export button, **Then** the system informs the user that there is nothing to export instead of producing a blank or broken image.
3. **Given** the user has switched to a different visualization tab, **When** the user clicks the export button on that tab, **Then** the generated image reflects the currently active tab's content, not a previously viewed tab.

---

### User Story 2 - Preview and download the exported image (Priority: P1)

After capturing a visualization, the user wants to see a preview of the result and save it locally so they can post it on Instagram or elsewhere later.

**Why this priority**: Downloading is the primary way most users will get the image onto a device they can upload from, so it must work reliably alongside the preview.

**Independent Test**: Can be fully tested by triggering an export, confirming the pop-up preview shows the captured image, clicking "Download", and verifying an image file is saved with recognizable content matching the preview.

**Acceptance Scenarios**:

1. **Given** an export has been triggered, **When** the pop-up appears, **Then** it shows a clear preview of the captured image along with a "Download" action and a "Close" action.
2. **Given** the pop-up preview is showing, **When** the user selects "Download", **Then** an image file is saved to the user's device containing the previewed visualization.
3. **Given** the pop-up preview is showing, **When** the user selects "Close" (or dismisses the pop-up), **Then** the pop-up closes without any file being sent or saved, and no residual state affects the next export.

---

### User Story 3 - Consistent export entry point across all visualizations (Priority: P2)

A user who has found the export button on one visualization tab expects to find the same option, in the same place and with the same behavior, on every other visualization tab.

**Why this priority**: Consistency drives discoverability and trust in the feature, but each individual tab's export already works once P1 stories are implemented for that tab; this story ensures uniform coverage rather than introducing new capture behavior.

**Independent Test**: Can be fully tested by visiting each of the six visualization tabs in turn and confirming each one exposes an export button in a consistent location that produces the correct preview for that tab.

**Acceptance Scenarios**:

1. **Given** the dashboard has multiple visualization tabs, **When** the user opens each tab in turn, **Then** every tab displays an export button in a consistent location and style.
2. **Given** the user exports from two different tabs in the same session, **When** comparing the two resulting images, **Then** each image matches only the content of the tab it was captured from.

---

### Edge Cases

- What happens when the visualization is very tall/wide (e.g., a large heatmap) and does not fit neatly into a 1:1 square Instagram-friendly frame? The system should still produce a usable image, scaling/cropping/padding the chart to fit the square rather than failing.
- What happens when a chart is still loading or animating at the moment of capture? The export should wait for rendering to settle, or clearly tell the user to retry, rather than exporting a partially drawn image.
- What happens if the user's browser blocks the pop-up preview? The user must still be able to close the flow and fall back to downloading the image.
- What happens if the user triggers export twice in quick succession? The second request should either be ignored while the first is in progress or replace the first cleanly, without stacking multiple pop-ups.
- What happens on a small/mobile screen? The preview pop-up and its actions (download, close) must remain usable and legible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an export button on each of the dashboard's visualization tabs (Total Distance, Heart Rate & Pace, Equipment, Equipment Timeline, Personal Bests, Heatmap).
- **FR-002**: When the export button is activated, the system MUST capture that tab's chart/graphic content, together with a meaningful title, as a single image (excluding surrounding page chrome such as navigation, filters, and the export button itself).
- **FR-003**: The system MUST display the captured image in a pop-up preview immediately after capture, without navigating away from the dashboard.
- **FR-004**: The pop-up preview MUST offer a "Download" action that saves the captured image as a file on the user's device.
- **FR-005**: The pop-up preview MUST offer a way to close/dismiss it without downloading anything.
- **FR-006**: The system MUST prevent exporting when the active visualization tab has no data to show, and instead present a clear message that there is nothing to export.
- **FR-007**: The exported image MUST reflect only the visualization tab that was active at the moment the export button was clicked.
- **FR-008**: All export processing (capture, preview generation, download) MUST happen using data already loaded in the user's browser session; no visualization data or exported image is uploaded to a server as part of this feature.
- **FR-009**: The exported image MUST use a 1:1 square aspect ratio, at a resolution high enough to remain legible on a phone screen, suitable for direct posting to Instagram.

### Key Entities

- **Exported Visualization Image**: A generated image representing the chart/graphic and a meaningful title for one visualization tab at the time of export; attributes include the source tab, 1:1 square dimensions, and creation timestamp. It exists only in the browser session/pop-up and as a downloaded file if the user chooses to save it.

> Sharing the image via email ("mail to") was considered but is out of scope for this iteration (see Clarifications); only the Download action is required now.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any visualization tab with data loaded, a user can produce and preview an export of that tab in under 5 seconds.
- **SC-002**: 100% of the dashboard's visualization tabs expose a working export button with identical preview/download behavior.
- **SC-003**: Users can go from clicking "export" to having a downloaded 1:1 square image file ready to upload to Instagram in 3 clicks or fewer (export → preview → download).
- **SC-004**: At least 95% of exported images are visually recognizable matches of the source visualization's chart/graphic and title when compared side by side (correct chart, correct data, no cropped-off key content, correctly framed to 1:1 square).

## Assumptions

- "Instagram" refers to sharing a static image file that the user manually uploads through Instagram's own app/website; this feature does not perform a direct API integration with Instagram.
- Sharing the exported image via email ("mail to") is explicitly out of scope for this iteration; Download is the only distribution action required. Email/other sharing may be considered in a future iteration.
- The six current visualization tabs (Total Distance, Heart Rate & Pace, Equipment, Equipment Timeline, Personal Bests, Heatmap) are the full initial scope; any future visualization tabs are expected to adopt the same export button by convention but are not individually enumerated here.
- A single captured image per export is sufficient; multi-image carousels or video/animated exports are out of scope for this feature.
- "Meaningful title" means a short, human-readable caption identifying the visualization (e.g., tab name and/or key stat), generated automatically without requiring user input at export time.
