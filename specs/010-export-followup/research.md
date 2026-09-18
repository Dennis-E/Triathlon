# Research: Export Follow-up Fixes

## Decision 1: Restore the Instagram asset in control markup

**Decision**: Keep the existing local Instagram asset and render controls in the order Strava icon, exact label, Instagram icon. Use the same structure for visualization controls and the PB popup control.

**Rationale**: The asset registry already contains `assets/Instagram_logo_2016.svg`; the regression is caused by its removal from markup, not a missing asset. A shared order makes the controls predictable and keeps the Instagram icon visibly to the right of the text.

**Alternatives considered**:
- Add Instagram back before the label: rejected because the request explicitly places it to the right of the text.
- Replace the icon with text: rejected because the supplied asset is the established brand cue.
- Put Instagram in the exported image: rejected because platform logos remain UI-control affordances only.

## Decision 2: Make metadata layout sequential

**Decision**: Treat filter text, available-control pills, and legend rows as sequential blocks. Each drawing helper returns the next available vertical coordinate; the legend starts after the actual preceding block, with a lower bound and footer boundary.

**Rationale**: Fixed y-coordinates cannot account for wrapped filters or variable control groups. Sequential placement directly prevents overlap and is deterministic enough for static tests.

**Alternatives considered**:
- Increase the whole metadata area without calculating positions: rejected because variable content can still overlap.
- Use CSS layout inside the final canvas: rejected because the final artifact is a canvas image.
- Omit the legend when filters are long: rejected because plotted measures remain important export context.

## Decision 3: Capture a stable PB wrapper

**Decision**: Capture a dedicated DOM wrapper containing the currently rendered PB detail chart rather than passing the raw SVG as the target. Build the target while the popup is open and keep the wrapper mounted until the asynchronous capture completes.

**Rationale**: The current error occurs only on PB popup export and the current target is the raw `pbDetailChart` SVG. A containing element gives html2canvas a browser layout box and preserves the selected detail's rendered context.

**Alternatives considered**:
- Capture the whole popup overlay: rejected because it includes controls and unrelated chrome.
- Re-render the PB chart into a separate canvas: rejected because it duplicates existing rendering logic.
- Capture the overview grid: rejected because it violates the selected-detail requirement.

## Decision 4: Keep failures retryable

**Decision**: Preserve the existing catch-path reset to idle, clear stale preview state before a new request, and provide a clear toast for capture errors. Do not swallow errors or leave the request state in `capturing`.

**Rationale**: A failed browser capture must not disable later exports, especially when users retry after a transient asset or layout issue.

**Alternatives considered**:
- Reload the page after failure: rejected because it discards the user's dashboard session.
- Silently retry indefinitely: rejected because it hides persistent asset or capture problems.
