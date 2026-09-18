# Feature Specification: Export Layout Density

**Feature Branch**: `011-export-layout-density`

**Created**: 2026-09-18

**Status**: Draft

**Input**: User description: "The filters overlap vertically between rows when there are many filters, and even one row of filters is cut off at the bottom. The overall font size in the export must be bigger and readable. Personal-best tile exports have too much blank space around the visualization. To save space on the export popup, use only the header and include the domain and QR code from the footer there; no footer is needed."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read all filter rows (Priority: P1)

A user views an exported visualization with many available filters and wants every row to be fully visible, separated, and readable.

**Why this priority**: Overlapping or clipped filters make the exported image misleading and prevent viewers from understanding the selected context.

**Independent Test**: Generate exports with one row, multiple rows, and a long set of filter controls; inspect the preview and download at supported sizes.

**Acceptance Scenarios**:

1. **Given** an export with one row of filter controls, **When** the image is generated, **Then** the complete row, including its bottom padding and labels, is visible and not cut off.
2. **Given** an export with multiple filter rows, **When** the image is generated, **Then** each row has its own vertical space and no control or label overlaps the row above or below it.
3. **Given** filters with labels of different lengths, **When** controls wrap to a new row, **Then** row height and the next row's starting position are based on the rendered content rather than a fixed row estimate.

### User Story 2 - Read a compact, legible export (Priority: P1)

A user wants the exported visualization and its supporting metadata to use available space efficiently, with larger text and a focused PB composition.

**Why this priority**: Small text and excessive blank space reduce the usefulness of an otherwise correct shareable image.

**Independent Test**: Compare a standard visualization export and a personal-best tile export, checking typography, chart scale, and wasted margins.

**Acceptance Scenarios**:

1. **Given** a standard visualization export, **When** the image is viewed, **Then** headline, filter, control, legend, domain, and QR text are readable without zooming beyond normal image inspection.
2. **Given** a personal-best tile export, **When** the image is generated, **Then** the selected visualization occupies most of the available content region with only intentional margins.
3. **Given** a personal-best detail with different chart proportions, **When** it is exported, **Then** the chart is fitted to the available region without clipping or excessive unused space.

### User Story 3 - Use a header-only export composition (Priority: P1)

A user wants the export image to be shorter and less repetitive by keeping branding, domain, and QR code in one header and removing the footer.

**Why this priority**: A single compact header gives the exported image a clearer hierarchy and more room for the visualization and metadata.

**Independent Test**: Generate any export and inspect the preview/download for header content, footer absence, domain, QR code, and chart placement.

**Acceptance Scenarios**:

1. **Given** an export preview, **When** the image is generated, **Then** the header contains the TriAnalytica branding, canonical domain, and QR code.
2. **Given** a generated export, **When** the image is inspected, **Then** no separate footer region is present and no footer branding is repeated.
3. **Given** header content and a chart with metadata, **When** the image is generated, **Then** the header does not overlap the headline, domain, QR code, or visualization.

### Edge Cases

- A single row must reserve enough height for its complete pills and text baseline, not only the nominal pill height.
- Multiple wrapped rows must use the actual number of rendered rows when placing the legend and later content.
- Very long labels must remain readable or be bounded without drawing over neighboring controls.
- A PB chart with a wide or tall aspect ratio must use the content bounds efficiently while preserving its aspect ratio.
- If header content cannot fit beside the logo, the domain and QR code must reflow within the header without overlapping the title.
- The compact composition must remain readable at supported desktop and narrow viewport previews.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The export composition MUST calculate each filter/control row's height from its rendered contents and MUST start the next row after the previous row's actual bottom plus spacing.
- **FR-002**: A one-row filter/control block MUST include sufficient bottom space for the complete row and MUST NOT be clipped at the block boundary.
- **FR-003**: Multiple filter/control rows MUST NOT overlap vertically or overwrite labels, selected states, or neighboring rows.
- **FR-004**: Export typography MUST use larger readable sizes for the headline, active filters, available controls, legend, domain, and supporting labels than the previous compact metadata sizing.
- **FR-005**: Personal-best tile exports MUST scale the selected visualization to use the available content region efficiently while preserving its aspect ratio and avoiding unnecessary blank space.
- **FR-006**: The export image MUST use a single header region containing TriAnalytica branding, the canonical domain, and the QR code.
- **FR-007**: The export image MUST NOT include a separate footer region or duplicate footer branding/domain/QR content.
- **FR-008**: Header, visualization, filters, controls, legend, domain, and QR code MUST remain separate and readable at supported export sizes.
- **FR-009**: Export processing MUST remain local to the browser and MUST NOT upload visualization data or generated images.

### Key Entities *(include if feature involves data)*

- **Export Header**: The single branded region containing the title, TriAnalytica logo, canonical domain, and QR code.
- **Filter Row Layout**: A measured row of controls with a start position, rendered height, and bottom position used to place later rows and metadata.
- **Export Content Region**: The bounded area into which standard visualizations and PB tile charts are fitted.
- **Compact Export Composition**: The complete image layout without a separate footer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of exports with one or more filter rows, no filter label or control is clipped or vertically overlaps another control.
- **SC-002**: At least 95% of reviewers can read the active filters, available controls, legend, domain, and supporting labels at normal image viewing size.
- **SC-003**: Personal-best tile exports use at least 85% of the available visualization content area in representative wide and tall chart cases, excluding intentional margins.
- **SC-004**: In 100% of generated previews and downloads, the domain and QR code appear in the header and no separate footer region is present.
- **SC-005**: In 100% of exports, the header, metadata, and visualization remain non-overlapping at desktop and narrow supported sizes.
- **SC-006**: No visualization data or generated image is transmitted to a server by this feature.

## Assumptions

- The existing square export format may be adjusted internally to remove the footer while preserving a shareable image format.
- The canonical domain remains `https://dennis-e.github.io/Triathlon/`.
- Larger typography means a measurable increase over the current export metadata sizes while still allowing controls to wrap safely.
- The QR code and domain remain visible in every successful export, including PB tile exports.
- Existing logo aspect-ratio, platform-control, no-data, and PB capture behavior remains unchanged except where the compact composition requires new bounds.
