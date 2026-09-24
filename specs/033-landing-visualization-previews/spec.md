# Feature Specification: Landing Visualization Previews

**Feature Branch**: `033-landing-visualization-previews`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "On landing page introduce also a preview for the timing and distribution visualization. Use the private-data zip file data to generate realistic screenshots for all visualizations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover All Visualizations (Priority: P1)

As a visitor on the landing page, I want to see previews for all available visualizations, including Workout Time and Distributions, so that I can understand the platform's breadth before importing my own data.

**Why this priority**: The landing page currently introduces only part of the dashboard and should accurately communicate the available experience.

**Independent Test**: Open the landing page without importing a file and verify that preview entries for Workout Time and Distributions appear alongside the existing visualization previews.

**Acceptance Scenarios**:

1. **Given** a visitor opens the landing page before importing data, **When** the preview area is visible, **Then** the visitor can identify a Workout Time preview and a Distributions preview.
2. **Given** a visitor scans the preview area, **When** they compare the available cards, **Then** the new previews use the same clear preview pattern and are distinguishable by title and descriptive text.

### User Story 2 - See Realistic Training Examples (Priority: P1)

As an athlete evaluating the platform, I want the previews to show realistic training patterns rather than generic placeholder graphics so that I can judge whether the visualizations will be useful for my own data.

**Why this priority**: Representative examples make the landing page credible and help visitors understand what imported activity data can look like.

**Independent Test**: Review the rendered preview assets for every landing-page visualization and verify that they are derived from a real local activity export, contain plausible training values, and do not expose identifying personal information.

**Acceptance Scenarios**:

1. **Given** the local private activity export is available during asset preparation, **When** preview assets are generated, **Then** the assets represent the existing visualizations plus Workout Time and Distributions using realistic activity-derived patterns.
2. **Given** a visitor views any landing-page preview, **When** they inspect it, **Then** the graphic communicates the relevant visualization type with readable labels or context and does not show raw file content or personal identifiers.

### User Story 3 - Preserve Landingpage Usability and Privacy (Priority: P2)

As a visitor, I want the expanded preview area to remain usable and fast on desktop and mobile, while the private source export remains private, so that the richer introduction does not create a confusing or unsafe first experience.

**Why this priority**: More previews must not compromise navigation, responsive layout, page loading, or the handling of personal training data.

**Independent Test**: Open the landing page at supported desktop and mobile widths without a local export selected, verify all previews remain readable and actionable, and confirm the private ZIP is neither referenced as a runtime asset nor added to version control.

**Acceptance Scenarios**:

1. **Given** a visitor opens the landing page on a narrow viewport, **When** they scroll through the preview area, **Then** every preview remains readable without horizontal scrolling or overlapping content.
2. **Given** a visitor selects a preview before importing data, **When** the dashboard requires imported data, **Then** the existing import guidance remains available and the new preview does not expose private source data.

### Edge Cases

- When the private ZIP is unavailable during asset preparation, the workflow must fail clearly rather than silently generating misleading or empty screenshots.
- When a visualization has sparse or missing values in the source export, its preview must remain legible and must not invent claims about unsupported metrics.
- When preview assets are viewed without network access after page load, the landing page must still show its bundled preview content rather than depending on the private ZIP.
- When the preview grid wraps on mobile, card titles and descriptions must remain readable without horizontal overflow.
- When the source export contains personal names, routes, dates, equipment names, or identifiers, those details must be removed, generalized, or cropped from published preview assets.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The landing page MUST include a clearly labeled preview for the Workout Time visualization.
- **FR-002**: The landing page MUST include a clearly labeled preview for the Distributions visualization.
- **FR-003**: The new previews MUST use the same visitor-facing preview interaction and visual hierarchy as the existing landing-page visualization previews.
- **FR-004**: The landing page MUST continue to identify all existing visualization previews after the new previews are added.
- **FR-005**: Preview assets for every landing-page visualization MUST be generated from realistic activity-derived examples based on the supplied private ZIP during preparation.
- **FR-006**: Published preview assets MUST NOT include the private ZIP, raw activity files, personal names, exact identifying routes, account identifiers, or other directly identifying source details.
- **FR-007**: Preview assets MUST communicate each visualization's purpose with an appropriate title, chart shape, metric context, or other readable visual cue.
- **FR-008**: Preview cards MUST remain readable and usable at the supported desktop and mobile viewport sizes without horizontal scrolling or overlapping content.
- **FR-009**: Preview cards that open dashboard visualizations MUST preserve the existing behavior that guides visitors to import Strava data before viewing data-dependent dashboard content.
- **FR-010**: The landing page MUST continue to load and display its preview area when no private export is present on the visitor's device.
- **FR-011**: The preview-generation workflow MUST keep the private source ZIP local to the preparation environment and MUST publish only approved derived preview assets.

### Key Entities *(include if feature involves data)*

- **Visualization Preview**: A landing-page entry with a title, descriptive context, derived visual asset, and existing dashboard action.
- **Preview Asset Set**: The approved collection of derived images or graphics covering every visualization presented on the landing page, including Workout Time and Distributions.
- **Private Activity Export**: The local ZIP used only during preparation to create realistic, sanitized preview assets; it is not a runtime dependency or published product asset.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of visualization types presented in the dashboard are represented by an identifiable landing-page preview, including Workout Time and Distributions.
- **SC-002**: 100% of published preview assets pass a privacy review confirming that no raw private export, personal identifier, or exact identifying route is exposed.
- **SC-003**: At least 90% of first-time evaluators can correctly identify the purpose of the Workout Time and Distributions previews from the landing page without opening the dashboard.
- **SC-004**: At least 95% of preview-card checks at supported desktop and mobile viewport sizes complete without horizontal overflow, clipping, or overlapping labels.
- **SC-005**: The landing page's initial preview area remains available without a visitor selecting or uploading a private export.
- **SC-006**: Every preview asset uses plausible activity-derived values or patterns that pass a content review against the corresponding visualization's purpose.

## Assumptions

- The private ZIP in `private-data/` is available locally to the person preparing the assets and is not committed or shipped to visitors.
- Static derived screenshots or image assets are acceptable for the landing-page previews; visitors do not need to see the source export or regenerate previews in the browser.
- Existing preview-card actions and import guidance remain the source of truth for dashboard access behavior.
- Exact publication formats, image dimensions, and asset naming can follow the existing landing-page conventions unless they affect responsive usability or privacy.
- Personal identifiers and exact route details will be removed or generalized even when the source data is used to make the visual patterns realistic.