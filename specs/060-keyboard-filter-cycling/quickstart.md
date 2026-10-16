# Quickstart: Validate Keyboard Navigation for Visualization Filters

## Prerequisites

- Node.js and root npm dependencies are available.
- A browser can serve the repository as a static site using the existing project workflow.
- For meaningful chart checks, use a locally supplied activity dataset. Do not commit personal exports.

## Automated Validation

From the repository root, run the focused navigation tests:

```powershell
npm test -- --runInBand __tests__/tab-navigation.test.js
```

Run dashboard markup and script integration checks:

```powershell
npm test -- --runInBand __tests__/index-script-syntax.test.js
```

Expected result: tab and filter stepping tests pass, including wraparound and no-op boundaries; dashboard markup and combined browser scripts remain valid.

## Browser Validation

1. Serve the repository root with `python -m http.server` and open `http://localhost:8000`.
2. Import activity data locally and open the dashboard.
3. Focus a visualization tab. Press Right and Tab; confirm each activates and focuses the next visualization. Press Left and Shift+Tab; confirm each activates and focuses the previous visualization, including wraparound.
4. Press Tab or Shift+Tab from controls and modal dialogs outside the visualization tab list. Confirm normal focus traversal remains available.
5. Open a visualization with a visible button-based single-choice filter. Focus one choice and press Down/Up. Confirm only that group's value changes, the visualization and active-filter summary update, focus follows the selected choice, the page does not scroll, and the matching vertical cue briefly activates.
6. Focus a different filter group and repeat. Confirm the first group remains unchanged.
7. Test native select, range, and multi-select checkbox controls. Confirm their established behavior remains intact and no unrelated filter changes.
8. Test no focused eligible group, a disabled group, and a group with one available choice. Confirm there is no filter change or false success cue and unhandled keys preserve normal behavior.
9. Repeat successful key presses rapidly and with reduced motion enabled. Confirm the matching cue begins within 250 ms, retriggers, clears within 1.5 seconds, and remains perceivable without animated blinking when reduced motion is requested.
10. Open a visualization with no matching activity data but available filters. Confirm empty-state content, filter navigation, summaries, and cues remain coherent.

Expected result: actions occur only in their specified focus contexts; visualizations, selected controls, and summaries stay synchronized; cues provide brief directional feedback without obscuring content.

## References

- Keyboard behavior and context boundaries: [dashboard-keyboard-navigation.md](contracts/dashboard-keyboard-navigation.md)
- Transient UI entities and invariants: [data-model.md](data-model.md)