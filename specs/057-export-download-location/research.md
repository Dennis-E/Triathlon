# Phase 0 Research: Choose Export Download Location

## Decision 1: Request a save destination at the preview Download action

- **Decision**: Use the browser's native file-save picker when it is exposed and permitted,
  invoked directly from the existing user-initiated Download action. Offer the existing
  anchor-based download as the fallback when the picker is unavailable or disallowed.
- **Rationale**: The app is static and browser-first; only the browser can safely present a
  system save dialog to a web page. The current download action already centralizes all export
  tiles, has the final PNG data URL and filename, and runs in direct response to user input.
- **Alternatives considered**:
  - A native operating-system file explorer launched independently by the app: unavailable to
    a static web page and would violate the browser security boundary.
  - Always use an anchor download: preserves compatibility but does not let users choose the
    destination in browsers that offer a save picker.
  - Add a server-side download endpoint: rejected because the image is already local and this
    would needlessly transmit export/personal data.

## Decision 2: Treat fallback capability and user cancellation as distinct outcomes

- **Decision**: Fall back to the current browser download flow only when destination picking
  is unavailable or cannot be used by the current environment. If the user cancels the picker,
  do not trigger the fallback, do not show a failure, and keep the preview ready for retry.
  Report write errors with existing export feedback and leave subsequent attempts enabled.
- **Rationale**: A cancellation is an explicit user decision, not an unsupported capability
  or a save failure. Falling back after cancellation would unexpectedly save somewhere else.
  A supported-but-denied picker (for example, policy/security failure) should preserve the
  existing ability to download, with clear feedback.
- **Alternatives considered**:
  - Treat every picker rejection as unsupported and auto-download: rejected because it could
    defeat the user's explicit cancel action.
  - Persist the last directory for future attempts: rejected because the browser may not
    expose a reusable path, and the requirement says each attempt should present a fresh choice.

## Decision 3: Save the existing PNG bytes without regenerating the export

- **Decision**: Keep the generated export image, existing PNG MIME type, and current suggested
  filename. Convert/use the current data URL as a PNG Blob for the picker write; keep the
  current data-URL anchor path as the legacy fallback.
- **Rationale**: The full square branded image is already composed before preview and held in
  `lastExportedImage`. Writing those bytes avoids another capture/composition and ensures the
  saved file matches the preview.
- **Alternatives considered**:
  - Re-capture the dashboard after the user clicks Download: rejected because it can capture
    changed dashboard state and delay the picker gesture.
  - Change the export output to another format: rejected; format changes are outside scope.

## Current repository behavior

- `src/dashboard-export.js` holds `lastExportedImage = { dataUrl, target }`; the composition
  returns a PNG data URL and the preview displays that same URL.
- `downloadExportedImage()` creates a temporary anchor, sets the generated filename, clicks it,
  and removes it. The preview Download button in `index.html` is wired to this function from
  `src/dashboard-tabs.js`.
- `src/export-utils.js` provides deterministic target-specific `.png` filenames; no dedicated
  dashboard-export download test currently exists.
- The app is static and the generated image already remains in the browser; no service or
  upload is needed for file saving.

## Resolved technical questions

- Destination selection depends on browser capability, secure-context rules, and user/policy
  permissions; fallback behavior remains necessary.
- The picker must be called synchronously in the Download click's user-activation flow, before
  unrelated asynchronous work can expire that activation.
- User cancellation is a quiet terminal outcome for that attempt; the preview remains open
  and the next click invokes a new picker request.