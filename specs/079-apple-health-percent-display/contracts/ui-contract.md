# UI Contract: Apple Health Import Progress

## Scope

This contract covers the numeric percentage label displayed while an Apple Health import is in progress. It does not cover completion summaries, diagnostics, stage wording, other import sources, or the progress indicator's numeric value.

## Observable Behavior

- A numeric Apple Health progress value is displayed as the nearest whole percentage followed by `%`.
- The label contains no fractional digits, including at the 0% and 100% boundaries.
- The progress indication continues to represent the existing bounded, unrounded numeric value.
- A stage-only update retains the last displayed numeric percentage.
- Strava and TrainingPeaks percentage labels retain their existing formatting.

## Verification Cases

| Input/state | Expected visible label | Other observable behavior |
| --- | --- | --- |
| Apple Health progress 0 | `0%` | Indicator remains at the existing bounded value |
| Apple Health progress 42.375 | `42%` | Indicator remains based on 42.375 |
| Apple Health progress 42.5 | `43%` | Indicator remains based on 42.5 |
| Apple Health progress 100 | `100%` | Indicator remains at the existing bounded value |
| Apple Health stage-only update | Previous percentage remains | Stage text updates as before |
| Non-Apple Health fractional progress | Existing presentation | No source behavior change |