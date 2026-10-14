# Quickstart: Validate Keyboard Dashboard Navigation

## Prerequisites

- Node.js and npm dependencies installed at the repository root.
- A browser for manual checks, served from the repository root with the existing static-server workflow.
- For meaningful chart/filter checks, an imported activity dataset. No private export file should be committed; use a locally supplied dataset or existing synthetic test fixtures.

## Automated validation

From the repository root, run the focused navigation test:

```powershell
npm test -- --runInBand __tests__/tab-navigation.test.js
```

Run the relevant dashboard markup/script integration checks:

```powershell
npm test -- --runInBand __tests__/index-script-syntax.test.js
```

Expected result: the existing left/right tab wrap behavior remains passing; vertical filter stepping and its no-op boundaries pass focused unit coverage; dashboard markup and inline script syntax validate.

## Browser validation

1. Start the static site using the project workflow (`python -m http.server`) and open `http://localhost:8000`.
2. Import a dataset locally and open the dashboard.
3. Focus the visualization tab list and press Left/Right repeatedly, including crossing both ends of the list. Confirm the selected visualization changes, focus follows the selected tab, and the corresponding side cue briefly flashes.
4. Open a visualization with multiple discrete button-based filter choices. Focus a choice in the active group and press Up/Down. Confirm only that filter value changes, the chart updates immediately, the summary above the visualization shows the new value, and the matching vertical cue briefly flashes.
5. Check views with native select, range, and checkbox filters. Confirm existing native control semantics remain available and unrelated filters do not change.
6. Focus a filter or tab and press an arrow where no movement/value change is available. Confirm there is no false success cue.
7. Repeat with reduced motion enabled in the operating system/browser. Confirm feedback remains perceivable without a blink animation.
8. Open a view with no matching activity data. Confirm available filters, empty states, summaries, and navigation cues remain coherent.
9. Verify successful directional feedback starts within 250 ms and returns to its inactive appearance within 1.5 seconds; when checking reduced motion, confirm the brief emphasis is static rather than animated.

Expected result: navigation responds only in its defined keyboard context; chart, filter summary, and selected control value stay synchronized; directional feedback is brief and does not obscure content or replace visible keyboard focus.
