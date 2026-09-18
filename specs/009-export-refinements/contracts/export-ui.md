# Export UI Contract

## Visualization Export Control

Every supported visualization tab exposes one control with:

- Visible text exactly: `Export for Insta / Strava`
- A clearly legible Strava icon with preserved aspect ratio
- An accessible name that identifies the selected visualization
- Layout that remains readable at desktop and narrow supported widths

The Personal Bests overview is excluded from this control list.

## Personal-Best Detail Popup Control

When one data-bearing personal-best tile is expanded:

- The overview and collapsed tile show no export control.
- The detail popup exposes exactly one export control.
- The control uses the same visible text: `Export for Insta / Strava`.
- Activation exports the current expanded detail model, not `pbColumnsContainer`.
- Closing the popup removes the control with the popup.

## Export Image Contract

The preview and downloaded PNG contain:

- The selected visualization or personal-best detail.
- A separate headline/header region.
- The canonical domain `https://dennis-e.github.io/Triathlon/`.
- The TriAnalytica logo with its source aspect ratio preserved.
- The QR code and relevant active filter/legend content.
- A picture of the current available filter/view controls with recognizable labels and states.

The preview and downloaded PNG do not contain Strava or Instagram logos. Those assets are control affordances only.

## Failure Contract

- No data or a missing capture target produces the existing user-facing no-data message and no blank preview.
- Missing local assets produce a clear export error and no misleading downloadable image.
- Repeated exports clear stale preview state before showing the next image.
