# Data Model: Viewport-Visible Navigation Cues and Arrow Handling

This feature introduces no persisted or imported data. Its state is transient browser-interface state.

## Active Visualization

- **Identity**: Existing selected visualization tab and associated panel.
- **Availability**: Keyboard fallback applies only while a dashboard visualization is active and visible.
- **State**: Active or inactive; modal and native-control focus can take precedence over dashboard key handling.

## Filter Group

- **Identity**: Existing single-choice filter group within a visualization panel.
- **Eligibility**: Visible, enabled, belongs to the active panel, has at least two enabled choices, and has a valid selected choice.
- **Selection**: The current selected choice and choices in displayed order.
- **Target selection**: Up selects the previous choice; Down selects the next choice; cycling wraps at either end.
- **Target group**: The currently focused eligible filter group, or when none is focused, the first eligible group in displayed order in the active visualization.
- **Transition effects**: Update the active visualization and filter summary, move focus to the new choice, prevent dashboard-page scroll for handled input, and activate only the matching cue.
- **No-op**: No active visualization, modal/native control owns keyboard input, or no eligible group/alternative exists. No unrelated filter changes or success cue occurs.

## Directional Cue

- **Identity**: Existing left, right, up, or down cue.
- **Position**: Relative to the visible browser viewport, not chart scroll position; left/right are vertically centered and all cues remain within viewport bounds.
- **State**: Available/unavailable plus inactive/brief success feedback.
- **Accessibility**: Non-interactive, hidden from assistive technology when decorative, and must not replace keyboard focus indication.
- **Timing**: Feedback begins within 250 ms and clears within 1.5 s; reduced-motion settings suppress animated blinking.

## Persistence

None. Active visualization, filter selection, and cue state remain in memory and are not stored across reloads.