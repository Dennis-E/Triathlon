# UI Behavior Contract: Heatmap Sport Filter

## Surface

The existing Heatmap view and its All Sports, Run, Bike, and Swim controls. No public network/API contract or new UI control is introduced.

## Filter transition

When a user selects a different sport:

1. Mark the selected sport control active.
2. Refresh route geometry, route frequencies, and the frequency legend for that selection.
3. Keep the map's geographic center and zoom at the values immediately preceding the selection.
4. Do not automatically fit the new result's overall geographic extent.
5. If the result contains no GPS-backed routes, show the existing empty state without changing the map view; a later populated selection is displayed at the retained view.

## Initial rendering boundary

Initial rendering continues to fit available routes using the existing behavior. This contract specifically covers sport-filter transitions on the current dataset; it does not prescribe viewport persistence across dataset replacement or page reload.

## Compatibility

Map pan/zoom gestures, filter labels, route selection semantics, and the existing no-route behavior remain unchanged. The filter redraw must not leave routes from the prior selection visible.
