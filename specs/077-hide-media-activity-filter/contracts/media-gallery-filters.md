# UI Contract: Media Gallery Filters

This contract covers the visible filter controls in the existing Media visualization. It does not change the Media tab or its export action.

## Controls

- The gallery exposes Year and Sport filters when its filter controls are rendered.
- The gallery does not render or populate an Activity filter, including before media are available or when no results match.
- Changing Year or Sport continues to filter the visible media and provides the existing empty-results feedback when appropriate.
- Media cards do not show pin/inspect icons or per-item Select checkboxes; clicking a card still opens its preview.

## Activity Context

- Activity associations remain attached to media.
- A user can still inspect associated activity details and follow available route navigation from a medium.
- Unassigned media remain visible and clearly identified; there is no Activity filter option for unassigned media.

## Export and Navigation

- Existing Media export remains available and summarizes only Year and Sport controls.
- The export-control summary does not list Activity or route inclusion as gallery controls.
- Recap and collage images never include route drawings; the gallery offers no route-inclusion option.
- A collage contains the readable media matching the active Year/Sport filters; there is no separate per-item selection state.
- Successful export preparation opens the existing preview without an additional "ready for local preview" status message.
- Tab IDs, tab order, dispatch, and navigation behavior remain unchanged.

## Verification

- Focused dashboard tests verify absent Activity control wiring and preserved Year/Sport filtering and linked details.
- Focused dashboard tests verify absent pin/select controls, working card previews, and filter-driven collage content.
- Static markup tests verify the Activity selector is absent and the Year/Sport controls remain.
- Export tests verify existing Media capture behavior remains available without Activity or route-inclusion controls and route drawings remain absent.
