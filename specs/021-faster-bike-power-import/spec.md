# Feature Specification: Faster Bike Power Import

**Feature Branch**: `021-faster-bike-power-import`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "the import of the watt on bike is extremely slow. can this be improved?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Faster bike power extraction during import (Priority: P1)

As a user importing a Strava export ZIP that contains bike activities recorded with a power meter, I want the "Extracting bike power" step of the import to finish quickly, so that I don't have to wait excessively long before I can see my dashboard and power personal bests.

**Why this priority**: This is the exact pain point reported — the bike power extraction phase is perceived as extremely slow. It's the most valuable and most visible improvement to users with power-meter data.

**Independent Test**: Import a ZIP export containing a realistic number of bike activities with power data (e.g. 50-200 rides) and measure the time spent in the "Extracting bike power" stage before and after the change; it must be substantially shorter without changing the resulting power personal-best data.

**Acceptance Scenarios**:

1. **Given** a Strava export ZIP with bike activities that include FIT files with power data, **When** the user imports the ZIP, **Then** the bike power extraction phase completes noticeably faster than before, with no change to the computed power values or personal bests.
2. **Given** a Strava export ZIP with many bike activities (100+) with power data, **When** the user imports the ZIP, **Then** the total import time does not scale worse than the GPS track extraction phase operating on the same set of files.
3. **Given** a Strava export ZIP with no bike activities or no power data, **When** the user imports the ZIP, **Then** the bike power extraction phase is skipped or completes almost instantly, with no unnecessary work performed.

---

### User Story 2 - Accurate progress feedback during import (Priority: P2)

As a user, I want the import progress indicator to reflect real work being done during the bike power extraction phase, so that I can trust the app is progressing rather than stalled.

**Why this priority**: Once extraction is faster, users still need confidence the app isn't frozen during larger imports; accurate progress reporting supports that trust.

**Independent Test**: Import a ZIP with a known number of bike activities and observe that the progress percentage/stage message advances steadily and completes at 100% once extraction finishes, without long pauses at a fixed percentage.

**Acceptance Scenarios**:

1. **Given** an import with multiple bike activities containing power data, **When** the bike power extraction phase runs, **Then** the displayed stage message and percentage update incrementally as each activity is processed.

---

### User Story 3 - Import remains responsive for large histories (Priority: P3)

As a user with a multi-year training history, I want the browser tab to stay responsive while my large export is being imported, so that the page doesn't appear frozen or unresponsive during the bike power extraction phase.

**Why this priority**: Large imports are the scenario most likely to expose slowness; keeping the UI responsive is a secondary but valuable improvement once the core redundant work is eliminated.

**Independent Test**: Import a large export (500+ activities, a meaningful share being bike activities with power data) and confirm the page remains able to render progress updates throughout the bike power extraction phase.

**Acceptance Scenarios**:

1. **Given** a large export with many bike activities with power data, **When** the import runs, **Then** progress updates continue to appear and the tab does not become unresponsive for an extended period.

### Edge Cases

- What happens when a bike activity's FIT file has no power data at all (should be skipped without slowing down other activities)?
- How does the system handle corrupted or unreadable FIT files during bike power extraction (import must continue for the remaining activities)?
- What happens with a ZIP containing only non-bike activities (Run/Swim) — the bike power phase should add negligible time?
- What happens with gzip-compressed FIT files (`.fit.gz`) versus uncompressed `.fit` files — both must be handled without duplicating decompression work?
- What happens when the same activity file is needed for both GPS track extraction and bike power extraction — the underlying file data must not be read and parsed twice?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The import process MUST extract bike power effort data for bike activities without performing duplicate reading/parsing of the same source activity file that was already processed for GPS track extraction in the same import run.
- **FR-002**: The import process MUST produce bike power personal-best results identical to those produced before this change, for the same input data (no regression in correctness).
- **FR-003**: The import process MUST continue to skip individual bike activities whose file is missing, corrupted, or unreadable, without aborting the overall import.
- **FR-004**: The import process MUST report progress (stage message and percentage) for the bike power extraction phase that reflects the actual number of activities processed so far.
- **FR-005**: The import process MUST NOT increase the time required for non-bike or no-power-data imports compared to today.
- **FR-006**: The import process MUST scale so that the time spent extracting bike power is proportional to the number of bike activities with power data, not to redundant re-processing of already-handled files.

### Key Entities

- **Bike Power Effort**: A best-effort power value for a given duration derived from a bike activity's recorded power data, used to compute power personal bests.
- **Activity Source File**: The GPS/sensor file (FIT, optionally gzip-compressed) associated with one imported activity, used as input for both GPS track extraction and bike power extraction.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For an export containing 100 bike activities with power data, the time spent in the bike power extraction phase is reduced by at least 50% compared to the current behavior.
- **SC-002**: Importing an export with bike activities that include power data no longer takes noticeably longer overall than importing an equivalent export where those same files only need GPS track extraction (within roughly 10% of that time).
- **SC-003**: 100% of bike power personal-best values computed after the change match those computed before the change for the same input export.
- **SC-004**: Imports of exports with no bike activities or no power data show no measurable slowdown from the bike power extraction phase (adds no more than a negligible fixed overhead).

## Assumptions

- Both GPS track extraction and bike power extraction currently operate on the same underlying per-activity source files (FIT, optionally gzip-compressed) during a single import run.
- Eliminating redundant processing of the same source file is an acceptable and sufficient way to address the reported slowness; the exact technical approach is decided during planning.
- The existing progress percentage ranges allocated to each import stage may be adjusted as needed to reflect actual work distribution, without changing the overall import UX.
- No new file formats or data sources need to be supported as part of this improvement.
- Existing tests covering bike power extraction and personal-best calculation (see [__tests__/zip-importer.test.js](../../__tests__/zip-importer.test.js) and [__tests__/power-pb-utils.test.js](../../__tests__/power-pb-utils.test.js)) remain the source of truth for correctness and must continue to pass.
