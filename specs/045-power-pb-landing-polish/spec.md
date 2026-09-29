# Feature Specification: Power PB and Landing Preview Polish

**Feature Branch**: `045-power-pb-landing-polish`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "PB visualizations following improvements: 1) In the 'all-time power' small tile the picture is smaller than usually for the other tiles. 2) The enlarged export picture for all-time power is different from the tile and wrong: its x-axis shows years instead of the durations for the all-time high watt records (1 min, 2 min, etc.). 3) On the landing page update the description; it only says progression by distance, but there is more than distance. 4) Make the Swim/Bike/Run labels above their visualizations adaptive: on a one-column mobile layout show a sport heading followed by that sport's visualization, then the next sport heading and visualization."

## Clarifications

### Session 2026-09-29

- Q: Soll die Korrektur des All-Time-Power-Bildes sowohl die vergrößerte Detailansicht als auch den heruntergeladenen Bildexport umfassen? → A: Beides.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read and export the all-time power profile (Priority: P1)

A cyclist viewing Personal Bests wants the small all-time power tile to be as legible as other tiles and wants both its enlarged detail view and downloaded image export to show the same profile, with each watt record associated with its duration rather than a year.

**Why this priority**: The tile's reduced visual size and the incorrect enlarged image make the same power data difficult to inspect and share accurately.

**Independent Test**: Open Personal Bests with Bike power records across several durations, compare the all-time power tile's chart size with other tiles, and inspect both the enlarged detail view and downloaded image export. Verify that both show the all-time watt profile and that x-axis labels match the record durations (for example, 1 min and 2 min), not years.

**Acceptance Scenarios**:

1. **Given** the all-time power tile is viewed at 390 px or 1280 px viewport width, **When** its chart is rendered, **Then** it uses at least 90% of the profile block's available inner width, preserves its aspect ratio, stays inside the tile bounds, and shows every mark, measurement line, and axis label without overlap or clipping.
2. **Given** the all-time power tile has duration-based watt records, **When** the user opens its enlarged detail view, **Then** it depicts that same all-time power profile rather than a different chart.
3. **Given** the all-time power tile has duration-based watt records, **When** the user downloads its image export, **Then** the exported image depicts that same all-time power profile as the tile.
4. **Given** the enlarged detail view or downloaded image export is displayed, **When** the user reads its horizontal axis, **Then** each plotted record is identified by its duration (such as 1 min or 2 min), not by a year.
5. **Given** the tile, enlarged detail view, and downloaded image export are compared, **When** the same record is inspected in each, **Then** its duration and watt value agree.

### User Story 2 - Understand the breadth of Personal Bests from the landing page (Priority: P2)

A visitor reviewing the landing page wants the Personal Bests description to represent the range of progress shown, rather than suggesting that PB progression is limited to distance.

**Why this priority**: The current distance-only description understates the available Personal Best insights and can give visitors an inaccurate expectation of the feature.

**Independent Test**: Read the Personal Bests description on the landing page and verify that it describes progress across more than distance and is consistent with the visible PB examples.

**Acceptance Scenarios**:

1. **Given** a visitor sees the Personal Bests landing-page card, **When** they read its description, **Then** it communicates that PB progress includes more than distance.
2. **Given** the card's sports and PB examples are visible, **When** the description is compared with them, **Then** it does not contradict or omit the broader kinds of records shown.

### User Story 3 - Match sport labels to their visualizations at every screen width (Priority: P1)

### User Story 3 - Match Dashboard Sport Headings to Their Visualizations (Priority: P1)

An athlete viewing the Personal Bests dashboard wants the Swim, Bike, and Run headings to identify the corresponding sport columns on wide screens and to appear above each sport's content when the dashboard changes to one column on mobile.

**Why this priority**: The shared sticky sport-header row spans three columns on wide screens but becomes detached from the content when the dashboard stacks into one column.

**Independent Test**: Open Personal Bests with Swim, Bike, and Run records; inspect the dashboard at a wide desktop width and at a narrow mobile width. Confirm the shared Swim/Bike/Run header remains over the three columns on desktop, while mobile shows each sport heading followed by its corresponding PB content, in Run, Bike, Swim order.

**Acceptance Scenarios**:

1. **Given** the Personal Bests dashboard is displayed in a three-column layout, **When** the user views its sport columns, **Then** one shared sticky Swim/Bike/Run header aligns with the corresponding columns.
2. **Given** the Personal Bests dashboard is displayed in a one-column mobile layout, **When** the user reads its sport sections, **Then** each section shows its heading followed by that sport's PB content, in Run, Bike, Swim order.
3. **Given** the dashboard changes between supported widths, **When** the layout adapts, **Then** the shared three-column header is hidden on mobile and no heading is detached, clipped, or aligned over unrelated sport content.

### Edge Cases

- If some duration records are unavailable, every plotted all-time power point in the tile, enlarged detail view, and downloaded image export still uses its actual duration label; missing durations do not cause the axis to switch to years.
- If only one duration record is available, the tile, enlarged detail view, and downloaded image export remain legible and identify that duration correctly.
- If the dashboard viewport is between its one-column and three-column layouts, each sport label remains associated with the correct PB content.
- On mobile, category rows with no Swim data (such as Elevation) still show an appropriate Swim heading before the existing not-applicable message.
- Longer labels or reduced viewport width must not cause the sport headings or their PB content to overlap or become clipped.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: At viewport widths of 390 px and 1280 px, the all-time power chart in its small Personal Bests tile MUST occupy at least 90% of the profile block's available inner content width, preserve its aspect ratio, and remain within the tile bounds; axis labels and ticks MUST be readable without overlapping, all plotted marks MUST remain visible, and each record MUST have a visible vertical measurement line to the x-axis.
- **FR-002**: Both the enlarged detail view and downloaded image export for all-time power MUST depict the same profile represented by the corresponding tile.
- **FR-003**: The all-time power profile's horizontal axis in the tile, enlarged detail view, and downloaded image export MUST identify plotted records by their duration (for example, 1 min or 2 min) and MUST NOT use years in place of durations.
- **FR-004**: Matching records in the tile, enlarged detail view, and downloaded image export MUST retain consistent duration and watt values.
- **FR-005**: The landing-page Personal Bests description MUST communicate that PB progression covers more than distance and MUST accurately reflect the range of records shown.
- **FR-006**: In a three-column Personal Bests dashboard layout, the shared sticky Swim/Bike/Run header MUST remain aligned with its matching sport columns.
- **FR-007**: In a one-column mobile Personal Bests dashboard layout, each sport section MUST display its own heading followed by that sport's PB content, in Run, Bike, Swim order; the shared three-column header MUST be hidden.
- **FR-008**: Responsive dashboard changes MUST preserve all three sports' PB content and MUST NOT cause headings or content to be clipped, overlap, or be assigned to the wrong sport.
- **FR-009**: These presentation and description changes MUST NOT alter the underlying PB records, their values, or the existing Personal Bests navigation and detail-view behavior.

### Key Entities

- **All-time power profile**: A set of highest watt records, each associated with an effort duration and presented in both a compact tile and an enlarged/exported view.
- **Personal Bests dashboard sport section**: A Swim, Bike, or Run column containing that sport's PB content for each metric category, identified by the shared desktop header or its own mobile heading.
- **Personal Bests landing-page preview**: A visitor-facing summary card containing descriptive text and illustrative Swim, Bike, and Run visualizations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At both 390 px and 1280 px viewport widths, the compact all-time power chart occupies at least 90% of its profile block's available inner content width, has no horizontal overflow, preserves its aspect ratio, and shows all plotted marks, per-record vertical lines, and non-overlapping axis labels without clipping.
- **SC-002**: In 100% of tested all-time power comparisons, the tile, enlarged detail view, and downloaded image export depict the same profile and show matching watt values for corresponding durations.
- **SC-003**: In 100% of tested all-time power tile, enlarged detail, and downloaded image views, every plotted x-axis label identifies the record duration and no x-axis uses years as a substitute.
- **SC-004**: The landing-page Personal Bests description explicitly conveys PB progress beyond distance and is consistent with the records represented in the preview.
- **SC-005**: In 100% of checks at wide desktop and one-column mobile widths, the dashboard's shared desktop header aligns with Swim/Bike/Run columns, while mobile displays Run, Bike, then Swim headings immediately before each sport's PB content and hides the shared header.
- **SC-006**: Existing PB values, records, and detail-view behavior remain unchanged in regression checks.

## Assumptions

- The all-time power correction applies to both the enlarged detail view and the downloaded image export; both should use the same correct profile and duration axis as the tile.
- Responsive proportional sizing and the 90% width requirement are the acceptance thresholds for compact-chart legibility at narrow mobile and desktop/laptop widths; the tile's outer layout and profile data remain unchanged.
- The Personal Bests card description may name representative PB dimensions such as distance, pace, time, and power, as applicable to the displayed sports and records.
- The landing-page preview card remains illustrative; the responsive sport-heading requirement applies to the actual Personal Bests dashboard, where mobile order is Run, Bike, then Swim as described by the requester.
- The change is limited to Personal Bests chart presentation, the landing-page description, and the dashboard's responsive sport headings; PB calculations and data are authoritative and remain unchanged.
