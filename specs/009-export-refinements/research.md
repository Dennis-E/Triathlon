# Research: Export Refinements

## Decision 1: Fit logos from their natural dimensions

**Decision**: Use a contain-fit calculation for each export logo inside a bounded rectangle, using the loaded image's natural width and height. Never pass independent width and height values that can distort the source.

**Rationale**: The existing `computeSquareFit` helper already demonstrates the required letterbox behavior, while the current canvas uses fixed rectangles that squeeze the wide Strava and TriAnalytica assets. A pure helper keeps the rule testable in the Node Jest environment.

**Alternatives considered**:
- Stretching to fixed rectangles: rejected because it visibly changes brand proportions.
- Cropping with cover-fit: rejected because it removes logo content.
- Replacing logos with new artwork: rejected because the existing assets are authoritative.

## Decision 2: Keep platform logos in controls only

**Decision**: Retain the Strava asset in each export control, enlarge it relative to the current icon, and use the exact label `Export for Insta / Strava`. Remove Strava and Instagram logo drawing from the generated composition and therefore from both preview and download.

**Rationale**: The request distinguishes the action control from the exported image. Keeping platform logos in the control communicates the action without adding unrelated branding to the shareable visualization.

**Alternatives considered**:
- Keep both logos in the image header: rejected by FR-008.
- Remove all logos including the control icon: rejected because the control must remain recognizable.
- Use text-only platform names: rejected because the request explicitly requires a larger Strava icon.

## Decision 3: Derive the available-controls picture from current UI controls

**Decision**: Build a controlled, non-interactive snapshot representation from the actual dashboard filter/view button labels and selected states, then render that representation into a bounded export region. Keep the active filter summary separately for the selected visualization.

**Rationale**: The previous export only captured active filter text and had no available-controls picture. Reading current labels/states avoids stale hardcoded illustrations while keeping the final image deterministic and non-interactive.

**Alternatives considered**:
- Add a static screenshot asset: rejected because labels and available views can change.
- Capture an arbitrary dashboard region: rejected because it can include unrelated content and browser layout noise.
- Make controls interactive in the export: rejected because a downloaded image cannot provide dashboard navigation.

## Decision 4: Move personal-best export ownership to the detail popup

**Decision**: Remove overview and collapsed-tile export actions. Add one export action to the expanded PB detail popup and construct its target from the current `activePbDetailModel`.

**Rationale**: The popup is the only state that unambiguously identifies the selected personal-best detail. This also prevents the overview from exposing an export action that would capture a much larger, less focused surface.

**Alternatives considered**:
- Keep tile-level buttons and add a popup button: rejected because it duplicates actions and violates the requested placement.
- Continue exporting `pbColumnsContainer`: rejected because it exports the full overview instead of the selected detail.
- Make the popup action export the last clicked tile: rejected because it can become stale after switching details.

## Decision 5: Validate behavior with pure tests, static assertions, and browser checks

**Decision**: Add utility tests for canonical domain, fit dimensions, and control metadata; update static inline-script assertions for markup and composition rules; manually validate generated pixels and responsive layout with the static server.

**Rationale**: The repository uses a Node Jest environment without jsdom or a canvas implementation. The split test strategy covers deterministic contracts in Jest and reserves real canvas/pixel and viewport checks for a browser.

**Alternatives considered**:
- Add a new browser test framework: rejected as unnecessary scope for this focused refinement.
- Test only with string replacement: rejected because logo geometry and viewport layout need visual verification.
- Test through the API service: rejected because the feature is entirely in the root static app and remains local.
