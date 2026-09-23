# Feature Specification: Optimized Bike Power PB Import

**Feature Branch**: `023-optimize-power-pb-import`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Optimize rolling bike power personal-best processing so large Strava ZIP imports complete substantially faster while preserving existing results, progress behavior, and import resilience."

## Clarifications

### Session 2026-09-23

- Q: How should the 2-second performance target be validated reliably? → A: Verify scaling automatically and validate the 2-second limit with a documented manual browser benchmark.
- Q: How large should the synthetic multi-activity dataset be for the required performance test? → A: 100 bike activities.
- Q: What duration and recording density should each of the 100 synthetic bike activities use? → A: Two hours with one record per second.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import Power Histories Quickly (Priority: P1)

As an athlete with long rides or many years of bike activities, I want my Strava export to import in a practical amount of time so that recorded power data does not make the dashboard excessively slow to open.

**Why this priority**: Power personal-best processing is the remaining import bottleneck and directly affects users with the largest and most valuable training histories.

**Independent Test**: Import synthetic histories containing long bike activities with one-second power records and compare completion time and growth as the record count increases, independently of dashboard rendering.

**Acceptance Scenarios**:

1. **Given** a four-hour bike activity with one-second power records, **When** all supported power personal-best durations are calculated, **Then** processing completes within the performance target defined in SC-001.
2. **Given** equivalent power histories whose record counts increase proportionally, **When** their personal bests are calculated, **Then** processing time grows approximately in proportion to the number of records rather than quadratically.
3. **Given** a bike activity with no usable power values, **When** it is imported, **Then** power personal-best processing finishes with negligible additional delay and returns no power efforts.

---

### User Story 2 - Preserve Existing Power Results (Priority: P2)

As an athlete, I want faster imports to produce exactly the same power personal bests as before so that optimization does not change my training history or rankings.

**Why this priority**: A speed improvement is only acceptable when all existing power calculations remain trustworthy and comparable with prior imports.

**Independent Test**: Compare the resulting power efforts against the current behavior for regular, irregular, sparse, duplicate-timestamp, missing-power, invalid-power, tied-best, and short activity datasets.

**Acceptance Scenarios**:

1. **Given** the same valid power records, **When** the optimized and current calculations are compared, **Then** duration, average power, start and end times, start and end distances, and selected tied effort are identical for every supported duration.
2. **Given** records with missing or invalid power samples, **When** a duration window is evaluated, **Then** the existing 80 percent coverage rule and valid-sample averaging behavior remain unchanged.
3. **Given** multiple windows with the same highest average power, **When** the personal best is selected, **Then** the first qualifying window in activity order remains selected.

---

### User Story 3 - Keep Large Imports Responsive and Understandable (Priority: P3)

As an athlete importing a large archive, I want visible progress and a responsive page so that I can tell the import is still working.

**Why this priority**: Faster calculations reduce waiting, while continued progress feedback and responsiveness prevent large imports from appearing stalled.

**Independent Test**: Import a synthetic multi-year archive and observe progress events and page responsiveness throughout file processing and power personal-best calculation.

**Acceptance Scenarios**:

1. **Given** a large archive containing many bike activities, **When** the import runs, **Then** progress continues to advance through the activities without regressing or remaining unchanged for an extended processing period.
2. **Given** an individual activity file that is missing, corrupt, or unreadable, **When** the archive is imported, **Then** that activity is skipped and remaining activities continue to import.
3. **Given** a performance validation run, **When** its timing results are reviewed, **Then** file parsing, GPS processing, and power personal-best calculation can be distinguished so regressions can be attributed to the responsible phase.

### Edge Cases

- A bike activity contains no power field, only zero or negative values, or only non-finite values.
- Records arrive at irregular intervals or contain long gaps that reduce duration-window coverage below 80 percent.
- Multiple records have the same timestamp, or later records move backward in time or distance.
- The activity is shorter than one or more supported power durations.
- The final available sample falls exactly on a duration-window boundary.
- Multiple qualifying windows have exactly the same highest average power.
- A very long activity contains a mixture of valid and missing power samples.
- A FIT file is missing, corrupt, compressed, or unreadable while other files remain valid.
- The archive contains only non-bike activities or bike activities without power data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST calculate bike power personal bests for the existing supported durations of 5 seconds, 30 seconds, 1 minute, 2 minutes, 5 minutes, 10 minutes, 20 minutes, and 60 minutes.
- **FR-002**: The system MUST substantially reduce power personal-best processing time for long activities and large histories compared with the current behavior.
- **FR-003**: For standard FIT power records containing positive integer watt samples, power personal-best processing MUST scale approximately in proportion to the number of activity records for a fixed set of supported durations; non-integer public-helper inputs MUST preserve exact existing results but are outside the scaling target.
- **FR-004**: For identical input, the system MUST preserve the existing selected effort's target duration, average power, start time, end time, start distance, and end distance.
- **FR-005**: The system MUST preserve the existing requirement that a candidate duration window has at least 80 percent combined time and valid-power coverage.
- **FR-006**: The system MUST preserve the existing treatment of missing, zero, negative, non-numeric, and non-finite power values as unusable samples.
- **FR-007**: When multiple candidate windows share the highest average power, the system MUST preserve selection of the first qualifying window in activity order.
- **FR-008**: Activities with no usable power samples MUST produce no power efforts and MUST add no material power-processing delay.
- **FR-009**: GPS extraction results and import behavior for non-bike activities MUST remain unchanged.
- **FR-010**: Failure to read or process one activity file MUST NOT prevent remaining valid activities from being imported.
- **FR-011**: Import progress MUST be non-decreasing and MUST continue to reflect completed activity work during large imports.
- **FR-012**: Performance validation MUST separately report time spent on file parsing, GPS processing, and power personal-best calculation.
- **FR-013**: The optimized results MUST be verified against the current behavior using regular, irregular, sparse, duplicate-timestamp, missing-power, invalid-power, tied-best, and short activity datasets.
- **FR-014**: A reproducible performance validation MUST cover at least one synthetic four-hour bike activity with one-second records and a history of 100 synthetic two-hour bike activities with one record per second (720,000 records total).
- **FR-015**: Raw Strava exports and personal activity data MUST remain local to the browser; performance validation MUST use synthetic or explicitly supplied local data.

### Key Entities

- **Power Record**: A time-ordered activity sample containing elapsed time, distance, and an optional usable power value.
- **Power Duration**: One of the eight supported target periods for which a best effort is calculated.
- **Candidate Power Window**: A contiguous time range evaluated for a target duration, including observed span, sample coverage, valid power samples, average power, and boundary metadata.
- **Power Personal Best**: The highest qualifying average-power window selected for one activity and duration, including its time and distance boundaries.
- **Import Phase Timing**: A performance measurement associated with file parsing, GPS processing, or power personal-best calculation during a validation run.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a documented manual benchmark, all eight power durations for a synthetic four-hour ride containing one-second records are calculated in no more than 2 seconds on a current mainstream desktop browser after the activity records are available.
- **SC-002**: An automated scaling check using three warm-up runs and seven measured runs confirms that doubling otherwise equivalent standard FIT records with positive integer watt samples increases median calculation time by no more than 2.5 times.
- **SC-003**: Optimized output matches the current output for 100 percent of fields across all defined regression datasets and supported durations.
- **SC-004**: An activity with no usable power values completes power personal-best processing in no more than 100 milliseconds for a four-hour, one-second dataset.
- **SC-005**: A bike-heavy synthetic import spends at least 75 percent less time in power personal-best calculation than the current behavior on the same validation environment and data.
- **SC-006**: Large imports continue after every independently corrupted or unreadable test activity, with all remaining valid activities included in the result.
- **SC-007**: Progress values never decrease, and users receive an updated completed-activity indication throughout a multi-activity import without a processing pause longer than 2 seconds.
- **SC-008**: Every performance validation result identifies separate elapsed times for file parsing, GPS processing, and power personal-best calculation.

## Assumptions

- The current power personal-best output is the correctness baseline; this feature changes performance, not calculation meaning.
- The existing eight power durations and 80 percent coverage threshold remain product requirements.
- FIT power-meter samples are ordinarily positive integer watts; public callers may supply positive decimals, for which exact compatibility takes priority over the linear scaling target.
- Synthetic datasets are sufficient for automated correctness and performance validation; personal Strava exports are not committed to version control.
- A current mainstream desktop browser on ordinary consumer hardware is the reference environment for the stated time targets, with repeated runs summarized by their median.
- Additional background processing is optional and only becomes necessary if profiling after the core optimization shows that progress updates still pause beyond SC-007.
- Changes to dashboard visualizations, power-PB presentation, GPS geometry, CSV interpretation, and supported sport classification are outside this feature's scope.