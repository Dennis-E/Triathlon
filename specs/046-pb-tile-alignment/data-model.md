# Data Model: Personal Bests Tile Consistency & Desktop Row Alignment

No persisted data and no changes to PB calculation. The "entities" are UI structures.

## PB block
- **Instances**: Distance records, Elevation, Longest (row-grid blocks); Watt (Bike-only block).
- **Fields**: heading text; the block grid element (`pb-row-block` class for row-grid blocks); 3 sport cells (Watt: 1).
- **Rules**: On desktop, the grid has 3 columns and implicit rows. The next block starts after the block's last row.

## Sport cell
- **Fields**: sport (`Swim` | `Bike` | `Run`); desktop column `data-pb-col` (Swim = 1, Bike = 2, Run = 3); mobile order (Run = 1, Bike = 2, Swim = 3); mobile heading (`data-pb-mobile-sport`, `lg:hidden`); tile container (existing IDs, e.g. `pbRunContainer`).
- **Rules**: Desktop column is fixed per sport. Mobile order and headings are unchanged.

## PB tile (grid item)
- **Fields**: `pb-grid-item` class; `--pb-row` = 1-based index within its sport cell.
- **Rules**: Desktop placement is `grid-row: var(--pb-row)` and `grid-column` from the parent sport cell. Tiles in the same row stretch to the tallest tile.
- **Includes**: distance PB cards, record cards (elevation, longest), the "No matching activities" note, and the static "Not applicable for swimming." note (row 1).

## All-time power profile tile
- **Source**: `powerPbUtils.buildAllTimePowerProfile(durationRecords)`. Visible labels come from `markPowerProfileLabelVisibility`.
- **Display fields**: header "All-time power profile" plus enlarge button; the chart (same viewBox as other tiles); max-W and `0 W` y labels; thinned duration labels; footer "N durations".
- **States**: ≥2 points → tile; 1 point → `limited-profile` note; 0 → nothing (the Watt block is hidden when there are no duration records).
