# Synthetic Silicon Valley training data

This folder contains a wholly fictional Silicon Valley triathlete's
2021-2025 training history. No personal exports, private routes, home addresses,
credentials, or content from `private-data` or `test-data` are inputs.

The public payload is `silicon-valley-training.json`; curated public
geometry is in `routes.json`. Workout dates, titles, measurements and
equipment are synthetic. Public geographic geometry is not an athlete's history.

## Geometry Sources and License

Geographic data: OpenStreetMap contributors, retrieved 2026-11-02 through the
[official OSM API](https://wiki.openstreetmap.org/wiki/API_v0.6).
Each route records its actual source URL, contributing way IDs, retrieval date,
attribution and license URL in `provenance`. The catalog connects named public
road/trail sections by shared OSM node IDs, uses recorded geometry rather than
straight-line shortcuts, and densifies long recorded segments to <= 45 m.

The distributed `routes.json` and derived `silicon-valley-training.json` databases
are available under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
Retain the OpenStreetMap contributor attribution and license notices when using
or redistributing these databases; adaptations are subject to ODbL share-alike.
See [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright).
The app's existing map attribution and sample map-export attribution identify OSM.
This data license does not change the license of application source code.

The twelve running/cycling patterns follow North Shoreline Boulevard, Alpine Road,
Portola Road, Westridge Drive, Hamms Gulch Trail, Razorback Ridge Trail, Skyline
Boulevard, Old La Honda Road, Spring Ridge Trail, East Bayshore Road, San
Francisquito Creek Trail and Adobe Creek Trail. Visit frequency differs by route;
out-and-back patterns follow the same recorded path in reverse, not a shortcut.

The two swimming patterns are synthetic repeated beach-drill courses derived
from the northern portion of OSM's Shadow Cliffs Lake water geometry (way
43986029). The [official park information](https://www.ebparks.org/parks/shadow-cliffs)
identifies designated swimming, seasonal opening and current water-quality
advisories. Sample outdoor swims occur only in May-September of the fictional
2021-2025 history; pool sessions have no GPS. These are illustrative historical
training records, not surveyed buoy routes, current swimming/access guarantees,
safety advice or directions for navigating the lake. Check current park rules.

## Generation and validation

```powershell
node scripts/generate-sample-data.js
node scripts/generate-sample-data.js --check
npm test -- --runInBand __tests__/sample-data-utils.test.js
```

Generation is offline from the committed catalog, with seed 76 and generator
version 2. The output contains 1,628 activities and 933 GPS tracks across all 60
months, with all three sports in every year; the uncompressed payload is
approximately 1.4 MiB. Seasonal winter recovery reduces training, and August
2023 includes a fictional injury-recovery break. Road shoes and bikes change
over the years, with trail shoes and a mountain bike used only occasionally on
trail routes. Cycling power averages and all eight best-effort durations are
derived from the same deterministic power series using the application's
existing best-effort calculation. Raw series are not shipped.
`--check` validates and compares expected bytes without writing or network access.
Visitors load the ready-made public payload and never run a generator.

For maintainers only, `node scripts/acquire-sample-routes.js` re-acquires public
geometry over the network, splitting oversized OSM queries. Review any resulting
geographic changes before regenerating the payload. This is not part of app startup
or the offline generator. No runtime routing service or account is required.

Both validation and hydration must reject incomplete histories, not just malformed
fields. Positive hydration tests use a complete synthetic fixture; reduced fixtures
are negative tests only. These rules never restrict personal imports.

Synthetic activity averages must stay within these inclusive ranges:

| Measurement | Range |
|---|---|
| Heart rate | 60-200 bpm |
| Running speed | 5-22 km/h |
| Cycling speed | 8-50 km/h |
| Swimming speed | 1-6 km/h |
| Running cadence | 110-220 steps/min |
| Cycling cadence | 40-120 rpm |
| Cycling mean power | 50-350 W |

Missing optional measurements remain null. Any explicitly supplied mean speed
must agree with distance divided by duration within 1%. Best efforts and average
power must originate in the same synthetic power profile.