# Data Model: Hide Partial Country Coverage Note

## Scope

This feature changes only presentation. It introduces no entities, fields, relationships, persistence, or state transitions.

## Existing Country Summary

The renderer continues to consume the existing country summary without changing its shape:

| Field | Role | Feature behavior |
|---|---|---|
| `status` | Indicates partial, complete, or unavailable country coverage | Used only to preserve the existing state-specific display behavior. |
| `countryCount` | Count of distinct countries identified | Remains displayed as before. |
| `countryNames` | Identified country names | Remain displayed in the existing order. |
| `trackedActivityCount` | Activities with usable route data | Remains available in summary data; its partial-coverage sentence is not displayed. |
| `totalActivityCount` | Total activities considered | Remains available in summary data; its partial-coverage sentence is not displayed. |

No aggregation or validation changes are required.