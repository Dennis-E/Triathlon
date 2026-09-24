# UI Contract: Refine Visualization Previews

## Capture States

- Heartrate vs Pace: Run filter, focused 2021-2026 range, visible points and year
  context.
- Equipment: Bikes-only filter with readable or approved generalized labels.
- Equipment Timeline: Bikes-only filter, Activities mode, visible activity bars.
- Personal Bests: visible 50 km PB tile/detail view.
- Heatmap: Rheinland-area map context with privacy-reviewed route density.
- Distributions: visible x-axis labels and units inside the asset.
- Workout Time: visible x-axis labels and units inside the asset.

## Public Asset Contract

- Replacement assets MUST keep the existing paths under `assets/previews/`.
- Card titles, dashboard actions, and import-gate behavior MUST remain unchanged.
- Corrected PNGs MUST contain visible content and MUST NOT contain unapproved exact
  routes, personal equipment names, or account identifiers.

## Responsive Contract

- Corrected assets MUST remain legible inside the existing preview-card image frame at
  desktop and 390px mobile landing-page widths.
- Axis labels, Bike labels, PB text, and Rheinland context MUST not be clipped by the
  asset boundary.