# Implementation Plan: Heatmap Zoom Preservation on Sport Filter Changes

**Branch**: `058-heatmap-zoom-preservation` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from [spec.md](./spec.md)

## Summary

Preserve the user's current heatmap center and zoom when sport filters change by separating
route/legend recomputation from initial viewport fitting. Keep the current route-filtering,
canvas redraw, and empty-state behavior. Fit route bounds on the first useful render of a
dataset, then allow another initial fit after a new imported dataset is detected.

## Technical Context

**Language/Version**: Browser JavaScript (classic scripts; current project runtime)

**Primary Dependencies**: Existing Leaflet 1.9.4 CDN integration; no new dependency

**Storage**: N/A; viewport state is transient browser-session state

**Testing**: Jest 30, Node environment; focused dashboard behavior test with DOM/Leaflet stubs,
existing heatmap utility tests, inline-script syntax guard, and manual browser validation

**Target Platform**: Modern desktop and mobile browsers serving the static app

**Project Type**: Static browser application with classic-script dashboard orchestration

**Performance Goals**: No new quantitative performance target is introduced. Sport-filter
changes retain the existing route and legend refresh work and do not trigger an additional
bounds fit after the initial fit for the current dataset.

**Constraints**: No bundler/build step or new runtime dependency; keep route data, map view,
and imported personal data local; maintain map view for filter changes on an unchanged dataset;
preserve existing initial fit behavior for a newly imported dataset

**Scale/Scope**: One heatmap dashboard render lifecycle, its focused tests, and feature
validation documentation; no change to other visualization tabs or route aggregation

## Constitution Check

### Before Phase 0

- **I. Static Browser-First Delivery**: PASS — changes remain within the existing browser
	dashboard script and static-app test/doc layout; no build tooling or runtime dependency is
	added.
- **II. Dual-Target Reusable Modules**: PASS — viewport lifecycle is DOM/Leaflet dashboard
	orchestration, so it belongs in the existing classic-script dashboard module; no reusable
	utility API is needed.
- **III. Narrowest-Scope Test-First Verification**: PASS — add focused render behavior tests
	and run heatmap utility and inline-script syntax checks.
- **IV. Faithful Locale-Aware Data Parsing**: PASS — import and sport classification are not
	changed.
- **V. Explicit Privacy & Network Boundaries**: PASS — no changes to import data handling,
	external requests, or analysis API behavior.

No gate violations or unresolved technical clarifications were identified.

### After Phase 1

- **I–V**: PASS — the proposed data is in-memory map lifecycle state only; the UI contract
	adds no network, storage, dependency, or data parsing behavior. Focused and regression
	verification are described in [quickstart.md](./quickstart.md).

## Project Structure

### Documentation (this feature)

```text
specs/058-heatmap-zoom-preservation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
		└── heatmap-view-preservation.md
```

### Source Code (repository root)

```text
src/
├── dashboard-heatmap.js       # Preserve viewport on filter/tab renders; fit on new dataset
└── dashboard-state.js         # Existing importedDataset identity used to detect data change

__tests__/
└── dashboard-heatmap.test.js  # Focused render lifecycle tests using DOM/Leaflet stubs
```

`index.html` remains unchanged unless test setup demonstrates that the established script
syntax guard needs an update; no new scripts or script-order changes are planned.

**Structure Decision**: Keep the behavior in the existing single static browser application.
The heatmap renderer already owns the Leaflet map, route canvas layer, and map rendering.
Use the existing imported dataset lifecycle to detect when an initial bounds fit becomes
eligible again; do not introduce a shared service, storage, or utility module for this
view-only behavior.

## Complexity Tracking

No constitution violations; no additional project or abstraction is required.

