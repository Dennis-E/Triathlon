# UI Contract: Power PB Enlarge Control

## Scope

This contract describes the user-visible control on every rendered Bike power Personal Best duration tile.

## Control Contract

| Property | Required behavior |
|---|---|
| Presence | One enlarge control appears in the header of each rendered Bike power duration tile. |
| Icon | A recognizable enlarge icon is visible inside the control in the default state. |
| Consistency | Icon, dimensions, contrast, spacing, hover state, focus state, and active state match the existing PB tile detail controls. |
| Accessibility | The control retains a tile-specific accessible name and descriptive hover title. |
| Activation | Activating the control opens the matching tile's full-screen detail view. |
| Responsive layout | The control remains fully visible and usable at standard desktop and narrow supported viewport widths. |
| Data integrity | The control does not modify PB calculations, chart values, or tile records. |

## Failure Conditions

The contract is violated if the control appears as a solid filled shape without a visible icon, if its icon loses contrast in an interaction state, if it opens the wrong detail view, or if it is clipped from the tile header.
