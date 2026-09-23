# Research: Fix Power PB Enlarge Button

## Decision 1: Reuse the existing shared PB detail-control path

- **Decision**: Correct the presentation of the shared detail-view control used by the Bike power duration tiles rather than introducing a separate power-only button implementation.
- **Rationale**: `appendPbDetailButton` already supplies the accessible name, tooltip, click handler, icon name, and full-screen detail action for all PB tile families. Keeping one path preserves consistent behavior and limits the change to the reported visual defect.
- **Alternatives considered**: A separate power-only control was rejected because it would duplicate behavior and could make the power tiles diverge again.

## Decision 2: Keep the existing Lucide enlarge icon contract

- **Decision**: Continue using the existing `maximize-2` icon contract and ensure it is rendered visibly inside the button after the tile is created.
- **Rationale**: The project already loads Lucide from the browser and the existing syntax test asserts the icon and rendering call. Reusing that convention avoids a new asset or visual language.
- **Alternatives considered**: A hand-drawn SVG or text glyph was rejected because it would not match the established PB controls and would add unnecessary visual maintenance.

## Decision 3: Verify behavior at the browser boundary

- **Decision**: Use the existing focused Jest syntax/regression test plus manual browser checks at desktop and narrow widths.
- **Rationale**: Jest can verify script wiring and preserved detail-button code, but it does not provide the repository's DOM/browser rendering environment. The reported defect is visual, so browser verification is required to confirm the icon is actually visible.
- **Alternatives considered**: Full application test-suite execution alone was rejected as insufficient for confirming rendered icon visibility.

## Resolved Unknowns

- No unresolved technical choices remain. The feature is presentation-only, does not change PB data, and does not add a network or storage interface.
