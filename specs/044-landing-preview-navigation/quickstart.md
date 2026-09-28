# Quickstart: Landing Preview and Navigation Validation

## Prerequisites

- Node.js/npm available in the repository environment.
- The static frontend served from the repository root; no frontend build is required.
- Use a desktop browser with responsive viewport tools or resize support.

## Automated checks

Run focused tests from the repository root:

```powershell
npm test -- --runInBand __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js __tests__/preview-assets.test.js
```

Expected result: all selected Jest suites pass. Navigation tests cover reveal-target and control-state decisions through injected/mock geometry; markup tests verify controls and preserved tab wiring; preview checks confirm the existing Workout Time card, asset, and destination remain available.

## Manual browser scenarios

1. Start the static site from the repository root, for example with `python -m http.server 8000`, and open `http://localhost:8000`.
2. Verify the landing page shows one Workout Time preview and selecting it without imported activity data retains the existing import gate. Confirm no duplicate Workout Time card is present.
3. Import an explicitly supplied local Strava export, then inspect the dashboard navigation at a wide width where all tab labels fit. Verify neither scroll control is displayed.
4. Reduce the viewport until tabs overflow. Verify page-level horizontal scrolling does not appear, the right `>>` control appears, and no tab text is covered.
5. Activate `>>` repeatedly. Each activation should expose the next clipped tab fully without skipping a tab. After moving right, verify `<<` appears; use it to reveal prior tabs in reverse order.
6. At each scroll boundary, verify the unavailable direction's control is hidden or unavailable. Manually swipe/trackpad-scroll the tab strip and confirm controls follow the actual scroll position.
7. Resize from overflowing to a width where all tabs fit again. Verify both controls disappear.
8. Use keyboard Tab/Shift+Tab to move through the sibling direction controls and tablist; activate controls with Enter/Space. Verify ArrowLeft/ArrowRight still move among tabs, Tab exits the tablist normally, selected tab/panel relationships still work, and focused tabs remain visible.
9. Repeat at narrow mobile width (including approximately 320–390 CSS pixels) and a wide desktop width; check for clipped labels, controls overlapping tabs, or page-level horizontal overflow.

## Completion evidence

- Focused Jest suites pass.
- Browser checks complete at a fitting width, an overflowing width, and after resize back to fitting.
- Workout Time preview remains a single, usable, privacy-safe card.
- No tab IDs/order/destinations or imported-data behavior changed.

## Browser validation record (2026-09-28)

- The Workout Time preview rendered once on the landing page; activating it without imported data opened the existing “Import Strava Data First” dialog.
- At 320px viewport width, the page remained 320px wide while the 132px navigation viewport revealed each clipped tab in sequence. Eight rightward activations reached the last tab; eight leftward activations returned to the first. Each activated target tab was fully visible, and the directional controls hid at their respective ends. The tab viewport scrollbar was visually hidden while native scrolling remained available.
- Keyboard Tab and Shift+Tab from the selected first tab reached the right and left scroll buttons when those buttons were available. Existing tab-arrow navigation remains covered by Jest tests.
- At 1440px viewport width, all tabs fit and both controls became visually hidden after resize state synchronization.
- Source review confirmed the change adds no dependency, data transfer, or new network request and preserves tab IDs, order, destinations, preview behavior, and the local import boundary.
- Automated result after implementation: `npm test -- --runInBand __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js __tests__/preview-assets.test.js` passed (3 suites, 79 tests). Run once more after final review if implementation changes.