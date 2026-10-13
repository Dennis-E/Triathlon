# Feature Specification: Import PNG Illustrations

**Feature Branch**: `056-import-png-illustrations`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: Replace the import-dialog vector graphics with 19 numbered PNG pictures from `assets/import-illustrations`; the exact message-to-file mapping is clarified below.

## Clarifications

### Session 2026-10-13

- Q: Soll `01.png` zur zweiten Meldung und `19.png` zur zwanzigsten Meldung gehören, passend zu den Texten in den Bildern? → A: Ja, um eins verschoben: PNG-Datei `NN.png` gehört zu Meldung `NN+1`; Meldung 1 behält ihr SVG.
- Q: Sollen Nummern, Bildunterschriften und Balken aus allen PNGs sowie der separate „Still local“-Hinweis und die Meldung ohne PNG entfernt werden? → A: Ja; alle drei Bild-Overlays und der separate Hinweis werden entfernt, und die PNG-lose Meldung samt SVG-Illustration wird nicht mehr angezeigt.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the supplied illustrations during import (Priority: P1)

As someone importing training data, I want the supplied pictures to show only their illustrations and pair with the matching remaining messages, so the dialog does not repeat text or show decorative progress that could be mistaken for actual import status.

**Why this priority**: Correctly pairing the provided artwork with the established messages is the whole user-visible purpose of this change.

**Independent Test**: Run or simulate the message rotation and verify that `01.png` through `19.png` match messages 2 through 20, each picture is free of its ordinal/caption/decorative track, and no message without a supplied PNG is displayed.

**Acceptance Scenarios**:

1. **Given** an import message numbered 02–20 is displayed, **When** its illustration is rendered, **Then** the PNG whose number is one less than the message number is shown (for example, message 07 uses `06.png` and message 20 uses `19.png`).
2. **Given** the import message changes, **When** the next message appears, **Then** its matching picture changes with it and no prior message's picture is left paired with the new text.
3. **Given** the catalog contains a message with no matching supplied PNG, **When** import messages are selected, **Then** that message and its SVG illustration are omitted.
4. **Given** any supplied PNG is displayed on a supported screen size, **When** its picture is shown, **Then** it has no embedded ordinal, caption sentence, or decorative progress track and remains legible within the existing illustration area.

### User Story 2 - Preserve special and personalized import messaging (Priority: P2)

As someone importing training data, I want the finalization-only message and data-based personal messages to use supplied PNGs, so all import illustrations follow one consistent image-only presentation.

**Why this priority**: Personal observations and the separately gated finalization message are existing parts of the import experience and must retain the correct visual association as the numbered assets are introduced.

**Independent Test**: Exercise personal-message display and finalization; verify that artwork remains paired correctly and the finalization-only message retains its current eligibility and behavior.

**Acceptance Scenarios**:

1. **Given** a personal message reuses a scene numbered 02–20, **When** that personal message is shown, **Then** it uses that scene's matching supplied PNG without an SVG fallback.
2. **Given** a personal message would require a scene with no supplied PNG, **When** candidates are prepared, **Then** that personal message is omitted.
3. **Given** the finalization-only message 20 is displayed, **When** its illustration is rendered, **Then** it uses `19.png` and remains eligible only in the finalization phase.
4. **Given** an import is in progress, **When** the artwork changes are active, **Then** actual message text, rotation, real progress, and completion/error behavior remain clear, with no separate “Still local” reminder.

### Edge Cases

- A message or personal-message candidate has no supplied PNG: omit that message; do not show an SVG or another message's image.
- A supplied PNG cannot be loaded: clear/hide its illustration instead of displaying an SVG fallback, while keeping the message and import status visible.
- A message is displayed before its image finishes loading: the text and progress feedback remain available, and the wrong numbered picture is not presented as the message's match.
- PNG numbering is offset from message numbering by one: `01.png` depicts message 2 and `19.png` depicts finalization-only message 20; neither should be shifted to the same-number message.
- A personal message reuses a scene from messages 2–20: it follows the same one-number offset; a message requiring scene 1 is omitted.
- Each import PNG is displayed without its baked-in number, bottom caption sentence, and decorative progress track; actual dialog progress remains independent.
- Narrow layouts and image aspect-ratio differences must not obscure text, progress, or error feedback.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: For each import message numbered 02–20, the import dialog MUST show `NN.png` where `NN` is one less than that message's two-digit number (message 07 uses `06.png`; message 20 uses `19.png`).
- **FR-002**: A message without a matching supplied PNG MUST be removed from the rotation; the import dialog MUST NOT display its SVG illustration.
- **FR-003**: A message and its illustration MUST update as a pair; a picture for another message MUST NOT be shown as the current message's intended illustration.
- **FR-004**: A personal import message MUST be shown only if its associated scene has a supplied PNG; it MUST use that PNG without an SVG fallback.
- **FR-005**: The finalization-only message 20 MUST use `19.png` and remain eligible only during finalization.
- **FR-006**: If a supplied picture cannot be displayed, the dialog MUST clear/hide the illustration instead of displaying a vector fallback, while keeping its message, progress, import status, and error feedback usable.
- **FR-007**: Every supplied PNG MUST omit its embedded ordinal, bottom caption sentence, and decorative progress track; the dialog's real progress bar and stage MUST remain unchanged.
- **FR-008**: The separate “Still local” privacy reminder MUST NOT be displayed during import-message rotation.
- **FR-009**: The change MUST preserve remaining message text and ordering behavior, actual import progress reporting, and success/error lifecycle.
- **FR-010**: The pictures MUST fit within the existing import-dialog illustration area on desktop and mobile without obscuring message text or progress information.

### Key Entities *(include if feature involves data)*

- **Import message**: One of the existing regular, personal, or finalization-only message texts displayed during an import.
- **Numbered import picture**: One of the supplied pictures numbered 01–19 paired with the message whose copy it depicts (catalog messages 02–20); the baked-in ordinal, caption and decorative progress track are removed.
- **Message-picture pairing**: The association ensuring the intended PNG is displayed whenever a message is shown; messages without a supplied PNG are excluded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 19 supplied pictures are paired with the matching embedded-copy scenes for messages 02–20, and the message without supplied artwork is absent.
- **SC-002**: During a complete rotation, every displayed message uses its matching PNG with zero mismatched pairings and no vector illustration.
- **SC-003**: Every supplied PNG is free of its baked-in ordinal, caption sentence and decorative progress track.
- **SC-004**: Personal messages are generated only when their associated scene has a supplied PNG; no SVG-backed personal message is emitted.
- **SC-005**: The finalization-only message uses `19.png` and appears only in explicitly finalizing states.
- **SC-006**: If an image fails to load, no SVG is rendered and message text, import status, progress, and error feedback remain usable.
- **SC-007**: The separate “Still local” reminder is absent from the import rotation.
- **SC-008**: Desktop and mobile layout checks show no overlap between pictures, message text, progress information, and error feedback.

## Assumptions

- The supplied files `01.png` through `19.png` are the complete set for messages 2 through 20 and are already present under `assets/import-illustrations`.
- PNG filename number `NN` maps to catalog message `message-(NN+1)`. The first T1 message has no matching PNG and is removed along with its vector illustration.
- The separately phase-gated “Almost there” message is message 20 and maps to `19.png`; it keeps its finalization-only eligibility and has no vector fallback.
- The image cleanup removes only the corner ordinal, the bottom caption sentence, and the progress track; words that are part of depicted signs or props remain part of the illustration.
- The separate “Still local” import reminder is removed; the site's other privacy disclosures are outside this feature change.
- Existing humorous and personal message text, import behavior, and image display area are otherwise out of scope for redesign.
- If an image fails to load, the message and status remain visible while its illustration area stays blank; no vector fallback is permitted.
