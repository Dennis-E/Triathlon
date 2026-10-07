# Research: Lifetime Statistics

## Activity data and metric completeness

**Decision**: Base the summary on `processedActivities`, which is the current in-memory dashboard dataset. Add boolean source-availability metadata for distance and moving time in both activity-processing paths while retaining their current numeric `distance` and `duration` fields and values. Treat a finite, non-negative raw value (including `0`) as available; a missing, invalid, or negative source value is unavailable. Elevation already uses `null` for missing or invalid input and will be validated as finite and non-negative.

**Rationale**: The browser import currently defaults unavailable distance and duration values to `0`, so summaries alone cannot tell “not recorded” from an actual zero. Changing those established numeric fields could alter many existing charts and personal-best calculations. Additive availability booleans let the new summary report incomplete or unavailable aggregates without changing those existing consumers.

**Alternatives considered**:
- Change `distance`/`duration` to nullable values: rejected because many visualizations rely on their existing numeric behavior and this expands the change substantially.
- Re-read raw CSV rows in the summary: rejected because it duplicates header/unit parsing, couples the view to import format, and risks disagreement with processed activities.
- Treat all numeric zeroes as missing: rejected because a real zero must remain distinguishable from missing source data.

## Existing parser boundaries

**Decision**: Keep all existing distance-unit semantics and sport/date normalization in place; the feature consumes normalized browser activity objects and adds only availability metadata. Test fixtures for aggregate accuracy use explicitly normalized activities and synthetic CSV rows with the established duplicate-distance-column convention.

**Rationale**: The browser parser in `src/dashboard-import.js` is the runtime importer; `src/dashboard-utils.js` provides a separately maintained parser used by Node tests. The latter currently has different assumptions for a single distance column. Changing unit interpretation is outside the lifetime feature and could silently alter existing results. New parser tests should verify availability flags and field preservation without broadening into a unit migration.

**Alternatives considered**:
- Reconcile all CSV parsing behavior in this feature: rejected as an unrelated import-semantics change with wider regression risk.
- Have the summary interpret raw CSV directly: rejected for the coupling and duplicate parsing risks noted above.

## Aggregation semantics

**Decision**: Implement calculations as a pure, linear pass over activities in a new dual-target utility. Count every processed activity as a workout even when a metric is unavailable or its sport is unknown. Include all valid activities in overall distance/time/elevation totals; create sport rows only for normalized `Run`, `Bike`, and `Swim`. Count active days by distinct local calendar date. Calculate longest distance and longest moving-time activities only from valid values.

**Rationale**: This matches the feature’s definition of the imported history, the normalized sport contract, and the existing local-calendar behavior. Keeping overall totals inclusive while limiting sport rows avoids silently discarding valid numeric data for unknown sports.

**Alternatives considered**:
- Exclude unknown sports from all totals: rejected because the sport is unknown but the activity’s numeric measures may still be valid.
- Count activity rows with missing metrics as zero measurements: rejected because that would fabricate completeness and distort averages or totals.
- Count activity records with invalid dates: not possible in the current model because the importer drops rows whose required date cannot be parsed; the visible workout count is over the accepted `processedActivities` dataset.

## Completeness and zero-value presentation

**Decision**: For distance, duration and elevation aggregates, track how many activities have a valid source value. Show the recorded sum if at least one value is available, annotate it as incomplete if some activities lack a valid value, and show unavailable (not zero) if none are available. Per-sport summaries apply the same rule to activities in that sport. A valid zero remains a zero. Workout count and equipment count are counts, not completeness-dependent measurements.

**Rationale**: This directly satisfies the specification’s distinction between unavailable/incomplete source data and an actual zero without making up omitted values.

**Alternatives considered**:
- Hide all totals unless every activity has a value: rejected because valid recorded totals still provide useful information and the spec allows recorded-only totals.
- Display a partial total without marking it: rejected because users could mistake it for a complete lifetime total.

## Equipment identity

**Decision**: Count distinct trimmed, non-empty equipment labels separately for normalized `Run` activities (shoes used) and `Bike` activities (bikes used). Ignore blank labels and recognized placeholder values (`-`, `none`, `unknown`, `n/a`, case-insensitive). Compare remaining labels exactly after trimming and return only the two counts; never display the names.

**Rationale**: The input may contain generic gear labels or identifiers rather than confirmed ownership. Per-sport counts provide the requested shoe and bike totals without exposing names or claiming verified ownership.

**Alternatives considered**:
- Count all equipment labels as bicycles: rejected because Run records commonly contain shoes and generic gear labels.
- Fuzzy-match or case-fold all names: rejected because merging distinct user-provided labels is more misleading than retaining exact trimmed labels.

## Tab and Share/Export integration

**Decision**: Add a new dashboard tab following the existing tab contract and render a responsive summary-card layout rather than a chart. Capture the summary and breakdown together in the established local image-preview/download flow. Add its tab display title and filename slug to export utilities, register data/no-data behavior, and include focused wiring tests.

**Rationale**: This feature consists primarily of scalar lifetime measures; a chart would not improve comprehension. The project constitution requires Share/Export for every new visualization tab. Existing tab navigation and export registration already provide the needed keyboard, capture and no-data patterns.

**Alternatives considered**:
- Add metrics to an existing tab: rejected because the feature is an independent lifetime summary and needs a discoverable entry point.
- Introduce a charting dependency or external export service: rejected as unnecessary and inconsistent with the static/privacy constraints.

## Runtime and verification

**Decision**: Keep the frontend static, use current dependencies only, and run Node/Jest tests for the pure utility, parsing availability, tab registration, script order and export helpers. Manually validate the integrated dashboard and export in a browser served locally using synthetic data.

**Rationale**: The project has no bundler and its Jest environment is Node rather than jsdom. Synthetic fixtures avoid depending on private Strava exports.

**Alternatives considered**:
- Add a browser test framework or backend endpoint: rejected as unnecessary scope and dependency expansion.

## Aggregation performance target

**Decision**: Keep aggregation to one O(n) pass and use completion within one second for 5,000 activities as a planning/validation target, not as a new user-facing service-level promise.

**Rationale**: This is consistent with the adjacent Pie Charts feature plan, which uses the same 5,000-activity / one-second responsiveness target for interactive aggregation. The lifetime summary is calculated once per render and does not need chart animation or repeated filtering.

**Alternatives considered**:
- Add caching, workers or persistent pre-aggregation: rejected because there is no evidence that a single linear pass is insufficient and those mechanisms add complexity.
- Leave performance untested: rejected because the feature summarizes user histories that may contain thousands of records.
