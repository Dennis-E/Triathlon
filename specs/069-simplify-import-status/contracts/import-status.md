# UI Contract: Import Completion Status

## Successful Import

- The upper-right header status identifies the source with exactly one label:
  - Strava: `Imported Strava history`
  - TrainingPeaks: `Imported TrainingPeaks history`
- The success label contains no activity, archive, media, matching, or readability counts.
- The label remains distinguishable between the two supported sources.

## Other Lifecycle States

- In-progress status continues to show the existing progress information.
- Failed imports continue to show the existing failure information.
- Changing successful copy does not alter import results, progress behavior, or error handling.

## Scope Boundary

This contract applies only to the successful upper-right header status. It does not remove diagnostics shown elsewhere in the import experience and does not change the header layout or shared status renderer.