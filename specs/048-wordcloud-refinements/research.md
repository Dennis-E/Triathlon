# Research: Wordcloud Sharing and Controls

## Decision: Reuse the established local visualization export flow

- **Decision**: Add Wordcloud to the app's existing tab-based export registration, title/filename configuration, data availability checks, control context, and export UI. Expose the same branded “Export for Insta / Strava” action used by existing visualization tabs; it opens the established local image preview and download flow rather than a remote publishing integration.
- **Rationale**: The project already has a consistent square-image preview/download path with branding and a user-visible no-data response. This satisfies the request for a share action while keeping the established privacy and interaction behavior.
- **Alternatives considered**: Add `navigator.share` or direct Instagram/Strava publishing (new permissions/platform behavior and not supported by the current requirements); add a button without a functional registered capture target (would violate Constitution Principle III).

## Decision: Capture only the rendered Wordcloud canvas and wait for layout completion

- **Decision**: Register the canvas as Wordcloud's export target and use the tab's exportable flag only when the renderer is supported, the selected-word set is nonempty, and the current cloud has completed rendering. Export capture must await the Wordcloud completion signal rather than relying solely on the existing fixed chart settle delay. The export composition continues to apply the existing title, square framing, branding, preview, and local-download rules.
- **Rationale**: The export pipeline captures the configured target element and then composes the branded image. Capturing only the canvas excludes the ranking panel, collapse rail, and interactive controls. Wordcloud placement is asynchronous, so waiting for completion prevents partial images after slider, checkbox, or resize changes.
- **Alternatives considered**: Capture the entire panel including the list and controls (does not match the request to share the visualization and causes inconsistent images when the list is collapsed); use a longer fixed delay (still unreliable for variable word counts or interrupted placement).

## Decision: Count Unicode letters, excluding tokens with fewer than two letters

- **Decision**: After existing Unicode normalization and case normalization, count Unicode letter code points in each token. Exclude tokens with fewer than two letters; combining marks do not count as additional letters. Use the same filtering in the ranked list, cloud, and exported image.
- **Rationale**: This implements “one-letter words” across German and other Unicode text, including letters with diacritics, without treating a decomposed accent as a second letter.
- **Alternatives considered**: Check JavaScript UTF-16 string length (miscounts astral Unicode letters and combining marks); exclude only ASCII single letters (does not satisfy locale-aware title processing).

## Decision: Increase the initial word count to 50

- **Decision**: Initialize the existing slider at 50, retaining its current 10–100 range. Show all available eligible terms if fewer than 50 exist. Preserve a user's selected count when switching away and back during the page session; changed input data follows the existing data-reset behavior.
- **Rationale**: 50 is a clear, testable increase from the previous default of 30 while remaining within the current supported range and the feature's 100-word rendering limit.
- **Alternatives considered**: Default to 100 (might overcrowd the initial visualization); use an adaptive ratio of available words (less predictable and less consistent across datasets).

## Decision: Collapse the ranked list responsively, resetting it open on tab activation

- **Decision**: Keep the ranking panel on the right on wide layouts. It starts expanded on initial load and resets to expanded every time Wordcloud is activated. The toggle collapses it to a narrow vertical rail on wide layouts and a compact horizontal control on narrow layouts. Collapsing does not discard term selection or rank state; resizing while collapsed preserves the current state until tab deactivation.
- **Rationale**: This directly implements the user's answers: open by default, compact the list to maximize canvas room, and reopen the list when returning to the Wordcloud tab. The responsive narrow control remains reachable and avoids page-level overflow.
- **Alternatives considered**: Persist collapse state across tab switches (rejected by clarification); remove the list entirely (users could not restore selections); show a vertical rail on mobile (too narrow and awkward to operate).

## Decision: Keep display-only state separate from frequency/ranking data

- **Decision**: Slider count, inclusion checkboxes, collapse state, and render-completion state are transient view state over the existing `processedActivities[].name` source. Collapse/expand changes only layout. Export reads the current canvas after the latest render completes. No titles, word lists, or generated images are sent to a service.
- **Rationale**: This preserves the existing local data model and avoids changing activity import, ranking semantics, or persistence behavior.
- **Alternatives considered**: Store panel collapse state in local storage or upload export content (not requested and adds persistence/privacy complexity).

## Project-wide convention

The new requirement is recorded normatively in Constitution Principle III and mirrored in `AGENTS.md`: each newly introduced visualization tab must include a working Share/Export action with capture-target registration, data/no-data behavior, wiring, and focused tests. A feature specification must explicitly justify any exception.
