# Quickstart: Concise TrainingPeaks Import Status

## Prerequisites

- Install the repository's root dependencies with `npm install` if they are not already available.
- Use local synthetic or explicitly supplied TrainingPeaks archives; personal exports remain local to the browser.

## Focused automated validation

From the repository root, run:

```powershell
npm test -- --runInBand __tests__/dashboard-import.test.js
```

Expected result: the focused import suite passes, including status assertions for successful imports with one and multiple archives, skipped or unmatched entries, cancelled selection, failure behavior, and unchanged Strava wording.

## Browser smoke check

1. Start the static app with `python -m http.server 8000` and open `http://localhost:8000`.
2. Import a valid TrainingPeaks archive. Confirm the top-right status reads exactly `Imported TrainingPeaks history`.
3. Repeat with multiple archives and an import containing skipped or unmatched items. Confirm the status text remains identical and contains no counts or explanatory details.
4. Confirm the existing progress and failure feedback remains available, then import Strava data and verify its success wording is unchanged.

Expected outcome: all successful TrainingPeaks imports show the same concise status; other import outcomes retain their established behavior.
