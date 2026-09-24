# Data Model: Refine Visualization Previews

This feature updates static derived assets and introduces no runtime persistence.

## Preview Capture State

- **Purpose**: Reproducible dashboard state used to create one corrected preview.
- **Fields**:
  - `visualization`: one of the seven affected visualization names.
  - `filters`: selected sport, date range, equipment type, display mode, or PB tile.
  - `viewport`: chart or map region included in the capture.
  - `crop`: asset boundary chosen to retain required labels and remove unrelated UI.
  - `privacyReview`: approval status and notes for labels/geography.
- **Validation**: The state must explicitly document the requested correction and the
  resulting asset must show visible content.

## Corrected Preview Asset

- **Purpose**: Replacement PNG shown by an existing landing-page card.
- **Fields**:
  - `path`: unchanged public asset path under `assets/previews/`.
  - `sourceState`: associated Preview Capture State.
  - `visibility`: visible chart marks, labels, axes, or map context.
  - `privacyStatus`: reviewed before publication.
- **Validation**: Must retain the existing card path/action, show the requested state,
  and contain no unapproved personal names, exact routes, or account identifiers.

## State Transitions

Capture State: `prepared` -> `captured` -> `privacy-reviewed` -> `published`.
Any asset failing visibility or privacy review returns to `prepared` and is replaced.