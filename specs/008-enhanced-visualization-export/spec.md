# Feature Specification: Enhanced Visualization Export

**Feature Branch**: `008-enhanced-visualization-export`

**Created**: 2026-09-18

**Status**: Draft

**Input**: User description: "Update the Export functionality: use the QR code and Strava/Instagram logos from assets, include both logos in the button, say 'Export for ...', include active filters in the screenshot, include the TriAnalytica logo, QR code, domain, a legend such as pace versus heart rate, keep the headline separate from the visualization, and add an export button to personal-best detail tiles."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export a branded visualization card (Priority: P1)

A user viewing a dashboard visualization wants to create a polished, shareable image that identifies TriAnalytica, the visualization, and the source platform while preserving the current analysis context.

**Why this priority**: The export image is the primary user-facing outcome and must be understandable when viewed outside the dashboard.

**Independent Test**: Load data, open a visualization, apply filters, activate its export action, and verify that the preview contains the selected visualization, a separate headline, the TriAnalytica logo, the relevant Strava and Instagram branding, the domain, and a QR code.

**Acceptance Scenarios**:

1. **Given** a visualization with loaded data, **When** the user chooses the export action, **Then** a preview image is generated without leaving the dashboard.
2. **Given** active filters on a visualization, **When** the user exports it, **Then** the image states or visually represents the active filter context so the result remains interpretable outside the app.
3. **Given** a visualization with a metric relationship such as pace versus heart rate, **When** the user exports it, **Then** the image includes a readable legend explaining the plotted measures.
4. **Given** the export image is displayed, **When** the user inspects its layout, **Then** the headline remains in a dedicated header area and does not overlap or become part of the visualization itself.

### User Story 2 - Download and share the export (Priority: P1)

A user wants to save the generated image for posting or sharing, with clear indication that the image is prepared for Instagram and that the app can be revisited through its domain or QR code.

**Why this priority**: A reliable local download turns the preview into a usable artifact while preserving the app's privacy boundary.

**Independent Test**: Generate an export, open the preview, download it, and verify that the saved image matches the preview and includes the required branding and sharing information.

**Acceptance Scenarios**:

1. **Given** an export preview, **When** the user selects the action labeled for Instagram, **Then** the browser downloads an image containing the current visualization and export metadata.
2. **Given** an export preview, **When** the user closes it without downloading, **Then** no file is saved and the next export starts without stale content.
3. **Given** an export image is viewed away from the dashboard, **When** a viewer scans its QR code or reads its domain, **Then** the image provides a clear route back to TriAnalytica.

### User Story 3 - Export a personal-best detail (Priority: P2)

A user viewing an individual personal-best detail tile wants the same export capability as for full visualization tabs, focused on that specific achievement.

**Why this priority**: Personal-best details are shareable milestones and are otherwise excluded from the consistent export experience.

**Independent Test**: Open Personal Bests, choose a detail tile, activate its export button, and verify that the result focuses on that tile's metric, title, filters, and applicable legend.

**Acceptance Scenarios**:

1. **Given** a personal-best detail tile with data, **When** the user selects its export button, **Then** an image is generated for that tile rather than for the entire Personal Bests view.
2. **Given** a personal-best detail tile has no result, **When** the user selects its export button, **Then** the user receives a clear no-data message and no blank export is produced.
3. **Given** multiple personal-best detail tiles, **When** the user exports two different tiles, **Then** each image identifies and contains only the selected tile's result.

### User Story 4 - Recognize export targets consistently (Priority: P2)

A user wants to understand what each export control does from its label and imagery without guessing whether it creates an Instagram-ready image or references Strava data.

**Why this priority**: Consistent naming and recognizable logos make the feature discoverable across the dashboard.

**Independent Test**: Inspect the export controls on every visualization and personal-best detail tile and confirm the same wording pattern and the appropriate Strava and Instagram logos are visible without obscuring the label.

**Acceptance Scenarios**:

1. **Given** any supported visualization or personal-best detail tile, **When** the user views its export control, **Then** it uses the wording pattern "Export for ..." and includes the Strava and Instagram logos from the provided assets.
2. **Given** a narrow viewport, **When** the user views an export control, **Then** the label and logos remain legible and do not overlap or change the surrounding layout unexpectedly.

### Edge Cases

- If no data is loaded or a selected personal-best tile has no result, the export action must explain that there is nothing to export.
- If filters are unset, the image should omit an empty filter block rather than showing misleading values.
- If many filters are active, the filter summary must remain readable without covering the visualization or headline.
- If a visualization has no meaningful legend, the export should omit the legend area rather than inventing labels.
- If a visualization is too wide or tall for the shareable image format, it must be scaled or padded while keeping key content, headline, filters, and legend readable.
- If the QR code or a supplied logo asset cannot be loaded, the export must fail clearly or use a documented fallback without producing a misleading broken image.
- Repeated export requests must not create stacked or stale previews.
- The download must remain local; visualization data and the generated image must not be uploaded as part of this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an export control on every supported visualization tab and on every personal-best detail tile that has exportable data.
- **FR-002**: Each export control MUST use the wording pattern "Export for ..." and include the provided Strava and Instagram logo assets without obscuring the action label.
- **FR-003**: The system MUST generate a preview image for the selected visualization or personal-best detail tile without navigating away from the dashboard.
- **FR-004**: The generated image MUST include a dedicated header area containing a concise headline that is visually separate from the visualization content.
- **FR-005**: The generated image MUST include the TriAnalytica logo and the TriAnalytica domain in a readable location.
- **FR-006**: The generated image MUST include the provided QR code in a readable location that does not overlap the visualization, headline, filters, or legend.
- **FR-007**: The generated image MUST include the active filters that materially affect the displayed result; when no filters are active, it MUST avoid presenting an empty or misleading filter summary.
- **FR-008**: When the selected content uses multiple plotted measures or categories, the generated image MUST include a readable legend, including examples such as pace versus heart rate; if no legend is applicable, it MUST omit the legend rather than invent labels.
- **FR-009**: An export from a personal-best detail tile MUST identify and capture the selected tile's result rather than exporting the entire personal-best view.
- **FR-010**: The preview MUST provide a download action that saves the image locally and a close action that discards it without saving.
- **FR-011**: The system MUST prevent blank or misleading exports when the selected content has no data and MUST present a clear explanation instead.
- **FR-012**: The export image MUST preserve the selected content, headline, active filter summary, applicable legend, branding, QR code, and domain in a readable shareable composition at supported viewport sizes.
- **FR-013**: Export processing MUST use data already present in the user's browser session; the visualization data and generated image MUST NOT be uploaded to a server by this feature.
- **FR-014**: Supplied assets that cannot be loaded MUST result in a clear user-facing error or a documented non-misleading fallback; broken asset placeholders MUST NOT be included in a downloadable image.

### Key Entities

- **Exportable Visualization**: A dashboard visualization or personal-best detail tile selected for export, including its title, displayed data, active filters, and applicable legend.
- **Export Image**: A locally generated shareable image containing the selected visualization, dedicated headline, filters, legend, TriAnalytica branding, domain, QR code, and relevant platform branding.
- **Export Control**: The user-facing action that identifies the target, uses the "Export for ..." wording, and displays Strava and Instagram logos.
- **Brand Asset Set**: The provided TriAnalytica, Strava, Instagram, and QR-code assets used in controls or exported images.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For 100% of supported visualization tabs and data-bearing personal-best detail tiles, users can find an export control using the consistent "Export for ..." wording.
- **SC-002**: At least 95% of test exports contain the selected visualization or tile, separate headline, applicable filters, applicable legend, TriAnalytica logo, domain, QR code, and required platform branding without overlap or missing assets.
- **SC-003**: A user can complete export preview and local download in 3 actions or fewer after selecting the export control.
- **SC-004**: At least 95% of reviewers can correctly identify the visualization, active filters, and plotted measures from the downloaded image without returning to the dashboard.
- **SC-005**: In a representative set of supported desktop and narrow-viewport layouts, 100% of required export text and controls remain readable and no required image element overlaps another.
- **SC-006**: No visualization data or generated export image is transmitted to a server as a result of using the export feature.

## Assumptions

- The existing files in `assets/` are the authoritative source for the QR code and Strava, Instagram, and TriAnalytica logos; no new branding artwork is required for this feature.
- "Export for Instagram" means producing a downloadable static image for manual posting; direct publishing to Instagram is out of scope.
- The domain printed in the image is the app's established public domain and will be selected from existing product configuration or copy rather than entered by the user at export time.
- Active filters means the user-visible filters currently controlling the selected visualization or personal-best detail.
- The existing preview/download flow remains the interaction model unless a requirement above explicitly changes its content or coverage.
- A square, phone-friendly shareable composition remains the default image format from the earlier Instagram export work; the exact pixel dimensions are a planning decision unless an existing export contract fixes them.
- Export controls may be disabled or hidden for content without data, but the user must receive an explanatory no-data state when attempting an unsupported export.
