# Data Model: Remove Filter Summary Bubbles

This feature introduces no persistent data model. It changes only how existing filter selections are presented.

## Filter Selection

- **Purpose**: Represents the selected value or values in an existing visualization filter control.
- **Attributes**: Control-defined available choices; current selected value or values; owning visualization.
- **Relationship**: The selected value determines which data the owning visualization displays.
- **Validation**: Selection remains limited to the values already offered by its control; this feature does not change allowed values.
- **State changes**: Existing user actions can change a selection and refresh the visualization. The selection remains visible at its control.

## Filter Summary Bubble

- **Purpose**: Redundant presentation of a filter label and its selected value in a separate row above a visualization.
- **Lifecycle**: Removed from the dashboard presentation. It is not stored and has no remaining state transitions.

## Invariants

- Removing a summary bubble does not clear or modify the associated filter selection.
- Filter changes continue to update their owning visualization.
- No empty summary row remains when a visualization has no filters or no active selection.
