# Research: Data-Source-Aware Visualizations

**Date**: 2026-10-16
**Scope**: Existing import lifecycle, visualization readiness, navigation, export, and test seams.

## Decisions

### Determine availability from renderable model output

- **Decision**: A view is available only when its current data model can produce meaningful, non-empty output from valid loaded data. The qualifying output is view-specific; do not apply one arbitrary activity-count threshold to all views.
- **Rationale**: Strava and TrainingPeaks have different field coverage, while each existing view already has a domain model or renderer that filters invalid/missing values. Model output captures those differences without hard-coding source names.
- **Alternatives considered**: Hide/show views from source labels or field-name presence. Rejected because it would misclassify partially populated data and couple view support to importer identity.

### Recompute visibility after import

- **Decision**: Recalculate visualization visibility when `applyImportedDataset()` applies a completed import, after activities and auxiliary FIT/GPS maps have been assigned. Do not mutate source files, normalized activities, or their values.
- **Rationale**: This is the shared successful-import boundary for Strava CSV and TrainingPeaks ZIP results. A newly imported dataset becomes the one currently displayed; this changes the dashboard's active input, not the imported data itself. Availability is a presentation decision only.
- **Alternatives considered**: Recalculate only on tab activation. Rejected because unavailable tabs would remain in navigation and selected panels could display stale content. Filter or remove unsupported activities from the imported data. Rejected because missing fields should affect only which visualizations are visible, not the dataset.

### Keep navigation and rendering in sync

- **Decision**: Use one ordered list of currently available tabs for visible navigation, keyboard cycling, activation validation, and selected-tab fallback. Preserve the existing canonical order for tabs that remain available; do not alter the imported activity list.
- **Rationale**: `TAB_ORDER` is currently static, and `setVisualizationTab()` accepts any registered tab. Hiding only markup would leave keyboard navigation and programmatic calls able to select unavailable views.
- **Alternatives considered**: Hide buttons in the import handler alone. Rejected because it duplicates state and does not update keyboard cycling or reject stale selections.

## Existing Project Findings

- The app is a static browser application with classic script orchestration and CommonJS + browser-global utility modules; root Jest runs in Node.
- `dashboard-import.js::applyImportedDataset()` sets `processedActivities`, `fitBestEffortsByActivityId`, and `gpsTracksByActivityId`, initializes controls, and renders selected views. It is the shared update boundary.
- `dashboard-tabs.js` dispatches view renderers and opens requested dashboard views. `tab-navigation.js` owns the canonical tab order, IDs, ARIA state, and keyboard cycling.
- There are 12 current tabs: total distance, pace metrics, equipment, equipment timeline, personal bests, heatmap, distributions, workout time, training calendar, wordcloud, pie charts, and lifetime statistics.
- Existing view-model signals include point/entry/bucket/slice/segment counts, calendar activity counts, generated word frequencies, and lifetime summary output. No uniform cross-view readiness contract currently exists.
- The current app displays one imported dataset at a time. A later import becomes the current dashboard input, but the availability feature does not edit or delete either import's activity data and does not add a cross-source merge workflow.
- Existing Share/Export behavior is outside this feature and remains unchanged.

## Test and Validation Approach

- Pure data/model readiness logic should use synthetic activities and remain testable under Node/Jest.
- Use tab-navigation tests for available ordering, wrapping keyboard movement, unavailable activation, ARIA/panel state, and no-ready-view behavior.
- Use import/dashboard harness tests to verify that each newly applied import recalculates availability and resets an unavailable selected tab.
- Add focused view readiness assertions where current models expose non-empty output; do not use personal Strava or TrainingPeaks exports as fixtures.
- Verify that visibility handling does not mutate activity data and does not change existing Share/Export behavior.

## Resolved Unknowns

- No new dependency, build step, persistent storage, server endpoint, or importer format is needed.
- The accepted clarification defines the threshold as enough data for each view's meaningful output. The existing model's valid non-empty result is the practical view-specific predicate; explicit numeric activity thresholds are not warranted by current behavior.
