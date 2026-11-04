# Quickstart: Apple Health Progress Percentage Display

## Prerequisites

- Node.js and npm installed from the repository root.
- The repository's existing dependencies installed.

## Focused Automated Validation

Run the dashboard import test file:

```powershell
npm test -- --runInBand __tests__/dashboard-import.test.js
```

Expected outcomes for the focused progress tests:

- Apple Health values `0`, `42.375`, `42.5`, and `100` display as `0%`, `42%`, `43%`, and `100%` respectively.
- The progress indication continues to use the unchanged bounded numeric value, including fractional input.
- A stage-only update retains the prior percentage label.
- Strava and TrainingPeaks progress presentation remains unchanged.

## Browser Smoke Check

Serve the static app from the repository root:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`, start an Apple Health import with a synthetic or explicitly supplied test archive, and verify that progress labels show whole percentages with `%` while the progress indication continues to advance smoothly. Repeat with another import source and confirm its existing label presentation is unchanged. Do not use personal exports as committed test fixtures.