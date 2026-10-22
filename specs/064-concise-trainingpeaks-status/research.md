# Research: Concise TrainingPeaks Import Status

## Findings

### Status ownership

- **Decision**: Keep one exact success message, `Imported TrainingPeaks history`, wherever the TrainingPeaks import flow updates the top-right status. Ensure the initial dataset-application update and the post-import completion update cannot expose archive, activity, skipped-workout, or unmatched-route details.
- **Rationale**: The current import flow updates the same status during dataset application and again after import completion. A consistent contract avoids a transient verbose status as well as a verbose final status.
- **Alternatives considered**: Changing only the final completion update would leave the earlier status update verbose. Keeping counts in the success string conflicts with the user's explicit request.

### Test approach

- **Decision**: Extend the existing Jest coverage in `__tests__/dashboard-import.test.js` for the DOM-orchestration import behavior and run that file as the focused gate.
- **Rationale**: The repository uses Jest's Node environment, and the nearby TrainingPeaks orchestration tests already provide the natural feature-level test home. The status-copy change needs no browser library or dependency.
- **Alternatives considered**: A new test file or browser automation would add setup without improving coverage for this narrowly scoped status change.

No unresolved technical questions or external research dependencies remain.
