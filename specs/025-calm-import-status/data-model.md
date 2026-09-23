# Data Model: Calm Import Status

## Factual Import Status

The current process stage shown above the progress bar.

| Field | Type | Rules |
|---|---|---|
| `text` | string | Uses the existing import callback text, including counters such as `Extracting GPS tracks (3/8)...`. |
| `percent` | number | Remains the existing bounded progress value and is displayed by the progress bar and percentage label. |
| `isError` | boolean | Preserves the existing error icon and detail behavior. |

The factual status is updated whenever import progress is reported. It does not control the preview timer.

## Preview Cycle

The presentation state for prepared visualization previews.

| Field | Type | Rules |
|---|---|---|
| `index` | number | Selects the currently visible prepared preview and matching message. |
| `intervalMs` | number | Fixed at 5000 milliseconds for this feature. |
| `timerActive` | boolean | Active only while the import modal is processing. |

Rules:

- The current preview remains unchanged for at least 5 seconds.
- Progress callbacks do not reset or accelerate the timer.
- Completion, error, and modal close stop the timer.
- A short import is never delayed to complete a preview cycle.

## Import Detail

The existing black status box content for the detailed current activity or error message. It remains separate from the factual status row and preview message.

## State Transitions

```text
Modal hidden
  -> import started: factual status + preview timer active
  -> progress callback: factual status updated, timer unchanged
  -> completion: final status retained, timer stopped, existing close delay
  -> error: error status/detail retained, timer stopped
  -> modal close: timer stopped
```
