# UI Contract: Landing Visualization Previews

## Preview Coverage

- The landing preview container MUST expose one identifiable preview for each of:
  `totalDistance`, `heartratePace`, `equipment`, `equipmentTimeline`,
  `personalBests`, `heatmap`, `distributions`, and `workoutTime`.
- Workout Time and Distributions cards MUST use their existing dashboard targets and
  clear visible titles.
- Each card MUST provide a title, purpose description, and approved derived asset.

## Asset and Privacy Contract

- Preview assets MUST be bundled under `assets/previews/` or an equivalent public
  static-asset location.
- `index.html` MUST NOT reference `private-data/`, the private ZIP filename, raw CSV,
  GPX, FIT, or ZIP files for landing previews.
- The published asset inventory MUST contain only reviewed derived images and MUST NOT
  contain personal names, account identifiers, exact route geometry, or raw activity
  data.

## Interaction and Responsive Contract

- Existing preview-card actions MUST continue to open the corresponding dashboard tab
  and preserve the current import-required guidance.
- Cards MUST remain readable at supported desktop and mobile widths without horizontal
  overflow, clipped titles, or overlapping labels.
- The preview area MUST render without a visitor selecting or uploading a file.