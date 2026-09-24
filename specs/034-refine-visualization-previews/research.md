# Research: Refine Visualization Previews

## Decision: Correct captures through existing dashboard controls

**Rationale**: The dashboard already exposes the requested sport filters, date range
controls, equipment filters, Timeline modes, PB tiles, chart wrappers, and Heatmap
viewport. Reusing those controls keeps the correction faithful to the actual product
and avoids changing visualization behavior for users.

**Alternatives considered**:

- Redraw the previews manually: rejected because it would risk diverging from the
  dashboard's real controls and data presentation.
- Change dashboard defaults globally: rejected because the requested states are for
  landing previews and should not alter interactive user defaults.
- Add a new preview-rendering runtime: rejected because static replacement PNGs already
  satisfy the landing-page contract.

## Decision: Use explicit capture states and chart-specific crops

**Rationale**: The defects are state and framing problems. A capture record makes the
  exact Run/year, Bikes, Activities, 50 km, Rheinland, and axis visibility choices
  reproducible. Distributions and Workout Time require the full chart wrapper or a
  lower crop so x-axis labels are retained.

**Alternatives considered**:

- Capture the whole dashboard page: rejected because unrelated controls and footers
  reduce preview clarity and can expose personal context.
- Crop every asset to a fixed generic rectangle: rejected because chart heights and
  x-axis placement differ by visualization.

## Decision: Privacy-review geographic and equipment content

**Rationale**: Rheinland is an intentional geographic context, but exact routes and
  equipment names can identify the owner. The Heatmap capture must show the approved
  regional context without precise route disclosure; Bike labels must be readable or
  generalized according to the asset review.

**Alternatives considered**:

- Keep the prior abstract heatmap: rejected because it does not satisfy the requested
  Rheinland context.
- Publish unredacted labels/routes: rejected because the existing privacy contract
  forbids directly identifying source details.