# Implementation Plan: TrainingPeaks Data Import

**Branch**: `053-trainingpeaks-import` | **Date**: 2026-10-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/053-trainingpeaks-import/spec.md`

## Summary

Add TrainingPeaks as a distinct browser-local import source alongside Strava. The seven supplied TrainingPeaks exports contain 2,126 physical entries, including duplicate ZIP paths; JSZip exposes 2,008 unique `.FIT.gz` workouts and 63 unique `.GPX.gz` routes (about 104.7 MB compressed across physical archive entries), with no activities CSV. The importer must decode FIT session summaries and records, normalize supported sport sessions into the shared dashboard activity model, merge multiple 12-month archives, preserve session-level GPS/power enrichment, and associate GPX routes only when their timestamps uniquely identify a FIT session. Keep Strava's current CSV-based import unchanged. Update the landing page and provide source-specific TrainingPeaks export instructions.

## Technical Context

**Language/Version**: JavaScript ES2020+; static browser app; Node-compatible modules for Jest.

**Primary Dependencies**: Existing JSZip 3.10.1 CDN loader; existing `fit-file-parser@1.10.0` loaded via esm.sh; browser `DecompressionStream` for gzip; Papa Parse and existing dashboard/import-experience utilities. No new service or package is planned. Before implementation, verify exact version/source pinning, license/security status, supported browser APIs, and FIT/GZIP compatibility with the supplied private samples; record findings in [research.md](research.md).

**Storage**: No workout-data storage is added. ZIP bytes and decoded workout data remain in browser memory during the active import/session only; no browser persistence, server upload, or database writes for workouts. Existing Firestore usage is limited to the public aggregate analysis count (`metrics/analyses`) and count-event metadata (`analysisEvents.createdAt`); this feature must not pass workout fields to that counter request or alter its schema/behavior.

**Testing**: Root Jest in Node environment; focused `__tests__/zip-importer.test.js`, `__tests__/dashboard-import.test.js`, plus focused landing-page/import tests as appropriate. Full root suite after narrow tests.

**Target Platform**: Modern desktop/mobile browser served as a static app; ES modules/CDN dependencies require network access as today, but the user-selected workout archives are parsed locally.

**Project Type**: Single static browser app with CommonJS/browser-global reusable utilities and classic-script dashboard orchestration.

**Performance Goals**: Process all seven supplied archives (2,071 unique ZIP paths; 2,008 FIT.GZ and 63 GPX.GZ entries, approximately 104.7 MB physical compressed archive data) without synchronous all-at-once parsing; provide aggregate progress across selected archives; process one archive/file at a time and release decompressed buffers promptly.

**Constraints**: Preserve Strava behavior and current shared activity fields; do not commit private sample archives; support optional/missing FIT metrics without fabricated values; unknown sports must not be silently classified; no bundler/build step; no changes to the analysis API.

**Scale/Scope**: Two source-specific landing/import paths; one TrainingPeaks import operation can select multiple ZIPs. Current private samples include seven annual exports, 2,071 unique FIT/GPX paths, and 2,126 physical entries before duplicate paths are collapsed by JSZip. No new visualization tabs or cross-provider combined dataset.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Static Browser-First Delivery**: PASS. UI and importer remain compatible with the existing static app and CDN dependency approach; no build tool or server required.
- **Dual-Target Reusable Modules**: PASS. FIT/ZIP normalization belongs in a reusable `src/` module that keeps CommonJS exports and the browser global bridge. DOM orchestration remains in the existing dashboard scripts.
- **Narrowest-Scope Test-First Verification**: PASS. Focused importer and dashboard import tests are planned before the root suite. No visualization tab is added.
- **Faithful Locale-Aware Data Parsing**: PASS with feature-specific care. Preserve existing Strava CSV semantics; map FIT sport values explicitly to Run/Bike/Swim, retain unknown as unknown, and retain missing values as unavailable.
- **Explicit Privacy & Network Boundaries**: PASS. Archive bytes and personal workout content remain local and out of version control; landing copy distinguishes local processing from other app network requests. No analysis API changes.
- **Repository/dependency boundaries**: PASS. Work stays in the root static app and root Jest suite; no API or CLI dependencies.

**Gate result**: PASS. No constitution exception or complexity justification is required.

## Design Decisions

1. **Separate provider pipelines, shared result boundary**: preserve the current Strava `activities.csv` importer; add TrainingPeaks FIT-archive processing and convert its output into the existing normalized dataset/application flow.
2. **Session-based extraction**: use FIT session messages for summary fields and records bounded by each session's time window for tracks and detail metrics. One multisport FIT file may contribute several sport-specific dashboard activities. Decompress `.GPX.gz` route files and attach a route only when its timestamp interval unambiguously matches one FIT session across all selected archives; leave ambiguous route data unattached.
3. **Transactional multi-ZIP import**: validate and process every selected archive and every contained FIT/GZIP workout entry before replacing the active dataset. If an archive or entry is invalid, report both archive and entry names and leave current dashboard state untouched; successfully parsed sessions with unsupported sports are skipped and counted, not misclassified.
4. **Bounded processing**: process archives and FIT entries one at a time, retaining normalized result data but releasing each raw/decompressed FIT buffer after extraction; report current file and aggregate processed/total counts.
5. **Duplicate handling**: deduplicate identical archive-entry/session identities, then use a conservative metadata fingerprint for renamed duplicate sessions; do not deduplicate solely by calendar date.
6. **Conditional metrics**: preserve optional metrics as unavailable and keep visualizations functional where their prerequisites exist; skip unsupported sports with a visible summary count. Validate all twelve current dashboard tabs against the metric prerequisites and empty/unavailable-state outcomes in [quickstart.md](quickstart.md). No source-specific assumptions are added to chart renderers.
7. **Instructions**: add TrainingPeaks-specific guidance; verify exact export UI steps against the live provider flow before release. Avoid claims that the whole application is network-free.
8. **Dependency and data-boundary gates**: before US1 implementation, audit the existing archive/FIT/GZIP dependencies and their versions, provenance, license/security status, and browser compatibility; parse at least one supplied private FIT.GZ sample locally using aggregate-only reporting. Separately verify that the Firestore counter remains count/event metadata only, that the import sends no workout payload, and that no workout data is persisted in browser storage or Firestore.

## Project Structure

### Documentation (this feature)

```text
specs/053-trainingpeaks-import/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── trainingpeaks-import.md
├── checklists/
│   └── requirements.md
└── tasks.md             # generated by /speckit-tasks, not this plan
```

### Source Code (repository root)

```text
index.html                      # source choice, landing-page copy and import help entry
src/
├── dashboard-import.js         # choose provider, multiple-file flow, progress/errors, dataset application
├── zip-importer.js             # preserve Strava pipeline; add multi-archive FIT session import
├── dashboard-utils.js          # shared normalized-activity assumptions only if needed
└── power-pb-utils.js           # reuse existing power calculations; no expected feature changes
docs/
└── trainingpeaks-export-how-to.html  # source-specific export guide
__tests__/
├── zip-importer.test.js        # FIT session parsing, archive aggregation, progress, failure, dedupe
├── dashboard-import.test.js    # provider selection and dataset application
└── index-script-syntax.test.js # preserve classic script syntax and script wiring, as relevant
```

**Structure Decision**: Single project, matching the existing static frontend and root Jest setup. Reuse `src/zip-importer.js` for archive/FIT I/O and the existing dashboard importer for orchestration; keep source-specific documentation under `docs/`. Tests must use synthetic FIT parser/decompression dependencies and must not require committing private archives.

## Risks and Mitigations

- **FIT session field variation across devices/providers**: test session summaries from representative synthetic parser output; omit unavailable optional fields and report files with no usable sessions.
- **Multisport session boundaries**: enforce session time-window selection and sport per session; test multiple sessions in one FIT file to prevent swim/bike misclassification and duplicated totals.
- **Large history memory use**: sequential extraction; avoid retaining decompressed FIT payloads and full raw archives beyond JSZip's needed in-memory representation; publish progress across total entries.
- **False duplicate matches**: prefer exact source file/session identity; use a narrowly defined timestamp+sport+duration+distance fallback and test same-day distinct sessions.
- **Provider export UI changes**: verify precise labels and steps before release; keep the guide focused on durable concepts and 12-month/multiple-archive behavior.

## Complexity Tracking

No constitution violations. Complexity tracking is not applicable.
