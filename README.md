# Training Dashboard

A browser-based dashboard for exploring long-term training trends from a reduced Strava activity extract. The app currently focuses on distance, heart-rate/pace, and equipment visualizations.

## Data Input

The dashboard starts empty. To use the visualizations, you first import a Strava ZIP export in the browser.

For local development only, the landing page also exposes sample-data buttons that load ignored files from `Data/Dennis/...` and `Data/EE/...` when those folders exist locally. On `localhost` they try the local paths directly. When opened via `file://`, they fall back to a file picker so you can choose the matching sample CSV or ZIP manually.

Each import source is converted into the same reduced interim dataset before the visualizations render.

If a Strava export has no heart-rate values or no equipment assigned to activities, the heart-rate and equipment visualizations will stay empty even though the import succeeded.

## Current Visualizations

- Total distance over time
- Sport split across running, cycling, and swimming
- Heart-rate vs pace scatter view
- Equipment-based summaries

## Data Columns Used

The dashboard currently reads these columns from `activities.csv`:

- `Aktivitäts-ID`
- `Aktivitätsdatum`
- `Name der Aktivität`
- `Aktivitätsart`
- `Aktivitätsausrüstung`
- `Bewegungszeit`
- `Durchschnittliche Herzfrequenz`
- `Distanz`

## Reduced Extract Generator

The repo includes `relevant-export-extractor.js` to create the reduced `activities.csv` from a Strava export folder or ZIP.

Example:

```bash
npm run extract:relevant -- "C:\path\to\export.zip" "C:\path\to\output-folder"
```

## Running The Dashboard

Open `index.html` through a local server.

Examples:

```bash
python -m http.server
```

or use VS Code Live Server.

Then import a Strava ZIP export from the landing page.

If you are working locally and have ignored development sample data under `Data/`, you can also use the `use D data` and `use E data` buttons.

## Tests

Run the test suite with:

```bash
npm test -- --runInBand
```

The repository also includes test fixture data in `test-data/` for integration tests.
