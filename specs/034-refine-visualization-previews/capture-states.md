# Preview Capture States

| Asset | Required state | Crop/visibility check | Privacy check |
|---|---|---|---|
| `assets/previews/heartrate-pace.png` | Run; focused 2021-2026 range | Points, pace axis, heart-rate axis visible | No identifying labels |
| `assets/previews/equipment.png` | Bikes only | Generalized Bike labels and bars readable | Original gear names replaced |
| `assets/previews/equipment-timeline.png` | Bikes only; Activities mode | Generalized Bike labels and activity bars visible | Original gear names replaced |
| `assets/previews/personal-bests.png` | 50 km PB tile/detail | 50k card, years, PB marker visible | No personal identifiers |
| `assets/previews/heatmap.png` | Rheinland-area view | Rheinland, Köln, Bonn, Koblenz context visible | Exact route geometry replaced |
| `assets/previews/distributions.png` | Length distribution | X-axis labels and units visible; 50+ bucket retained | No identifiers |
| `assets/previews/workout-time.png` | Day/start-time distribution | X-axis labels and units visible; start-time labels retained | No identifiers |

## Interpretation

The user's `201 vs 2026` wording is captured as a 2021-2026 range. If the source
dataset has insufficient Run heart-rate points in that range, retain the 2026 endpoint
and document the nearest populated range in this table.