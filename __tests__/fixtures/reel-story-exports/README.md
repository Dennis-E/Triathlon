# Synthetic Reel / Story Fixtures

This directory is reserved for synthetic inputs only. No athlete export or personal media belongs here.

## Regeneration

Serve the repository, open TriAnalytica, and load `generate.js` as a classic script in the local browser test harness. Reuse the app's `ensureJSZipLoaded()` and current `PB_DISTANCES` plus `window.powerPbUtils.POWER_DURATIONS` definitions.

`reelStoryFixtures.createRecipe('sparse' | 'dense', PB_DISTANCES, window.powerPbUtils.POWER_DURATIONS)` builds deterministic CSV inputs and expected references. `createMedia(document)` records an actual MP4 and encodes an actual JPEG from an explicitly synthetic canvas. MP4 encoding is required, not simulated by renaming another container. Recorded video bytes may vary with browser encoder, but selected content, chronology, metrics and expected values are deterministic.

`buildArchive(recipe, JSZip, media)` produces a real Strava-shaped ZIP with activities.csv, media.csv, valid FIT power records, GPX tracks and readable media. Save the generated sparse/dense ZIPs and CSVs here together with expected-values.json. The FIT fixture carries constant power per activity so every configured duration has an independently checkable expected watt value.

When browser downloads are unavailable in the integrated test browser, capture a JSON object with `recipes.sparse` and `recipes.dense` containing `archiveBase64` and `activityCsv`, plus the `expected` synthetic reference object. The local generator accepts either plain JSON or the browser tool's `Result: ` prefix: `node __tests__/fixtures/reel-story-exports/generate.js <local-capture-path>`. It writes only the named fixture outputs, validates their ZIP signatures, and expands the live export/PB definitions into unverified review cases. It refuses to overwrite an already generated matrix, protecting later reviewer results.

For a fixture correction after the matrix exists, append `--fixtures-only` to refresh generated inputs/references without overwriting reviewer rows. Re-import the refreshed files and invalidate any affected image evidence. Synthetic run equipment intentionally includes the recognized Nike classification token so the app's existing brand-based heuristic exposes real Shoes-filter cases; these are fictional review pairs, not real athlete equipment.

For reference-only corrections, run `node __tests__/fixtures/reel-story-exports/generate.js --refresh-references`. This refuses to update references if the saved CSV differs from regenerated input, requiring complete archive regeneration instead. Media order follows the existing newest-first chronological gallery contract with stable ties, and expected-values.json records both the full eligible order and the actual default twelve-item selection.

## Import Recipes

1. Import training-sparse.zip through the normal archive file input. It contains one year, one activity for each configured distance, one-record power histories and one video. For a minimal single-sport/metric case, select the sport/year/activity indicated in the reference recipe.
2. Import training-dense.zip the same way. It contains thirteen years, progressively faster distance sessions, improving elevation/power records, long equipment names, thirteen shoe/bike eras, thirteen power-record milestones and fourteen media references, exercising the existing twelve-item media limit.
3. Load activities-sparse.csv or activities-dense.csv through the existing `importCsvText` pipeline in the local browser harness to check the no-track/no-media availability path; the visible Strava file dialog accepts ZIP, not CSV. FIT power and route/media views are intentionally unavailable for CSV-only imports; use the corresponding ZIP for full-family coverage.
4. Select Media Gallery, choose year 2025, and create an annual recap; then create a collage. Test routes both disabled and enabled. Also use an explicit video-only selection to exercise a sparse still-image export independently of the default twelve-item selection, which already includes this fixture's video.
5. In the local harness, use `beginImportOperation('sample')` to avoid counting test analyses, pass the parsed archive's FIT/GPX/media results to `importCsvText`, and set `sourceType = 'sample'` plus `sampleProvenance = { synthetic: true, label: 'Synthetic sample training data' }` in its `onDatasetPrepared` callback. These Strava-shaped inputs follow the real importer without claiming to be real athlete data. The review manifest must record this setting and the synthetic notice on every exported page.

Expected values belong in expected-values.json and must be compared with the imported data, not inferred from chart labels. Missing generated files, failed real imports, mismatched definitions/reference values, or unreadable media leave T002 incomplete and block image review.