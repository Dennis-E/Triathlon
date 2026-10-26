# Research: Simplify Import Status

## Findings

- **Decision**: Keep the existing source-specific labels and use them as the complete success status for both import sources.
  - **Rationale**: The TrainingPeaks completion handler already reports `Imported TrainingPeaks history`; Strava currently appends its activity count in the shared dataset-application path. This aligns both success states without changing the import lifecycle.
  - **Alternatives considered**: Add counts to TrainingPeaks for symmetry; rejected because the request is to remove unnecessary status detail.

- **Decision**: Change only successful status text; preserve progress and failure feedback.
  - **Rationale**: Import progress and error messages communicate active or failed work and are explicitly outside the requested simplification.
  - **Alternatives considered**: Shorten all status messages; rejected because it would hide useful error and progress context.

- **Decision**: Keep status rendering and markup unchanged; test the import orchestration's supplied label.
  - **Rationale**: `updateStatusBadge` writes the supplied string directly to `#statusText`. The local behavior is controlled by the success-message construction in `src/dashboard-import.js`.
  - **Alternatives considered**: Add truncation or source-label logic to the shared renderer; rejected because that would affect unrelated status callers.

## Repository Evidence

- The header status badge is `#statusBadge` / `#statusText` in `index.html`.
- `src/dashboard-import.js` currently sends `Imported Strava history: N activities` after Strava dataset application and `Imported TrainingPeaks history` after TrainingPeaks completion.
- Existing focused tests in `__tests__/dashboard-import.test.js` assert those completion strings and can be updated with synthetic datasets.
- The specific media diagnostic summary included in the feature request was not found in the current HTML or JavaScript source. The accepted scope remains the successful header status; no unrelated diagnostic surfaces will be changed.

## Unknowns

None. The source labels, scope, status behavior, and narrow validation path are defined by the specification and current repository behavior.