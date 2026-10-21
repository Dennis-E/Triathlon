# Quickstart: Remove Filter Summary Bubbles

## Prerequisites

- Node.js and npm installed, with project dependencies available.
- A browser for the manual dashboard check.
- A local activity export only if needed to populate the dashboard; use synthetic or explicitly supplied data and keep personal exports local.

## Automated Validation

Run the focused dashboard structure test:

```powershell
npm test -- --runInBand __tests__/index-script-syntax.test.js
```

Expected result: the test passes, asserting that no active-filter summary row or update wiring remains while dashboard navigation and filter handling remain present.

Run the root test suite as the final verification gate:

```powershell
npm test -- --runInBand
```

Expected result: all root Jest tests pass.

## Manual Browser Validation

1. Start the static app from the repository root with `python -m http.server 8000` and open `http://localhost:8000`.
2. Load activity data and open visualizations with different filter controls.
3. Confirm no separate row of selected-filter bubbles appears above any visualization.
4. Confirm each filter still visibly shows its current selection; change selections and verify the corresponding visualization updates.
5. Switch among visualizations and repeat the check, including a view with no filters or no available filter selection.

Expected result: the redundant summary row is absent across the dashboard, filter controls remain usable and visibly selected, and visualizations continue to respond to filter changes.
