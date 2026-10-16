# Data Model: Data-Source-Aware Visualizations

This feature adds no persisted entities. It derives transient visualization availability from the currently loaded in-memory dataset and each existing view's renderable model output.

## Loaded Activity Set

Represents the activities currently displayed by the dashboard after a successful import. A later import may become the current dashboard input; applying availability rules never mutates imported source files, activity records, or values.

| Attribute | Meaning | Validation / lifecycle |
|---|---|---|
| `activities` | Normalized activities from the current import | May contain fields absent or invalid for individual views; use only values accepted by the relevant view model. Treat as read-only for this feature. |
| `fitBestEffortsByActivityId` | Optional FIT-derived best-effort data keyed to activities | Empty or missing map means no FIT-derived data is available. Read only for readiness. |
| `gpsTracksByActivityId` | Optional GPS tracks keyed to activities | Tracks are usable only if they produce valid route geometry. Read only for readiness. |
| `sourceLabel` | Human-readable label for the import source | Informational only; must not determine view availability. |

## Visualization Readiness

A transient result for one registered visualization, recalculated from the loaded activity set.

| Attribute | Meaning | Validation |
|---|---|---|
| `tabKey` | Existing canonical visualization key | Must be present in the registered tab order. |
| `available` | Whether the view-specific minimum data requirement is met | True only when the view can produce meaningful, non-empty output from valid loaded data. |
| `renderableOutput` | Model-derived signal used for the decision, such as points, entries, buckets, route segments, slices, or summary content | Derived from existing view models; no synthetic/default values count as data. |

The ordered available-tab list is derived by filtering the canonical tab order with each readiness result. It is not persisted and may be empty.

## View-Specific Readiness Signals

| Tab | Candidate valid output signal |
|---|---|
| `totalDistance` | Non-empty dated distance aggregation for the current loaded activities |
| `paceMetrics` | At least one valid pace/metric point |
| `equipment` | At least one valid equipment aggregation entry for a supported equipment metric |
| `equipmentTimeline` | At least one valid equipment timeline row/activity |
| `personalBests` | At least one computed PB record, not merely an eligible sport |
| `heatmap` | At least one valid route segment after route validation |
| `distributions` | At least one non-empty bucket for an available distribution metric |
| `workoutTime` | At least one valid dated workout-time point |
| `trainingCalendar` | At least one activity in the calendar model |
| `wordcloud` | At least one ranked word from activity titles |
| `pieCharts` | At least one non-empty, positive-value slice for a supported grouping |
| `lifetimeStatistics` | A summary with at least one meaningful rendered statistic; missing optional fields remain unavailable within the summary |

These signals follow the actual model output and may be refined during implementation where a view's model has a more precise renderability check. They do not define arbitrary global minimum counts.

## State Transitions

1. A successful import becomes the current dashboard input, including its activity set and auxiliary maps; import values are not changed by this feature.
2. Readiness is recomputed for all registered views from the current import.
3. Navigation visibility, active panel, and keyboard sequence are synchronized to the new readiness set; activity rows and values remain intact.
4. If the previous selection is no longer available, the first available tab in canonical order becomes active.
5. If the available set is empty, no visualization is selected and a stable no-visualizations state is shown; non-visualization navigation remains usable.
