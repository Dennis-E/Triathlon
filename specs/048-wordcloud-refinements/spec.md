# Feature Specification: Wordcloud Sharing and Controls

**Feature Branch**: `048-wordcloud-refinements`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "The Wordcloud looks good so far, but the Share button is not implemented. Add it to this visualization, and require it on every new visualization. Exclude one-letter words, show a more generous number of words by default, and let users collapse the ranked-word list to a narrow strip on the right to maximize the wordcloud area. Start with the list expanded."

## Clarifications

### Session 2026-10-05

- Q: Wenn du die Wortliste einklappst, soll sie beim Zurückkehren zum Wordcloud-Tab eingeklappt bleiben, bis du sie selbst wieder öffnest? → A: Beim erneuten Öffnen des Tabs wieder ausgeklappt starten.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Share the current Wordcloud (Priority: P1)

As an athlete, I want a Share/Export action on Wordcloud that produces a local, downloadable image of the current cloud, so that I can share my training-title insights without taking a screenshot manually.

**Why this priority**: The visualization is already available, but without its expected sharing action users cannot conveniently keep or share its result.

**Independent Test**: Import or supply activities with known titles, open Wordcloud, alter the word selection, activate Share/Export, and verify that the preview represents the currently displayed cloud and can be downloaded locally.

**Acceptance Scenarios**:

1. **Given** Wordcloud has rendered eligible terms, **When** the user activates its Share/Export action, **Then** the existing shareable-image preview flow opens for the currently displayed cloud with a meaningful Wordcloud title.
2. **Given** the preview is open, **When** the user downloads it, **Then** the image is saved locally and matches the cloud currently displayed; when the user closes the preview, no image is saved.
3. **Given** there are no eligible words or the cloud renderer is unavailable, **When** the user requests sharing, **Then** the app explains that there is no shareable cloud rather than creating a blank or misleading image.
4. **Given** an image is prepared, **When** sharing/export is used, **Then** neither workout titles nor the generated image are uploaded to a server by this action.

### User Story 2 - Focus the cloud on meaningful words (Priority: P1)

As an athlete, I want one-letter tokens excluded and more of the frequent words shown initially, so that the first view is more informative and less crowded by unhelpful short tokens.

**Why this priority**: Single-letter tokens add little context, and the current default of 30 words leaves substantial space unused for many users.

**Independent Test**: Use titles containing one-letter tokens and at least 50 eligible multi-letter words; open Wordcloud and verify single-letter tokens are absent and the initial list includes 50 terms, subject to the number of available terms.

**Acceptance Scenarios**:

1. **Given** titles contain one-letter tokens, including letters with German diacritics, **When** word frequencies are calculated, **Then** those tokens are excluded from the ranked set and wordcloud.
2. **Given** at least 50 eligible words exist, **When** the user first opens Wordcloud, **Then** the slider starts at 50 and the ranked list shows the top 50 words.
3. **Given** fewer than 50 eligible words exist, **When** the user first opens Wordcloud, **Then** all eligible words are shown and the displayed count does not claim unavailable terms.

### User Story 3 - Maximize the wordcloud area (Priority: P2)

As an athlete, I want the ranked-word list to start open but be collapsible into a narrow strip on the right, so that I can reclaim space for the wordcloud while retaining a way to restore the list.

**Why this priority**: The ranked list is useful for selection, but it takes space away from the primary visualization, especially on smaller screens.

**Independent Test**: Open Wordcloud and confirm the list is expanded. Collapse it, verify that the wordcloud gains the freed space while a compact accessible control remains, then expand it and verify the same ranked terms and checkbox selections are restored.

**Acceptance Scenarios**:

1. **Given** Wordcloud is opened, **When** its initial layout appears, **Then** the ranked-word list is expanded.
2. **Given** the ranked list is expanded on a wide viewport, **When** the user collapses it, **Then** it becomes a narrow vertical strip at the right edge of the visualization area and the cloud uses the reclaimed width.
3. **Given** the list is collapsed, **When** the user activates its expand control, **Then** the full list returns with the same selected/unselected terms and counts.
4. **Given** the user is on a narrow viewport, **When** the list is collapsed, **Then** it becomes a compact horizontal control rather than an unusable vertical rail, and the cloud remains within the viewport without horizontal page scrolling.
5. **Given** the list is collapsed or expanded, **When** a keyboard or screen-reader user reaches its toggle, **Then** the control has an accessible name, communicates expanded state, and works with keyboard activation.

### Edge Cases

- A title consisting only of one-letter tokens, punctuation, digits, and excluded function words produces no eligible terms and uses the existing empty state.
- If only 1–49 eligible words exist, the effective default display is limited to those available words while the slider still communicates its configured default consistently.
- The user collapses the list after deselecting terms; expanding it restores the same checkbox states and does not recompute their counts.
- A viewport resize while the list is collapsed must resize/reflow the cloud and preserve collapse state for the current page session.
- Export while the list is collapsed captures the current cloud content, not the compact toggle strip or surrounding dashboard controls.
- Share/Export remains unavailable with a clear explanation if there is no rendered cloud to capture.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Wordcloud tab MUST provide a visible Share/Export action consistent with the existing visualization shareable-image workflow.
- **FR-002**: Activating Share/Export MUST preview a shareable image of the currently displayed Wordcloud and its meaningful visualization title; the preview MUST provide local download and close actions.
- **FR-003**: The Share/Export action MUST NOT upload activity titles, derived word data, or the generated image to a server.
- **FR-004**: Share/Export MUST provide a clear no-data/unavailable response when no cloud content has been rendered.
- **FR-005**: The word-frequency analysis MUST exclude all one-letter tokens after normalization, including single Unicode letters with diacritics.
- **FR-006**: The initial word-count slider value MUST be 50, replacing the previous default of 30; the displayed list and cloud MUST remain limited to available eligible words when fewer than 50 exist.
- **FR-007**: The ranked-word list MUST start expanded each time the Wordcloud tab is activated, including after returning to it from another tab.
- **FR-008**: On wide viewports, users MUST be able to collapse the list to a narrow vertical strip along the right side of the visualization area, allowing the cloud to use the released width.
- **FR-009**: On narrow viewports, the list MUST collapse to a compact, usable control rather than a vertical strip that makes the cloud or toggle inaccessible.
- **FR-010**: Collapsing and expanding the list MUST preserve the current word order, counts, and checkbox selections.
- **FR-011**: The collapse/expand control MUST be keyboard-operable and expose an accessible name and current expanded/collapsed state.
- **FR-012**: Every newly introduced dashboard visualization MUST include a discoverable Share/Export action using the existing local preview/download interaction, unless an explicit, justified exception is recorded in that feature's specification.

### Key Entities

- **Shareable Wordcloud Image**: A local preview/download image representing the current cloud and a meaningful Wordcloud title; it contains the displayed visualization rather than the dashboard controls or ranking panel.
- **Eligible Word**: A normalized title token of at least two Unicode letters that remains after missing-title and German/English function-word exclusions.
- **Ranked Word List State**: Expanded or collapsed UI state for the current page session, independent of each term's frequency and checkbox selection.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In every Wordcloud export check with rendered data, the preview corresponds to the current cloud and can be downloaded locally; no-data and renderer-failure checks never create a blank image.
- **SC-002**: In 100% of synthetic-title checks, one-letter tokens do not appear in the rank list or cloud.
- **SC-003**: With at least 50 eligible words, Wordcloud opens with 50 words selected for display; with fewer eligible words, all available terms are shown.
- **SC-004**: In 100% of wide-screen layout checks, collapsing the list leaves a narrow right-side control and increases the cloud's available width; expanding restores prior checkbox states.
- **SC-005**: In 100% of narrow-screen checks, the collapsed list remains operable without page-level horizontal overflow.
- **SC-006**: In 100% of new-visualization feature reviews, a Share/Export action exists or the feature specification documents a justified exception.

## Assumptions

- “Share button” means the existing in-app shareable-image preview and local download flow; this does not add direct publishing to Instagram/Strava or an operating-system share-sheet integration.
- The updated default is 50 words (previously 30), with the existing slider limits retained.
- The list starts expanded on initial load and each time the user activates the Wordcloud tab; collapse state is transient and is discarded when navigating away from the tab.
- On wide layouts the collapsed state is a narrow right-side vertical rail; on narrow layouts it is a compact horizontal toggle to preserve usability.
- Existing export branding, square-image composition, preview behavior, and local download policy remain unchanged unless the established export workflow requires a Wordcloud-specific title/capture target.
- The project-wide rule for future visualizations is recorded in the project constitution and agent guide as well as this feature's functional requirements.
