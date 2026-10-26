# Data Model: Heatmap Color Schemes

## Color Scheme

Represents the visual preference used to render the existing heatmap for the active page
session.

| Field | Type | Rules |
|---|---|---|
| `id` | String enum | One of `blue-red`, `yellow-red`, `blue`, `black-fire`. |
| `label` | Display string | `Blue to Red`, `Yellow to Red`, `Blue`, or `Black + Fire`. |
| `routeColorStops` | Ordered color stops | Defines the route color at low-to-high normalized frequency positions. Each scheme must be monotonic and visible against its map presentation. |
| `mapPresentation` | Enum | `standard` for the first three schemes; `dark` for `black-fire`. |

The selected scheme is in-memory dashboard state. It defaults to `blue-red`, is retained
through sport-filter changes and redraws in the current page session, and is not persisted
across page reloads.

## Route Frequency Scale

Existing derived view state; it is not changed by this feature.

| Field | Type | Rules |
|---|---|---|
| `minCount` | Positive number | Minimum valid route visit count in the active sport view. |
| `maxCount` | Positive number | Maximum valid route visit count in the active sport view. |
| `logMin` / `logMax` | Number | Logarithms used to normalize route counts. |
| `hasRange` | Boolean | False when all visible routes have the same count. |

The scale is independent of the selected scheme. A route frequency is normalized once and
then mapped through the selected scheme's ordered color stops. Invalid counts and empty
views retain existing behavior.

## Route Segment

Existing derived map geometry; no new fields or persistence are introduced.

| Field | Type | Rules |
|---|---|---|
| `count` | Positive integer | Existing visit-frequency value after the active sport filter. |
| `coords` | Coordinate sequence | Existing route geometry, unchanged by color selection. |
| `activityIds` | String list | Existing activities contributing to this route segment, unchanged. |
| `color` | Color value | Derived at render time from `count`, the active logarithmic scale, and the selected scheme. |

## Frequency Guide

Existing display state derived from the route frequency scale and selected scheme. For a
varied range, its gradient uses the active scheme's route color stops and its accessible
description identifies the low, midpoint, and high frequency meanings. For a constant
range, its single swatch uses the active scheme's low-frequency color. It is hidden for an
empty filtered view.

## State Transitions

1. Initial page state selects `blue-red`.
2. Selecting a scheme updates the selected scheme, route colors, map presentation, guide,
   and export context without modifying route data or frequency values.
3. Selecting a sport rebuilds the frequency scale for that sport while retaining the
   selected scheme.
4. Selecting a non-dark scheme restores the standard map presentation.
5. Empty/no-GPS views keep the selected scheme in state but retain the existing empty state
   and hide misleading guide values.