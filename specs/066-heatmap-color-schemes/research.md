# Research: Heatmap Color Schemes

## Decision 1: Keep the existing map tile source

**Decision**: Keep the current OpenStreetMap tile layer and attribution. For Black + Fire,
apply a reversible dark visual treatment to the tile layer only. Leave the Leaflet route
canvas, frequency legend, activity tooltip, and controls outside that treatment. Restore
the standard tile appearance when another scheme is selected.

**Rationale**: The current dashboard already sends map tile requests to OSM. A separate
dark-tile provider would add another network recipient, service availability dependency,
attribution requirements, and potentially different cross-origin behavior for image
capture. Keeping the same tiles avoids changing the app's network boundary while fulfilling
the user-visible dark-map requirement.

**Alternatives considered**:

- Switch to a third-party dark tile endpoint: likely offers a more purpose-designed dark
  basemap, but introduces a new external service, terms/attribution and CORS risks. Rejected
  for this feature's narrow scope and privacy constraints.
- Apply a filter to the entire Leaflet map container: simple to toggle, but also alters
  route colors, labels, controls, and overlays. Rejected because it damages palette and
  legend accuracy.

**Validation risk**: A CSS treatment of existing OSM tiles may reduce label or road
readability. Its exact filter values require visual tuning in a browser. The export path
uses html2canvas with `useCORS: true`, but this alone does not prove that filtered external
tiles are present in the output. Verify both the live map and exported PNG before accepting
the implementation.

## Decision 2: Keep frequency normalization independent of palette

**Decision**: Continue deriving the low-to-high position from the existing logarithmic
frequency scale. Map that normalized position through one of four named palette ramps:
Blue to Red, Yellow to Red, Blue, and Black + Fire. Preserve the existing Blue to Red
colors and result as the default and as the fallback for invalid or missing scheme values.

**Rationale**: Frequency calculations are established and tested separately from visual
style. A palette should not affect route counts, sport filtering, geometry, ordering, or
hover hit-testing. Existing color interpolation and custom endpoint behavior are covered in
`__tests__/heatmap-utils.test.js` and should remain compatible.

**Alternatives considered**:

- Recompute route frequency differently per scheme: rejected because the same data would
  communicate different values depending on display preference.
- Replace the current default palette: rejected because FR-010 requires preserving the
  existing Blue to Red appearance.

## Decision 3: Use the existing UI and export integration points

**Decision**: Add the selector alongside the existing heatmap sport filter, include its
value in the heatmap keyboard-filter adapter, and add the active scheme to the heatmap's
export control summary/context. Update the frequency guide from the selected palette,
including its constant-frequency swatch and accessible description.

**Rationale**: Other dashboard visualizations already treat palettes as user-selectable
state and include palette/sport filters in keyboard navigation and export metadata. The
heatmap export captures `heatmapMapContainer`, so it should naturally include the active
map and route appearance; the export context still needs to name the selected scheme.

**Alternatives considered**:

- Store the choice in local storage: rejected because the spec requires retention only for
  the active dashboard session, not across reloads.
- Add a new heatmap tab or export flow: rejected; the existing tab and local image-preview
  download flow already own this visualization.

## Relevant Local References

- `src/dashboard-heatmap.js`: current OSM tile creation, route canvas, sport filter,
  frequency guide, and independent preview-map rendering.
- `src/heatmap-utils.js`: logarithmic normalization, color interpolation, and accessible
  frequency guide model.
- `src/dashboard-export.js`: heatmap export target, available control groups, export
  context, and html2canvas capture (`useCORS: true`).
- `src/dashboard-distributions.js`: existing palette selection and keyboard adapter pattern.
- `__tests__/heatmap-utils.test.js`: current Blue to Red output and custom-color tests.
- `__tests__/dashboard-heatmap.test.js`: map lifecycle, sport filtering, empty state, and
  viewport preservation tests.