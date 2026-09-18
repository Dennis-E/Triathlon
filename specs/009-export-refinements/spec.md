# Feature Specification: Export Refinements

**Feature Branch**: `009-export-refinements`

**Created**: 2026-09-18

**Status**: Draft

**Input**: User description: "I reviewed the implementation of the improvements for export. Following updates please: use https://dennis-e.github.io/Triathlon/ as the domain; keep TriAnalytica and Strava logos in their correct aspect ratio in exported images; show the real filters and buttons in the filter-options picture so viewers know which views are available; make the Strava icon in the export button larger and use the text 'Export for Insta / Strava'; do not show Strava and Instagram logos in the exported preview; and move the personal-best export button from the main page into the expanded personal-best detail popup."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Share an undistorted export (Priority: P1)

A user creates an export image and wants its branding, domain, and available-view illustration to look accurate and trustworthy when shared.

**Why this priority**: Distorted branding or misleading interface imagery reduces confidence in the exported result.

**Independent Test**: Generate an export preview and inspect the TriAnalytica and Strava logos, the printed domain, and the filter-options picture at its native display size.

**Acceptance Scenarios**:

1. **Given** an export containing the TriAnalytica and Strava logos, **When** the image is generated, **Then** both logos retain their original vertical-to-horizontal proportions without visible horizontal squeezing.
2. **Given** an export containing a domain reference, **When** the image is generated, **Then** it displays `https://dennis-e.github.io/Triathlon/` as the application domain.
3. **Given** an export containing a picture of the available filter options, **When** a viewer examines that picture, **Then** it shows the actual filter controls and view buttons currently available in the application, with their labels and visual states recognizable.
4. **Given** the filter-options picture is displayed at different supported sizes, **When** its contents are scaled, **Then** the controls remain proportionate, legible, and free from overlap or cropping that changes their meaning.

### User Story 2 - Understand the export action (Priority: P1)

A user scans the dashboard and wants to recognize the export action immediately from its label and Strava icon.

**Why this priority**: Clear action wording and a legible icon make the control discoverable and reduce ambiguity about the intended sharing destination.

**Independent Test**: Inspect every supported export control on desktop and narrow layouts and verify its label and icon size.

**Acceptance Scenarios**:

1. **Given** a supported visualization with export available, **When** the user views its export control, **Then** the control says `Export for Insta / Strava` and includes a clearly visible Strava icon.
2. **Given** a narrow supported viewport, **When** the user views the export control, **Then** the larger Strava icon and complete label remain inside the control without overlapping or obscuring one another.
3. **Given** an export control is activated, **When** the preview opens, **Then** the preview image does not contain Strava or Instagram logos as decorative or platform-branding elements.

### User Story 3 - Export a personal-best detail in context (Priority: P2)

A user expands one personal-best tile to inspect its details and wants to export exactly that detail without cluttering the main personal-best overview.

**Why this priority**: The detail view provides the necessary context for a focused export while keeping the overview focused on comparison.

**Independent Test**: Open the personal-best overview, confirm it has no export action, expand a tile, and activate the export action inside the detail popup.

**Acceptance Scenarios**:

1. **Given** the personal-best overview is shown, **When** the user scans the page, **Then** no export button appears on the overview or collapsed tile.
2. **Given** a personal-best tile is expanded in its detail popup, **When** the user views the popup, **Then** an export button is available there and uses the standard `Export for Insta / Strava` wording.
3. **Given** an expanded personal-best detail has exportable data, **When** the user activates its popup export button, **Then** the generated preview contains that selected personal-best detail rather than the complete overview.
4. **Given** the personal-best detail popup is closed, **When** the user returns to the overview, **Then** its popup export control is no longer visible and no duplicate overview control appears.

### Edge Cases

- If a logo is resized to fit the export composition, its aspect ratio must be preserved even when the available space changes.
- If the available filter or view controls change in the application, the filter-options picture must reflect the current controls rather than a stale or invented set.
- If the full export label does not fit in a narrow viewport, the control must reflow or resize while keeping the wording understandable.
- If the export preview is reopened repeatedly, platform logos must remain absent from every preview and no stale control imagery may be carried over.
- If a personal-best detail has no result, its popup must show the established no-data behavior and must not create a misleading blank export.
- If a user opens several personal-best details in sequence, only the currently expanded detail may expose the detail export action and be used as the export source.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST use `https://dennis-e.github.io/Triathlon/` wherever the export composition identifies the TriAnalytica application domain.
- **FR-002**: The system MUST preserve the original aspect ratio of the TriAnalytica logo whenever it is displayed in an export image.
- **FR-003**: The system MUST preserve the original aspect ratio of the Strava logo whenever it is displayed in an export image.
- **FR-004**: The filter-options picture in the export MUST represent the actual filters and view buttons available in the application, including recognizable labels and control states rather than placeholder controls.
- **FR-005**: The filter-options picture MUST remain legible and proportionate when rendered at each supported export size.
- **FR-006**: Every supported visualization export control MUST display the exact label `Export for Insta / Strava`.
- **FR-007**: Every supported visualization export control MUST display a Strava icon at a size that is clearly legible relative to the control label and does not distort the control layout.
- **FR-008**: The exported preview and the downloadable export image MUST NOT display Strava or Instagram logos; platform logos are limited to the export controls unless another requirement explicitly identifies them as content.
- **FR-009**: The personal-best overview page MUST NOT display an export button on the overview or collapsed personal-best tiles.
- **FR-010**: Each expanded personal-best detail popup with exportable data MUST provide one export control using the standard export label.
- **FR-011**: A personal-best detail export MUST contain the currently expanded detail and MUST NOT export the full personal-best overview instead.
- **FR-012**: The system MUST preserve existing no-data behavior for personal-best details and MUST NOT produce a blank or misleading export when the selected detail has no result.
- **FR-013**: Export controls and their associated preview behavior MUST remain usable at supported desktop and narrow viewport sizes without overlapping text, icons, or image content.

### Key Entities *(include if feature involves data)*

- **Export Composition**: The shareable image and preview layout containing the selected visualization, domain, branding, and any available-control illustration.
- **Filter Options Picture**: The portion of the export that communicates the actual filters and view buttons available to dashboard users.
- **Export Control**: The dashboard action labeled `Export for Insta / Strava`, including its legible Strava icon.
- **Personal-Best Detail Popup**: The expanded context for one personal-best tile, which owns the detail-specific export action.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of reviewed exports, the TriAnalytica and Strava logos retain their measured source aspect ratios within a 2% tolerance.
- **SC-002**: In 100% of reviewed exports, the displayed domain exactly matches `https://dennis-e.github.io/Triathlon/`.
- **SC-003**: At least 95% of reviewers can identify the actual available filters and view buttons from the filter-options picture without opening the application.
- **SC-004**: In 100% of supported export controls, users can read `Export for Insta / Strava` and recognize the Strava icon on desktop and narrow viewport checks.
- **SC-005**: In 100% of generated preview and download checks, no Strava or Instagram logo appears in the exported image content.
- **SC-006**: In 100% of personal-best overview checks, no overview export button is shown; in 100% of expanded data-bearing detail checks, the popup contains one export button that exports the selected detail.
- **SC-007**: At least 95% of reviewers can distinguish the selected personal-best detail from the complete overview in its generated export.

## Assumptions

- The public domain supplied in the request is the canonical domain for all new and updated export output.
- "Real filters / buttons" means the current user-visible filter controls and view-selection buttons, including their actual labels and meaningful selected or available states.
- The exported preview refers to the image content shown before download as well as the resulting downloaded image; neither contains platform logos.
- The existing TriAnalytica and Strava assets remain the authoritative logo sources.
- The export action continues to create a local shareable image; direct publication to Instagram or Strava is outside this feature.
- Existing visualization export coverage and existing no-data messaging remain unchanged except where this specification explicitly changes placement or content.
- Supported viewport sizes are the desktop and narrow layouts already used by the application's export experience.
