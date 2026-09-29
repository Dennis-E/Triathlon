# Research: Personal Bests Tile Consistency & Desktop Row Alignment

## R1 — Root cause of the desktop "staircase"

- **Decision**: Treat it as a CSS grid auto-placement defect, not a data defect.
- **Rationale**: Each block in [index.html](../../index.html) is a `lg:grid-cols-3` grid. Its three sport wrappers appear in DOM order Run → Bike → Swim (for the mobile order) and set only `lg:col-start-3/2/1`, with no row. Under the default sparse auto-placement, the cursor never moves backwards. Once Run is placed in column 3, Bike (column 2) and then Swim (column 1) can only be placed in new rows.
- **Alternatives considered**: Reordering the DOM to Swim → Bike → Run was rejected because it would change the mobile order (FR-004). `grid-auto-flow: dense` only aligns the tops of the three wrappers, not the strict n-th-tile rows required by the clarification.

## R2 — Strict row grid technique (FR-003)

- **Decision**: On `lg` and wider screens, flatten each sport wrapper and its tile container with `display: contents` (`lg:contents`). Each tile then becomes a direct item of the block grid. Each tile gets an explicit `grid-column` (from the sport's column: Swim 1, Bike 2, Run 3) and `grid-row` (its 1-based index within its sport). A small `<style>` rule inside `@media (min-width: 1024px)` reads the row from a `--pb-row` custom property and the column from the wrapper's `data-pb-col` attribute. A renderer helper sets `--pb-row` and the `pb-grid-item` class on every tile after rendering.
- **Rationale**: Implicit grid rows size to their tallest item. With the default `align-self: stretch`, all tiles in a row share its height, which meets "row height = tallest tile". Mobile is untouched because all rules sit in the `lg` media query and `lg:contents` has no effect below `lg`. Mobile sport headings are already `lg:hidden`. There is no build step and no new dependency: the Tailwind CDN already supports `contents`, and the rule is plain CSS.
- **Alternatives considered**:
  - CSS `subgrid` with a dynamic `row-span-N`: requires computing N per block and nests two levels, so it is more complex.
  - Rendering tiles row-major from JS into a single grid: would duplicate the mobile ordering and headings logic.
  - Explicit row placement via inline `style.gridRow`: would also apply on mobile. The custom property plus media query avoids that.
- **Side effects handled**: `space-y-4` on the containers adds a margin to sibling tiles, which would offset rows. Add `lg:space-y-0`. Margins on the wrappers themselves (`space-y-2`) have no effect when the wrappers are `contents`.

## R3 — Scope of blocks

- **Decision**: Apply the row grid to the Distance records, Elevation and Longest blocks. The Watt block keeps its single Bike wrapper in column 2 (clarification Q3). It already starts on row 1 because it is the only item.
- **Rationale**: Minimal change that meets FR-001, FR-002 and FR-003.
- The Elevation block's static "Not applicable for swimming." note is marked as a `pb-grid-item` in row 1 (default `--pb-row: 1`).

## R4 — Profile tile visual alignment (FR-005 to FR-011)

- **Decision**: Reuse the shared mini-chart coordinate system and helpers already used by every PB tile: `VB_W` (300) × `SVG_H` (56), `PAD_L`, `PAD_R`, `CHART_TOP`, `X_AXIS_Y`, `appendYAxisLabel` (6.8 size), the timeline baseline and y-axis colour `#1E293B`, and 8.5 size monospace x labels at `SVG_H - 0.5`. Keep the duration categories evenly spaced on the x axis with a small inset, so the edge labels are not clipped.
  - Y scale from 0 to the max watt value, like the power duration tiles. Labels: max watt at the top (`isTop`) and `0 W` at the bottom.
  - Polyline stroke 1.8. Measurement lines stroke 1.8, opacity 0.75, hover → 1. Point markers r 2.5.
  - Remove the "Power (W)" and "Duration" captions from the in-grid tile (clarification Q1).
  - Card class `bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5`, identical to the other tiles.
  - Footer `text-[10px] text-slate-600` with the text "N durations".
  - SVG sizing like the other tiles: `width="100%"`, `preserveAspectRatio="xMidYMid meet"`, `display:block`, `overflow:visible`, no fixed height.
  - Keep the existing tooltip and hit areas (circle and wide transparent line), the `profile-measurement-hit-area` class, `markPowerProfileLabelVisibility` thinning, the enlarge button model (`xAxisMode: 'duration-category'`) and the `limited-profile` note.
- **Rationale**: Uses the same code paths, so it looks the same by construction.
- **Label density**: `markPowerProfileLabelVisibility` shows the shortest duration plus all durations of 300 s or more. With 8.5-size labels on a width of about 270 units, that is at most about 6 visible labels, which fit.
- **Alternatives considered**: Scaling down the existing 360×148 chart. Rejected: the aspect ratio would still differ (FR-006).

## R5 — Export and tests

- **Export**: A tab export captures `pbColumnsContainer` via html2canvas, which renders from element bounding boxes. Wrappers with `display: contents` have no box, and the tiles keep their real positions. Verify manually (quickstart step 5). Detail/tile export uses `pbDetailCaptureTarget` and is unaffected.
- **Tests**: `__tests__/index-script-syntax.test.js` asserts the old profile geometry (`const height = 148;`, `yLabel.setAttribute('y', '17')`, `const right = 24;`, `measurementLine … stroke-width '3'`, `svg.style.aspectRatio …`, `measurementLine.setAttribute('y2', height - bottom)`). Replace these with assertions for the new contract. Add layout assertions for `pb-row-block`, `data-pb-col`, `lg:contents` and the row-assignment helper.
