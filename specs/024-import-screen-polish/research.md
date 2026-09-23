# Research: Import-Screen Polish

## Decision 1: Use prepared dashboard visualizations for import previews

- **Decision**: Rotate prepared, non-user-specific previews of visualizations that already exist in the TriAnalytica dashboard.
- **Rationale**: The clarified requirement explicitly chooses prepared previews. Existing preview cards in `index.html` already represent the product's actual visualization language, so the import screen can reuse that visual vocabulary without waiting for parsed user data or creating charts from incomplete state. The preview layer remains independent from import results and cannot change import timing or counts.
- **Alternatives considered**:
  - Live charts from partially imported data: rejected because short or incomplete imports would produce inconsistent previews and couple UI animation to data availability.
  - Generic placeholder illustrations: rejected because the requirement calls for real TriAnalytica visualizations.

## Decision 2: Keep import status ownership in the existing progress modal

- **Decision**: Keep one main import headline, the progress bar, and the black detail box; remove the secondary stage headline and use the black box for the current detailed stage. Add the prepared preview and rotating message as separate supporting content.
- **Rationale**: `index.html` owns the modal markup and `dashboard-import.js` owns progress updates. Preserving this boundary minimizes scope and keeps completion/error behavior intact.
- **Alternatives considered**:
  - Create a second modal or a separate import page: rejected because it would duplicate state and increase transition/error risks.
  - Put rotating copy in the headline: rejected because the headline must remain the single stable overall status.

## Decision 3: Segment FIT records by activity session time range

- **Decision**: For FIT files representing multiple sessions, derive one GPS track per imported child activity by selecting only records whose timestamps fall inside that activity's session interval. An activity without selected GPS points has no GPS-track entry.
- **Rationale**: The clarified requirement defines uniqueness per imported activity and explicitly prohibits attaching the full source track to every multisport child. The existing `gpsTracksByActivityId` map is already keyed by activity ID, so the change should preserve that public shape while changing how records are assigned.
- **Alternatives considered**:
  - Assign all FIT records to every child activity: rejected as the reported duplication/corruption bug.
  - Count one track per source file: rejected because a multisport source contains multiple independent activity sessions.
  - Split only by sport labels: rejected because time ranges are the required boundary and are more precise for transitions such as T1/T2.

## Decision 4: Preserve the current static-browser and test boundaries

- **Decision**: Keep UI orchestration in `index.html` and `src/dashboard-import.js`; keep reusable FIT segmentation helpers in `src/zip-importer.js` with CommonJS and browser-global compatibility; add focused Jest tests using synthetic FIT records.
- **Rationale**: This matches the constitution and existing module layout. Synthetic records avoid private exports and make exact segment membership testable in Node.
- **Alternatives considered**:
  - Add a bundler or browser test framework: rejected because it violates the static-browser project boundary and is unnecessary for the targeted logic.
