# Data Model: Logarithmic Heatmap Colors

## Route Segment (existing, extended at render time)

Represents one aggregated piece of traveled route created by `buildRouteSegments()`.

| Field | Type | Rules |
|-------|------|-------|
| `key` | string | Stable, direction-independent segment identity |
| `coords` | pair of latitude/longitude pairs | Existing geographic endpoints |
| `count` | number | Positive visit frequency; unchanged by this feature |
| `color` | CSS color string | Ephemeral cached render value derived from `count` and the active scale |

`color` is attached only to the layer's rendered copy or equivalent render metadata. The
underlying frequency data remains unchanged.

## Frequency Color Scale

Derived once from all valid route-segment counts in the active sport-filter result.

| Field | Type | Rules |
|-------|------|-------|
| `minCount` | positive number | Lowest finite positive count |
| `maxCount` | positive number | Highest finite positive count |
| `logMin` | number | Natural logarithm of `minCount` |
| `logMax` | number | Natural logarithm of `maxCount` |
| `extremeStartCount` | positive number | $e^{logMin + 0.9(logMax-logMin)}$ when varied |
| `hasRange` | boolean | `true` only when `maxCount > minCount` |

### Validation

- Non-finite, zero, negative, missing, and non-numeric counts do not participate.
- No valid counts produces `null` rather than an invented domain.
- One valid value or several equal values produce `hasRange: false`, with minimum and maximum
  equal and no red classification.
- Scale derivation never mutates the input collection.

## Normalized Frequency

A finite value in $[0,1]$ representing one valid count's logarithmic position in a scale.

$$
t(c)=\operatorname{clamp}\left(\frac{\ln(c)-logMin}{logMax-logMin},0,1\right)
$$

- Constant domains normalize to `0`.
- Counts below/above the domain clamp to `0`/`1`.
- Invalid counts normalize to `0` as a defensive visible fallback and do not alter the scale.
- Values at or below `0.9` are non-extreme; values above `0.9` are extreme.

## Color Palette

| Role | Position | Default color |
|------|----------|---------------|
| Low frequency | `0` | `#60A5FA` |
| High, non-extreme frequency | `0.9` | `#1E3A8A` |
| Extreme frequency | `1` | `#DC2626` |

Colors between stops use deterministic channel-by-channel interpolation. Equal counts under
the same scale therefore always produce equal colors.

## Low-Zoom Route Aggregate (existing, extended)

Represents several nearby route segments as one stroke below the existing zoom threshold.

| Field | Type | Rules |
|-------|------|-------|
| `key` | string | Existing coarse-grid identity |
| `coords` | pair of latitude/longitude pairs | Existing representative endpoints |
| `count` | number | Existing sum of source counts, used for weight and opacity |
| `colorCount` | positive number | Maximum valid source `count`, used only for color |
| `color` | CSS color string | Cached from `colorCount` and the full-detail scale |

`colorCount` prevents the coarse bucket's sum from being mistaken for repeated travel over
one real route segment.

## Scale Guide

An in-map read-only representation of the active `Frequency Color Scale`.

| Field | Source | Display rule |
|-------|--------|--------------|
| Minimum label | `minCount` | Shown for varied data |
| Extreme-start label | `extremeStartCount` | Rounded up to the first whole visit count that is extreme |
| Maximum label | `maxCount` | Shown for varied data |
| Gradient | Palette stops | Shown only when `hasRange` is true |
| Constant value | `minCount` | Shown with one blue swatch when `hasRange` is false |
| Accessible label | All visible values | Describes low, frequent, and extreme meanings in text |

## Pure Function Contracts

### `computeRouteFrequencyScale(segments)`

- Accepts an object map or array of objects with `count`.
- Returns a `Frequency Color Scale` or `null` when no valid count exists.

### `normalizeRouteFrequency(count, scale)`

- Returns the clamped logarithmic position in $[0,1]$.
- Returns `0` for a missing/constant scale or invalid count.

### `computeRouteSegmentColor(count, scale, options?)`

- Returns a deterministic CSS hex color.
- Uses the default palette unless all three color stops are supplied through options.
- Returns light blue for invalid counts or a missing/constant scale.

## State Transitions

1. **Import or sport-filter change**: build full-detail segments, derive a new scale, cache
   full-detail colors, update the Canvas layer and legend together.
2. **First low-zoom draw after data change**: build aggregates, derive each `colorCount`, and
   cache aggregate colors against the existing full-detail scale.
3. **Pan/zoom redraw**: reuse the current scale and cached colors; do not recompute the domain.
4. **Empty filter result or map-load failure**: clear/hide the legend and retain the existing
   empty/error state.
