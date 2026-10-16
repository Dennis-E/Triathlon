# UI Contract: Dashboard Keyboard Navigation

This is an internal browser UI contract. The feature adds no public API or network interface.

## Keyboard Behavior

| Focus/context | Key | Required behavior | No-op or preserved behavior |
|---|---|---|---|
| Visualization tab | Right / Tab | Activate and focus the next visualization in tab order, wrapping at the end. | Only when the tab interface is available. |
| Visualization tab | Left / Shift+Tab | Activate and focus the previous visualization in tab order, wrapping at the beginning. | Only when the tab interface is available. |
| Visible, enabled single-choice button group in the active visualization | Down | Select the next displayed choice, wrapping at the end; update the visualization and filter summary. | No eligible focused choice or fewer than two choices: do not change state or show success feedback. |
| Visible, enabled single-choice button group in the active visualization | Up | Select the previous displayed choice, wrapping at the beginning; update the visualization and filter summary. | No eligible focused choice or fewer than two choices: do not change state or show success feedback. |
| Any focus context outside the visualization tab or eligible filter group | Tab / Shift+Tab / Up / Down | Preserve normal browser, modal, and control focus/keyboard behavior. | Dashboard-level navigation does not capture the key. |
| Native select, range, or multi-select checkbox | Up / Down | Preserve the control's established keyboard behavior; do not step another filter group. | No dashboard-level single-choice cycling is applied. |

## Visible Feedback

- Four direction cues correspond to the supported horizontal and vertical actions.
- Only a successful action briefly activates its matching cue; unavailable or no-op input does not indicate success.
- A successful filter change updates the active visualization and its visible filter summary in the same interaction.
- Cues remain secondary, do not obscure chart data or controls, and do not replace keyboard focus indication.
- Feedback starts within 250 ms and clears within 1.5 s; reduced-motion preferences avoid animated blinking while retaining brief static feedback.

## Change and Accessibility Expectations

- Existing Left/Right wraparound remains unchanged.
- Tab and Shift+Tab act as navigation aliases only while a visualization tab has focus; they remain normal focus traversal elsewhere.
- Up/Down changes only the focused eligible filter in the active visualization.
- A handled Up/Down key does not scroll the page. Unhandled keys retain normal behavior.
- Native controls and multi-select checkbox groups preserve their own keyboard semantics.