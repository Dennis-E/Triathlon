# UI Contract: Calm Import Status

## Modal Order

The active import modal must present these regions in order:

1. One stable main headline.
2. One factual import-status row showing the current stage, including GPS extraction counters when applicable.
3. The progress label, percentage, and progress bar.
4. The prepared visualization preview and calm rotating message.
5. The black detail box for the current detailed activity or error information.

The factual status row must be visually separate from the preview message and black detail box.

## Timing Contract

- The first preview is visible immediately when import begins.
- The next preview/message pair appears no sooner than 5000 milliseconds later.
- Frequent factual progress updates do not restart the 5000-millisecond timer.
- Completion, error, and modal close stop future preview changes.
- Import completion is never delayed by the timer.

## Responsive and Error Contract

- The factual status row remains readable above the progress bar on desktop and mobile widths.
- Long GPS extraction status text may wrap without overlapping the progress bar.
- Error details remain available in the black detail box while the factual status row shows the error state.
