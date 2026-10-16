# Feature Specification: Viewport-Visible Navigation Cues and Arrow Handling

**Feature Branch**: `061-viewport-navigation-cues`

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "1) the navigation left, right functions well. one change: the symbols are not vertically centered. if the display is long, then the user does not see the symbols. They should always be visible to the user in his current view. 2) the navigation up down arrow is not working. the browser is scrolling up and down when these keys are pressed."

## Clarifications

### Session 2026-10-16

- Q: Wenn eine Visualisierung aktiv ist, aber kein Filterwert Tastaturfokus hat, was sollen Hoch/Runter tun? → A: Den ersten sichtbaren und aktivierten Einzelauswahl-Filter der aktiven Visualisierung in dargestellter Reihenfolge verwenden; dessen aktuellen Wert ändern und den Fokus auf die neue Auswahl setzen.
- Q: Soll Hoch/Runter den ersten Filter nur ändern, wenn der Tastaturfokus auf dem aktiven Visualisierungstab oder innerhalb der aktiven Visualisierung liegt? → A: Den ersten geeigneten Filter ändern, sobald eine Visualisierung aktiv ist, unabhängig vom Tastaturfokus; modale Dialoge und native Steuerelemente behalten ihre eigene Bedienung.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep navigation cues in view (Priority: P1)

As an athlete browsing a long visualization, I want the directional navigation cues to remain visible in my current view, so that I can keep using keyboard navigation without scrolling back to find the arrows.

**Why this priority**: Cues that scroll out of view cannot teach or confirm the available navigation while users inspect long visualizations.

**Independent Test**: With a long visualization open, scroll through its content and verify that all four directional cues remain inside the visible browser area, with the left and right cues vertically centered.

**Acceptance Scenarios**:

1. **Given** a visualization is taller than the browser view, **When** the user scrolls through it, **Then** all four directional cues remain visible in the current view.
2. **Given** the browser view is resized or has a narrow/mobile width, **When** the user scrolls the visualization, **Then** the cues remain within the visible area and do not cover important chart data, labels, or controls.
3. **Given** a directional action is available or unavailable, **When** the user views its cue while scrolling, **Then** its availability state remains distinguishable without moving the cue out of view.

### User Story 2 - Use Up and Down without page scrolling (Priority: P1)

As an athlete navigating a visualization, I want Up and Down to perform the expected filter navigation instead of scrolling the page, so that vertical keyboard navigation works reliably.

**Why this priority**: Page scrolling when the user expects filter navigation makes the keyboard feature appear broken and prevents predictable chart exploration.

**Independent Test**: With a visualization active, use Up and Down in the confirmed keyboard context and verify that the intended filter action occurs, the chart and filter summary update, and the page does not scroll because of a handled key.

**Acceptance Scenarios**:

1. **Given** an eligible filter choice has keyboard focus, **When** the user presses Up or Down, **Then** the focused filter changes in the requested direction, only that filter group changes, and the page does not scroll.
2. **Given** a visualization is active and no eligible filter choice has focus, **When** the user presses Up or Down outside a modal dialog or native control, **Then** the first visible, enabled single-choice filter group in displayed order changes from its current selection and focus moves to the new choice.
3. **Given** an Up/Down press cannot change an eligible filter, **When** the user presses that key, **Then** no unrelated filter changes and no success cue is shown.
4. **Given** a native select, range, or multi-select checkbox has focus, **When** the user presses Up or Down, **Then** the control's established keyboard behavior remains intact.

### Edge Cases

- Cues remain within the visible area at the top, middle, and bottom of a long visualization.
- Cues remain visible when viewport dimensions change while a visualization is active.
- A narrow viewport must not cause cues to overlap each other or obscure essential chart controls.
- With a visualization active and no eligible filter choice focused, Up/Down uses the first visible, enabled single-choice filter group in displayed order, regardless of the current focus location.
- If the active visualization has no eligible filter group, or a native control or modal owns keyboard focus, Up/Down does not change an unrelated filter and preserves that control's or context's normal behavior.
- If no visualization is active, Up/Down retains normal browser behavior.
- A focused filter with no alternative choice must not produce a false success cue.
- Native controls retain their own keyboard behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST keep all four directional navigation cues within the user's current visible browser area while the user scrolls through a long visualization.
- **FR-002**: The left and right cues MUST remain vertically centered in the visible browser area; the up and down cues MUST remain visible and clearly associated with the same navigation cue group.
- **FR-003**: Directional cues MUST remain visible at supported desktop and narrow/mobile viewport sizes and MUST NOT obscure essential chart data, labels, or controls.
- **FR-004**: The system MUST preserve the existing left/right visualization navigation and cue availability behavior while cues remain in view.
- **FR-005**: When Up or Down is handled as filter navigation, the system MUST perform the expected filter action, update the active visualization and filter summary, and prevent page scrolling caused by that key press.
- **FR-006**: When a visualization is active and no eligible filter choice is focused, Up/Down MUST use the first visible, enabled single-choice filter group in displayed order, regardless of the current focus location. It MUST advance or reverse from that group's current selected choice and move focus to the newly selected choice. Modal dialogs and native controls MUST retain their established keyboard behavior.
- **FR-007**: Up/Down navigation MUST NOT change unrelated, hidden, disabled, or inactive-visualization filters, and MUST preserve established native control behavior.
- **FR-008**: An unavailable or unsuccessful Up/Down action MUST NOT show success feedback.

### Key Entities *(include if data is involved)*

- **Directional Cue**: One of four visual indicators for left, right, up, or down navigation, with availability and brief success-feedback states.
- **Visible Browser Area**: The portion of the application currently visible to the user while scrolling or resizing the browser view.
- **Focused Filter Choice**: The eligible selected choice in a visible filter group belonging to the active visualization.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all tested scroll positions of a long visualization, all four cues remain within the visible browser area and the left/right cues remain vertically centered within 24 pixels of the viewport midpoint.
- **SC-002**: In all tested Up/Down sequences performed in the clarified keyboard context, the expected filter action occurs, the active visualization and summary match, and the page scroll position does not change because of the handled key.
- **SC-003**: In all tested narrow and desktop viewport sizes, cues remain visible without obscuring essential chart data, labels, or controls.
- **SC-004**: At least 90% of first-time participants can locate the directional cues while viewing either the top or a scrolled portion of a long visualization.

## Assumptions

- Existing four directional cues and their availability/success states are reused; this feature changes their visibility during scrolling rather than adding new directions.
- Existing left/right key behavior is retained.
- Up/Down changes only one filter group at a time: the focused eligible group when one has focus, otherwise the first visible, enabled single-choice group in displayed order whenever a visualization is active.
- Modal dialogs and native controls retain their established keyboard behavior; when no visualization is active, browser arrow-key behavior is unchanged.
- No new visualization, filter choice, persistence, or network behavior is introduced.