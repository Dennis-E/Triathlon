# Quickstart: TrainingPeaks Data Import

## Prerequisites

- Node.js and npm dependencies installed at repository root.
- Serve the static app from the repository root (for example, `python -m http.server`) and open the local page in a modern browser.
- For private manual verification only, use the archives already under `private-data/Training Peaks/workout files/`. Do not copy them into fixtures, logs, screenshots, or version control.

## Focused Automated Validation

Run focused import/data parsing and data-boundary tests:

**Baseline before implementation (2026-10-12)**: `__tests__/zip-importer.test.js` and `__tests__/dashboard-import.test.js` passed (2 suites, 44 tests).

- `npm test -- --runInBand __tests__/zip-importer.test.js`
- `npm test -- --runInBand __tests__/dashboard-import.test.js`
- `npm test -- --runInBand __tests__/analysis-counter.test.js`
- `npm test -- --runInBand __tests__/legal-footer.test.js`
- Add focused test coverage for TrainingPeaks FIT session normalization, multi-ZIP aggregation, transaction-on-failure behavior, duplicate handling, dataset application, and the no-persistence/no-workout-payload boundary.

**Implementation validation (2026-10-12)**: Focused import/dashboard/counter/landing/legal tests passed (5 suites, 142 tests). Full root Jest suite passed (31 suites, 622 tests).

Expected automated checks:

- A TrainingPeaks-shaped ZIP with multiple `.FIT.gz` entries yields all supported sessions in chronological order.
- Files are processed once and sequentially, with progress covering aggregate file counts across multiple archives.
- Gzip/FIT errors identify the archive/file and do not replace an existing imported dataset.
- A FIT file with multiple sport sessions maps each session to its own sport and uses only records within that session's time bounds.
- Timestamped `.GPX.gz` routes attach only when their time range uniquely matches one FIT session; ambiguous routes are omitted, and an available FIT-record route takes precedence.
- Missing distance, duration, heart rate, power, or route data remains unavailable without fabricated zero values.
- Duplicate sessions across overlapping archives are collapsed without removing distinct same-day workouts.
- Existing Strava ZIP import tests continue to pass.
- The analysis-counter POST uses the existing event metadata headers, has no request body, and receives no normalized activities, filenames, routes, or FIT contents.
- A failed or cancelled TrainingPeaks import does not invoke the analysis counter; a successful import invokes it no more than once.
- Code-path review confirms TrainingPeaks activities/routes/power data are not written to `localStorage`, IndexedDB, cookies, Firestore, or another application persistence service.
- German and English privacy-policy copy identifies FIT.GZ/GPX.GZ sources, memory-only workout processing, no workout persistence, and the separate bodyless counter metadata request; it does not claim that local browser storage is used for counter deduplication.
- A corrupt/unreadable FIT/GZIP entry names both archive and entry, aborts the complete multi-ZIP operation, and leaves the previously active dataset unchanged; a successfully parsed session with unsupported sport is skipped and included in the successful import's skipped-activity count.

## Visualisierungs-Prüfmatrix

After importing the supplied sample data, inspect every existing dashboard tab. For each row, verify that it renders without a user-visible error when its required data is available, and otherwise presents the existing empty/unavailable state without treating missing measurements as zero. Mark data prerequisites based on the decoded sample fields; do not assume every FIT export contains every optional field.

| Dashboard | Required normalized data to verify | Expected behavior when required data is unavailable |
|---|---|---|
| Total distance | Activity date, recognized sport, available distance | Exclude unavailable distances from totals; show no-data state if none remain. |
| Pace vs. metrics | Sport, date, available distance and duration; selected optional heart-rate/cadence/elevation metric | Omit points missing the selected metric; show no-data state if no valid points remain. |
| Equipment | Equipment/gear label plus date and selected distance/count/pace metric | Do not invent equipment labels or count unavailable distance/pace; show no-data state if no valid groups remain. |
| Equipment Timeline | Equipment/gear label and activity date; selected distance/activity-count metric | Show no-data state if equipment/date data cannot form timeline entries. |
| Personal Bests | Recognized sport, session distance/duration and/or supported FIT power efforts for configured targets | Omit unsupported targets/metrics; show no-data state if none can be calculated. |
| Heatmap | Session route points with valid latitude/longitude and recognized sport, from FIT records or uniquely matched `.GPX.gz` track timestamps | Show no-route-data state; never substitute zero coordinates or attach an ambiguous route. |
| Distributions | Selected metric among available duration, distance, pace, elevation, or bike power, plus sport/date as required by filters | Exclude unavailable values; show no-data state if the selected metric has no eligible activities. |
| Workout Time | Valid activity start time and available duration | Exclude unavailable duration from time totals; preserve date-only activity counts only where that chart mode supports them. |
| Training Calendar | Valid activity date and recognized sport; duration only for duration-based intensity | Show date/count information where supported; do not assign intensity from a missing duration. |
| Wordcloud | Activity name | Omit blank/missing names; show empty state if no names remain. |
| Pie Charts | Recognized sport and the date/value fields for selected breakdown | Omit entries missing the selected metric; show no-data state if no valid slices remain. |
| Lifetime Statistics | Activity date and recognized sport; each displayed total additionally requires its corresponding available metric | Calculate each total only from available values and present unavailable totals as unavailable rather than zero. |

Run the full root test suite after focused tests pass:

- `npm test -- --runInBand`

## Manual Browser Validation

1. Open the landing page and verify the two import sources and TrainingPeaks export guide are discoverable.
2. Choose TrainingPeaks and select all seven supplied adjacent 12-month exports together; keep the files under `private-data/` and report only aggregate results.
3. Verify visible progress completes; check aggregate activity count, chronological ordering, skipped-activity count, and outcomes for all sports represented in the data.
4. Confirm the status summary identifies TrainingPeaks, all seven selected ZIP archives, the activity total, unsupported/undated-session skips, and unmatched GPX-route count; no workout values or full paths should appear.
	- **Observed in browser (2026-10-12):** 1,826 activities from seven ZIPs; 763 Bike, 791 Run, 272 Swim; 209 unsupported-sport sessions and 63 GPX routes omitted; zero invalid-start sessions. The active dataset had 1,360 route tracks and 540 bike-power activity summaries.
5. Inspect every dashboard row in the visualization matrix above; note per-tab render/empty-state pass/fail and route-match counts without copying personal activity details into reports.
6. Re-import overlapping periods and verify duplicated sessions do not inflate activity counts while separate same-day sessions remain.
7. Use a synthetic valid ZIP containing a corrupt FIT/GZIP entry plus another valid archive; verify a named error appears and the prior dataset remains active. Also test a GPX route that uniquely matches one session and an ambiguous route that must be omitted.
8. Import a known-good Strava export and confirm the existing Strava path remains available.
9. Use browser network inspection to confirm selected archive bytes/workout contents are not sent in requests. Ignore unrelated CDN/API requests; the copy must not claim the whole app is network-free.
10. Confirm the single expected successful-import counter request has no body and contains no activity fields; confirm failed/cancelled imports cause no counter POST.
11. Check browser storage and app/API code paths to verify no TrainingPeaks activity data is persisted; existing Firestore records remain limited to the public count and count-event timestamp.
12. Check the TrainingPeaks export guide against the current provider UI before release and correct any stale labels or steps.

## Dependency and Private-Sample Gate

Completed before implementation on 2026-10-12; details and limitations are recorded in [research.md](research.md):

- JSZip 3.10.1 and fit-file-parser 1.10.0 versions, load origins, licenses, and advisory checks were reviewed; no OSV advisories were found for these versions. Repository `npm audit` does not cover CDN-loaded packages.
- `DecompressionStream('gzip')` is supported in the tested current browser and in modern Chrome/Edge, Firefox, and Safari versions as documented in [research.md](research.md).
- A local private-sample smoke parse succeeded and confirmed FIT session/record output; aggregate structural inspection found seven archives with 2,040 physical FIT.GZ entries and 86 GPX.GZ entries (2,126 physical entries total, no CSV). Duplicate internal paths mean JSZip exposes 2,008 unique FIT paths and 63 unique GPX paths (2,071 unique parser-visible entries); duplicate FIT contents were identical, while conflicting duplicate GPX paths remain optional and are not assumed complete. Only aggregate counts were retained; no workout values, route coordinates, file/entry names, or private archives were copied to the repository.
- No compatibility blocker was found for the sampled archive/current browser. Historical browser/device compatibility beyond the documented baseline is not claimed.
