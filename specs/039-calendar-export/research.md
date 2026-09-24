# Research: Training Calendar Transparency and Export

## Decision: Use a 50% transparent empty-cell token

**Decision**: Represent empty calendar cells with an RGBA neutral token equivalent to approximately 50% opacity over the calendar background, while active palette colors remain opaque. Apply the same empty token in Green, Blue, and Fire and preserve it in export rendering.

**Rationale**: The requested result is that inactive days merge with the background without disappearing completely. A shared alpha token creates consistent hierarchy across palettes and exports.

**Alternatives considered**:
- Remove empty cells entirely — rejected because the full calendar grid and pauses must remain legible.
- Use a darker solid gray — rejected because it would continue to make empty days visually dominant.

## Decision: Reuse the existing branded image export flow

**Decision**: Register `trainingCalendar` in the existing export target map and render the complete `trainingCalendarYears` container through the current image-preview/download flow. Add the active palette and sport filter to the export context. Hide or exclude the local tooltip layer during capture.

**Rationale**: This preserves established branding, preview, filename, error, and download behavior without introducing a second export mechanism.

**Alternatives considered**:
- Build a standalone calendar download format — rejected because the request is for the visualization export and the repository already has a branded image workflow.
- Export raw activity data — rejected because the requested artifact is a visual calendar and raw personal data must remain local.

## Decision: Export the full multi-year container without clipping

**Decision**: Use the multi-year calendar container as the capture target and ensure its dimensions include every visible YearBlock, including empty years. The export target must not be the viewport-only panel or an individual year grid.

**Rationale**: The primary value of the refined calendar is cross-year comparison; capturing only the currently visible portion would silently omit years.

**Alternatives considered**:
- Export only the first visible year — rejected because it violates the multi-year export requirement.
- Export each year as separate files — rejected for v1 because the user expects one complete visualization.

## Decision: Keep export state local and fail without changing the calendar

**Decision**: The export remains client-side. If there is no data or capture fails, show the existing export error/toast behavior and leave the calendar and filters unchanged. Tooltip overlays are hidden or excluded for capture and restored afterward.

**Rationale**: This follows the privacy boundary and avoids export failures corrupting the dashboard state.

**Alternatives considered**: None; local-only behavior and recoverable errors are existing repository constraints.
