# UI Contract: Workout Time Tab

This contract defines the observable IDs, control behavior, and rendering guarantees
for the Workout Time visualization.

## Tab registration

- Tab key: `workoutTime`
- Button ID: `vizTabWorkoutTime`
- Panel ID: `vizPanelWorkoutTime`
- Register the tab in `src/tab-navigation.js` and the matching markup/dispatch paths.
- Keyboard next/previous navigation must include the new tab.

## Controls

| Control | Suggested element ID | Behavior |
|---|---|---|
| Granularity selector | `workoutTimeGranularity` | Exactly one of Day, Week, Month, Year is active; selection recalculates groups. |
| Sport filter | `workoutTimeSportFilter` | Uses All/Run/Bike/Swim semantics and the existing active dashboard sport filter where applicable. |
| Date range | `workoutTimeDateStart`, `workoutTimeDateEnd` | Uses existing inclusive date-range behavior; changing either bound recalculates groups. |
| Export | Existing export control/context for `workoutTime` | Captures the current selected granularity, labels, filters, and chart/empty state. |

## Chart contract

- Canvas ID: `workoutTimeChart`.
- Wrapper ID: `workoutTimeChartWrapper`.
- Empty-state ID: `workoutTimeEmptyState`; visible when no filtered activity has a valid `startTime`, with the chart hidden.
- X-axis: fixed labels for the selected granularity.
- Y-axis: non-negative workout count.
- Each visible group must expose its interval label and count through the existing chart interaction/tooltip pattern.
- Day labels represent fixed two-hour intervals; Week is Monday-Sunday; Month is 1-31; Year is January-December.

## Export contract

- Export title and filename slug must identify Workout Time.
- Export context must identify the selected granularity and active sport/date range.
- Export uses the existing local image-capture flow and does not send activity data to a new service.

## Non-goals

- No user-configurable time interval size.
- No multi-granularity overlay.
- No timeline of individual activity rows.
- No persistence of selected granularity across page reloads unless the existing dashboard already provides that behavior.
