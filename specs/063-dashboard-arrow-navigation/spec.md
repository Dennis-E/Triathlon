# Feature Specification: Independent Dashboard and View Arrow Navigation

**Feature Branch**: Not created; specification-only workflow

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "the navigation via arrows needs a different logic. left / right should always work to switch through dashboards. up and down should iterate through views of a specific visualization. implement a logic where this will iterate through all combinations of filters one after the other and does NOT deactivate the left / right arrow functionality"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch Dashboards from Any View (Priority: P1)

As an athlete exploring my activities, I want Left and Right to switch dashboards regardless of which filter I last used, so that changing a view never traps me in filter navigation.

**Why this priority**: Reliable dashboard switching is the explicit constraint of this change and must not depend on returning focus to a dashboard tab.

**Independent Test**: Open a dashboard, use a filter, press Down, and then press Right without clicking or moving focus. Verify that the next available dashboard opens. Repeat with Left from the chart, dashboard tab, filter buttons, closed choice controls, and binary filter controls.

**Acceptance Scenarios**:

1. **Given** the dashboard workspace is active, **When** Right or Left is pressed from a dashboard tab, visualization content, or filter control, **Then** the next or previous available dashboard opens with exactly one switch per key press.
2. **Given** Up or Down has just changed a filter combination and focus remains within the visualization, **When** Right or Left is pressed, **Then** dashboard switching works without an extra click, Tab press, or focus reset.
3. **Given** the first or last available dashboard is active, **When** Left or Right moves beyond that end, **Then** navigation wraps to the last or first available dashboard respectively, skipping unavailable dashboards.
4. **Given** focus is in a text-editing field or an open modal dialog, **When** an arrow is pressed, **Then** the field or dialog retains its own keyboard interaction and the underlying dashboard does not change.

---

### User Story 2 - Explore Every Filter Combination (Priority: P1)

As an athlete viewing a visualization, I want Down and Up to move through all its available filter combinations in a predictable order, so that I can explore every view without selecting each filter separately.

**Why this priority**: Changing only one focused filter cannot expose every combination and is the behavior this feature replaces.

**Independent Test**: Use a visualization with two independent filters: sport choices All and Run, and period choices Year, Month, and Week. Starting at All/Year, verify that Down visits All/Month, All/Week, Run/Year, Run/Month, Run/Week, and All/Year. Verify that Up traverses the exact reverse sequence.

**Acceptance Scenarios**:

1. **Given** several eligible filters are visible, **When** Down is pressed, **Then** the next complete filter combination is selected, the active visualization stays the same, and its content reflects that combination.
2. **Given** filters and choices have a displayed order, **When** combinations are traversed, **Then** the last filter advances fastest, carrying into preceding filters when its choices wrap, and every valid combination appears exactly once before repetition.
3. **Given** a combination reached with Down, **When** Up is pressed before filter availability changes, **Then** the immediately preceding combination is restored; the same inverse behavior applies to Up followed by Down.
4. **Given** the first or last valid combination is selected, **When** Up or Down crosses that boundary, **Then** navigation wraps to the last or first valid combination respectively without switching dashboards.
5. **Given** the user manually selects any valid combination, **When** Up or Down is pressed, **Then** traversal continues from that selection rather than restarting or changing only the focused filter.
6. **Given** dashboard navigation owns the keyboard context, **When** Up or Down changes a view, **Then** the page does not scroll and a focused choice control does not independently apply a second filter change.

---

### User Story 3 - Handle Changing Choices and Show Accurate Cues (Priority: P2)

As an athlete browsing different visualizations, I want navigation to reflect the choices currently available and its directional cues to match actual actions, so that sparse data and filter changes do not make the controls misleading.

**Why this priority**: Combinations can change when data or dependent filters change, and feedback must not imply that navigation stopped merely because focus moved.

**Independent Test**: Exercise a dashboard with a dependent filter, a valid empty-result view, and a dashboard with no alternative combinations. Verify correct traversal, horizontal availability, and successful-action feedback in each case.

**Acceptance Scenarios**:

1. **Given** a filter choice changes which other choices are available, **When** Up or Down is pressed, **Then** traversal uses currently valid complete combinations and never leaves an invalid selection visible as the resulting view.
2. **Given** a valid selectable combination produces no activities, **When** traversal reaches it, **Then** the existing no-data view is shown and the user can continue in either direction or immediately switch dashboards.
3. **Given** the active visualization has no eligible filters or only one valid combination, **When** Up or Down is pressed, **Then** no view change or success feedback occurs, and Left/Right remains usable.
4. **Given** a successful dashboard or view change, **When** it occurs, **Then** only the corresponding directional cue briefly signals success; filter focus alone does not disable horizontal cues.
5. **Given** multiple dashboards are available, **When** focus moves between their tabs, content, and supported filter controls, **Then** horizontal cues continue to indicate that dashboard switching is available.

### Edge Cases

- With no available dashboards, arrow navigation performs no action. With one available dashboard, Left/Right does not claim a successful switch.
- A filter with one permitted choice contributes a fixed value; hidden, disabled, or inactive-dashboard filters are not independently cycled.
- Finite binary filters include both permitted states; finite multi-selection filters include every permitted selection, respecting existing selection constraints.
- Invalid combinations are excluded, but valid combinations with no results remain reachable.
- If choices change after a new import or a dependent selection, the next step uses the current valid selection and available combinations rather than a stale traversal position. Existing filter defaults resolve selections that are no longer valid before navigation resumes.
- Returning to a dashboard resumes from its current filter selections under the existing dashboard-state behavior; no separate keyboard-only selection is introduced.
- Rapid alternating horizontal and vertical inputs must not allow a previous dashboard's delayed update to change the newly active dashboard's selections or content.
- Arrow shortcuts do not intercept text editing, open modal dialogs, expanded native choice popups, or explicit native editing of continuous numeric controls. Dashboard shortcuts resume when that interaction closes or focus leaves it.
- Outside the active dashboard workspace, existing browser keyboard behavior remains unchanged. Within the workspace, Up/Down is reserved for view navigation, including a no-op when no alternative view exists.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Within the active dashboard workspace, Left and Right MUST select the previous and next available dashboard in existing dashboard order, regardless of focus on tabs, visualization content, or eligible filter controls, subject only to the editing and dialog exceptions in FR-010.
- **FR-002**: Dashboard navigation MUST wrap at both ends, skip unavailable dashboards, and perform no successful switch when fewer than two dashboards are available.
- **FR-003**: Up and Down MUST navigate the previous and next valid complete combination of eligible filters for the active visualization, without switching dashboards or requiring focus on a specific filter group.
- **FR-004**: Eligible filters MUST include the active visualization's visible, enabled filters with finite permitted selections, including single-choice, binary, and constrained multi-selection filters. Hidden, disabled, inactive-dashboard, free-text, and continuous-value controls MUST NOT be enumerated.
- **FR-005**: Combination order MUST follow the displayed filter order and each filter's displayed choice order, with the last filter varying fastest. Binary choices MUST order unselected before selected. Multi-selection choices MUST order their unselected/selected states by displayed option order, with the last option varying fastest, omitting prohibited selections. The traversal MUST cover every valid combination exactly once before wrapping and Up MUST reverse Down.
- **FR-006**: Navigation MUST start from current filter selections, including manually chosen selections, and MUST use current permitted combinations when available choices change. Existing default selections MUST resolve any invalid current selection before the next step.
- **FR-007**: Each accepted vertical key press MUST produce one resulting filter combination and a visualization consistent with it, without a second native filter step or page scroll. Vertical navigation with no alternative combination MUST leave the view unchanged without scrolling the workspace.
- **FR-008**: A vertical change, focus movement to a filter, or re-render MUST NOT disable subsequent Left/Right navigation. Each arrow key press MUST trigger at most one navigation action, and delayed results from previous navigation MUST NOT overwrite the currently selected dashboard or view.
- **FR-009**: Valid empty-result combinations MUST remain in the traversal and use existing no-data presentation; unavailable or invalid combinations MUST be excluded. Filters belonging to other dashboards MUST remain unchanged.
- **FR-010**: Text-editing fields, open modal dialogs, expanded native choice popups, and native editing of continuous numeric controls MUST retain their own arrow-key behavior without changing the underlying dashboard. Closed finite-choice and binary filter controls MUST NOT block dashboard navigation. Existing Tab and Shift+Tab behavior MUST remain unchanged, and shortcuts MUST NOT act outside the active dashboard workspace.
- **FR-011**: Directional cue availability MUST reflect possible dashboard and combination changes rather than tab or filter focus. Only successful actions MUST trigger their matching cue, with no success indication for no-op actions. Existing cue placement and unobstructed chart presentation MUST be preserved.
- **FR-012**: The feature MUST refine existing navigation only, preserving existing visualizations, filter meanings, data processing, and Share/Export behavior without adding filter-summary bubbles or new controls.

### Key Entities

- **Dashboard**: An available visualization workspace with an ordered position, its own filters, and its existing current selections.
- **Filter Dimension**: A visible, enabled finite set of permitted selections affecting the active visualization, with a defined display order and possible dependencies on other selections.
- **View Combination**: One valid complete selection across the eligible filter dimensions, including combinations whose result contains no activities.
- **Navigation Context**: The active workspace and focus state that determine whether dashboard shortcuts or an editing interaction owns arrow input.
- **Directional Cue**: An existing indicator showing whether an arrow action is available and briefly confirming a successful change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested eligible focus contexts, Left/Right selects the expected dashboard on the first key press, including immediately after Up/Down, without additional focus movement.
- **SC-002**: For two independent filters with two and three choices, six Down presses visit all six combinations exactly once and return to the starting combination; six Up presses do the same in reverse. This holds from every starting combination.
- **SC-003**: In every tested unchanged choice set, Down followed by Up and Up followed by Down restore the starting combination. Cases with dependent choices, binary filters, and constrained multi-selection filters visit all and only valid combinations before repeating.
- **SC-004**: In all tested handled vertical actions, the page scroll position remains unchanged, exactly one resulting combination is selected, and no other dashboard's filters change. All tested excluded editing and dialog interactions retain their established behavior.
- **SC-005**: For a synthetic dataset of 1,000 activities and up to 100 valid combinations, at least 95% of arrow actions show the selected dashboard or updated view within one second of the key press.
- **SC-006**: Successful-action cue feedback begins within 250 milliseconds and ends within 1.5 seconds in all tested cases; no-op actions show no success feedback and horizontal availability remains accurate after vertical navigation.
- **SC-007**: Across a complete pass through available dashboards, users can switch dashboard, explore its views, and switch again using only arrow keys, without a keyboard trap, unintended dashboard change, or additional focus-restoring action.

## Assumptions

- The request is about keyboard arrow navigation, not the tab-strip scrolling buttons. Dashboard and visualization refer to the same existing top-level tabs.
- This specification intentionally supersedes the focused-filter-only Up/Down behavior and its clarification in feature 060-keyboard-filter-cycling. Left/Right is workspace-wide rather than restricted to focused dashboard tabs.
- Down means next, Up means previous, and both axes wrap. Display order provides the default combination order; the last filter changes fastest.
- All combinations means permitted combinations of existing finite filter selections, not arbitrary text, unbounded numeric values, chart zoom states, export settings, or newly introduced filters. Finite year or equipment selectors are included when available.
- Expanded choice popups and editing contexts temporarily own arrows to preserve usable input. Closing or leaving them restores workspace navigation immediately.
- Existing dashboard availability, filter defaults and dependencies, data/no-data rendering, and directional cues supply the behavior this feature coordinates. Existing filter-state retention is preserved; no cross-session persistence is added.
- No new visualization tab is introduced, so the existing Share/Export flow remains unchanged and no exception to the project's export requirement is needed.