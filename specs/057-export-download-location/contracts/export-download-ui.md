# UI Contract: Choose Export Download Location

## Entry point

- The existing **Download** button in the export preview is the only entry point; every export
  tile continues to use the shared preview and download flow.
- The save prompt starts directly from the user's button activation and uses the current
  preview image and target-specific suggested PNG filename.

## Supported destination picker

- The browser/system save dialog lets the user choose a destination and filename where
  supported.
- Confirming the dialog saves the exact PNG shown in the preview at the chosen location.
- Cancelling closes only the save dialog: no file is saved, no error is shown, the preview
  stays open, and a later click opens a new choice.
- A write error is communicated clearly; the preview and retry action remain available.

## Compatibility fallback

- If the environment does not provide or permit destination selection, the existing browser
  download behavior remains available and the user is informed that the location could not be
  selected.
- A user cancellation is not treated as an unavailable picker and MUST NOT trigger an
  automatic fallback download.

## Privacy and content

- All image conversion and saving is browser-local; no export image or activity data is sent
  to a server.
- The saved file remains PNG and is byte-for-byte equivalent to the preview image.
- No destination or filename choice is remembered for a later download attempt.