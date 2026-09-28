# Research: Landing Preview and Navigation

**Feature**: `044-landing-preview-navigation`
**Date**: 2026-09-28

## Decisions

### 1. Preserve and verify the existing Workout Time preview

- **Decision**: Do not add a second preview card. The current `index.html` already includes the Workout Time card, preview image, descriptive text, and `openDashboardTab('workoutTime')` action. `__tests__/preview-assets.test.js` already asserts preview coverage and the asset.
- **Rationale**: Duplicate UI would make the landing page inconsistent and could create duplicate IDs. Existing tests already establish the intended entry and privacy boundaries. Confirm the card remains visible in a real landing-page check; if the reported absence reproduces in the deployed view, diagnose that discrepancy and repair the existing entry.
- **Alternatives considered**: Add another card (rejected as duplicative); change preview asset or card copy (not supported by the request/current evidence).

### 2. Place scroll controls around, not inside, the tablist

- **Decision**: Keep the existing `role="tablist"` and nine `role="tab"` elements. Put separately named, keyboard-focusable directional buttons as siblings around a width-constrained scrolling viewport containing the tablist.
- **Rationale**: This preserves valid tab semantics and the current roving-tabindex/pointer behavior while giving the scroll controls their own accessible purpose and normal keyboard focus. Controls do not replace or intercept arrow-key tab selection.
- **Keyboard compatibility**: The existing key handler also intercepts Tab/Shift+Tab and cycles the selected tab. To satisfy the new requirement that sibling scroll controls are keyboard reachable, stop intercepting Tab; retain ArrowLeft/ArrowRight for tab movement and allow normal browser focus traversal out of the tablist. This is a narrowly scoped accessibility correction required by the feature.
- **Alternatives considered**: Make scroll controls children of the tablist (rejected because they are not tabs and would pollute its keyboard/ARIA model); rely on horizontal touch scrolling only (rejected because explicit controls are required).

### 3. Reveal the nearest clipped tab per activation

- **Decision**: For rightward movement, reveal the first tab not fully visible on the right; for leftward movement, reveal the nearest tab not fully visible on the left. Scroll only the minimum distance needed to bring that target tab fully into view, bounded by the scroll viewport's start/end.
- **Rationale**: This implements the user's confirmed choice to reveal the next hidden entry without skipping tabs, works with variable label widths, and avoids a fixed pixel/page increment.
- **Alternatives considered**: Fixed distance/page scroll (rejected because it can skip several short tabs or barely move past a long one); jump to either end (rejected because it skips intermediate entries).

### 4. Derive control visibility from real overflow and scroll position

- **Decision**: Show the right control only when content extends past the viewport's right edge; show the left control only after content has moved past its left edge. Re-evaluate after scroll and size changes, using element dimensions and scroll position rather than viewport breakpoints.
- **Rationale**: A content-based check handles exact fit, different label lengths, and resize changes. A scroll listener plus resize observation/event handles user touch/trackpad scrolling and control activation without polling.
- **Layout stability**: Keep each control's layout slot reserved while it is visually hidden. Otherwise the left control appearing after the first scroll changes the viewport width and can clip the tab that the click just revealed. Determine edge availability from the first/last tab bounds, not residual viewport padding.
- **Alternatives considered**: Hard-coded viewport breakpoints (rejected because overflow depends on actual labels, zoom, and available container width); continuous polling (rejected as unnecessary work).

### 5. Keep test seams compatible with the existing Jest environment

- **Decision**: Keep DOM layout measurement and event orchestration in the existing dashboard script. Add the reusable next-clipped-tab selection as a pure helper in the existing CommonJS plus `window.*` navigation module. Cover deterministic decisions with mock geometry, markup wiring with existing source tests, and actual CSS/layout behavior with manual browser checks.
- **Rationale**: The project uses Jest's Node environment without jsdom. Pure/injected behavior remains unit-testable, while a real browser check is necessary to validate responsive dimensions and visibility.
- **Alternatives considered**: Add jsdom or a new browser-test stack (rejected as an unnecessary dependency and setup change for this focused feature).

## Repository Findings

- Landing cards use focusable buttons in `#previewCardsContainer`; the Workout Time entry and asset are already present and covered by `preview-assets.test.js`.
- Dashboard tabs are in an `inline-flex` tablist with no horizontal overflow wrapper or directional controls.
- `src/tab-navigation.js` defines `TAB_ORDER`, IDs, active/inactive tab updates, and existing ArrowLeft/ArrowRight/Tab behavior. `src/dashboard-tabs.js` wires those helpers to the page and owns dashboard DOM orchestration.
- `__tests__/tab-navigation.test.js` uses an injected mock document. `__tests__/index-script-syntax.test.js` protects HTML script wiring and page-level contracts.
- No external service, imported activity data, new persistence, dependency, or dashboard tab destination is needed.

## Resolved Unknowns

No implementation-blocking unknowns remain. Responsive behavior is content-measured rather than assigned to fixed breakpoints; the scroll step was clarified in the specification.