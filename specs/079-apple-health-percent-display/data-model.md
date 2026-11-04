# Data Model: Apple Health Progress Percentage Display

## Scope

This feature introduces no persisted entities and does not change imported activity data. It changes only the transient representation of Apple Health import progress in the UI.

## Transient Progress State

| Value | Meaning | Invariant |
| --- | --- | --- |
| Reported progress | Numeric progress supplied by the active import operation | Remains unchanged by display formatting |
| Bounded progress | Existing progress value constrained to the supported 0-100 range | Continues to drive the progress indication without whole-number rounding |
| Displayed percentage | Human-readable Apple Health progress label | Nearest whole percentage followed by `%`, with no decimal places |
| Stage text | Current import activity description | A stage-only update retains the existing numeric progress display |

## Relationships And State Changes

- A numeric Apple Health progress update supplies the reported value, updates the existing bounded progress indication, and produces a rounded label.
- A non-numeric or stage-only update does not replace the previously displayed progress percentage.
- Other import sources retain their existing progress label formatting.
- Formatting the label does not modify activity records, import results, or progress calculations.