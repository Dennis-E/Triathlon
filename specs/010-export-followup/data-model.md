# Data Model: Export Follow-up Fixes

## Export Control

| Field | Type | Rules |
|------|------|-------|
| stravaIcon | local asset | Rendered first; source aspect ratio preserved. |
| label | string | Exactly `Export for Insta / Strava`. |
| instagramIcon | local asset | Rendered after the label; source aspect ratio preserved. |
| responsiveLayout | layout state | Both icons and the complete label remain visible at supported widths. |

## Export Metadata Layout

| Field | Type | Rules |
|------|------|-------|
| filterBlockY | number | Start coordinate for active filter text. |
| controlsBlockY | number | Must be greater than the actual filter block bottom plus spacing. |
| controlsBlockBottom | number | Returned by available-control rendering after wrapping. |
| legendY | number | Must be greater than controls block bottom plus spacing and before footer start. |
| footerStart | number | Hard lower boundary for metadata content. |

The layout is valid only when each block's bottom is less than or equal to the next block's start and all blocks remain above the footer region.

## PB Detail Capture Target

| Field | Type | Rules |
|------|------|-------|
| kind | enum | `pb-tile`. |
| key | string | Current active PB export key. |
| title | string | Current active PB title. |
| targetElementId | string | Stable wrapper element containing the selected PB chart. |
| hasData | boolean | False prevents capture. |
| model | PB detail model | Must remain associated with the active popup detail for the request. |

## Export Request State

Allowed transitions:

- `idle` -> `checking` when a request starts.
- `checking` -> `idle` for no-data or missing-target rejection.
- `checking` -> `capturing` when data and target are valid.
- `capturing` -> `previewing` after successful capture and composition.
- `capturing` -> `idle` after asset or capture failure.
- `previewing` -> `idle` after close/reset.

A failed request MUST not remain in `capturing` or block a later retry.
