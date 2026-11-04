# Data Model: Hide Media Activity Filter

## Scope

No imported media, activity, or association data changes. The feature changes only which filter state the Media gallery exposes and uses.

## Media Gallery Session

The gallery continues to hold transient UI state for the current page session.

| State | Meaning | Change |
| --- | --- | --- |
| `filters.year` | Selected media year or all years | Preserved |
| `filters.sport` | Selected sport or all sports | Preserved |
| `filters.activityId` | Selected activity or unassigned media | Removed from Media gallery session state |
| `includeRoutes` | Whether export images include route drawings | Removed; route drawings are always excluded |
| `selectedKeys` | Manually selected media for collage composition | Removed; collages use the active Year/Sport-filtered set |
| Activity associations | Media-to-activity identifiers used for context | Preserved |

Year and sport selection continue to filter the displayed assets. With no activity selection in gallery state, media remain visible regardless of whether they are associated with an activity. Collages use the readable assets in this filtered set. Export session state has no route opt-in; route drawings are never embedded in recap or collage images.

## Existing Entities

- **Medium**: Existing asset with its current date, sport, status, and activity associations; no fields are added or removed.
- **Activity**: Existing training record used to show details or route context for an associated medium; identity and lifecycle are unchanged.

No migration, persistent storage, import behavior, or public utility API change is required.
