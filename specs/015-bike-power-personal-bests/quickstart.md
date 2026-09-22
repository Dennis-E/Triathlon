# Quickstart: Bike Power Personal Bests

## Prerequisites

- Repository checked out on branch `015-bike-power-personal-bests`.
- Node.js/npm available from the repository root.
- The frontend can be served with `python -m http.server`.
- Use synthetic CSV/FIT-like records for tests; do not add personal Strava exports.

## Automated validation

Run the focused tests first:

```powershell
npm test -- power-pb-utils processing zip-importer index-script-syntax
```

Expected outcomes:

- Average power headers in German and English remain normalized to usable watts.
- Invalid, missing, zero, and negative power values are excluded.
- Bike-only filtering prevents non-bike power from entering Bike PBs.
- FIT records can produce the supported duration-specific power efforts.
- Average-only data produces an activity-average power record without inventing a duration record.
- Mixed data keeps average and duration records separate and chronological.
- The inline dashboard script remains syntactically valid and contains the expected Bike power PB labels/no-data behavior.
- The focused slice currently covers the power utility, CSV processing, ZIP import, and inline dashboard contracts.

Then run the complete root suite:

```powershell
npm test
```

## Manual browser validation

1. Serve the repository root with `python -m http.server` and open `http://localhost:8000`.
2. Import a synthetic or explicitly supplied Strava export containing Bike rows with `Average Watts` or `Durchschnittliche Wattzahl`.
3. Open **Personal Bests** and inspect the Bike column.
4. **Expected**: a visible watts-labeled activity-average result appears, with date and activity context; no 5m/10m/20m/60m label is assigned solely from that average.
5. When a ZIP contains a Bike FIT file with power records, import it again.
6. **Expected**: each supported duration with a qualifying rolling effort shows a separate progression in watts; durations without qualifying data remain absent or clearly unavailable.
7. Hover or open a power record detail.
8. **Expected**: the value, `W` unit, category, date, activity name, and source meaning are understandable.
9. Import a dataset without usable Bike power.
10. **Expected**: existing non-power Personal Bests remain unchanged and the power area does not show fabricated or empty records.

## Browser smoke note

The static startup smoke check must find `window.powerPbUtils` loaded before dashboard
initialization. A localhost run may also show the pre-existing analysis-counter CORS
warning because that external service does not allow the local origin; this is unrelated
to local power parsing and does not transmit power records.

## References

- [Feature specification](spec.md)
- [Data model](data-model.md)
- [UI contract](contracts/power-pb-ui.md)
- [Research decisions](research.md)
