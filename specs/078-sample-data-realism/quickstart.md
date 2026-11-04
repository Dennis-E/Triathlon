# Quickstart: Realistic Sample Training Data

## Prerequisites

- Run commands from the repository root.
- Node.js and the root npm dependencies are installed.
- The committed route catalog at `sample-data/routes.json` is available.

## Regenerate and Verify the Payload

```powershell
node scripts/generate-sample-data.js
node scripts/generate-sample-data.js --check
```

Expected: generation reports 1,628 activities and 933 tracks. The check command exits successfully when the committed payload is byte-for-byte reproducible and within the existing 4 MiB limit.

## Run Focused Tests

```powershell
npm test -- --runInBand __tests__/sample-data-utils.test.js __tests__/equipment-utils.test.js
```

Expected: both suites pass. They verify sample payload validity and hydration, seasonal volume, the extended recovery gap, shoe/bike filtering, occasional equipment use, and compatibility with the bundled history.

## Verify in the Browser

1. Start the static app with `python -m http.server 8000`.
2. Open `http://localhost:8000` and load the exemplary sample data.
3. Verify that the live status identifies the loaded dataset as `Synthetic sample training data`.
4. Compare monthly training volume across years and inspect the 2023 timeline for the recovery break.
5. Open equipment summaries and timelines. Verify that shoes and bicycles appear in their respective categories and that trail equipment is occasional rather than uniformly used.

Expected: the active sample is visibly identified as synthetic, and the existing dashboard views work without a new tab, runtime service, or personal-file import.

## Related Design

See [data-model.md](data-model.md) for payload entities and validation rules. No external contracts are introduced by this feature.
