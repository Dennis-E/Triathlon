# UI Contract: Visualization Export Button

## Scope

This contract covers the eleven standard `exportVisualizationTab(...)` buttons in visualization headers. The separate `pbDetailExport` control is excluded because it belongs to a distinct detail overlay and does not use the affected stacked header layout.

## Layout

- The button width is determined by its label, icons, spacing and padding, not by the remaining width of its parent header.
- The button does not expand to fill a stacked (single-column) header row.
- In a stacked header, its inline position is at the same content edge as other left-aligned header controls; unused space to its right is not painted as part of the button.
- Its width remains bounded by the viewport. At 320 CSS px, all label and icon content must remain visible and usable without horizontal page overflow.
- At a fixed viewport size, equivalent standard export actions have consistent visible width and height. Their width spread is at most 2 CSS px.
- Existing header breakpoints and the relative order of heading, filters, palette and export button remain unchanged.
- Existing focus, hover and keyboard activation behavior remains unchanged.

## Behavior

The existing action target, visualization capture mapping, preview, download, no-data handling and image contents remain unchanged. The button remains an export action; its visual dimensions do not alter the captured visualization.

## Verification

Static tests assert that all eleven standard buttons share the explicit class and that the centralized styling contract is present. This verifies consistent markup, not actual geometry. Browser acceptance checks rendered size, alignment, text wrapping and horizontal overflow at 320, 375, 640, 768, 1024 and 1440 CSS px, including breakpoints immediately below and above 640 and 768 px as practical.
