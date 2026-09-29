# Research: Power PB and Landing Preview Polish

## Decision 1: Model the all-time profile as duration-category data in the detail view

**Decision**: Preserve the current compact chart's duration-ordered profile points as the single source for the all-time profile tile and its full-screen detail chart. Give the all-time profile detail model a profile-specific x-axis mode and provide each point's duration category/label alongside its watt value and activity context. Render category positions and duration ticks for this model; retain date/year axes for ordinary PB history charts.

**Rationale**: `src/dashboard-power-pb.js` builds the compact profile from duration-ordered points, but the maximize button currently maps those points to ordinary `{ date, value, title }` PB records. `renderPbDetailChart()` always maps dates to x positions and generates calendar ticks, explaining the incorrect years. The export action captures `#pbDetailCaptureTarget`, so it inherits the same erroneous chart. A distinct profile model avoids changing chronological charts for other PBs and keeps tile/detail/export values consistent.

**Alternatives considered**:

- Change the generic detail chart's x-axis to duration for every Bike power detail tile: rejected because duration-specific PB tiles show a record history over dates and must keep chronological axes.
- Build an independent export-only chart: rejected because export already captures the detail chart; a second renderer would risk visual/data divergence and duplicate work.
- Use dates as x positions with duration text only as decorative labels: rejected because the profile's plotted x positions would still express dates rather than durations.

## Decision 2: Keep profile data and selection logic unchanged; improve only its visible chart area

**Decision**: Keep `buildAllTimePowerProfile()` as the authority for one highest watt record per available duration and preserve point order/counts. Size the compact SVG responsively to the profile block's available inner content width while preserving its 360×136 viewBox aspect ratio; reserve a separate top line for the watt-axis title, retain readable tick labels, and draw a vertical measurement stem from each point to the duration axis.

**Rationale**: The request concerns the small tile's presentation, including its overflowing/stretching layout, overlapping watt title/ticks, and missing point-to-axis measurement lines. Proportional sizing prevents overflow and horizontal distortion while the axis title's dedicated row avoids label collisions. Existing profile values, ordering, labels, and record-selection behavior are already established and covered by tests; changing them is unnecessary and introduces data-regression risk.

**Alternatives considered**:

- Change PB point selection, tile placement, or watt scaling: rejected because the reported issue is chart presentation, and these changes could change interpretation or counts.
- Add a new chart dependency: rejected because the current SVG charting approach is adequate and project constitution requires static delivery without needless dependencies.

## Decision 3: Make sport title/chart pairs the responsive grid items

**Decision**: Keep the Personal Bests dashboard's shared sticky Swim/Bike/Run header for its three desktop columns. At mobile widths, hide that shared header and show a sport heading directly above each category cell's content in Run, Bike, Swim order. Preserve category content and the existing Swim/Bike/Run desktop column alignment.

**Rationale**: The reported fixed bar belongs to the actual dashboard, not the decorative Personal Bests preview card. Its desktop structure has category rows spanning three sport columns and a shared sticky heading; mobile needs per-cell headings repeated for each metric category so the single-column flow remains understandable.

**Alternatives considered**:

- Keep the shared header visible on mobile: rejected because it remains detached from each sport's category content in the one-column flow.
- Reorder the entire dashboard grid's columns with CSS alone: rejected because category rows, separators, and metric labels make global item ordering ambiguous; each category row needs its own responsive sport cells.

## Decision 4: Keep landing copy representative and concise

**Decision**: Replace the distance-only wording with a concise description that indicates PB progress spans multiple record dimensions, using representative examples only when accurate for the preview.

**Rationale**: The current landing card says “PB progression per distance across all three sports”, which implies distance is the only PB measure. The update should correct that expectation without committing to unsupported coverage claims or changing the dashboard.

**Alternatives considered**:

- List every PB category in the card: rejected because a long list is poor landing-card copy and would be brittle as categories evolve.
- Mention distance alone with broader generic wording elsewhere: rejected because it would leave the misleading card description in place.
