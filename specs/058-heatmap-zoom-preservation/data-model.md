# Data Model: Heatmap Zoom Preservation

## Entities

### Map View

The transient Leaflet viewport currently selected by the user.

| Field | Meaning | Validation / lifecycle |
|---|---|---|
| Geographic center | Latitude and longitude at the visible map center | Owned by the existing map instance; unchanged by sport-filter renders |
| Zoom level | Current Leaflet zoom | Owned by the existing map instance; unchanged by sport-filter renders |

The feature does not serialize this state or introduce a second source of truth. User pan and
zoom actions remain authoritative.

### Sport Filter

The selected route subset: `All`, `Run`, `Bike`, or `Swim`.

| Field | Meaning | Validation / lifecycle |
|---|---|---|
| Selected sport | Current heatmap filter | Must remain one of the existing UI choices |
| Filtered routes | Route segments matching selected sport and current imported dataset | Recomputed on each filter selection; stale segments are replaced |
| Frequency scale | Legend/style values for the current filtered routes | Recomputed with the filtered routes; hidden/cleared on empty results as today |

### Viewport Fit Eligibility

Transient render state controlling whether the existing initial bounds fit should run.

| Field | Meaning | Validation / lifecycle |
|---|---|---|
| Current dataset identity | Reference to the imported dataset last observed by the heatmap renderer | A new imported dataset identity makes a fresh fit pending |
| Initial fit pending | Whether valid route bounds for the current dataset have yet been fitted | Starts pending; consumed only after a non-empty route set with valid bounds is rendered |

## Relationships

- One imported dataset supplies route data to the selected Sport Filter.
- One Leaflet Map View belongs to the existing heatmap map instance and remains stable through
  changes to the selected Sport Filter.
- A dataset identity change resets Viewport Fit Eligibility, not the map instance or the
  selected viewport immediately.
- An empty filtered route set changes the empty-state display but does not consume pending fit
  eligibility or discard Map View state.

## State Transitions

1. **Initial/replacement dataset observed**: initial fit becomes pending.
2. **Filter render with no matching routes**: show the established empty state; retain current
   center/zoom and leave a pending initial fit pending.
3. **Filter render with matching routes, fit pending**: show the map, replace route segments,
   refresh the frequency legend, fit current dataset bounds once, then clear pending status.
4. **Filter render with matching routes, fit already consumed**: show the map, replace route
   segments, refresh the frequency legend, and leave center/zoom unchanged.
5. **User pans/zooms**: Leaflet updates Map View; subsequent filter renders do not overwrite it.

## Invariants

- The displayed routes and frequency legend always correspond to the active sport filter.
- A sport-filter change on an unchanged dataset never changes the geographic center or zoom.
- Empty filter results do not erase the existing Map View.
- Each imported dataset receives at most one initial bounds fit, at the first render with
  usable route bounds.
