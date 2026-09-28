# UI Contract: Visualization Navigation

## Existing navigation contract

- **Container**: A single `role="tablist"` named “Visualization tabs”.
- **Members**: The existing nine tabs and their IDs, labels, `aria-controls` links, DOM order, destinations, active state, and roving `tabindex` remain unchanged.
- **Activation**: Pointer activation continues to select the same visualization. ArrowLeft/ArrowRight continue to move among tabs. Tab and Shift+Tab use the browser's normal focus order so visitors can leave the tablist and reach the sibling scroll controls.
- **Landing preview**: The existing Workout Time card continues to use its current preview image, descriptive card content, import gate, and `workoutTime` dashboard destination.

## Directional controls

- A horizontal scroll viewport constrains the tablist. A left scroll button and right scroll button are siblings of (not members of) the tablist.
- The right control is available only when tabs are clipped beyond the viewport's right edge. The left control is available only when tabs are clipped beyond its left edge. When all tabs fit, both controls are visually hidden. Their layout slots remain reserved so showing one does not shift the viewport and re-clip a tab just revealed.
- Controls use visible directional symbols `<<` and `>>` and accessible names that state the action, such as “Scroll visualization tabs left” and “Scroll visualization tabs right”.
- Controls are native keyboard-operable buttons in normal page tab order; they do not participate in the tablist's roving-tabindex sequence and do not intercept the tablist's arrow keys.
- Each activation reveals the closest clipped tab in the chosen direction fully, using the minimum required scroll movement. It does not jump to an arbitrary pixel/page increment or skip an intervening tab.
- Scrolling by touch/trackpad and scrolling caused by focused/selected tabs update the same directional availability state as button activation.
- Controls must not cover tab labels. Their appearance and disappearance must not create page-level horizontal overflow.
- Re-evaluate state on scroll and on viewport/content resize. At scroll boundaries or when no overflow exists, no further movement is possible in that direction and its control is hidden or unavailable.

## Compatibility and out of scope

- No tab key, panel ID, tab ordering, chart behavior, import behavior, or dashboard destination changes.
- No data persistence, service/API, network request, or runtime dependency is added.
- This contract defines observable interaction and accessibility behavior, not a required CSS framework or exact visual skin.