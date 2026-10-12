# Feature Specification: TrainingPeaks Data Import

**Feature Branch**: `053-trainingpeaks-import`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: Add TrainingPeaks data import alongside Strava, update the landing page with an explanation and export instructions, allow selecting multiple ZIP exports because each covers only 12 months, and adapt data preparation so visualizations work with both sources wherever possible.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import TrainingPeaks history (Priority: P1)

A TrainingPeaks user selects the TrainingPeaks import option and chooses one or more ZIP exports. Since each export contains at most 12 months, the user can select consecutive yearly exports together and import the history as one dataset. The user sees the resulting activities in the existing dashboards wherever the exported data provides the information those dashboards need.

**Why this priority**: Importing real TrainingPeaks data is the core user value; without it, the new data source cannot be used.

**Independent Test**: Select two valid TrainingPeaks ZIP exports covering different 12-month periods and verify that activities from both periods appear in the resulting dataset and relevant visualizations.

**Acceptance Scenarios**:

1. **Given** valid TrainingPeaks ZIP exports for two consecutive periods, **When** the user selects both in one import, **Then** activities from both archives are available together in the dashboards.
2. **Given** selected exports contain overlapping copies of the same workout, **When** they are imported together, **Then** the workout is not counted twice.
3. **Given** the user selects an invalid or unsupported ZIP alongside valid exports, **When** import validation runs, **Then** the user is told which file could not be processed and is not shown a silently incomplete dataset as a successful complete import.
4. **Given** an exported activity does not contain a metric needed by a visualization, **When** that visualization is opened, **Then** the missing metric is treated as unavailable rather than as a fabricated zero.
5. **Given** a valid TrainingPeaks archive, **When** it is imported, **Then** its contents are processed on the user's device and the archive contents are not sent to a server.
6. **Given** multiple TrainingPeaks archives are being imported, **When** processing takes time or fails, **Then** the user can see that the import is progressing or receive an actionable error identifying the affected archive.
7. **Given** a TrainingPeaks import succeeds, **When** the application updates its existing analysis counter, **Then** no workout fields or file contents are sent with that counter request, and workout data is not persisted to browser storage or an application database.
8. **Given** a selected TrainingPeaks ZIP contains a corrupt or unreadable FIT entry, **When** it is imported, **Then** the entire multi-ZIP operation fails with both the archive and entry identified, and the currently active dataset remains unchanged. A readable workout with an unsupported sport is skipped and included in the import's skipped-activity count rather than causing a parser failure.
9. **Given** the selected TrainingPeaks ZIPs contain compressed GPX route files alongside FIT workouts, **When** route timestamps identify one matching FIT session unambiguously, **Then** the route is attached to that session's activity; ambiguous routes are not attached to the wrong workout.

### User Story 2 - Continue using Strava import (Priority: P1)

A Strava user continues to select a Strava export and uses the existing dashboards without needing to change their workflow. The import experience makes the two supported sources clear and does not apply TrainingPeaks-specific archive expectations to Strava exports.

**Why this priority**: TrainingPeaks support must not disrupt the existing source or its users.

**Independent Test**: Import a known-good Strava ZIP using the updated landing-page flow and verify that its existing activity data and dashboards remain available.

**Acceptance Scenarios**:

1. **Given** the user chooses Strava, **When** they select a valid Strava export, **Then** it is imported through the existing Strava flow and produces the same supported data as before.
2. **Given** the user chooses TrainingPeaks, **When** they select one or more supported TrainingPeaks exports, **Then** the import flow applies TrainingPeaks-specific validation and guidance.

### User Story 3 - Find export instructions before importing (Priority: P2)

A user visiting the landing page can understand that TriAnalytica supports Strava and TrainingPeaks, what data is processed locally, and how to export TrainingPeaks workout history in ZIP files of up to 12 months each. The instructions explain that multiple period exports should be selected together for a longer history.

**Why this priority**: Clear source-specific instructions prevent failed imports and make the new capability discoverable.

**Independent Test**: Ask a user who has not used the importer to find the TrainingPeaks export instructions and identify how to import more than 12 months; verify the guidance is visible and actionable without starting an import.

**Acceptance Scenarios**:

1. **Given** a visitor on the landing page, **When** they look for supported data sources, **Then** they can distinguish Strava from TrainingPeaks and find the corresponding import option.
2. **Given** a user needs more than 12 months of TrainingPeaks history, **When** they read the export guidance, **Then** they understand they must create separate period ZIPs and select the relevant ZIPs together.
3. **Given** the page describes local processing, **When** a user reads the privacy wording, **Then** it accurately distinguishes local file processing from any other network requests the application may make.

### Edge Cases

- A user selects no files, a non-ZIP file, an empty archive, or an archive without recognizable TrainingPeaks workout data.
- One selected ZIP is unreadable while other selected ZIPs are valid; the result must not be presented as a complete history without clearly reporting the failure.
- A ZIP is readable but one contained FIT/GZIP entry is corrupt; the operation follows the all-or-nothing archive policy and names both the ZIP and failing entry.
- A FIT session parses successfully but has an unknown sport; it is not classified as Run/Bike/Swim and is counted in a user-visible skipped-activity summary.
- A compressed GPX route cannot be matched by its recorded timestamps to exactly one FIT session; the route is omitted without discarding its workout or attaching the route to another activity.
- Two exports contain the same workout because their date ranges overlap.
- Exports contain no workouts, unsupported activity types, incomplete metrics, or workouts without route or power data.
- The archives are valid but cover non-consecutive periods or are selected in an arbitrary order; activities must still be presented chronologically.
- A user selects an unusually large number or size of archives; the import must provide progress and a comprehensible failure rather than appearing unresponsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST offer TrainingPeaks as an import source while retaining the existing Strava import option.
- **FR-002**: The TrainingPeaks import MUST allow the user to select and import multiple ZIP exports in one operation.
- **FR-003**: The application MUST combine supported activities from all selected TrainingPeaks archives into one import result, regardless of archive selection order.
- **FR-004**: The application MUST recognize the TrainingPeaks export structure represented by the user-provided local sample, including gzip-compressed FIT workouts and optional gzip-compressed GPX routes, and give a clear, source-specific error for unsupported or unreadable exports. The private sample data MUST remain local and MUST NOT be added to version control.
- **FR-005**: The application MUST map TrainingPeaks FIT session information into the existing activity data model wherever equivalent information is present, including activity date, sport, duration, distance, and GPX route when available and unambiguously matched to the FIT session.
- **FR-006**: The application MUST make existing visualizations available for TrainingPeaks data when their required data is present and MUST handle unavailable fields without inventing values or breaking unrelated visualizations.
- **FR-007**: The application MUST avoid double-counting the same workout when it occurs in more than one selected archive.
- **FR-008**: If any selected archive is invalid, or if any contained FIT/GZIP workout entry cannot be read or parsed, the application MUST reject the entire multi-ZIP operation, identify both the archive and failing entry when applicable, and MUST NOT replace the active dataset or report a partial result as complete. A successfully parsed session with an unsupported sport MUST be skipped, never misclassified, and included in a visible skipped-activity count.
- **FR-009**: The application MUST process selected archive contents on the user's device; MUST NOT transmit raw archives or personal workout/activity fields to a server, including through the existing analysis-counter request; and MUST NOT persist imported workout data in browser storage or an application database. User-facing privacy text MUST NOT imply that the entire application makes no network requests.
- **FR-010**: The landing page MUST explain the supported import sources and provide TrainingPeaks export guidance, including that each ZIP covers no more than 12 months and multiple period exports can be selected together.
- **FR-011**: The TrainingPeaks export guidance MUST be checked against the currently available TrainingPeaks export flow before release and MUST describe steps users can follow without assuming a single fixed archive filename.
- **FR-012**: Existing Strava import behavior and the data it currently provides MUST remain supported.
- **FR-013**: The import flow MUST communicate progress and completion or actionable failure for multi-archive imports.

### Key Entities

- **Import source**: The selected provider, either Strava or TrainingPeaks, which determines the applicable archive expectations and user guidance.
- **TrainingPeaks export archive**: A ZIP containing exported workouts for a period of up to 12 months; multiple archives may contribute to one import.
- **Workout**: A dated activity with a sport and any available duration, distance, route, power, or other supported measurements.
- **Normalized activity dataset**: Activities from one selected source represented in the shared form consumed by the existing visualizations, preserving unavailable measurements as unavailable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can import two valid 12-month TrainingPeaks ZIP exports together and see workouts from both periods in one dashboard session.
- **SC-002**: In validation importing all seven supplied period ZIPs together, every supported workout appears in the resulting dataset, no workout duplicated across selected archives is counted more than once, and each unsupported-sport session is included in a skipped-activity count.
- **SC-003**: For every existing visualization whose required data is present in the TrainingPeaks sample, as enumerated in [quickstart.md](quickstart.md#visualisierungs-prüfmatrix), the visualization renders without a user-visible error; when required data is absent, the visualization shows its existing unavailable/empty state and missing measurements do not appear as fabricated zero values.
- **SC-004**: A user can locate the TrainingPeaks export instructions on the landing page and correctly determine how to export and import more than 12 months of history without assistance.
- **SC-005**: A known-good Strava export still imports successfully after the new source is added.
- **SC-006**: Automated and manual validation confirm that raw ZIP contents and normalized workout/activity fields are neither sent to application endpoints nor persisted in browser storage or an application database; the existing analysis counter continues to receive only its event metadata.

## Assumptions

- The seven TrainingPeaks ZIP files in the user-provided `private-data/` sample are the initial reference for the supported export structure; the files remain private, local-only test inputs and are not committed. Their observed contents include FIT.GZ workouts and GPX.GZ route exports, but no CSV.
- Users choose one import source per import operation. Combining Strava and TrainingPeaks activities into a single cross-source dataset is outside this feature unless separately requested.
- TrainingPeaks exports may not contain every field required by every existing visualization; support is conditional on the presence and compatibility of the required activity data.
- The TrainingPeaks export instructions will be verified against the export flow available when the feature is implemented, since provider interfaces may change.
- Existing application network behavior outside the handling of the selected workout files is not changed by this feature.
