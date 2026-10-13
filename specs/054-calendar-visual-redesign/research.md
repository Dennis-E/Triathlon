# Research: Training Calendar Visual Redesign

**Date**: 2026-10-13  
**Scope**: Resolve implementation choices for the approved UX requirements using existing repository behavior and the supplied GitHub contributions-calendar screenshot.

## Decision 1: Use an opaque, near-background dark token for zero activity

- **Decision**: Replace the bright translucent empty-day color with one shared opaque dark color token used by both calendar cells and the legend. Start with `#0B1220` against the current `slate-950` grid surface (`#020617`), then verify the rendered contrast is greater than 1.0:1 and no more than 1.2:1. Keep the token centralized in `src/training-calendar-utils.js`; renderer and legend should consume it rather than duplicate values.
- **Rationale**: The clarified requirement calls for a subtly visible cell, not a missing date or a bright gray tile. An opaque token produces stable contrast across the existing dark surface and export rendering; alpha colors vary with the compositing background. `#0B1220` is approximately 1.08:1 against `#020617`.
- **Alternatives considered**: Preserve the current `rgba(241,245,249,0.5)` (contradicts the request); use the exact background color (makes cells visually disappear); use transparent fill (background-dependent and less deterministic).

## Decision 2: Keep the existing date model; separate month header from the seven-day grid

- **Decision**: Reuse the existing Monday-first `weeks[].days` structure and newest-to-oldest multi-year model. Render one month-label row aligned to week columns, followed by seven weekday rows. Derive month labels from the week containing each month's first day, ensuring consistent column alignment.
- **Rationale**: The model already preserves real calendar dates, leap days, blank leading/trailing cells, and every intervening year. Only the presentation needs refinement. A separate aligned month row avoids making labels compete with day cells and follows the reference's compact weekly-column layout.
- **Alternatives considered**: Rewrite date generation or intensity aggregation (unnecessary and increases correctness risk); retain a per-week month label within each calendar cell column (makes long labels overlap and consumes grid height).

## Decision 3: Maintain compact year sections, horizontal navigation, and one shared legend below the grids

- **Decision**: Keep the summary and palette/sport controls before the calendars, stack all year sections newest-first, and keep each month header and its day grid together inside its horizontal scroll region. Move the compact zero-through-five-level Less-to-More legend to below the last year grid.
- **Rationale**: This preserves the product's multi-year behavior while adopting the reference's compact summary/control → grid → legend hierarchy. Keeping the month header inside the same scroll region preserves column alignment while scrolling.
- **Alternatives considered**: Adopt GitHub's single-year selector (conflicts with the existing product requirement); duplicate the legend for every year (unnecessary visual repetition); retain the legend above the grids (does not follow the supplied reference hierarchy).

## Decision 4: Preserve the existing export capture and interaction behavior

- **Decision**: Keep `trainingCalendarYears` as the export capture target and preserve the established local preview/download flow, palette/sport metadata, and tooltip suppression. Put the shared legend inside the capture area so it appears with the calendars. Manually verify the full horizontally scrollable/multi-year composition in the export preview; change export capture behavior only if the browser verification shows clipping.
- **Rationale**: The feature refines an existing visualization, and the app already registers its capture target and control state. Avoid introducing another export path or sending training data elsewhere.
- **Alternatives considered**: Add a new export target or service (unnecessary and violates focused scope); put the legend outside the target (causes the exported image to omit its key).

## Decision 5: Test pure data/color behavior with Jest and visual composition in the browser

- **Decision**: Extend the focused calendar utility and static page wiring tests; verify layout, keyboard focus, horizontal scrolling, and image preview in a locally served browser. Use synthetic activities for visual checks.
- **Rationale**: Root Jest runs in Node, not jsdom, so it can validate model semantics, stable color tokens, and source/markup wiring but not actual layout, focus rendering, or html2canvas output.
- **Alternatives considered**: Add a browser-test framework (out of scope for a focused change); rely on unit tests alone (cannot reveal CSS overflow or export cropping).

## Interface contract decision

No new external contract is introduced. This is an internal refinement to an existing static dashboard panel; preserve existing filter, day-tooltip, and export behavior rather than defining a new API contract.