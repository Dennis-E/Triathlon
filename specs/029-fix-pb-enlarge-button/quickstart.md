# Quickstart: Fix Power PB Enlarge Button

## Prerequisites

- Node.js and npm are installed.
- The repository root is the current directory.
- A local browser is available.
- Local Bike activity data with at least one power PB duration is available, or an existing synthetic/import test dataset can be used. Keep personal exports local.

## Focused Automated Check

Run the existing script and detail-control assertions:

```powershell
npm test -- --runInBand __tests__/index-script-syntax.test.js
```

Expected result: the test suite passes, including the per-tile full-screen detail overlay assertions.

## Browser Check

1. Start the static app from the repository root:

   ```powershell
   python -m http.server 8000
   ```

2. Open `http://localhost:8000/` and import Bike data containing at least one power duration PB.
3. Open the Personal Bests view and locate the Bike power duration tiles.
4. Confirm each tile header shows a recognizable enlarge icon, not a blank or solid black control.
5. Compare the power controls with the enlarge controls on the other PB tiles for icon visibility, dimensions, contrast, and hover/focus appearance.
6. Activate a power tile's control and confirm the matching full-screen detail view opens.
7. Repeat at a narrow browser width and confirm the control remains inside the tile header and usable.

## Full Regression Check

After the focused check passes, run:

```powershell
npm test -- --runInBand
```

Expected result: all existing tests pass and no PB values or detail-view behavior regress.
