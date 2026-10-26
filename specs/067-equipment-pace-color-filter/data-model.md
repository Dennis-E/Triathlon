# Data Model: Equipment Pace Colors

## Existing Equipment Performance Row

Owned by `buildEquipmentPaceDisplay` in `src/equipment-utils.js`; do not change its existing public shape.

| Field | Meaning | Invariant |
|-------|---------|-----------|
| `name` | Display equipment name | Preserved across scheme switches. |
| `type` | Shoes or Bikes | Color comparisons never mix types. |
| `paceMinPerKm` | Aggregated minutes per kilometer | Finite and positive for valid performance. |
| `speedKmh` | `60 / paceMinPerKm` | Finite and positive; greater means faster for either type. |
| `barValue` | Speed divided by fastest speed of the same type | Existing value in `(0, 1]`; independent of chosen palette. |

Rows and ordering are read-only inputs to the color calculation. Invalid performances remain excluded by the existing display processing and are also ignored defensively by the new range helper.

## Equipment Color Selection

| Field | Values | Lifetime |
|-------|--------|----------|
| `selectedEquipmentColorScheme` | `fire`, `monochrome-blue` | In-memory Equipment orchestration state; initial `fire`. |

The setter normalizes unsupported input to `fire`, matching the existing distribution convention. No browser storage, imported-data mutation, or saved preference is introduced.

### State Transitions

| Event | Selection state | Visible result |
|-------|-----------------|----------------|
| Select supported scheme | Store selected value | Rerender eligible chart in that scheme. |
| Select unsupported scheme | Store `fire` | Use safe default when eligible. |
| Switch Shoes to Bikes or back | Retain | Recompute bounds from new visible rows. |
| Select All | Retain | Hide selector and use existing type colors. |
| Select non-Pace metric | Retain | Hide selector and retain existing metric presentation. |
| Return to eligible Pace view/tab | Retain | Synchronize select value and render retained scheme. |
| Import or reprocess data in the same loaded session | Retain | Derive a fresh range from current displayed rows. |
| Reload page | Reset to `fire` | No persistence guarantee across reloads. |

## Displayed Color Range

New pure derived value from `getEquipmentPaceColorRange(rows)`:

| Field | Meaning |
|-------|---------|
| `minSpeedKmh` | Slowest finite positive speed among the supplied visible rows. |
| `maxSpeedKmh` | Fastest finite positive speed among the supplied visible rows. |

Return `null` if no valid speed exists. Equal bounds are a valid degenerate range, not an error. The caller supplies exactly one equipment type; the helper does not filter activities, select types, sort, or mutate rows. Complexity is linear with constant auxiliary storage.

For distinct bounds, color position is `(speedKmh - minSpeedKmh) / (maxSpeedKmh - minSpeedKmh)`. This normalization does not replace `barValue` or change the chart axis.

## Derived Rendering State

- Eligibility: metric is `pace` and selected type is Shoes or Bikes.
- Gradient start: x-scale pixel at `minSpeedKmh / maxSpeedKmh`.
- Gradient end: x-scale pixel at `1`, the fastest displayed performance.
- Stops: existing fire palette at positions 0, 0.5, 1.
- Before the gradient start, canvas uses the yellow start color. Each bar clips the shared gradient at its own existing end.
- Degenerate range: yellow fill for all valid bars. Blue choice: constant existing monochrome blue.
- Missing drawable geometry: safe yellow fallback; derive geometry again on the next draw.

The gradient is an ephemeral canvas resource owned by the chart draw, not serializable application data. The existing captured PNG is the export artifact; no separate color data model or schema is required.