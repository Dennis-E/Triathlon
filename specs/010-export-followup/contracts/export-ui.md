# Export Follow-up UI Contract

## Export Control Contract

Every supported visualization control and the PB detail-popup control must render:

1. Strava icon
2. Visible text `Export for Insta / Strava`
3. Instagram icon

The Instagram icon must be visibly to the right of the text. The control must preserve both icon aspect ratios and keep the complete sequence readable at desktop and narrow supported widths.

Platform icons are control-only elements and must not be drawn into the exported preview or downloaded image.

## Metadata Layout Contract

The generated image must render metadata in this order:

1. Active filter summary, if non-empty
2. Available filter/view control snapshot
3. Applicable legend, if present
4. Footer branding, canonical domain, and QR code

Each region must start after the previous region's measured/rendered bottom plus spacing. The legend must never overlap filter text, control pills, footer branding, domain, or QR code.

## PB Detail Export Contract

While a data-bearing PB detail popup is open:

- The popup export action is enabled and uses the common control contract.
- The export target identifies the current PB detail and points to a stable browser-capturable wrapper containing its chart.
- Successful capture opens the normal preview and downloads the selected detail.
- Capture failure resets the request to idle, shows a clear error, and permits retry.
- No-data details do not create blank exports.

## Privacy Contract

All capture and composition work remains local to the browser. No visualization data or generated image is sent to a server.
