# Quickstart: Distributions Chart Refinements

## Prerequisites

- Local checkout on branch `019-distributions-refinements`.
- Node.js installed (for running the Jest suite).
- A modern browser for manual verification.

## Setup

```powershell
npm install
npm test
```

## Manual validation (static app)

1. Serve the app from the repo root:

   ```powershell
   python -m http.server
   ```

2. Open `http://localhost:8000` and import/load a dataset that includes Run, Bike,
   and Swim activities, where at least one Run activity's raw CSV row has a non-empty
   average-power/watts value (to exercise User Story 1), and where one metric (e.g.
   Length) has one clear outlier activity among many typical ones (to exercise User
   Story 4).
3. Open the **Distributions** tab.
4. **Power exclusion (User Story 1)**: Select the "Power (Watt)" metric with "All
   Sports". Confirm only Bike activities are counted. Switch the sport filter to
   "Run" or "Swim" and confirm the empty-state message appears (never a chart with
   the previously-leaking Run watts).
5. **Per-sport lines (User Story 2)**: Select "All Sports" and "Line" display mode for
   any metric. Confirm up to three separately colored/labeled lines appear (one per
   sport with qualifying data), aligned on the same x-axis. Switch to a single sport
   and confirm the single-line behavior from `018` is unchanged. Switch to
   "Histogram" and confirm the combined-bar behavior is unchanged.
6. **Axis formatting (User Story 3)**: Check each metric in turn:
   - Duration shows whole minutes or "Xh Ym", never seconds or decimals.
   - Pace shows `mm:ss` plus its unit (e.g. "5:30 min/km" for Run).
   - Elevation gain shows whole meters.
   - Length shows whole or one-decimal kilometers.
   Confirm the same formatting appears in both Histogram and Line modes.
7. **Bucket boundaries and overflow (User Story 4)**: With the outlier dataset from
   step 2, select the metric containing the outlier. Confirm the regular buckets have
   round, human-readable boundaries and that the outlier appears in one final
   "> [boundary]" bucket rather than stretching the regular buckets. Switch to a
   metric/filter combination with no outliers and confirm no overflow bucket appears.

## Automated validation

```powershell
npm test -- distribution-utils
npm test -- index-script-syntax
npm test -- processing
```

Expected: all three suites pass, covering bucket/formatting/outlier logic
(`distribution-utils.test.js`), the inline per-sport-line/formatting contract
(`index-script-syntax.test.js`), and avgWatts exclusion for non-Bike activities
(`processing.test.js`, plus the equivalent inline `processData()` behavior verified
via `index-script-syntax.test.js` or a dedicated assertion).

## Reference

- UI contract: [contracts/distributions-refinements-ui.md](contracts/distributions-refinements-ui.md)
- Data model: [data-model.md](data-model.md)
- Design decisions: [research.md](research.md)
- Base feature this refines: [../018-activity-distributions/spec.md](../018-activity-distributions/spec.md)
