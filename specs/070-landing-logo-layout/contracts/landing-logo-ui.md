# Landing Page Logo UI Contract

## Covered Areas

- The brand logo in the shared page header while the landing page is visible.
- The brand logo in the landing-page hero.

## Required Behavior

- Both logos use the existing brand image and retain its original aspect ratio.
- At viewport widths of 320, 375, 768, and 1280 CSS pixels, both logos are fully visible and recognizable.
- From 320 through 767 CSS pixels, header content may reflow but must not overlap the logo or create horizontal page overflow.
- Changing the viewport width must leave the logos and surrounding landing-page content usable.
- Wider layouts retain the existing visual hierarchy and centered hero presentation.

## Failure Conditions

The contract is not met if either logo is visibly compressed, clipped, covered by adjacent content, or if the logo layout causes horizontal page overflow at a supported width.