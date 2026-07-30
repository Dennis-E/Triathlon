# Training Dashboard

A browser-based dashboard for exploring long-term training trends from a reduced Strava activity extract. The app currently focuses on distance, heart-rate/pace, and equipment visualizations.

## Current Dataset

The repository keeps visualization-ready datasets such as:

- `Data/EE/relevant-export_155559589/activities.csv`
- `Data/Dennis/relevant-export_39173135/activities.csv`

This reduced file contains only the fields currently needed by the visualizations.

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

Open `index.html` through a local server so the default dataset can be fetched by the browser.

Examples:

```bash
python -m http.server
```

or use VS Code Live Server.

The dashboard auto-loads the first available reduced extract from:

- `./Data/EE/relevant-export_155559589/activities.csv`
- `./Data/Dennis/relevant-export_39173135/activities.csv`

If that is not available through the browser, you can manually select a reduced `activities.csv` file in the UI.

## Tests

Run the test suite with:

```bash
npm test -- --runInBand
```

The repository also includes test fixture data in `test-data/` for integration tests.
