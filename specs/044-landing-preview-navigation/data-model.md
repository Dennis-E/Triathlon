# Data Model: Landing Preview and Navigation

This feature introduces no persisted or domain data. The navigation state is transient presentation state derived from rendered tab geometry.

## Entities

### Visualization Tab

- **Identity**: Existing stable visualization key and matching button/panel IDs from `TAB_ORDER`, `TAB_BUTTON_IDS`, and `TAB_PANEL_IDS`.
- **Label**: Existing user-facing tab text; labels may have variable widths.
- **Position**: DOM order in the existing tablist; order and identities remain unchanged.
- **Relationships**: Each tab retains its existing panel relationship through `aria-controls`.
- **Validation**: Exactly the existing tabs participate in tab selection; directional controls are not tab entities and are not children of the `role="tablist"`.

### Navigation Viewport State

Derived at runtime; never persisted.

- **Has overflow**: True when the tablist content width exceeds the visible viewport width.
- **Scroll offset**: Current horizontal scroll position of the viewport.
- **Start available**: True when the offset is greater than the start tolerance and earlier tab content can be revealed.
- **End available**: True when the viewport's right edge is before the tablist content end by more than the end tolerance.
- **Next reveal target**: Closest partially or fully clipped tab in the activated direction. The target is brought fully into view with the smallest required movement, clamped to the viewport's scroll range.

## State Transitions

1. **Measure** after initial layout and whenever the viewport/content size changes. If there is no overflow, both controls are hidden and the viewport is at its start.
2. **Scroll right/left** when a directional button is activated; bring the nearest clipped target tab fully into view, then re-measure.
3. **Native scroll** from touch, trackpad, or other browser interaction updates the offset and directional-control visibility.
4. **Resize/content reflow** re-measures overflow and bounds. If content now fits, hide both controls and keep all tabs visible.
5. **Tab activation or keyboard focus movement** preserves existing selection behavior and ensures the active/focused tab is brought into view when necessary.

No training activities, equipment, user identity, or remote records are read or changed by this state model.