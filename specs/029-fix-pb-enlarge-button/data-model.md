# Data Model: Fix Power PB Enlarge Button

This feature does not add or change persisted data. The relevant model is a rendered UI control attached to an existing PB tile.

## Power PB Tile

- **Purpose**: Displays one supported Bike power duration and its PB history.
- **Relevant existing data**: Duration label, PB records, chart values, and detail-view model.
- **Relationship**: Owns one detail-view control.
- **Validation**: Existing PB qualification and chart values remain unchanged.

## PB Detail Control

- **Purpose**: Opens the selected tile's detailed full-screen view.
- **Display state**: Contains a visible enlarge icon with sufficient contrast against the button background.
- **Accessible state**: Retains the tile-specific accessible name and descriptive title.
- **Interaction state**: Default, hover, focus, and active states keep the icon visible and usable.
- **Action**: Opens the detail view for the owning Power PB Tile.
- **Responsive rule**: Remains visible and inside the tile header at supported desktop and narrow viewport sizes.

## State Transitions

1. Tile rendered -> detail control is visible and identifiable.
2. Control receives hover/focus/active state -> icon remains visible with sufficient contrast.
3. Control activated -> matching detail view opens.
4. Detail view closed -> original tile and its control remain unchanged.
