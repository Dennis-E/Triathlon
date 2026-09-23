# Quickstart: Calm Import Status

## Prerequisites

- Node.js and npm installed.
- Dependencies installed with `npm install`.
- A synthetic or locally supplied Strava ZIP export. Do not commit private exports.

## Automated Validation

Run the focused UI contract tests:

```powershell
npm test -- --runInBand __tests__/index-script-syntax.test.js
```

Expected results:

- The factual import-status element appears before the progress bar.
- GPS extraction status text is represented in the status contract.
- The preview timer uses a 5000 millisecond interval.
- The existing black detail box remains present.

Run the full root suite:

```powershell
npm test -- --runInBand
```

## Manual Browser Validation

Serve the static app:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/` and start a Strava ZIP import.

Verify:

1. `Extracting GPS tracks (n/total)...` appears above the progress bar.
2. The same preview remains visible for at least 5 seconds.
3. Frequent progress updates do not cause an early preview change.
4. Completion and errors stop further preview rotation.
5. The black detail box remains readable and separate from the factual status.
6. The layout remains usable at narrow mobile widths.

See [import-status contract](contracts/import-status.md) and [data model](data-model.md) for the exact order and timing rules.
