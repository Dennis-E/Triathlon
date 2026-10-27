# Data Model: Pace-Ansichten verfeinern

This feature introduces no persisted or imported entities. The following in-memory view state defines the behavior to preserve and validate.

## Pace View State

- **Current dataset**: The imported activity collection to which the selection applies.
- **Sport**: The active sport filter: Run, Bike, or Swim.
- **Metric**: The active Pace-vs-Metrics measurement.
- **Date range**: The currently selected activity date interval.
- **Disabled years**: Calendar years explicitly unchecked by the athlete. A year not in this set is enabled.
- **Trend-line visibility**: Independent on/off state for regression lines.

### State rules

- A change to sport, metric, or date range MUST NOT clear disabled years.
- A year without qualified points in the current view MUST retain its prior state while absent.
- A newly available year MUST be enabled unless it was already disabled in the current dataset.
- A new import MUST reset the disabled-year set and trend-line visibility using the existing import reset behavior.
- The year selection MUST NOT be shared with other dashboard visualizations.

## Year Legend Entry

- **Year**: Calendar year represented by chart datasets.
- **Color**: Existing dataset color used to identify that year's points and trend line.
- **Enabled state**: Checkbox state controlling that year's point and trend-line visibility.

The legend entry is rendered only when its year has qualified points for the active view. Missing years remain represented in the state but do not require a visible checkbox until data for that year is available again.
