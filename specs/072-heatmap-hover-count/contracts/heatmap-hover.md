# Heatmap Hover UI Contract

## Scope

Defines the visible count and activity-summary behavior for an existing heatmap route hover. It does not change route matching, frequency calculation, map navigation, filters, or imported data.

## Interaction

- Hovering a route segment opens the existing activity tooltip.
- For a segment with more than 10 distinct contributing tracks, the first line is `# of tracks: N`, where `N` is the segment's distinct contributing activity count.
- Exactly 10 tracks does not meet the threshold. For 10 or fewer tracks, the track-count line and the existing count heading are omitted; activity rows and other applicable details remain available.
- If the activity tooltip model is sampled, its existing `Random 10 of N activities` explanation remains visible below the track-count line.
- When the pointer moves to another segment, visibility and count are recalculated for that segment; content from the previous segment is not retained.
- Leaving all route hit areas closes the tooltip according to existing behavior.
- A missing or invalid count does not display the track-count line.

## Data and privacy

The displayed number comes from the existing local tooltip model. This interaction makes no network requests and does not persist or export activity data.
