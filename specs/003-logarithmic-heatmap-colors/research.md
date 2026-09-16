# Phase 0 Research: Logarithmic Heatmap Colors

All Technical Context items are resolved. No `NEEDS CLARIFICATION` markers remain.

## Decision 1: Normalize against the complete filtered frequency range

- **Decision**: Derive one color scale whenever `renderHeatmap()` supplies a new filtered
  segment set. For valid positive counts with minimum $m$ and maximum $M$, normalize count
  $c$ as:

  $$
  t(c)=\operatorname{clamp}\left(\frac{\ln(c)-\ln(m)}{\ln(M)-\ln(m)},0,1\right)
  $$

  The scale is based on all segments for the active sport filter, not only the current map
  viewport or zoom representation.
- **Rationale**: Equal multiplicative steps receive equal scale spacing, preserving detail
  among infrequent routes when counts span orders of magnitude. A full filtered-domain scale
  also prevents colors from changing while the user pans or zooms.
- **Alternatives considered**:
  - Linear normalization: rejected because one extremely frequent route compresses nearly
    all lower frequencies into the same visual range.
  - Viewport-relative normalization: rejected because the same route would change color as
    the map moves.
  - Fixed saturation count: rejected for color because it cannot adapt to both small and
    long training histories; the existing fixed cap remains appropriate for line thickness.

## Decision 2: Use a three-stop, piecewise color progression

- **Decision**: Use `#60A5FA` (light blue) at $t=0$, `#1E3A8A` (dark blue) at $t=0.9$, and
  `#DC2626` (red) at $t=1$. Interpolate RGB channels linearly from light blue to dark blue
  over $0\le t\le0.9$, then from dark blue to red over $0.9<t\le1$.
- **Rationale**: The first 90% of the logarithmic range stays blue as requested, while only
  the upper tenth acquires a red component. The endpoints are visually distinct on typical
  light map tiles, and the existing frequency-based thickness remains a non-color cue.
- **Alternatives considered**:
  - A rainbow palette: rejected because hue order is harder to interpret and introduces
    unnecessary colors unrelated to the requested visual language.
  - Switching abruptly from dark blue to red: rejected because it loses ordering within
    the extreme range.
  - Adding a second outline stroke immediately: deferred unless browser validation finds a
    concrete contrast failure, because it nearly doubles Canvas draw work and risks the
    performance target from feature 002.

## Decision 3: Treat empty and constant domains explicitly

- **Decision**: Exclude non-finite and non-positive counts from scale derivation. Return no
  scale when no valid count exists. When $m=M$, mark the scale as constant, normalize valid
  counts to zero, render every route light blue, and present a single-value legend without
  red. Invalid individual counts use the visible light-blue fallback but never affect valid
  scale bounds.
- **Rationale**: Logarithms are undefined for non-positive values, and a lone maximum is not
  meaningfully an extreme. Explicit states avoid division by zero and misleading red routes.
- **Alternatives considered**:
  - Coercing invalid values to one: rejected because malformed data would alter the domain.
  - Rendering the sole/equal value red as the maximum: rejected because it implies variation
    that does not exist and conflicts with FR-007.

## Decision 4: Preserve low-zoom performance without artificial extremes

- **Decision**: Extend each low-zoom rendering aggregate with `colorCount`, defined as the
  maximum valid frequency among its source route segments. Keep its existing summed `count`
  unchanged for line weight and opacity. Color both full-detail and aggregate segments
  against the scale derived from the full filtered route segments.
- **Rationale**: `buildLowZoomRouteSegments()` currently sums many nearby counts for drawing
  prominence. Using that sum as a frequency color would make dense geography appear extreme
  even when no underlying route is exceptionally frequent. Maximum source frequency
  preserves real extreme routes without adding per-redraw analysis.
- **Alternatives considered**:
  - Use summed `count` for color: rejected because aggregation invents frequency.
  - Use average count: rejected because a truly extreme route could disappear among many
    occasional neighbors.
  - Disable low-zoom aggregation: rejected because it would regress feature 002.

## Decision 5: Cache the scale and segment colors when data changes

- **Decision**: `RouteCanvasLayer.setSegments()` computes one scale and one color per
  full-detail segment. Low-zoom aggregates receive colors when their cache is first built.
  `_draw()` only performs viewport checks and style/color lookups. The small preview computes
  one scale for its synthetic segments and reuses the same color helper.
- **Rationale**: Panning and zooming can redraw many strokes. Keeping logarithms and color
  interpolation out of that loop preserves the single-canvas performance design.
- **Alternatives considered**:
  - Compute color for every stroke on every redraw: functionally correct but unnecessary
    repeated work at large scale.
  - Store a global scale outside the layer: rejected because filter updates and preview data
    would share mutable state and could display stale colors.

## Decision 6: Add a compact in-map legend with current values

- **Decision**: Place a non-interactive legend overlay at the lower left of the heatmap map
  wrapper, away from Leaflet attribution. For varied data it shows the color progression and
  labels for minimum, extreme-start, and maximum counts. For a constant domain it shows one
  blue swatch and value. Hide it for empty data and map-load failure. Give it an accessible
  text alternative containing the current values.
- **Rationale**: The adaptive scale cannot be interpreted reliably without its current
  bounds. Updating the legend in the same render path as the Canvas layer keeps it consistent
  after sport-filter changes.
- **Alternatives considered**:
  - No legend: rejected because users could identify order but not the meaning of red or the
    current range.
  - A separate settings panel: rejected as unnecessary interaction and layout complexity for
    a read-only scale.

## Decision 7: Test pure math automatically and visual integration manually

- **Decision**: Add Jest coverage for domain derivation, normalization, endpoint/intermediate
  colors, exact 90% threshold behavior, invalid/constant inputs, and low-zoom `colorCount`.
  Preserve existing heatmap tests and run the inline-script syntax test. Validate palette,
  legend, filter updates, preview, zoom stability, and OSM contrast in the browser.
- **Rationale**: The repository's Jest environment is Node without jsdom. Pure behavior can
  be exhaustive there, while Canvas/Leaflet rendering is most reliably checked in the real
  browser without introducing a new test dependency.
- **Alternatives considered**:
  - Add jsdom or a Canvas browser harness: rejected as disproportionate for this focused
    feature and inconsistent with current project boundaries.
