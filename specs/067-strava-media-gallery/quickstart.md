# Quickstart: Strava Media Gallery

## Prerequisites

- Node.js and npm installed for the root Jest suite.
- A modern browser and the existing static app server.
- The private reference Strava ZIP already available locally under `private-data/Strava/`. Do not copy it into fixtures or version control.

## Focused Automated Validation

Run the feature's focused suites:

```powershell
npm test -- --runInBand __tests__/zip-importer.test.js __tests__/dashboard-import.test.js __tests__/visualization-availability.test.js __tests__/tab-navigation.test.js __tests__/dashboard-export-download.test.js __tests__/export-utils.test.js __tests__/index-script-syntax.test.js
```

Expected result: all focused suites pass in Jest's Node environment. Synthetic ZIP fixtures cover exact reference matches, missing and duplicate references, corrupt/unsupported files, multiple references per activity, and cleanup behavior. No test reads or commits a private media file.

## Manual Browser Validation

1. Start the static app from the repository root:

   ```powershell
   python -m http.server 8000
   ```

2. Open `http://localhost:8000`, choose the Strava import, and select the local reference ZIP once.
3. Verify the import report accounts for every media manifest row, discovered supported/unsupported file, and activity media reference. Confirm only exact, unique references are linked and unresolved entries stay visible as unassigned/ambiguous/missing/corrupt statuses.
4. Switch to another dashboard view and back to the media tab without selecting the archive again. Confirm the tab is absent for an import with no readable supported media and absent for TrainingPeaks-only data.
5. Filter by year, sport, and activity. Confirm undated and unassigned media remain discoverable, empty filters have a clear state, and a video starts only after an explicit play action.
6. Create a year recap and a manual/filter-based collage. Preview and download locally. Confirm routes are excluded by default; explicitly include a visible route and confirm the exported image still contains no embedded source-photo location metadata.
7. Replace the dataset and verify prior media URLs/resources are released. Reload the page and confirm a new import is required.
8. Repeat a normal Strava training import with corrupt/unreadable media entries and a TrainingPeaks import; confirm training activities and existing visualizations remain available.

## Expected Privacy Behavior

- No media, caption, or normalized activity content appears in network requests or analysis-counter payloads.
- No media is stored in localStorage, IndexedDB, cookies, or an application database.
- Only locally generated raster exports enter the existing preview/download flow; original media bytes are never exported as collage bytes.