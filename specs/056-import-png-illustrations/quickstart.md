# Quickstart: Validate Import PNG Illustrations

## Prerequisites

- Node.js and npm installed in the repository environment.
- The 19 supplied files `assets/import-illustrations/01.png` through `19.png` present.

## Focused automated validation

From the repository root, run:

`npm test -- --runInBand __tests__/import-experience.test.js __tests__/dashboard-import.test.js __tests__/index-script-syntax.test.js`

Expected result: messages 02–20 map to PNGs 01–19 in line with the copy embedded in the artwork; all PNGs have no ordinal, bottom caption sentence, or decorative progress track; the message with no PNG and the separate local-processing reminder are absent; message 20 remains finalization-only; all related tests pass.

## Browser visual validation

1. Start the static site using `python -m http.server` from the repository root and open `http://localhost:8000`.
2. Start a Strava or TrainingPeaks import using a suitable local test archive (or a user-supplied archive if no synthetic archive is available).
3. Confirm the initial “Calculating…” message uses `01.png`; its embedded sentence and number are absent, while the HTML message and actual progress stage remain visible.
4. Inspect a range of aspect ratios, particularly the 307-ish-pixel wide images and wider `16.png`–`19.png`, at desktop and narrow viewport widths. Confirm the existing contained image area shows each asset without clipping or overlapping message/progress text.
5. If time permits a full rotation, verify all 19 regular message/image pairs. The automated catalog tests cover the full mapping without waiting through the entire rotation.
6. During finalization, verify message 20 uses the cleaned `19.png` and remains gated to that phase.

Expected result: the supplied local PNG artwork displays for messages 02–20 according to its embedded copy, with no SVG graphics or separate “Still local” reminder; actual progress reporting, message rotation, and completion/error feedback remain unchanged.

## Fallback check

Temporarily simulate a failed PNG request in a local browser test/dev environment (do not commit asset changes). Confirm that no vector image appears and that text, progress, and error state remain usable. Restore the asset after the check.
