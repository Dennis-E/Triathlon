# Feature Specification: Refine Visualization Previews

**Feature Branch**: `034-refine-visualization-previews`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "ok observations to make previews better. a) heartrate vs pace just select run and year 201 vs 2026 b) equipment the names of equipment are not readable. and use bikes only. c) timeline is black nothing to see. use just bikes here also and not the continuous view. d) personal best is black nothing visible. use one of the cards, the 50 km pb tile view. e) heatmap is completely wrong picture. use a screenshot of rheinland area f) distributions the x axis is not visible. g) workout time also x-axis is not visible."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use Specific Preview States (Priority: P1)

As a visitor, I want each preview to show a deliberate and useful filter/view state so that the landing page communicates the visualizations clearly instead of showing empty or misleading defaults.

**Why this priority**: The preview images are the first representation of the product and several currently fail to show meaningful content.

**Independent Test**: Review the preview-generation states and confirm that Heartrate vs Pace uses Run with the requested focused year range, Equipment and Timeline use Bikes, Timeline uses Activities, and Personal Bests shows the 50 km card.

**Acceptance Scenarios**:

1. **Given** the preview source data is loaded, **When** the Heartrate vs Pace preview is prepared, **Then** it uses the Run sport filter and a focused year range ending in 2026 rather than the all-sports/all-time default.
2. **Given** the Equipment and Equipment Timeline previews are prepared, **When** their filters are applied, **Then** both show Bikes only and the Timeline uses the Activities view rather than Continuous.
3. **Given** the Personal Bests preview is prepared, **When** a PB card is selected, **Then** the rendered preview shows a visible 50 km personal-best tile or equivalent 50 km detail view.

### User Story 2 - Make Every Preview Visually Legible (Priority: P1)

As an athlete evaluating TriAnalytica, I want every preview to contain visible data, labels, and chart context so that I can understand what each visualization offers.

**Why this priority**: Black, empty, or cropped previews prevent visitors from evaluating the platform.

**Independent Test**: Inspect all eight preview assets and verify that each has visible content; specifically, Equipment names are readable, Timeline has visible Bike bars, Personal Bests has visible PB content, and Distributions and Workout Time show their x-axis labels.

**Acceptance Scenarios**:

1. **Given** a visitor views the Equipment preview, **When** they inspect the chart, **Then** Bike labels or generalized readable bike labels and bars are visible.
2. **Given** a visitor views the Equipment Timeline preview, **When** they inspect the chart, **Then** the Bike activity periods are visible against a non-empty background.
3. **Given** a visitor views the Distributions or Workout Time preview, **When** they inspect the bottom of the chart, **Then** the x-axis and its labels are visible and not cropped.

### User Story 3 - Show the Correct Geographic and Data Context (Priority: P2)

As a visitor, I want the Heatmap preview to show the Rheinland area and the other previews to retain realistic activity context so that the examples feel geographically and analytically credible.

**Why this priority**: The current Heatmap image communicates the wrong place, while the other corrections must retain realistic source-data context.

**Independent Test**: Review the Heatmap asset and confirm it shows a privacy-reviewed Rheinland-area map view with readable route-density content and no unrelated geography.

**Acceptance Scenarios**:

1. **Given** the local source activities include Rheinland-area routes, **When** the Heatmap preview is captured, **Then** the map is centered on the Rheinland area and displays the relevant route pattern.
2. **Given** the Heatmap preview is published, **When** it is reviewed for privacy, **Then** it does not expose exact identifying route details beyond the approved Rheinland-area context.

### Edge Cases

- If the requested focused year contains too few Run heart-rate sessions, the preview must use the nearest meaningful year range ending in 2026 and remain visibly populated.
- If Bike equipment names are long, labels must remain readable through suitable cropping, abbreviation, or layout without becoming personal-data disclosures.
- If no visible 50 km PB exists in the source data, the preview must show the closest available 50 km-compatible PB detail or an explicitly labeled equivalent rather than a black tile.
- If map tiles or network map resources are unavailable during capture, the workflow must fail clearly or use an approved local map capture; it must not publish the wrong geographic area.
- If chart labels would be cropped by the capture boundary, the capture dimensions or chart layout must be adjusted until both axes remain visible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Heartrate vs Pace preview MUST use the Run sport filter and a focused year range ending in 2026; the preparation assumption interprets the requested `201` as 2021.
- **FR-002**: The Equipment preview MUST use Bikes only and MUST display readable bike labels or privacy-approved generalized equivalents.
- **FR-003**: The Equipment Timeline preview MUST use Bikes only and the Activities view, not Continuous.
- **FR-004**: The Equipment Timeline preview MUST contain visible Bike activity periods against a readable non-black chart background.
- **FR-005**: The Personal Bests preview MUST show a visible 50 km PB card or equivalent 50 km detail view with readable content.
- **FR-006**: The Heatmap preview MUST show a privacy-reviewed map view centered on the Rheinland area and MUST NOT show an unrelated geographic image.
- **FR-007**: The Distributions preview MUST show a visible x-axis with readable labels and units within the captured asset bounds.
- **FR-008**: The Workout Time preview MUST show a visible x-axis with readable labels and units within the captured asset bounds.
- **FR-009**: All corrected preview assets MUST retain the existing preview dimensions, public asset paths, card titles, and dashboard actions.
- **FR-010**: All corrected preview assets MUST remain readable at supported desktop and mobile landing-page sizes without clipped labels or overlapping content.
- **FR-011**: Geographic and equipment details in corrected assets MUST remain privacy-reviewed before publication; exact identifying routes and personally identifying equipment names MUST NOT be exposed.

### Key Entities *(include if feature involves data)*

- **Preview Capture State**: The selected filters, date range, display mode, PB tile, chart dimensions, and geographic viewport used to create one preview asset.
- **Corrected Preview Asset**: A public image generated from a defined capture state and reviewed for visibility, realism, and privacy.
- **Rheinland Heatmap View**: The approved geographic context for the Heatmap preview, showing Rheinland-area activity patterns without exact identifying route disclosure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the seven observed preview defects are addressed in the corresponding published assets: filter state, equipment readability, timeline visibility, PB visibility, geographic correctness, and both missing x-axes.
- **SC-002**: 100% of Equipment and Equipment Timeline preview reviews show Bikes-only content with visible chart marks and readable or approved generalized labels.
- **SC-003**: 100% of Personal Bests preview reviews show a visible 50 km PB tile or equivalent detail view.
- **SC-004**: 100% of Distributions and Workout Time preview reviews show their x-axis labels within the captured image bounds.
- **SC-005**: 100% of Heatmap preview reviews identify the Rheinland area as the intended geographic context without exposing exact identifying routes.
- **SC-006**: At least 95% of desktop and 390px mobile preview checks complete without black/empty content, clipped labels, horizontal overflow, or overlapping text.

## Assumptions

- The phrase `201 vs 2026` means a focused Run year range from 2021 through 2026; this can be adjusted during capture if the source data makes a nearby range more meaningful.
- The existing local private export remains the preparation source and is never published or referenced at runtime.
- The existing dashboard controls and visualization behavior remain unchanged; this feature corrects preview capture states and derived assets.
- Rheinland-area context is acceptable for the Heatmap preview as a privacy-preserving geographic label; exact route geometry is still generalized or cropped.
- Static replacement PNGs remain the public delivery format under `assets/previews/`.