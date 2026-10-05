# Quickstart Validation: Wordcloud Sharing and Controls

## Prerequisites

- Node.js/npm installed at repository root.
- Serve the static application with `python -m http.server` from the repository root.
- Use synthetic activity titles for automated/browser test data; do not commit private exports or real workout titles.

## Automated validation

1. Run the focused wordcloud utility, dashboard contract, tab navigation, export utility, preview asset, and HTML script/wiring Jest tests.
2. Verify token tests exclude one-letter Latin and accented Unicode words (including decomposed accents), while retaining two-letter terms; verify ranks/counts for retained terms remain correct.
3. Verify the default count is 50, slider bounds remain 10–100, and available terms cap the rendered count when fewer than 50 exist.
4. Verify export utility metadata recognizes Wordcloud title and filename, and export registration reports no data for an empty/unavailable/incomplete cloud.
5. Run the full root suite with `npm test`; expected: all prior visualizations and export workflows remain unaffected.

## Browser validation

1. Start the static site and open `http://localhost:8000`; load/import a synthetic dataset with one-letter tokens and at least 50 distinct eligible terms.
2. Activate Wordcloud. Confirm one-letter tokens are absent, default N is 50, and the ranked list is expanded.
3. Collapse the list at a wide viewport. Confirm a narrow right-side rail remains, the cloud grows into the freed space, and checkbox state is preserved after expanding.
4. Re-enter Wordcloud after collapsing and leaving for another tab. Confirm the list resets to expanded while the user's count slider and included-word selections persist.
5. Resize to a narrow mobile viewport, collapse the list, and confirm it becomes a compact horizontal control with no page-level horizontal overflow; expand it again successfully with pointer and keyboard.
6. Change N, toggle a word, and wait for the cloud to finish rendering. Activate Share/Export and confirm the preview matches the current canvas, has the Wordcloud title and existing branding, excludes panel controls/list/rail, and downloads locally.
7. Verify Share/Export gives a clear no-data/unavailable message with no eligible words, no selected words, unsupported renderer, or in-progress/aborted layout; no blank export should appear.
8. Inspect network activity while exporting. Confirm neither workout titles, derived word data, nor the generated image is sent to a server.

## Validation record (2026-10-05)

- Focused Jest suites passed: 103 tests across the Wordcloud utility, dashboard, export utility, and HTML wiring suites.
- Root Jest suite passed: 543 tests across 25 suites.
- Browser smoke test with synthetic titles confirmed 50 as the initial limit, one-letter-token exclusion, and 43 available ranked terms for that fixture.
- At a 1280px viewport, collapsing the panel increased the canvas from about 867px to 1,099px while keeping the page within the viewport; on a 390px viewport the compact control remained visible without horizontal overflow.
- Re-entering Wordcloud reset the list to expanded while retaining the slider and checkbox choice. A populated export produced the existing branded 1080×1080 preview; a dataset with no eligible words showed the empty state and did not open an export preview.
- All browser test inputs were synthetic. The Wordcloud export code uses the local preview/download pipeline and adds no upload request for titles, terms, or generated images.
