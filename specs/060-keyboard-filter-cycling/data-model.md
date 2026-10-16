# Data Model: Keyboard Navigation for Visualization Filters

This feature adds no persisted or imported data. The following entities describe transient dashboard state and interaction constraints.

## Visualization

- **Identity**: Existing visualization tab identifier and its associated panel.
- **Order**: Position in the current visualization tab sequence.
- **State**: Active or inactive; only the active panel may respond to filter navigation.
- **Transitions**: Left/Right and Tab/Shift+Tab select adjacent visualizations with wraparound in their respective directions.

## Filter Group

- **Identity**: A filter group belonging to a visualization panel.
- **Eligibility**: The group is visible, enabled, belongs to the active panel, and contains the focused single-choice button.
- **Choices**: Enabled choices in their displayed order, with exactly one selected choice for keyboard cycling.
- **State transition**: Up selects the previous choice; Down selects the next choice; both wrap at either end when at least two choices are available.
- **Isolation rule**: A transition changes only the focused eligible group. Other, hidden, disabled, native, multi-select, and inactive-panel controls are not changed by dashboard-level stepping.
- **No-op conditions**: No eligible focused group, fewer than two available choices, or invalid selection state. A no-op does not trigger success feedback.

## Directional Cue

- **Identity**: One of the four existing direction cues: left, right, up, or down.
- **Availability**: Whether the corresponding action can be performed in the current focus context.
- **Feedback state**: Inactive or briefly active following a successful matching keyboard action.
- **Timing**: Feedback begins within 250 ms and returns to inactive within 1.5 s. Repeated successful actions retrigger the matching cue.
- **Accessibility/visibility**: Cues are non-interactive, visually secondary, and do not replace focus indication or cover chart content.

## Persistence

None. Active tab, focused control, selected filter values, cue availability, and blink state remain ordinary in-memory UI state and are not stored across reloads.