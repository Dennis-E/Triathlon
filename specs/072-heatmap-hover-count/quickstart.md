# Quickstart: Heatmap Hover Count Threshold

## Prerequisites

- Node.js dependencies installed from the repository root.
- Run commands from the repository root.

## Focused validation

```powershell
npm test -- --runInBand __tests__/dashboard-heatmap.test.js __tests__/heatmap-utils.test.js
```

Expected result: both suites pass. Coverage must verify counts at 10 and 11, the visible label and exact count above the threshold, no count heading at or below the threshold, preservation of sampled-activity context, and removal of stale heading content when the hovered segment changes.

## Manual browser check

1. Serve the static app from the repository root with `python -m http.server 8000` and open `http://localhost:8000`.
2. Import local synthetic activity data containing heatmap segments with 10 and 11 distinct contributing tracks.
3. Hover each segment. At 10, verify that no count heading is shown and the activity details remain. At 11, verify that `# of tracks: 11` appears above the details and the sampling explanation remains visible.
4. Move directly from the 11-track segment to the 10-track segment and verify that the count heading disappears.

Use synthetic activity records for this check; do not add personal exports or raw Strava files to the repository.
