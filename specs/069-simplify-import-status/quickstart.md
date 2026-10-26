# Quickstart: Simplify Import Status

## Prerequisites

- Node.js and npm installed.
- Root dependencies installed with `npm install`.
- Tests use synthetic import datasets; personal Strava or TrainingPeaks exports are not required.

## Automated Validation

Run the focused import status tests:

```powershell
npm test -- --runInBand __tests__/dashboard-import.test.js
```

Expected results:

- Successful Strava import application reports exactly `Imported Strava history`.
- Successful TrainingPeaks import completion reports exactly `Imported TrainingPeaks history`.
- Activity counts and skipped-item details do not appear in either success label.
- Existing progress and failure status behavior remains unchanged.

Run the full root suite:

```powershell
npm test -- --runInBand
```

## Manual Browser Validation

Serve the static app:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/`, complete one import from each supported source, and verify that the upper-right header shows only the matching source label. Confirm the active progress and a failed import still show their existing informative messages.

See [import status contract](contracts/import-status.md) and [data model](data-model.md) for the exact label rules.