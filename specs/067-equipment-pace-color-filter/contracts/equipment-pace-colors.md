# Contract: Equipment Pace Color Selection and Rendering

## 1. UI Surface

- Add label wrapper `equipmentColorSchemeControl` and native select `equipmentColorScheme` beside the existing Equipment metric/type controls in `index.html`.
- Match the existing distribution/pie Color scheme label, classes, and `data-filter-summary` conventions. Use `data-filter-label="Colour scheme"` as those views do.
- Options: `fire` / `On fire` (initial), `monochrome-blue` / `Monochrome blue`.
- Select change invokes the classic-script global `setEquipmentColorScheme(this.value)`.
- Wrapper is visible only for metric `pace` with Shoes or Bikes. Visibility and selected value synchronize even when the chart has no data. Hidden controls must not appear in the generic active-filter summary.
- Preserve native label association, focus, and keyboard behavior. No custom menu, new tab ID, script, or dispatch entry.

## 2. Additive Utility API

`equipmentUtils.getEquipmentPaceColorRange(rows)` is exposed through both existing CommonJS exports and the `window.equipmentUtils` bridge.

- Input: array of visible Equipment display rows for a single type, using the existing `speedKmh` field.
- Valid entries: finite numeric `speedKmh > 0`; ignore missing entries and invalid field values without coercing strings into performance values.
- Output: `{ minSpeedKmh, maxSpeedKmh }` or `null` for an empty/all-invalid array.
- Equal bounds are retained. Do not collapse close distinct values by an arbitrary epsilon.
- No mutation, ordering change, palette lookup, DOM access, or canvas dependency.
- Existing helper signatures and behavior remain unchanged. Caller, not the helper, determines displayed type/rows.

## 3. State and Rendering

- Local `selectedEquipmentColorScheme` defaults to `fire`; setter accepts the two supported values, falls back to `fire` otherwise, and rerenders.
- Filter, metric, and tab navigation do not reset this variable during the loaded session.
- Existing performance aggregation, display row processing, `barValue`, labels, tooltips, units, axis, and sorting remain unchanged.
- Fire drawing uses the range from the current displayed valid rows, not the previous view or all imported equipment.
- The chart-local drawing hook computes shared gradient geometry after layout with `chart.scales.x.getPixelForValue(...)` using logical chart coordinates.
- Start at `minSpeedKmh / maxSpeedKmh`, end at `1`. Stops use `getFireGradientColor(0)`, `getFireGradientColor(0.5)`, and `getFireGradientColor(1)`.
- Preserve resolved bar options other than fill; do not mutate options shared with another chart or palette. Recompute after resize/layout changes rather than caching stale pixel positions.
- Single/equal valid performances receive `getFireGradientColor(0)`. Unavailable pixel geometry safely falls back to that color until a valid draw. No empty-gradient creation or nonfinite canvas coordinates.
- Monochrome blue uses `getDistributionColor(0, 'monochrome-blue')`, currently `#2563EB`, without any retained fire stops.
- All uses existing Shoes/Bikes colors, `#8B5CF6` and `#14B8A6`, independent of retained scheme. Other metrics, timeline, and yearly charts are unaffected.
- Disable animation only for the Equipment Pace chart so scheme switching and immediate capture use settled geometry.
- If no valid rows remain after display validation, show the established empty state and do not construct a comparative gradient.

## 4. Export Compatibility

- Keep the existing Equipment capture target `equipmentChartWrapper`, data/no-data gating, preview dialog, filename behavior, and PNG download flow.
- Capture the already rendered canvas; no export-only palette or bar reconstruction.
- Preview and downloaded PNG preserve the selected colors and clipped shared gradient, names, and values.
- No new color metadata, capture target, remote upload, export dependency, or global timeout change.

## 5. Required Discriminating Checks

| Check | Required result |
|-------|-----------------|
| Shoes 6:00, 5:00, 4:00 min/km | Speed range 10-15; endpoint fire positions 0, 0.4, 1; original bar values unchanged. |
| Bikes 20, 25, 30 km/h | Speed range 20-30; endpoint fire positions 0, 0.5, 1. |
| Shared x position in different bars | Equal fill color at equal chart x; shorter bars do not restart the gradient. |
| Single item or equal speeds | Yellow bars; finite geometry; no false ranking. |
| Close distinct speeds, e.g. 29.9 and 30 | Actual bounds retained; no zero-based color compression. |
| Invalid and empty rows | No invented range/value; existing empty/unavailable treatment. |
| Blue, All, other metric, return | Correct colors/control visibility at each step; retained eligible choice. |
| Resize and redraw | New pixel endpoints follow current scale and padding. |
| Immediate preview/download | Settled selected colors and visible fire progression in both images. |

For viewport-level pixel tests use resolvable ranges such as the shoe/bike examples above. Values separated by less than one drawable pixel cannot yield independently sampled endpoint pixels without changing the preserved bar geometry.