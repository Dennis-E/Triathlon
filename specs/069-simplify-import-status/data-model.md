# Data Model: Simplify Import Status

This feature introduces no persisted data or changes to imported activity records. The status is transient presentation state derived from the current import source and lifecycle state.

## Import Completion Status

| Attribute | Meaning | Constraint |
|-----------|---------|------------|
| `source` | Origin of the current imported history | Strava or TrainingPeaks |
| `state` | Import lifecycle state represented by the status | In progress, success, or failure |
| `displayText` | User-visible text for the current status | On success, exactly the source label; progress and failure keep their existing detail |

## Source Label Rules

| Source | Successful display text |
|--------|-------------------------|
| Strava | `Imported Strava history` |
| TrainingPeaks | `Imported TrainingPeaks history` |

Activity totals, archive counts, and media diagnostics are not attributes of the success status. No source files, activity entities, or persistence rules change.