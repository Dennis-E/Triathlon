# User Interface Contract: Import Status Badge

## TrainingPeaks success

- After a successful TrainingPeaks import, the top-right status badge displays exactly `Imported TrainingPeaks history`.
- The text is identical for one or multiple archives and regardless of skipped unsupported or undated workouts or unmatched routes.
- No archive count, activity count, skipped-item count, or skipped-item explanation appears in this success status, including during the transition from dataset application to import completion.

## Other outcomes

- Progress feedback remains in the import progress surface and is not replaced by the success text before import completion.
- Import failures continue to use the existing failure feedback and do not show a success status.
- Cancelling file selection does not show a TrainingPeaks success status.
- The Strava success status remains unchanged.
