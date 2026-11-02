# Sample Data Interface Contract

## Static asset interface

`GET ./sample-data/silicon-valley-training.json` is the sole required runtime sample fetch. It must return a successful HTTP response containing the complete version-1 JSON payload described in [data-model.md](../data-model.md). Serve it from the application's origin; no credentials, user workout content, external routing calls, or tracking payload are sent by this loader. No custom API endpoint is introduced.

Non-success HTTP status, invalid JSON, unsupported version, or failed required invariants is a load failure. Do not retry endlessly, commit partial data, or reinterpret absent optional values as zeros. An explicit visitor retry starts a new operation after failure. The browser may cache the public resource normally; active hydrated objects are not persisted.

## Reusable utility interface

New `src/sample-data-utils.js` exports the same object through CommonJS and `window.sampleDataUtils`, avoiding duplicate top-level names in classic-script scope.

| Function | Contract |
|---|---|
| `validateSamplePayload(payload)` | Pure synchronous validation of structure, sample-only physiological bounds, associations, and full year/month/sport/track/effort/equipment coverage; returns the validated payload or throws a descriptive validation error. Does not mutate input, DOM, or globals. |
| `hydrateSampleDataset(payload)` | Validates and returns a fresh runtime dataset with local Date objects and activity-keyed GPS/effort associations, preserving the existing envelope and units. No fetch, activation, counter call, or personal-file access. |
| `routeDistanceKm(points)` | Pure length calculation for ordered latitude/longitude points; used by offline acquisition/generation and consistency checks. |

Fetch and import-experience statistic accumulation stay in dashboard-import orchestration. Test fetch via injection or the existing VM sandbox, not by adding DOM dependencies to this utility.

Both exported validation/hydration paths enforce the full minimum history without a bypass option. Positive hydration tests must use a complete synthetic fixture; reduced fixtures are rejection cases. Sample-specific physiological bounds are defined in the data model and must not restrict personal imports.

## Deterministic generation interface

Maintainer commands, from repository root after implementation:

```powershell
node scripts/generate-sample-data.js
node scripts/generate-sample-data.js --check
```

The default command regenerates only the public sample payload from committed curated inputs and fixed generation configuration. `--check` computes the expected result, validates it, and exits nonzero on any byte difference or invalid invariant without writing. Neither command reads private files, requires secrets, or contacts a routing service. An unsupported argument fails explicitly. Output reports activity/year/sport/track counts and payload bytes for audit.

## Provenance and legal gate

Curated route sources must be licensed for the chosen redistribution and modification. Preserve required notices, source attribution, and access-verification evidence in `sample-data/README.md` and route metadata. Verify current permitted swimming locations before publishing. This design does not assert that any specific route has already passed those checks.

## Compatibility

Do not change existing CSV header semantics, supported sport normalization, GPX parsing, dashboard dataset `kind`, or personal-import entry signatures. Optional operation context is passed through existing options/dependency objects. No sample-only dataset may depend on `private-data` or `test-data` content.