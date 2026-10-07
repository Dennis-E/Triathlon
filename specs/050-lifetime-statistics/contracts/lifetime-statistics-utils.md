# Utility Contract: Lifetime Statistics

## Module

New reusable module: `src/lifetime-statistics-utils.js`.

- CommonJS export for Node/Jest.
- Browser global bridge: `window.lifetimeStatisticsUtils`.
- Pure calculations: no DOM access, mutation, persistence, time-zone network lookup or external service access.

## Public function

### `aggregateLifetimeStatistics(activities)`

**Input**: Array of normalized activity objects from the current imported dataset. A non-array or empty input is treated as an empty list.

**Output**: A new `LifetimeSummary` as described in [data-model.md](../data-model.md), containing:

- Overall workout count, distance, moving-time and elevation results.
- Per-supported-sport summaries.
- Unique local active-day count.
- Longest activity by valid distance and by valid moving time, or `null` when no valid candidates exist.
- Counts of distinct shoes and bikes represented by imported Run and Bike equipment labels; no labels are returned for display.

**Rules**:

1. Do not mutate input activities or retain results between calls.
2. Count every input record as a workout, including records with missing metrics and unknown sport.
3. Include finite, non-negative metric values. For distance/time, an explicit availability flag of `false` makes the metric unavailable even if the legacy numeric field is `0`. When no boolean flag is supplied, treat a finite, non-negative numeric value as available to support already-normalized inputs and test fixtures.
4. A metric result is `complete`, `partial` or `unavailable` according to its available-value count; unavailable results have `value: null`.
5. Group sport summaries only for `Run`, `Bike`, and `Swim`; unknown sports remain in overall values only.
6. Deduplicate active days by local year/month/day, independent of activity time.
7. For equipment counts, count distinct trimmed labels separately for Run (shoes) and Bike (bikes); reject blank and `-`, `none`, `unknown`, `n/a` placeholders case-insensitively. Do not return individual labels.
8. Resolve longest-activity ties by retaining the first candidate in input order.

## Error behavior

The function returns a correctly shaped empty summary for non-array or empty input; it does not throw for null activity entries or malformed optional values. Invalid metric values are ignored for that metric only.

## Complexity

Expected O(n) time and O(d + e + s) auxiliary space, where `n` is activity count, `d` unique dates, `e` unique gear labels per counted category, and `s` supported sports (at most 3).
