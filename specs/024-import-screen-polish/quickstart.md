# Quickstart: Import-Screen Polish

## Prerequisites

- Node.js and npm installed.
- Repository dependencies installed with `npm install`.
- A synthetic Strava CSV/ZIP fixture or a locally supplied export. Do not commit private exports.

## Focused Automated Validation

Run the GPS importer tests:

```powershell
npm test -- --runInBand __tests__/zip-importer.test.js
```

Expected coverage includes:

- One normal FIT activity produces one GPS-track entry.
- A FIT source with five synthetic session ranges produces five independently segmented tracks.
- Each segmented track contains only points in its own time interval.
- A session with no GPS points produces no GPS-track entry.
- Existing GPX and FIT power extraction behavior remains unchanged.

Run the full root suite after the focused tests pass:

```powershell
npm test -- --runInBand
```

## Manual Browser Validation

Serve the static app from the repository root:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/` and start a Strava ZIP import.

Verify:

1. Only one main import headline is visible.
2. The current detailed stage/activity appears only in the black box below the progress bar.
3. A prepared TriAnalytica visualization preview and a short message are visible during processing.
4. A sufficiently long import rotates to a second preview/message without delaying progress.
5. Completion and error states stop rotation and remain readable.
6. A synthetic multisport FIT fixture produces one GPS entry per child activity with only that session's points.
7. A source file with no GPS points does not create a GPS entry.

See [UI contract](contracts/import-screen.md) and [data model](data-model.md) for the exact state and segmentation rules.
