# Feature Specification: Personal Bests Tile Consistency & Desktop Row Alignment

**Feature Branch**: `046-pb-tile-alignment`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "in the pb visualization. 1) why is the 'all-time power profile' so out of sync with all other tiles? it should match the exact same style. 2) now the layout works if it is a one-column view that it is all below each other with properly labeled swim, bike, run. BUT, in a desktop view with three columns shown the swim bike run tiles are never shown in the same line. every tile has its own row. if run, then only on right side in this row the run is shown. the bike eg duration is then below in its own separate row. this should be corrected that the lines in 3 column view are filled (at least when it is the same 'block' like watt, elevation, longest etc)"

## Background (observed behavior)

- **All-time power profile tile**: Rendered with its own, larger drawing canvas and noticeably bigger text (axis title, watt labels, duration labels, "Duration" caption), thicker markers and circles, larger vertical spacing, and no footer line. All neighbouring PB tiles (distance records, elevation, longest, individual bike-power durations) share a compact, uniform look: small header label, compact mini chart, small axis labels, and a small "N records set" footer. The profile tile therefore looks visually oversized and out of place in the Watt block.
- **Desktop 3-column layout**: Within each block (Distance records, Elevation, Longest, Watt), the Swim, Bike and Run cells are intended to sit side by side in the Swim | Bike | Run columns. Instead, on wide screens each sport cell is pushed into its own row: the Run cell appears alone in the right column, the Bike cell appears one row lower in the middle column, and the Swim cell one row lower again in the left column. This creates a "staircase" with large empty areas. The single-column (mobile) layout is correct and must be preserved.

## Clarifications

### Session 2026-09-29

- Q: Should the all-time power profile tile keep its axis captions ("Power (W)" and "Duration") although other tiles have none? → A: No — remove both captions; keep only value labels (e.g., "350 W") and duration labels, like other tiles.
- Q: On desktop, should tiles align row-by-row across sport columns or only start together at the top? → A: Strict row grid — the n-th tile of each sport shares one row; row height equals its tallest tile.
- Q: Should the bike-only Watt block stay in the middle column or spread across all three columns on desktop? → A: Middle (Bike) column only; left and right columns stay empty.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sport cells of a block share one row on desktop (Priority: P1)

As an athlete viewing Personal Bests on a wide screen, I want the Swim, Bike and Run tiles of each multi-sport block (Distance records, Elevation, Longest) to be laid out row by row under the Swim | Bike | Run column headers (the n-th tile of each sport in the same row), so I can compare sports at a glance without scrolling through a staircase of mostly empty rows. The bike-only Watt block stays in the Bike column.

**Why this priority**: The current desktop layout wastes most of the screen and makes cross-sport comparison impossible; it is the most visible defect.

**Independent Test**: Import data containing Swim, Bike and Run activities, open Personal Bests on a viewport where three columns are shown, and verify that in every multi-sport block the n-th Swim, Bike and Run tiles share the same row (top edges aligned), and that the Watt block starts directly under its heading in the Bike column.

**Acceptance Scenarios**:

1. **Given** data with records for all three sports and a desktop-width viewport, **When** the Personal Bests tab is shown, **Then** in the Distance records block the Swim tiles appear in the left column, Bike in the middle, Run on the right, and all three columns start on the same row.
2. **Given** a desktop-width viewport, **When** the Elevation block is shown, **Then** the "Not applicable for swimming" note (left), Bike elevation tile (middle) and Run elevation tile (right) are on the same row.
3. **Given** a desktop-width viewport, **When** the Longest block is shown, **Then** Swim, Bike and Run longest tiles are on the same row.
4. **Given** a desktop-width viewport and bike power data, **When** the Watt block is shown, **Then** all its tiles (power durations and the all-time profile) stay in the middle (Bike) column only, starting on the first row of that block with no empty row above them; the Swim and Run columns remain empty for this block.
5. **Given** one sport has more tiles than another within a block (e.g., Run has 4 distance tiles, Swim has 2), **When** shown on desktop, **Then** the n-th tile of each sport sits in the same row (1st Swim / 1st Bike / 1st Run in row 1, etc.), each row is as tall as its tallest tile, sports with fewer tiles leave the remaining cells in their column empty, and the next block starts below the last row of the current block.

---

### User Story 2 - Mobile/single-column layout remains unchanged (Priority: P1)

As an athlete on a narrow screen, I want the current stacked layout with per-sport labels (Run, Bike, Swim) inside each block to keep working exactly as it does today.

**Why this priority**: The single-column layout is explicitly confirmed as correct; fixing desktop must not regress it.

**Independent Test**: Open Personal Bests on a narrow viewport and compare order, labels and grouping with the current behavior.

**Acceptance Scenarios**:

1. **Given** a single-column viewport, **When** the Personal Bests tab is shown, **Then** each block lists its sport cells stacked vertically in the current order (Run, Bike, Swim), each preceded by its coloured sport label.
2. **Given** a single-column viewport, **When** the page is shown, **Then** the shared desktop sport header row remains hidden and the per-cell sport labels remain visible.

---

### User Story 3 - All-time power profile matches other PB tiles (Priority: P2)

As an athlete, I want the "All-time power profile" tile to look like every other PB tile (same card frame, header styling, chart proportions, text sizes, line/marker weights and footer), so the Watt block feels like one consistent set.

**Why this priority**: Purely visual consistency; the data is already correct, but the tile currently looks oversized and foreign.

**Independent Test**: With bike power data covering at least two durations, view the Watt block and compare the profile tile side-by-side with an individual power duration tile.

**Acceptance Scenarios**:

1. **Given** at least two power durations with records, **When** the Watt block renders, **Then** the profile tile uses the same card frame, padding, inner spacing and header label style as the power duration tiles.
2. **Given** the profile tile is rendered, **When** compared with a neighbouring power duration tile in the same column, **Then** the chart area has the same width and proportional height, and its axis and value labels use the same text sizes and colours.
3. **Given** the profile tile is rendered, **When** viewed, **Then** line thickness and point markers are visually in the same weight class as the other tiles' trend lines and markers (no oversized dots or thick bars).
4. **Given** the profile tile is rendered, **When** viewed, **Then** it has a small footer line in the same style as other tiles (e.g., "N durations").
5. **Given** the profile tile, **When** the user hovers a duration point, **Then** the existing tooltip still appears; **When** the user clicks the enlarge button, **Then** the existing enlarged profile view still opens unchanged.

---

### Edge Cases

- A sport has no records in a block (e.g., no swim distance records): its column remains empty for that block, while the other sports stay on the block's first row.
- Only one power duration exists: the existing "Limited power profile" note remains, styled consistently with other small notes.
- No bike power data: the Watt heading, divider and block remain hidden as today.
- Many duration labels on the compact profile: labels must not overlap; the existing label-thinning behaviour continues to apply at the compact size.
- Viewport exactly at the breakpoint between single- and three-column layouts: the layout is either fully stacked or fully aligned, never mixed.
- Sticky desktop Swim | Bike | Run header continues to line up with the three columns below it.
- Image export of individual PB tiles (including the profile tile) continues to work and reflects the new consistent style.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: In the three-column (desktop) layout, the Swim, Bike and Run cells of each multi-sport PB block (Distance records, Elevation, Longest) MUST begin on the same row, in the left, middle and right columns respectively. The bike-only Watt block MUST begin on its block's first row in the middle column.
- **FR-002**: Column assignment in the desktop layout MUST match the shared sticky header order: Swim left, Bike middle, Run right. This applies to every block, including the bike-only Watt block, whose tiles MUST NOT be redistributed into the Swim or Run columns.
- **FR-003**: Within a block on desktop, tiles MUST follow a strict row grid: the n-th tile of each sport MUST occupy the same row, each row's height MUST equal its tallest tile, and the following block MUST begin below the last row of the preceding block.
- **FR-004**: The single-column layout MUST remain unchanged in order (Run, Bike, Swim within each block), per-cell sport labels, block headings and dividers.
- **FR-005**: The "All-time power profile" tile MUST use the same card frame, padding, inner spacing and header label styling as the individual bike power duration tiles.
- **FR-006**: The profile tile's chart MUST use the same overall proportions (aspect ratio) as the other PB tile charts so it neither appears taller nor with larger text than its neighbours.
- **FR-007**: All text inside the profile chart (axis values, duration labels, axis captions) MUST use the same text sizes and colours as the corresponding labels in other PB tile charts. The axis captions "Power (W)" and "Duration" MUST be removed from the in-grid tile; only watt value labels and duration labels remain.
- **FR-008**: The profile tile's line and point markers MUST use stroke widths and marker sizes consistent with other PB tile charts.
- **FR-009**: The profile tile MUST show a footer line in the same style as other PB tiles, stating the number of durations shown.
- **FR-010**: Existing profile interactions (hover tooltip per duration, enlarge/detail view, tile export) MUST keep working.
- **FR-011**: Duration labels on the profile tile MUST remain readable and non-overlapping at the compact size.

### Key Entities

- **PB block**: A themed group of tiles (Distance records, Elevation, Longest, Watt) containing one cell per sport.
- **Sport cell**: The per-sport ordered list of PB tiles within a block; mapped to a fixed column on desktop, where its n-th tile is placed in the block's n-th row.
- **PB tile**: A card with header label, optional enlarge button, compact chart and footer.
- **All-time power profile tile**: A PB tile summarising the best watt value for each power duration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a desktop-width viewport with data for all three sports, 100% of PB blocks place the n-th Swim, Bike and Run tiles in the same row (top edges aligned within a few pixels).
- **SC-002**: On desktop, the vertical space used by the Personal Bests tab for the same data is reduced compared to today (no rows containing only a single sport cell caused by misplacement).
- **SC-003**: On a single-column viewport, the order, labels and grouping of PB content are identical to the current behaviour.
- **SC-004**: Placed next to a power duration tile, the profile tile has the same card styling, the same chart aspect ratio, and no text larger than the largest label in the neighbouring tiles.
- **SC-005**: All existing automated tests continue to pass, and a user can still hover, enlarge and export the profile tile.

## Assumptions

- "Three-column view" refers to the existing large-screen breakpoint at which the shared Swim | Bike | Run sticky header is shown.
- Swim | Bike | Run left-to-right column order (as in the sticky header) is the desired desktop order; Run, Bike, Swim remains the mobile order.
- The profile tile keeps its current x-axis semantics (durations as categories) and data; only its visual presentation is aligned.
- The enlarged/detail profile view is out of scope for restyling; only the in-grid tile is aligned.
- No changes to PB calculation, data import, or other dashboard tabs.
