# Research: Keyboard Dashboard Navigation

## Decisions

### Arrow-key ownership
- **Decision**: Keep left/right navigation on the visualization tab buttons. When a supported filter control has focus, up/down changes that control's value; it does not move focus to another filter. Do not intercept arrow keys while focus is outside the dashboard navigation/filter context.
- **Rationale**: The specification's accepted clarification requires the visualization to update directly, and existing left/right tab behavior must remain. Existing native controls already have their own arrow-key behavior that should be preserved where it meets the requirement.
- **Alternatives considered**: Move focus among filters on up/down (rejected by clarification); globally capture all arrow keys (risks breaking sliders, menus, and unrelated browser interactions).

### Control-specific value changes
- **Decision**: Custom discrete single-choice filter groups cycle in their rendered choice order, wrapping at both ends. Native select and range inputs retain their established keyboard stepping and trigger the existing visualization update when their values change; for custom button-based choices, implement value stepping through their established state-change/render pathways and keep focus on the newly selected option. Exclude multi-select checkbox groups from dashboard-level stepping and retain their established checkbox keyboard behavior.
- **Rationale**: Dashboard filters use a mixture of custom button groups, selects, checkboxes, and range sliders. Respecting their semantics avoids losing existing interaction patterns and applies only the requested step behavior to single-choice filters.
- **Alternatives considered**: Convert every filter to a common widget (rejected as a broad redesign); apply every arrow press to all filters simultaneously (would be surprising and incorrect).

### Active filter summary
- **Decision**: Present the current values for the active visualization's applicable filters in a compact, non-interactive summary above its visualization. Update it from the same authoritative filter state used for rendering; do not create a second independently mutable state store.
- **Rationale**: Meets the clarified visibility request and prevents the summary from drifting from the chart.
- **Alternatives considered**: Duplicate selected values in separate summary state (risks stale content); show summaries for inactive visualizations (unnecessary clutter).

### Directional cues and accessibility
- **Decision**: Use non-interactive, hidden-from-assistive-technology directional cues around the active visualization. Flash the cue corresponding to a successful action, keep focus indication on the actual tab/filter, and respect reduced-motion preferences by replacing the blink with a brief non-animated emphasis.
- **Rationale**: The arrows are visual discoverability feedback, not controls; motion must not replace keyboard focus or force animation on users who request reduced motion.
- **Alternatives considered**: Focusable arrow buttons (would add duplicate navigation controls); continuous animation (distracting and contrary to brief feedback).

### Runtime, test, and integration boundaries
- **Decision**: Implement within the existing static frontend, using the existing browser global/CommonJS conventions for reusable logic and dashboard DOM orchestration, with no new dependency or persistent storage. Unit-test pure keyboard/value-step logic in Jest and validate markup/script integration using the repository's existing test patterns.
- **Rationale**: Matches the constitution and current architecture; filter selections are transient dashboard UI state.
- **Alternatives considered**: Add a frontend framework/build step or an external keyboard library (unnecessary and incompatible with project constraints).

## Technical Context Findings

- Current visualization-tab order and left/right wrap logic are in `src/tab-navigation.js`; DOM dispatch and render refresh are in `src/dashboard-tabs.js` and inline dashboard wiring in `index.html`.
- Filters are heterogeneous: custom button groups, `<select>` elements, sliders, and checkboxes. This makes preserving each control's native or existing behavior a core design constraint.
- Root Jest uses the Node environment rather than jsdom. Tests for reusable behavior should inject dependencies or test pure functions; DOM wiring should follow established test patterns.
- This feature adds no visualization tab, external API, saved data, or network behavior.
