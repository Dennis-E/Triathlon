# Quickstart: Validate Viewport Cues and Vertical Filter Navigation

## Prerequisites

- Node.js and root npm dependencies are available.
- Serve the repository root as the existing static browser application.
- Use a synthetic/local activity dataset; do not commit personal training exports.

## Automated Validation

Run the focused dashboard integration suite:

```powershell
npm test -- --runInBand __tests__/index-script-syntax.test.js
```

Expected result: cue markup, viewport positioning hooks, key dispatch, focus arbitration, filter summaries, reduced-motion behavior, and script syntax assertions pass.

## Browser Validation

1. Start the app with `python -m http.server 8000` and open `http://localhost:8000`.
2. Import one or more synthetic activities locally and open a visualization taller than the browser viewport.
3. At the top, middle, and bottom of the visualization, verify all four cues remain visible. Confirm the left/right cue centers remain within 24 px of the viewport's vertical midpoint.
4. Repeat at a desktop viewport (for example 1280x800) and a narrow viewport (for example 390x844). Confirm cues remain inside the viewport and do not obscure essential chart data, labels, or controls.
5. Focus a filter choice and use Up/Down. Confirm only that group changes, focus follows the selected choice, the chart and filter summary update, the page does not scroll, and only the matching cue shows success feedback.
6. With a visualization active and no filter choice focused, focus a non-native control outside the visualization and use Up/Down. Confirm the first eligible filter group in displayed order changes and focus moves to the selected choice.
7. Focus a native select, range, or checkbox; then open a modal. Confirm their established key and focus behavior remains intact and no dashboard fallback filter is changed.
8. Open a visualization with no eligible filter group. Confirm Up/Down changes no unrelated filter and shows no success cue; the active dashboard does not scroll. With no active visualization, confirm normal browser arrow behavior.
9. Repeat a successful action with reduced motion enabled. Confirm feedback remains visible without animated blinking and clears within 1.5 seconds.

Expected result: cues stay viewport-visible throughout scrolling and resize, and vertical navigation changes only the eligible intended filter without scrolling the active dashboard.

## References

- Interaction and placement contract: [dashboard-navigation-cues.md](contracts/dashboard-navigation-cues.md)
- Transient UI entities and invariants: [data-model.md](data-model.md)