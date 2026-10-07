# Implementation Plan: Lifetime Statistics

**Branch**: `050-lifetime-statistics` | **Date**: 2026-10-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/050-lifetime-statistics/spec.md`

## Summary

Add a Lifetime Statistics dashboard tab that summarizes the currently imported activities: total distance, moving time and workout count; per-sport totals; elevation, active days and longest activity milestones; and distinct shoe/bike counts derived from Run/Bike gear labels. The UI does not show gear names. Partial metrics show a generic missing-values note without an available/total activity count. A pure, dual-target utility aggregates the in-memory activity dataset, while a classic dashboard orchestration script renders responsive summary cards and an explicit no-data state. Preserve the current numeric activity fields for existing visualizations and add metric-availability metadata so lifetime totals can distinguish a real zero from missing or invalid distance/time input. Integrate the tab into keyboard navigation and the existing local Share/Export preview/download flow. Country counting is out of scope.

## Technical Context

**Language/Version**: Browser JavaScript (classic scripts; CommonJS-compatible syntax for reusable utility modules); Node.js for Jest.

**Primary Dependencies**: Existing app globals and Tailwind styling; no new runtime dependencies. No chart library is needed for a KPI-and-breakdown summary.

**Storage**: In-memory `processedActivities`; transient render state only. No persistence.

**Testing**: Jest in Node (`npm test`), including pure aggregation tests, import-processing tests, tab navigation, script-order checks and export metadata. Manual browser validation through a static server.

**Target Platform**: Modern desktop and mobile browsers served as a static site.

**Project Type**: Static browser dashboard with CommonJS-testable reusable utilities.

**Performance Goals**: One linear aggregation over the imported dataset; target completion under 1 second for 5,000 activities. No explicit larger-volume service-level target is specified.

**Constraints**: No bundler or build step; no new network requests; preserve numeric `distance`/`duration` fields for existing visualizations; unknown sports remain unclassified; all new tabs need keyboard navigation and tested Share/Export registration; raw personal data remains local.

**Scale/Scope**: One new dashboard tab, one reusable aggregation utility, one dashboard renderer, additive data-availability markers in both activity parsing paths, export/tab wiring, focused tests, and feature documentation. No country totals, new service, external API or persistent state.

## Constitution Check

*Gate: evaluated before research and re-evaluated after design.*

| Principle / constraint | Status | Evidence in this plan |
|---|---|---|
| I. Static browser-first delivery | PASS | Uses current static HTML/classic scripts; no bundler, build step or new dependency. |
| II. Dual-target reusable modules | PASS | Aggregation logic is a pure `src/` utility with CommonJS and `window.*` exports; DOM orchestration remains in a classic dashboard script. |
| III. Test-first verification and Share/Export | PASS | Tab IDs/order, markup, dispatch and keyboard tests are updated together. The export capture target, data/no-data state, title/filename mapping and focused tests are part of the feature. |
| IV. Faithful locale-aware parsing | PASS | Reuses normalized sport/date semantics and preserves German/English parsing plus the duplicate distance-column convention. Additive availability flags preserve existing numeric fields and do not reclassify unknown sports. |
| V. Privacy and network boundaries | PASS | All statistics use the already imported in-memory dataset; no new outbound requests; tests use synthetic data. |
| Dependency boundaries and public APIs | PASS | No API/CLI changes and no new packages. Existing `distance` and `duration` values remain unchanged; new source-availability fields are additive. |

No constitutional violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/050-lifetime-statistics/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── lifetime-statistics-utils.md
│   └── ui-contract.md
└── tasks.md                 # Later phase; not created by planning
```

### Source Code and Tests

```text
index.html                                      # Tab markup and utility/renderer script loading
src/lifetime-statistics-utils.js                # NEW pure aggregation and validation helpers
src/dashboard-lifetime-statistics.js             # NEW DOM rendering / empty-state orchestration
src/dashboard-import.js                         # Add source availability metadata at browser import
src/dashboard-utils.js                          # Keep test-side processing metadata in parity
src/tab-navigation.js                           # Register tab ids/order and accessible switching
src/dashboard-tabs.js                           # Render dispatch and open-tab focus mapping
src/dashboard-export.js                         # Capture target, data flag and export context
src/export-utils.js                             # Tab display title and download filename slug
__tests__/lifetime-statistics-utils.test.js     # NEW deterministic aggregate and edge-case tests
__tests__/lifetime-statistics-dashboard.test.js # NEW renderer state / wiring tests with mocks
__tests__/fixtures/lifetime-statistics.js        # NEW shared synthetic activity fixtures
__tests__/dashboard-import.test.js               # NEW runtime-import availability tests
__tests__/processing.test.js                    # Availability parsing and existing field preservation
__tests__/tab-navigation.test.js                # Tab selection and keyboard-cycle tests
__tests__/index-script-syntax.test.js           # Script order and dashboard wiring assertions
__tests__/export-utils.test.js                  # New title, slug and export metadata behavior
scripts/benchmark-lifetime-statistics.js       # NEW standalone 5,000-activity performance check
```

**Structure Decision**: Extend the existing static dashboard using one pure data utility and one DOM orchestration script. Keep import completeness information additive to existing activity records. Add a dedicated dashboard tab and register it through the existing centralized tab and export flows; do not create another project or service.

## Phase 0: Research

See [research.md](research.md). Research confirms the browser's processed activity object has the needed sport/date/name/equipment/elevation fields, but currently defaults missing distance and moving-time values to numeric zero. The design therefore adds boolean availability metadata while preserving the numeric fields used by existing dashboard tabs. It also records the existing local-calendar-day convention, parser/test-helper parity needs, and full tab/export registration requirements.

## Phase 1: Design and Contracts

- [Data model](data-model.md): current activity input, additive completeness markers, summary/sport aggregate, milestones and validity rules.
- [Aggregation utility contract](contracts/lifetime-statistics-utils.md): input/output shapes, aggregation semantics and export surface.
- [UI contract](contracts/ui-contract.md): tab IDs, content states, responsive summary layout, keyboard behavior and export capture.
- [Quickstart](quickstart.md): focused automated validation and manual static-browser scenarios.

## Constitution Check (Post-Design)

| Gate | Status | Re-evaluation |
|---|---|---|
| Static browser-first | PASS | HTML/classic scripts only; no build or dependency changes. |
| Reusable logic testable in both environments | PASS | Pure CommonJS/`window.*` aggregation utility; UI stays in the dashboard script. |
| Locale and sport semantics | PASS | Existing normalized values and distance-column meaning are retained; missingness metadata is additive; unknown sports are not relabeled. |
| New-tab registration and export | PASS | UI contract enumerates navigation, rendering, no-data, capture-target and filename/title registration, all with focused tests. |
| Privacy and network boundaries | PASS | No country inference, geocoding, API calls or additional data transmission; only imported activities are summarized. |
| Dependency and public API boundaries | PASS | Existing public utility behavior and numeric activity fields are preserved; no API or CLI surface changes. |

No violations remain after design.

## Out of Scope

- Country counts, whether from explicit metadata or geographic lookup.
- Activity deduplication, date-range controls, persisted selection, and year-by-year trends.
- Changing existing visualizations' distance/duration display behavior or redesigning the general CSV import flow.
