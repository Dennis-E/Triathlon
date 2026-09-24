# Research: Workout Time Visualization

## Decision: Preserve the activity start timestamp during import

**Decision**: Extend the normalized activity contract with a valid `startTime` value (or an equivalent timestamp representation) while retaining the existing `date` field for current date-range behavior. Both the browser import path in `src/dashboard-import.js` and the Jest/browser-compatible processing path in `src/dashboard-utils.js` must parse German and English activity timestamps consistently.

**Rationale**: The current German date parsing path can discard the time component, while Workout Time requires the activity start time. Keeping the existing date field preserves current filters and sorting; adding the timestamp avoids changing established consumers.

**Alternatives considered**:
- Reconstruct time from the date string inside the chart renderer — rejected because it duplicates parsing logic and cannot recover a time already discarded during import.
- Replace `date` with a timestamp everywhere — rejected because it expands the change surface and risks existing date-range behavior.

## Decision: Use a fixed two-hour day grouping

**Decision**: Day view uses twelve stable two-hour intervals from `00:00-01:59` through `22:00-23:59`, with midnight assigned to the first interval.

**Rationale**: Twelve groups remain readable on desktop and narrow viewports while still revealing meaningful daily routines. Fixed boundaries make acceptance tests deterministic and avoid a user-configurable bucket model in v1.

**Alternatives considered**:
- One group per hour — rejected for excessive axis density on narrow screens.
- One group per minute — rejected as too granular for a distribution overview.
- Variable data-driven intervals — rejected because the same clock times would move between groups across datasets.

## Decision: Aggregate calendar perspectives at their natural recurring grain

**Decision**: Week view has Monday-Sunday groups; Month view aggregates day numbers 1-31 across all selected months; Year view aggregates January-December across all selected years. All group lists remain in fixed calendar order.

**Rationale**: These views answer recurring-pattern questions, match the clarified Month requirement, and keep the chart shape stable when the selected date range changes.

**Alternatives considered**:
- Chronological date/month-year sequence — rejected because it answers timeline questions rather than recurring day/week/month timing patterns and can create an unbounded x-axis.

## Decision: Reuse existing dashboard filters and export pipeline

**Decision**: Filter by the existing `selectedSportFilter` and date-range bounds before grouping, using the activity's calendar date for inclusion and its preserved `startTime` for grouping. Register the new tab with the existing navigation and export metadata/capture contracts.

**Rationale**: This keeps filter behavior consistent across visualizations, avoids new feature-specific filter state, and preserves the privacy boundary of local in-memory processing.

**Alternatives considered**:
- Add a separate Workout Time date slider — rejected because it would diverge from existing dashboard behavior and create conflicting date state.
- Add an API endpoint for aggregation — rejected because the feature does not need remote data and would violate the local-first scope.

## Decision: Pure grouping utility plus classic dashboard renderer

**Decision**: Add a dual-target `src/workout-time-utils.js` containing timestamp validation, filter application, and deterministic group aggregation. Add `src/dashboard-workout-time.js` for DOM controls, Chart.js lifecycle, empty state, and tab-local selected granularity.

**Rationale**: Pure logic is testable under the repository's Node Jest environment; DOM orchestration follows the existing static browser architecture and avoids putting reusable computation in `index.html`.

**Alternatives considered**:
- Inline all grouping logic in `index.html` — rejected by the dual-target module principle and harder to test.
- Add a new framework or chart dependency — rejected because Chart.js and classic scripts already provide the required behavior.
