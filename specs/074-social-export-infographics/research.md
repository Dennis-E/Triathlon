# Research: Social Export Infographics

**Feature**: [Social Export Infographics](./spec.md)
**Date**: 2026-10-30

## Decision 1: Extend the existing local capture and download pipeline

**Decision**: Continue using the current DOM snapshot and html2canvas capture, then compose the final infographic on a fixed-size Canvas. Keep the preview and download based on the same generated PNG data.

**Rationale**: `src/dashboard-export.js` already snapshots canvas/image content, isolates the capture target, handles export resources, renders a composed PNG, presents it in the preview, validates PNG data, and supports both a file picker and a download-link fallback. Replacing this path would duplicate working behavior and increase risk across every current export target.

**Alternatives considered**:
- Add a separate image-rendering library: rejected because the app already has the required capture and Canvas primitives and must avoid unnecessary runtime dependencies.
- Download directly from each visualization's chart/map renderer: rejected because it would bypass the shared branded composition and preview/download parity.

## Decision 2: Use one immutable export snapshot for both formats and both outputs

**Decision**: At export start, capture the selected view and its relevant metadata into one request snapshot. Build the chosen format's final PNG once; show that image in preview and download those same bytes. Changing dashboard state after capture must not mutate the open preview.

**Rationale**: The current preview already displays the same data URL used for saving. Preserving that invariant makes the acceptance requirement directly testable and prevents races between filters, animations, map movement, preview, and download.

**Alternatives considered**:
- Re-render independently for preview and download: rejected because fonts, tiles, animation, or changed dashboard state can produce different outputs.
- Re-read current UI state at download time: rejected because the preview could then differ from the downloaded image.

## Decision 3: Keep family-specific data access at existing dashboard ownership boundaries

**Decision**: Reuse the selected view's current computed values and filters. Provide explicit read-only metadata for headline, optional central value, sport, metric, period, units, labels, and series where existing DOM/chart state is insufficient. Do not recalculate training analytics in the export layer or infer an achievement from chart shape.

**Rationale**: `dashboard-export.js` currently gathers display titles and some filter context, while each dashboard owns the selected metric and rendered data. Explicit view metadata prevents label/unit drift and preserves the existing analysis as the source of truth.

**Alternatives considered**:
- Parse chart labels or nearby UI text as the authoritative data model: rejected because presentation text can be truncated, localized, or out of sync with underlying values.
- Duplicate aggregation and PB calculations in the exporter: rejected because it creates a second source of truth and risks changing analysis semantics.

## Decision 4: Share a format-aware layout engine, with specialized family render data

**Decision**: Add pure format/layout helpers to `src/export-utils.js`; keep canvas drawing and DOM capture in `src/dashboard-export.js`. Define explicit family presentation metadata for the six detailed families, while routing all other current export targets through the common social structure and retaining their meaningful visualization.

**Rationale**: The utility module already owns pure layout helpers and is tested in Node; the dashboard export file is the current browser orchestration boundary. A common layout contract reduces drift across the current target list without forcing unlike chart data into a single analysis model.

**Alternatives considered**:
- Make each dashboard independently draw and download a complete post: rejected because format, branding, accessibility, and preview behavior would diverge.
- Treat every view as a generic screenshot: rejected because six families have explicit data, ranking, milestone, and map requirements.

## Decision 5: Preserve the user's heatmap viewport rather than refit routes during export

**Decision**: Snapshot the exact map view selected by the user through pan/zoom and render that geographic extent into the selected format without calling fit-to-routes or changing the user's live map state. Fit the captured viewport proportionally inside the designed map region; do not crop routes to fill a different aspect ratio. Aim for the 65% usable-height requirement when possible, but exact geographic bounds take precedence. Preview and PNG use the same captured map image.

**Rationale**: The user clarified that scrolling and zooming define the desired crop and that the 65% height target cannot override it. The current `captureAtExportSize()` temporarily resizes the live map to 960 × 500 while preserving center and zoom; changing map dimensions can change geographic bounds, so center/zoom alone is not a sufficient viewport invariant. The map renderer must preserve the selected bounds and restore any temporary capture state even on failure.

**Alternatives considered**:
- Automatically fit all route bounds: rejected because it discards the user's chosen view.
- Preserve center and zoom but resize the map before capture: rejected because the changed aspect ratio can expose a different geographic extent.
- Stretch or crop the captured map to fill the export box: rejected because it distorts map geometry or omits part of the selected viewport.

## Decision 6: Treat maps, images, and fonts as required export resources

**Decision**: Wait for the selected export's required images, visible map tiles, and active fonts before final composition. Surface a clear retryable error when a required resource fails; never expose a partial PNG as a successful download. Use the existing brand asset set and font family unless the feature adds an explicitly loaded font.

**Rationale**: The current code rejects failed brand-image loads, but caches the rejected promise and waits only a fixed short interval for heatmap tiles. The feature requires reliable image completeness and font readiness. Resource readiness must be scoped to assets used by the selected export and errors must preserve local processing.

**Alternatives considered**:
- Continue after a fixed delay regardless of tile state: rejected because slow networks can yield incomplete maps.
- Allow missing assets and download a degraded image: rejected by the specification's explicit resource-failure rule.

## Decision 7: Validate with Node/Jest plus browser visual acceptance

**Decision**: Unit-test deterministic helpers and orchestration through existing injected/VM harnesses under the Node Jest environment; verify real Canvas, html2canvas, map tiles, font readiness, and 360 px readability in the browser.

**Rationale**: Jest is configured for Node rather than jsdom, while DOM and third-party rendering are browser concerns. Both levels are required: unit tests for deterministic behavior, browser checks for rendered pixels and resource integration.

**Alternatives considered**:
- Rely only on unit tests: rejected because Node tests cannot establish actual text rendering, tile capture, contrast, or visual clipping.
- Add a browser test framework as part of this feature: deferred because the repository has no such dependency and browser acceptance can initially be performed using the existing local app/browser workflow.