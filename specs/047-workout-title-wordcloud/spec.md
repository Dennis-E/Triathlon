# Feature Specification: Workout Title Wordcloud

**Feature Branch**: `047-workout-title-wordcloud`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "Create a new Wordcloud visualization showing the n most frequent words from workout titles, with n adjustable using a slider. Show a list of those n words with checkboxes so users can deselect words to remove them. Add a new landing-page tile titled 'And much more' containing only bullet-point keywords; for now list 'Wordcloud' and an ellipsis."

## Clarifications

### Session 2026-10-05

- Q: Soll die Häufigkeit eines Wortes zählen, wie oft es insgesamt in allen Workout-Titeln vorkommt, oder in wie vielen verschiedenen Titeln es vorkommt? → A: Jedes Vorkommen eines Wortes über alle Titel hinweg zählt.
- Q: Wo soll die Wortliste im Verhältnis zur Wordcloud erscheinen? → A: Neben der Wordcloud auf breiten Bildschirmen, darunter auf schmalen.
- Q: Sollen häufige Funktionswörter wie „der“, „und“ oder „the“ automatisch aus der Wordcloud ausgeschlossen werden? → A: Häufige deutsche und englische Funktionswörter automatisch ausschließen; Nutzer können weitere Wörter über die Checkboxen abwählen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore frequent workout-title words (Priority: P1)

As an athlete, I want to see the most frequent words in my workout titles as a wordcloud and choose how many ranked words are included, so that I can discover recurring themes in my training history.

**Why this priority**: The wordcloud is the core value of the feature and the requested adjustable word count is necessary to explore the data at different levels of detail.

**Independent Test**: Load activity data with known repeated words, open Wordcloud, and verify the displayed terms and their relative prominence against the known frequencies; move the count slider and verify the included ranked set changes accordingly.

**Acceptance Scenarios**:

1. **Given** imported activities have titles with repeated words, **When** the user opens Wordcloud, **Then** the cloud displays the highest-frequency eligible words, with more frequent words visually more prominent than less frequent words.
2. **Given** Wordcloud is displayed, **When** the user changes the word-count slider, **Then** the word list contains the selected number of top-ranked words, or all available words when fewer exist, and the cloud attempts to place every checked word.
3. **Given** two words have equal frequency at the cutoff, **When** the selected count is applied, **Then** the same deterministic tie-break order is used each time.
4. **Given** the user views Wordcloud on a wide screen, **When** the visualization and word list are displayed, **Then** the list appears beside the cloud; on a narrow screen, it appears below the cloud.
5. **Given** activity titles contain common German or English function words, **When** the word ranking is generated, **Then** those function words are excluded from the eligible ranked terms.

### User Story 2 - Remove words from the cloud (Priority: P1)

As an athlete, I want a checkbox list of the ranked words so that I can hide words that are not interesting while keeping the rest of the cloud available for comparison.

**Why this priority**: User-controlled exclusion is explicitly requested and makes the visualization useful when common or personally irrelevant terms dominate.

**Independent Test**: With a dataset containing several frequent words, deselect one term and verify that it remains identifiable as unchecked in the list but no longer appears in the cloud; reselect it and verify it returns.

**Acceptance Scenarios**:

1. **Given** the ranked word list and cloud are visible, **When** the user deselects a word, **Then** the word remains unchecked in the list and is removed from the cloud without affecting the other words.
2. **Given** a word is unchecked, **When** the user checks it again, **Then** it reappears in the cloud with its original frequency-based prominence.
3. **Given** the user changes the slider count, **When** the ranked set changes, **Then** the word list and cloud remain synchronized and any words newly entering the top-ranked set are included by default.

### User Story 3 - Discover Wordcloud on the landing page (Priority: P2)

As a visitor, I want an “And much more” tile that briefly lists feature keywords, so that I can see that the product offers more than the individual visualizations previewed on the landing page.

**Why this priority**: The new visualization should be discoverable before import, while the requested tile gives a concise overview without requiring another detailed preview.

**Independent Test**: Open the landing page before importing data and verify that an “And much more” tile contains only a short bullet list, including Wordcloud and an ellipsis placeholder, with no detailed description or visualization preview.

**Acceptance Scenarios**:

1. **Given** a visitor opens the landing page, **When** the “And much more” tile is visible, **Then** it lists “Wordcloud” and an ellipsis placeholder as concise bullet points.
2. **Given** the tile is viewed on a narrow or wide screen, **When** its content is displayed, **Then** the title and bullet points remain readable and the tile does not introduce horizontal overflow.

### Edge Cases

- If no activities or no usable titles are present, Wordcloud shows a clear empty state rather than a blank visualization.
- If fewer eligible words exist than the selected count, the cloud and list show all eligible words without empty entries.
- If a title contains only punctuation, numbers, or excluded common words, it contributes no cloud terms.
- Word matching is case-insensitive; punctuation is treated as a separator, and German characters such as ä, ö, ü, and ß remain valid parts of words.
- Generic fallback text used when a title is absent is not counted as a workout-title word.
- If a user deselects every listed word, the cloud shows a clear no-selected-words state while the full checkbox list remains available.
- If the available canvas cannot fit every checked word even after responsive resizing and font shrinking, the cloud identifies the unplaced terms clearly; those terms remain visible and selectable in the ranked list.
- Activity titles may contain personal or sensitive text; their processing and display remain within the existing local-data experience and titles are not sent to a new service.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST provide a clearly named Wordcloud visualization based on words from imported workout/activity titles.
- **FR-002**: The visualization MUST rank eligible words by the total number of occurrences across all available activity titles (including repeated occurrences within one title), using case-insensitive matching and treating punctuation as a word separator.
- **FR-003**: The visualization MUST provide a slider that allows users to select how many of the most frequent words are included, with a defined minimum, maximum, and initial value communicated by the control.
- **FR-004**: The visualization MUST display the currently ranked top-N words in a corresponding list, each with a checkbox.
- **FR-005**: Each listed word MUST be included in the cloud when checked and excluded when unchecked, without changing the word's underlying frequency or the other words' inclusion state.
- **FR-006**: The cloud MUST encode word frequency through relative visual prominence, and equal-frequency words MUST be ordered consistently.
- **FR-007**: Changing the selected word count MUST update the cloud and list together; newly included words MUST be checked by default, while the user's existing selections for words that remain in the list MUST be preserved.
- **FR-008**: The visualization MUST provide understandable empty states when no eligible words are available or all listed words are unchecked.
- **FR-009**: The word analysis MUST use activity-title text already available in the imported activity data and MUST NOT transmit titles to a new external service.
- **FR-010**: The landing page MUST include a tile titled “And much more” containing only concise bullet-point keywords; its initial contents MUST include “Wordcloud” and an ellipsis placeholder, without a detailed description or chart preview.
- **FR-011**: The landing-page tile MUST remain readable at narrow and wide viewport sizes without horizontal overflow.
- **FR-012**: The word list MUST appear beside the cloud on wide viewports and below it on narrow viewports, with both remaining usable without horizontal overflow.
- **FR-013**: The ranking MUST exclude a defined fixed set of common German and English function words before selecting the top N terms.
- **FR-014**: The cloud renderer MUST attempt to place every checked top-N word by using the available responsive canvas area and shrinking terms when necessary; any terms that still cannot be placed MUST be identified clearly and remain available in the checkbox list.

### Key Entities *(include if feature involves data)*

- **Activity title**: Text associated with an imported workout/activity; the source for word extraction and frequency calculation.
- **Eligible word**: A normalized word token retained for ranking after empty tokens, generic missing-title fallback text, and common German/English function words are excluded.
- **Ranked word**: An eligible word paired with its total occurrence count across all titles and rank in the frequency order.
- **Word inclusion selection**: The user's checked/unchecked choice for a ranked word, controlling whether it appears in the cloud.
- **Landing-page feature tile**: The concise “And much more” entry that lists selected visualization keywords without preview content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of validation datasets with known title-word counts, the displayed ranked list matches the expected frequency order and selected top-N count.
- **SC-002**: In 100% of interaction checks, deselecting a listed word removes only that word from the cloud, and reselecting it restores it.
- **SC-003**: Users can adjust the number of displayed words and see the cloud and list update within 1 second for datasets of up to 5,000 activity titles.
- **SC-004**: In 100% of empty-data and all-unchecked checks, the user sees a clear explanatory state rather than a blank or broken visualization.
- **SC-005**: In 100% of landing-page checks, visitors can identify the “And much more” tile and its “Wordcloud” bullet without horizontal overflow at supported narrow and wide widths.
- **SC-006**: Review of the feature confirms activity titles are not sent to a new external service.
- **SC-007**: At the maximum selection of 100 words, every checked word is either visible in the cloud or explicitly identified as unplaced and remains available through its checkbox.

## Assumptions

- The existing activity model already carries the imported activity title; no new title-import capability is needed.
- The slider selects a word count from 10 to 100, starting at 30; if fewer than 10 eligible terms exist, the actual displayed count is limited to the available terms.
- Common German and English stop words and generic missing-title placeholders are excluded so the cloud emphasizes meaningful title terms; the stop-word set is fixed for the initial release.
- Counts are based on occurrences across all imported activity titles; there is no additional sport or date filter in the initial release.
- Existing local-data privacy behavior applies; this feature adds no account, persistence, export, or network behavior.
- The landing-page ellipsis is a temporary concise placeholder for additional feature keywords and does not imply an unavailable visualization is already implemented.
