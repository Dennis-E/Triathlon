# Research: Training Calendar View

## Decision: Add a pure dual-target calendar utility

**Decision**: Add `src/training-calendar-utils.js` with pure functions for available-year discovery, activity filtering, local-date day keys, daily aggregation, intensity levels, and the Monday-first calendar grid. Export the functions through CommonJS and `window.trainingCalendarUtils`.

**Rationale**: Calendar grouping and intensity calculation are reusable business logic and must be testable in Jest's Node environment. This follows the established `workout-time-utils.js`, `heatmap-utils.js`, and constitution Principle II patterns.

**Alternatives considered**:
- Put all aggregation inside `index.html` — rejected because it would make the core behavior difficult to test and would violate the repository's reusable-module convention.
- Use a browser-only date or DOM library — rejected because the project has no bundler and the existing utilities already provide compatible date handling.

## Decision: Preserve unknown sports as an explicit `Other` view category

**Decision**: Do not change the existing parser's strict sport normalization. For this visualization only, activities whose normalized sport is not `Run`, `Bike`, or `Swim` are represented as `Other` and can be filtered explicitly. The original activity remains unchanged.

**Rationale**: This satisfies the clarification while avoiding silent reassignment of an unknown sport to a supported sport. It also keeps the calendar complete when an import contains additional activity types.

**Alternatives considered**:
- Drop unknown activities — rejected because the user explicitly requested an `Other` category and dropping them would make the calendar incomplete.
- Merge unknown activities into Run, Bike, or Swim — rejected by the constitution's data-integrity rule.

## Decision: Use deterministic daily metric fallback

**Decision**: For each day, sum all valid durations when at least one duration is available. If the day has no valid duration, sum valid distances. If neither duration nor distance is available, use the unit count. A daily aggregate retains separate duration, distance, unit count, and sport totals for details.

**Rationale**: The clarified priority is preserved while missing values remain visible and are never fabricated. The fallback is deterministic for sparse imports and can be asserted with unit tests.

**Alternatives considered**:
- Mix duration, distance, and count in one weighted score — rejected because the result would be difficult for athletes to interpret and validate.
- Treat missing values as zero in a universal duration sum — rejected because it would understate days with partial data.

## Decision: Five relative intensity levels use equal-width positive-value bins

**Decision**: Build five levels from the positive daily metric range of the current year and sport filter. A single positive value receives the highest level; otherwise equal-width bins span the observed minimum through maximum. Empty days are level zero.

**Rationale**: Equal-width bins are simple, explainable, stable, and match the requested heatmap metaphor. The legend can describe the levels without exposing implementation details.

**Alternatives considered**:
- Quantile bins — rejected for v1 because repeated values and small datasets can produce uneven or unintuitive thresholds.
- A fixed global scale across all years — rejected because it would make sparse years appear empty and would reduce within-year pattern recognition.

## Decision: Monday-first, local-date, full-year grid

**Decision**: Render every calendar day for the selected local calendar year in Monday-first week columns, including leading and trailing empty cells needed to align the year. Display only years present in the imported dataset, with the selected year defaulting to the latest available year.

**Rationale**: Monday-first matches the project's German audience and existing workout-time grouping. A full-year grid preserves the visual meaning of pauses and makes every day addressable.

**Alternatives considered**:
- Sunday-first GitHub-style ordering — rejected for consistency with the existing application's Monday-first convention.
- Render only weeks containing activities — rejected because it hides inactivity and makes year-to-year comparison harder.

## Decision: Keep controls and rendering in dashboard orchestration

**Decision**: Add `src/dashboard-training-calendar.js` for DOM event handlers and rendering, and keep markup in `index.html`. Register the tab in `src/tab-navigation.js`. The utility owns no DOM state.

**Rationale**: This matches the repository's split between reusable calculation modules and classic dashboard scripts, while preserving static-browser delivery and injectable-document tests for tab navigation.

**Alternatives considered**:
- Introduce a component framework or bundler — rejected by Constitution Principle I.
- Add the calendar to an existing chart renderer — rejected because the heatmap grid has different layout and interaction requirements from Chart.js charts.
