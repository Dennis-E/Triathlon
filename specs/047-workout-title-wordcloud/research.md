# Research: Workout Title Wordcloud

## Decision: Use the existing processed activity titles as local-only input

- **Decision**: Derive the word frequency model from `processedActivities[].name`, which is already populated from Strava's activity-name column. Treat blank names and the generic `Activity` fallback as missing titles.
- **Rationale**: This avoids a second import path, preserves the current normalized activity model, and keeps personal title text in the browser.
- **Alternatives considered**: Re-read the source ZIP or persist a separate title dataset; both duplicate existing information and increase privacy and synchronization risk.

## Decision: Keep tokenization and ranking in a pure dual-target utility

- **Decision**: Add a DOM-free utility under `src/` with CommonJS exports for Jest and a `window.*` bridge for the browser. Keep module-local declarations isolated (for example, with an IIFE) to avoid lexical name collisions across classic browser scripts. Normalize Unicode and case, split punctuation, count every token occurrence, remove a fixed curated German/English function-word set, and sort by descending count then alphabetically for deterministic ties.
- **Rationale**: This follows existing testable utility conventions, directly captures the three accepted clarifications, and avoids runtime translation or network calls.
- **Alternatives considered**: Count distinct titles (rejected by clarification); rely on a remote NLP service or a large language package (violates local-data and dependency goals); use an opaque third-party stop-word package (unnecessary for a small fixed list).

## Decision: Use wordcloud2.js 1.2.3 for canvas placement, with a textual companion list

- **Decision**: Load `https://cdn.jsdelivr.net/npm/wordcloud@1.2.3/src/wordcloud2.js` from the established CDN-script pattern and pass only copied `[word, frequency]` pairs to it. Use a responsive canvas container, deterministic ordering (`shuffle: false`), horizontal text (`rotateRatio: 0`), logarithmically bounded font-size scaling, and `shrinkToFit: true` while keeping drawing within the panel. Track each `wordclouddrawn` result; any still-unplaced checked terms are named in a visible notice and remain selectable in the companion list. Keep a synchronized DOM checkbox list with each word and its count as the keyboard-accessible alternative and editing surface.
- **Rationale**: The project already loads browser libraries via CDN and has no build step. wordcloud2.js accepts a word/weight list and can render to canvas or DOM; its canvas mode provides actual spatial word-cloud placement without introducing a custom collision/packing algorithm. Its shrink-to-fit option helps maximize placement, and its per-word drawn result supports an explicit fallback rather than silent omission. The companion list avoids relying on canvas as the only representation or interaction surface.
- **Alternatives considered**: Chart.js (does not provide word placement); implement custom packing (substantial layout, collision, resizing, and cross-browser work); D3 cloud layout (additional D3 dependencies/build concerns and no clear benefit here); display a simple typographic list as a cloud (does not meet the requested visualization).
- **Source**: [wordcloud2.js README](https://github.com/timdream/wordcloud2.js) documents browser loading and `[word, size]` input; [API](https://github.com/timdream/wordcloud2.js/blob/gh-pages/API.md) documents canvas/DOM output, weighting, size/shape, and rendering events. The pinned jsDelivr distribution was confirmed available. The project retains its existing CDN network boundary; activity text remains in browser memory and is not sent to that library's host.

## Decision: Render controls and cloud as one responsive tab

- **Decision**: Add a Wordcloud navigation tab, button, panel, and render dispatch. On wide viewports, place the cloud and word-selection panel side by side; on narrow viewports, stack the word list below the canvas. Slider count defaults to 30 and ranges 10–100, bounded by the actual eligible count. When count changes, preserve checkbox choices for still-visible words and check newly admitted words by default.
- **Rationale**: This aligns with the accepted responsive layout and existing tab lifecycle. Rendering is refreshed from current processed activities when selected and on relevant control changes; no persistent preferences are added.
- **Alternatives considered**: Embed the visualization inside another tab (less discoverable and contradicts the request for a new visualization); save control state across imports or sessions (out of scope and potentially confusing when the source data changes).

## Decision: Keep “And much more” separate from data-dependent preview cards

- **Decision**: Add a responsive, non-interactive overview tile in the landing preview grid titled “And much more”, containing only the bullet keywords “Wordcloud” and “…”; do not assign it a preview image or `openDashboardTab` action. Update landing-preview tests to check the overview separately from the visualization preview-card/asset set.
- **Rationale**: The request describes a compact feature list, not a second entry point or fabricated preview. Keeping it separate preserves the existing one-preview-card/one-image assertions for actual previewable visualizations.
- **Alternatives considered**: Treat the tile as a Wordcloud preview card with a screenshot (contradicts the requested bullet-only contents); make it clickable (no distinct navigation behavior was requested).

## Decision: Keep rendering lifecycle and tests within existing browser/Jest boundaries

- **Decision**: Use a classic DOM-orchestration dashboard script loaded before dashboard tab dispatch, plus the pure utility tests, tab-navigation tests, dashboard integration assertions, preview/markup assertions, and script syntax checks. Do not add a bundler or a runtime service.
- **Rationale**: Matches the constitution and established dashboard file layout. The new tab must be included in tab constants, HTML button/panel IDs, keyboard navigation, render dispatch, and open-dashboard focus logic.
- **Alternatives considered**: Move the whole dashboard to a framework or use browser-only business logic, both contradict current test/runtime constraints.
