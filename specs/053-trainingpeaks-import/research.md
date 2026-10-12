# Research: TrainingPeaks Data Import

**Feature**: [TrainingPeaks Data Import](spec.md)

## Findings and Decisions

### 1. Actual TrainingPeaks archive shape

**Decision**: Treat the supplied TrainingPeaks exports as ZIP collections of gzip-compressed FIT workouts and optional gzip-compressed GPX route tracks, not as Strava-style archives with a master activities CSV.

**Evidence**: The seven supplied local archives contain 2,126 physical file entries in total: 2,040 `.FIT.gz` workouts and 86 `.GPX.gz` routes, approximately 104.7 MB compressed; none contains a CSV. All 86 `.GPX.gz` entries decompress to GPX XML with trackpoints and time elements. Only three route names share an exact path stem with a FIT entry, so filename-only matching is inadequate. The per-archive physical file counts are 90, 374, 111, 292, 352, 475, and 432. ZIP duplicate-name inspection found 8 FIT path groups with 32 extra entries, all identical content, and 13 GPX path groups with 23 extra entries whose contents differ. JSZip exposes one value per internal path; therefore the FIT collisions are safe redundant copies, while GPX is treated as optional enrichment and ambiguous/unmatchable routes are omitted rather than guessed. The runtime importer sees 2,008 unique FIT paths and 63 unique GPX paths. Inspection reported aggregate counts only; no personal activity fields, names, route coordinates, or private archive contents were copied into this artifact.

**Rationale**: Requiring `activities.csv` would reject the real supplied exports. FIT contents provide activity/session summary metadata and recorded measurements; timestamped GPX companions provide route geometry and must be matched to sessions by time, not by filename alone.

**Alternatives considered**: Reusing the Strava ZIP parser as-is was rejected because it requires `activities.csv` and paths mapped by Strava activity IDs. Ignoring GPX.GZ was rejected because the supplied exports include route data and heatmap visualization depends on routes. Matching GPX solely by identical file stem was rejected because only a small minority of supplied routes share a stem with FIT files. Converting exports before import was rejected because the request is direct multi-ZIP import.

### 1a. GPX-to-FIT route association

**Decision**: Parse timestamps along with coordinates from `.GPX.gz` trackpoints. Attach a GPX route only when its track time range identifies exactly one supported FIT session; if no session or multiple sessions are plausible, omit the route without affecting the normalized workout. Prefer the FIT record route when both sources yield route points for the same session. JSZip collapses duplicate internal paths to one entry; conflicting GPX duplicates remain optional and are never assumed to be complete.

**Rationale**: The supplied routes are time-stamped but generally do not share filenames with FIT workouts. Timestamp-based association preserves route coverage while avoiding attaching a route to the wrong workout or multisport segment.

**Alternatives considered**: Pairing by filename is insufficient in the supplied sample; guessing the nearest workout without a bounded/unique match risks false route attribution.

### 2. FIT parsing and activity summaries

**Decision**: Reuse the existing browser FIT parser dependency pinned at `fit-file-parser@1.10.0`, configured in list mode, and consume session, lap, and record message collections. Extend the internal parsing result as needed while preserving existing exported helper behavior used by Strava and tests.

**Evidence**: The currently pinned parser documentation describes `mode: 'list'` as exposing independent collections for sessions, laps, records, and related messages. The application's current `parseFitRecords()` intentionally returns only `data.records`, which suffices for Strava GPS/power enrichment but not for synthesizing complete TrainingPeaks activities.

**Rationale**: FIT session messages can supply start time, sport, elapsed/timer duration, distance, and aggregate metrics; FIT records can supply GPS traces and detailed samples for the existing power-best-effort calculations. This avoids inventing a second parser dependency.

**Alternatives considered**: Guessing activity types/durations from filenames was rejected; filenames contain timestamps but are not a reliable source for all metrics or sport. Adding an API or remote conversion service was rejected because the application is browser-first and raw workout files must stay local.

### 3. Shared normalized activity representation

**Decision**: Convert each usable FIT session into the existing normalized activity shape and publish it through the same import-dataset application path used by CSV imports. Keep absent measurements unavailable (`null` or the established availability flags), and map only known sport values to `Run`, `Bike`, or `Swim`.

**Rationale**: Existing dashboards consume normalized activities rather than provider ZIP structures. Reusing that boundary provides broad visualization support and keeps source-specific ZIP parsing outside dashboard renderers.

**Alternatives considered**: Adding TrainingPeaks-specific branches to individual visualizations was rejected as duplicative and likely to create inconsistent metric semantics. Treating missing values as zero was rejected because it biases totals and chart axes.

### 4. Multiple archives, transaction and deduplication

**Decision**: Validate the selected ZIPs as one import operation, process archives and their FIT entries sequentially, aggregate progress across all entries, sort normalized activities chronologically, and do not apply any result if an archive is invalid or any contained FIT/GZIP entry fails to read or parse. Report the failing archive and entry. Successfully parsed sessions with unsupported sports are skipped and included in a visible skipped-activity count; they do not fail the archive. Deduplicate repeated source-file/session identities, with a stable session fingerprint as a fallback for exports that rename identical sessions.

**Rationale**: Sequential parsing bounds peak memory for histories with hundreds of FIT files, matching the largest supplied sample archive (475 entries). All-or-nothing import avoids presenting a misleading partial history. Stable identity plus a carefully scoped fingerprint handles overlapping date-range exports.

**Alternatives considered**: Parallel parsing was rejected because it would inflate memory and responsiveness risk. Silently skipping a corrupt FIT entry was rejected because it would misrepresent an incomplete archive as complete. Rejecting a valid FIT session solely because its sport is not supported was also rejected; skip and report that session without misclassification. Deduplicating by date alone was rejected because legitimate same-day workouts are common.

### 5. Multi-session FIT files

**Decision**: Preserve session-level sport boundaries when a FIT file contains multiple sessions; represent each supported session as a normalized activity segment with a unique import identity, using only records inside that session's time bounds for its route and detailed metrics.

**Rationale**: A FIT activity can contain multiple sport sessions (for example, multisport). The existing dashboard model supports one sport per activity; session-level representation prevents a bike segment from being mislabeled as a swim and matches existing sport-filter expectations.

**Alternatives considered**: Assigning one sport to the whole file was rejected because it loses multisport detail and risks sport misclassification. Combining the whole file's distance/duration into each session was rejected because it double counts.

### 6. Browser privacy and CDN behavior

**Decision**: Keep archive reads, decompression, FIT parsing, normalization, and deduplication on-device. Continue precise wording that the selected files are processed locally without promising that the entire app is network-free; existing CDN dependencies and unrelated app requests are outside this import feature.

**Rationale**: This meets the explicit file privacy requirement while respecting the existing application architecture and constitution's network-boundary wording.

### 7. TrainingPeaks export instructions

**Decision**: Provide a distinct, user-facing TrainingPeaks export guide alongside the existing Strava guide. Explain that each ZIP covers up to 12 months and that users should select all relevant period ZIPs together. Verify the precise current TrainingPeaks navigation and export labels against the provider UI immediately before release; do not hard-code an unverified sequence into this plan.

**Rationale**: Export screens can change, and the supplied artifacts establish the archive shape and period limit but do not establish the user's current menu labels or exact click sequence.

**Alternatives considered**: Reusing Strava export instructions was rejected because it would be incorrect for TrainingPeaks. Guessing current UI labels was rejected as brittle and potentially misleading.

### 8. Dependency and real-file compatibility gate

**Decision**: Reuse only the existing pinned JSZip 3.10.1 and `fit-file-parser@1.10.0` runtime dependencies plus the browser's native `DecompressionStream`; add no package or CDN dependency unless the audit documents why the current stack cannot parse the supplied samples. Before feature implementation, review dependency source/version pinning, license, known security advisories, browser support, and parse at least one supplied `.FIT.gz` entry locally. Record aggregate pass/fail and parser-shape findings only; do not expose workout values or copy private files into tests/repository.

**Rationale**: The feature changes the import format and depends on interpreting actual FIT sessions, not just recognizing ZIP entry names. Existing unit-test mocks cannot establish compatibility with provider/device-produced FIT files or runtime availability of gzip decompression.

**Alternatives considered**: Adding a newer parser without proving a gap in the existing parser was rejected to avoid unnecessary dependency surface and supply-chain risk. Committing personal FIT files as test fixtures was rejected for privacy; deterministic unit coverage will use synthetic parser results.

**Audit result (2026-10-12)**: The importer loads JSZip 3.10.1 from cdnjs (`https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`, registry metadata license `MIT OR GPL-3.0-or-later`) and `fit-file-parser@1.10.0` from esm.sh (npm registry metadata license `MIT`). OSV version queries returned no advisories for either exact version. `npm audit --omit=dev` reported zero vulnerabilities in the repository's installed production dependency tree; this command does **not** include those CDN-loaded packages, so the separate OSV checks were performed. The browser's GZIP `DecompressionStream` is a native platform feature; MDN reports support for GZIP in Chrome/Edge 80+, Firefox 113+, and Safari 16.4+. In the available Windows VS Code browser (Chrome 148 / Electron 42), a private-local FIT.GZ smoke parse succeeded: the selected ZIP contained 416 file entries, the FIT.GZ entry decompressed to 54,699 bytes, and fit-file-parser returned 1 session and 339 records. Separately, all 86 GPX.GZ files across the supplied seven archives decompressed with valid GPX trackpoints and time elements. Only aggregate counts and parser collection/field names were inspected; no workout values, route coordinates, file names, or private archive contents were retained. This confirms compatibility for the sampled archive and current browser, not every historical browser/device combination.

### 9. Persistence and analysis-counter boundary

**Decision**: Keep TrainingPeaks activities, routes, and derived power data exclusively in active-session memory. Do not add a database, browser persistence, or activity payload to the existing analysis counter. Preserve the current Firestore contract: aggregate count in `metrics/analyses` and event timestamp metadata in `analysisEvents`; a successful TrainingPeaks import may trigger one existing count event using its current headers and no request body.

**Rationale**: The current application has no workout database; Firestore is isolated to aggregate analysis counting. An explicit no-persistence/data-flow invariant prevents the source integration from accidentally broadening that boundary.

**Alternatives considered**: Persisting normalized activities to Firestore, browser storage, or an API was rejected as outside scope and contrary to local-only workout handling.

## Validation Notes

- Use synthetic FIT parser/decompression dependencies for deterministic unit tests; do not check in the supplied personal ZIP exports.
- If manual verification uses the private samples, keep the files under `private-data/` and report aggregate outcomes only.
- Validate at least one standard workout and one multi-session or missing-metric case, as available from synthetic FIT parser output.
- Verify Strava regression behavior using the existing synthetic/fixture test coverage.
- Before implementation, verify the existing dependency versions, source, license/security notices, browser GZIP support, and actual parser compatibility with a locally read private sample; report only aggregate findings.
- Assert the analysis counter receives no request body/workout fields and that failed imports do not trigger it; inspect the app/API data path to confirm no workout fields reach Firestore and no activity storage was introduced.
