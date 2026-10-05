# Quickstart Validation: Workout Title Wordcloud

## Prerequisites

- Node.js/npm installed at repository root.
- A local static server for browser verification.
- Synthetic activity records for unit tests; do not use or commit a private export as a fixture.

## Automated validation

1. Run the focused pure-utility, tab-navigation, landing-preview, and HTML script-syntax tests after implementation. Expected: all pass, including cases for total occurrences, German/English stop words, Unicode and punctuation normalization, deterministic ranking, checkbox state, empty states, and the “And much more” tile.
2. Run a synthetic ranking smoke test with 5,000 activity titles. Measure ranking and control-driven top-N preparation with `performance.now()`; each update must take less than 1 second.
3. Run the complete root suite with `npm test`. Expected: no regressions in existing visualizations or dashboard navigation.

## Browser validation

1. Start the existing static app with `python -m http.server` from the repository root and open `http://localhost:8000`.
2. On the landing page at 390px and 1280px viewport widths, verify the “And much more” tile shows only the “Wordcloud” and “…” bullets, has no preview image/action, and causes no horizontal overflow.
3. Import an explicitly supplied local Strava export or synthetic activity CSV, open the Wordcloud tab, and verify top-ranked terms, frequency-scaled text, slider value 30, and counts beside the checkbox labels.
4. Confirm repeated occurrences within one title increase that word's count; common German/English function words and numeric-only tokens do not appear; equal counts tie-break alphabetically.
5. Uncheck/recheck words and adjust N. Confirm only checked terms render, choices persist for words still visible, newly entering words start checked, and list/cloud remain synchronized.
6. At a wide viewport verify list and cloud are side by side; at a narrow viewport verify they stack with no horizontal overflow.
7. Set N to 100 and verify the renderer shrinks words to fit where possible. If any checked terms remain unplaced, verify the cloud explicitly names them and their checkboxes remain available.
8. With 5,000 synthetic titles loaded, measure from opening the tab or changing the slider until the cloud reports render completion; each operation must finish in under 1 second. Exercise both the default N=30 and N=100.
9. Confirm no-data and no-checked-word states are clear; navigate into and out of the tab using click and keyboard controls; inspect network activity to verify activity titles/terms are not transmitted.
10. Block or disable the wordcloud2.js CDN resource and verify the dashboard shows a clear cloud-unavailable message while keeping the page usable.
