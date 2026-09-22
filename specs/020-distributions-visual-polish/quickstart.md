# Quickstart: Distributions Visual Polish

## Prerequisites

- Local checkout on branch `020-distributions-visual-polish`.
- Node.js installed (for running the Jest suite).
- A modern browser for manual verification.

## Setup

```powershell
npm install
npm test
```

## Manual validation (static app)

1. Serve the app from the repo root:

   ```powershell
   python -m http.server
   ```

2. Open `http://localhost:8000` and import/load a dataset that includes Run, Bike,
   and Swim activities, with a wide Duration range (minutes to multiple hours) and at
   least one Swim activity with an extremely fast (current-assisted) pace outlier.
3. **Default state (User Story 1)**: Open the Distributions tab for the first time and
   confirm it shows "All Sports" + "Line" mode with per-sport lines, without any
   manual interaction. Change the sport filter or mode, then switch away and back to
   the tab, and confirm your manual choice is preserved (not reset).
4. **Fire color scheme (User Story 2)**: Check each metric in both Histogram and Line
   modes and confirm bars/points consistently run yellow (slow/short) to red
   (fast/long), and that per-sport lines in "All Sports" + Line mode remain
   distinguishable by their existing stroke color/legend while their points still
   carry the gradient.
5. **Duration buckets (User Story 3)**: Select Duration and confirm every regular
   bucket boundary is a round time value (e.g., multiples of 10 minutes), never an
   odd number like 17 minutes.
6. **Pace unit placement (User Story 4)**: Select Pace for a single sport and confirm
   the axis title shows the unit once (e.g., "Pace (min/km)") while bucket labels show
   only the time/number value.
7. **Underflow bucket + axis order (User Story 5)**: With the Swim pace outlier
   dataset, select Pace + Swim and confirm a "smaller than" bucket appears and the
   fastest values sit on the same red/fast end used by other metrics. Confirm the same
   metric with "All Sports" selected keeps the existing (unreversed) shared axis.
8. **Swim + Elevation N/A (User Story 6)**: Select Elevation gain + Swim and confirm an
   explicit "N/A" message appears (not an empty/zero chart). Select Elevation gain +
   "All Sports" + Line mode and confirm Swim is omitted from the per-sport lines while
   Run/Bike still render normally.

## Automated validation

```powershell
npm test -- distribution-utils
npm test -- index-script-syntax
```

Expected: both suites pass, covering the fire color-mapping function, Duration
nice-step table, Pace underflow bucket, axis-reversal metadata
(`distribution-utils.test.js`), and the inline default-state/axis-title/Swim-N/A
contract (`index-script-syntax.test.js`).

## Reference

- UI contract: [contracts/distributions-visual-polish-ui.md](contracts/distributions-visual-polish-ui.md)
- Data model: [data-model.md](data-model.md)
- Design decisions: [research.md](research.md)
- Base features this refines: [../018-activity-distributions/spec.md](../018-activity-distributions/spec.md), [../019-distributions-refinements/spec.md](../019-distributions-refinements/spec.md)
