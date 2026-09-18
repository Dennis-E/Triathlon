# Quickstart: Validate the Instagram-Ready Visualization Export

## Prerequisites

- Serve the app locally: `python -m http.server` from the repository root, then open
  `http://localhost:8000`.
- Import a Strava export (or use the app's example flow) so at least one activity of each
  sport (Run, Bike, Swim) is loaded, to exercise all six visualization tabs with real data.

## Automated checks

Run the narrowest relevant test command after implementing `src/export-utils.js`:

```powershell
npm test -- export-utils
```

This should cover, at minimum:

- Square-fit ("contain"/letterbox) math: given arbitrary source width/height, output is
  always square and the source content is fully contained (no dimension exceeds the target).
- Title text composition: produces the expected label per `sourceTab` value.
- Filename generation: matches `trianalytica-<tab-slug>-<yyyyMMdd-HHmmss>.png`.
- `hasExportableContent(...)`: returns `false` for each tab's known empty-state input and
  `true` once minimally populated input is provided.

Then run the full root suite to confirm no regressions:

```powershell
npm test
```

## Manual browser validation

1. **Per-tab presence**: Open each of the six visualization tabs in turn (Total Distance,
   Heart Rate & Pace, Equipment, Equipment Timeline, Personal Bests, Heatmap). Confirm each
   shows an export button in a consistent location.
2. **Happy path capture**: On a tab with data, click Export. Confirm:
   - A modal appears in-page within ~5 seconds (SC-001).
   - The previewed image is a 1:1 square containing that tab's chart/graphic and a title.
   - Switching tabs before exporting produces an image matching the newly active tab, not a
     previously viewed one (FR-007).
3. **Download**: From the preview modal, click Download. Confirm a `.png` file is saved
   locally and visually matches the modal preview.
4. **Close without action**: Reopen the modal, then Close it. Confirm no file is downloaded
   and a subsequent export still works normally.
5. **No-data state**: Before importing any data (or on a tab with no relevant records),
   click Export. Confirm an inline "nothing to export" message appears and no modal opens.
6. **Heatmap tile limitation**: On the Heatmap tab with GPS data, export and confirm the
   route overlay lines are visible in the image even if the base map background renders
   blank — this is the documented, accepted limitation from `research.md`, not a bug.
7. **Rapid double-click**: Click Export twice in quick succession on the same tab. Confirm
   only one modal/preview results, not two stacked modals.
8. **Small viewport**: Resize the browser to a narrow/mobile width and repeat step 2–3;
   confirm the modal, image, and buttons remain usable and legible.

## Expected outcome

All eight manual checks pass, and `npm test` (including the new `export-utils` tests) is
green, confirming FR-001 through FR-009 and SC-001 through SC-004 are met.
