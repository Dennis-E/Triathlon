# UI Contract: Viewport Navigation Cues and Vertical Filter Navigation

This is an internal browser UI contract. No public API or network interface is added.

## Cue Position and Visibility

- Four existing cues represent left, right, up, and down.
- Cues stay within the visible browser area while the user scrolls visualization content or resizes the viewport.
- Left/right cues are vertically centered in the viewport within 24 pixels of its midpoint.
- Up/down cues remain visible near the corresponding viewport edges and remain associated with the same cue group.
- Cues do not obscure essential chart content, labels, or controls; they remain non-interactive and do not replace focus indication.
- Availability state and brief success feedback remain distinguishable; reduced motion disables animation while preserving static feedback.

## Keyboard Behavior

| Focus/context | Key | Required behavior | No-op or preserved behavior |
|---|---|---|---|
| Eligible single-choice button group in the active visualization | Up / Down | Change only that focused group to the previous/next displayed choice, wrapping at either end; update chart and summary; move focus to the selected choice; show the matching cue. | No alternative choice means no change and no success cue. |
| Active visualization; no eligible filter choice focused | Up / Down | Use the first visible, enabled single-choice group in displayed order; change its current choice and move focus to the new choice. | If no eligible group exists, do not change a filter or show a success cue; prevent page scroll while the dashboard is active. |
| Native select, range, or checkbox has focus | Up / Down | Preserve the control's established keyboard behavior. | No dashboard fallback filter selection. |
| Modal dialog owns focus | Up / Down | Preserve modal keyboard behavior. | No dashboard fallback filter selection. |
| No visualization is active | Up / Down | Preserve normal browser behavior. | No dashboard filter selection. |
| Visualization tab | Left / Right | Preserve existing visualization navigation and corresponding cue feedback. | No change to horizontal navigation semantics. |

## State and Feedback

- Only an action that changes a visualization or filter value counts as successful navigation.
- An unavailable or unsuccessful action does not activate a success cue.
- Successful filter changes update the active filter summary in the same interaction.
- Handled dashboard Up/Down input does not scroll the page.