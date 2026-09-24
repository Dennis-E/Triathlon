# Quickstart: Training Calendar Refinements

## Prerequisites

- Node.js and npm installed.
- A local Strava export or synthetic local activity data.
- Existing Training Calendar implementation available in the repository.

## Automated validation

From the repository root:

```powershell
npm test -- training-calendar tab-navigation index-script-syntax
```

Expected result: multi-year ordering, bright empty-state styling, palette definitions, shared palette rendering, and removal of the year selector pass alongside existing calendar and tab tests.

## Manual validation

1. Serve the repository:

   ```powershell
   python -m http.server
   ```

2. Open `http://localhost:8000` and import synthetic or supplied data spanning at least five years, including active and empty periods.
3. Open **Training Calendar** and measure the time until five visible year blocks are rendered. Confirm this is at most 2 seconds, every calendar year between the newest and oldest activity year appears as a complete block below the preceding newer year, and there is no year selector.
4. Compare an empty day with the lowest active level. Confirm the empty day is much brighter and remains neutral.
5. Select **Green**, **Blue**, and **Fire**. Confirm all year blocks and legends update together while empty cells remain the same bright neutral color.
6. For Fire, confirm active levels progress from yellow through orange to red.
7. Change an existing sport filter and measure the rerender. Confirm every visible year block updates within 1 second while the selected palette remains active.
8. Use keyboard focus on palette controls and day cells. Confirm accessible selected state, date labels, and day details remain available.
9. Resize to a narrow viewport. Confirm year headings and all day grids remain reachable with horizontal scrolling where needed.

## Expected outcomes

- Five represented years render within the documented initial-load target.
- No year filter is present.
- Exactly three palette choices are present.
- Empty cells are brighter than the lowest active cells in all palettes.
- The current or newest available year is first.
