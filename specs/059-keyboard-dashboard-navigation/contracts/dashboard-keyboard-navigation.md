# UI Contract: Dashboard Keyboard Navigation

This is an internal browser UI contract; the feature adds no public network/API endpoint.

## Keyboard behavior

| Focus/context | Key | Required behavior | No-op conditions |
|---|---|---|---|
| Visualization tab | Left / Right | Activate and focus the previous/next visualization tab in the current circular tab order. | Only if the tab interface is unavailable. |
| Eligible custom discrete single-choice filter group in the active view | Up / Down | Select previous/next choice in visible order, wrapping at either end; run the existing filter update and visualization refresh; focus follows the newly selected custom button choice. | Control is disabled/hidden, inactive, or cannot change value. |
| Native select/range or multi-select checkbox | Up / Down | Preserve the control's established native/semantic keyboard behavior; do not additionally step an unrelated setting. | Normal control semantics do not produce a value change. |
| Any other focus context | Arrow keys | Do not capture or alter unrelated browser/page interaction. | Always, except existing visualization-tab behavior when focus is on a tab. |

## Visible feedback

- The active view's filter summary appears above its visualization and reflects all current applicable filter values.
- Four small, non-interactive arrow cues are located around the visualization region; cues are hidden from assistive technology.
- A cue briefly emphasizes only after its corresponding action succeeds. A failed/no-op key press does not show success feedback.
- Cues never replace native focus indication or cover chart content, labels, or controls. Reduced-motion settings suppress animated blinking while retaining a brief static emphasis.

## Change and accessibility expectations

- Left/right retains the current wraparound behavior.
- Up/down must not change a filter other than the focused eligible control, nor activate a different visualization.
- Control values, derived summary, and rendered visualization remain synchronized through the existing filter-update pathways.
- No keyboard listener may prevent default for unrelated controls or focus contexts.
