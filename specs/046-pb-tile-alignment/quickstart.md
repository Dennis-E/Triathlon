# Quickstart: Validate Feature 046

## Prerequisites
- A local Strava export (or synthetic data) with Swim, Bike and Run activities and bike power (FIT) data.
- From the repo root: `python -m http.server`, then open `http://localhost:8000`.

## Automated
```powershell
npm test -- __tests__/index-script-syntax.test.js
npm test
```
Expected: all tests pass, including the updated profile-tile and PB layout contract assertions ([contracts/pb-grid-ui.md](contracts/pb-grid-ui.md)).

## Manual scenarios
1. **Desktop row grid** (window at least 1024 px wide), Personal Bests tab:
   - Distance records: the 1st Swim, 1st Bike and 1st Run tiles share row 1, and the 2nd tiles share row 2. Sports with fewer tiles leave empty cells.
   - Elevation: "Not applicable for swimming." (left), Bike tile (middle) and Run tile (right) are in one row.
   - Longest: Swim, Bike and Run are in one row.
   - Watt: tiles only in the middle column, starting directly under the heading.
   - The sticky Swim | Bike | Run header lines up with the columns.
2. **Mobile** (window below 1024 px wide): stacked order Run → Bike → Swim with coloured sport labels in each block, identical to before.
3. **Profile tile**: next to a power duration tile it has the same card, the same chart height and proportions, and small labels. There is no "Power (W)" or "Duration" caption, and the footer reads "N durations".
4. **Interactions**: hover over a profile point shows the tooltip; the enlarge button opens the detail view unchanged.
5. **Export**: export the Personal Bests tab and a profile tile detail. The images match the on-screen layout.
