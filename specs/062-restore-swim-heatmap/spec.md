# Feature Specification: Restore Swim GPS Heatmap Visibility

**Feature Branch**: Current working branch (unchanged; no branch hook configured)

**Created**: 2026-10-20

**Status**: Draft

**Input**: User description: "on heatmap: GPS data for swim disappeared, is not shown anymore. since the trainingpeaks import was implemented. why didnt tests catch this? what is the problem? please heal it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recover Existing Swim Routes (Priority: P1)

As an athlete importing my Strava history, I want recorded outdoor swims to appear on the heatmap again so I can inspect where I trained without losing routes after an import update.

**Why this priority**: Missing routes make an existing visualization incomplete and undermine trust in imported history.

**Independent Test**: Import a synthetic history containing a standalone swim with a valid recorded route and conflicting activity-summary timing; confirm that the route appears without manually modifying the export.

**Acceptance Scenarios**:

1. **Given** an outdoor swim with at least two distinct valid recorded locations, **When** the athlete imports the history and opens the heatmap, **Then** its route appears in both All and Swim views.
2. **Given** a recording belonging only to one swim and summary times that differ from recording times, **When** the athlete imports it, **Then** summary timing alone does not remove or truncate the recorded route.
3. **Given** a standalone swim whose elapsed recording is longer than its moving duration, **When** it is imported, **Then** valid locations after the moving-duration cutoff remain available to the heatmap.
4. **Given** a standalone swim with valid locations but missing point timestamps, **When** it is imported, **Then** those locations are not rejected solely because timestamps are unavailable.

---

### User Story 2 - Preserve Correct Multisport Attribution (Priority: P1)

As a multisport athlete, I want shared recordings to retain correct swim, bike, and run attribution while standalone route visibility is restored.

**Why this priority**: Recovering swims must not mix routes between disciplines or regress existing TrainingPeaks support.

**Independent Test**: Import synthetic shared multisport recordings and separate sport recordings, then compare each sport view with the known routes.

**Acceptance Scenarios**:

1. **Given** one recording shared by swim, bike, and run activities with distinct supported activity boundaries, **When** the history is imported, **Then** each activity receives only locations belonging to its segment.
2. **Given** standalone run and bike recordings with conflicting summary timing, **When** imported, **Then** their valid routes remain available and bike power results are not restricted by unrelated summary cutoffs.
3. **Given** equivalent supported outdoor-swim histories from Strava and TrainingPeaks, **When** imported separately, **Then** both sources produce visible swim routes and retain the Swim classification.
4. **Given** a visible swim route, **When** the athlete uses the existing heatmap Share/Export action, **Then** the resulting image includes the selected route.

---

### User Story 3 - Explain and Prevent Recurrence (Priority: P2)

As a maintainer, I want an evidence-backed explanation and repeatable regression checks so future import changes cannot silently remove valid swim routes.

**Why this priority**: Passing tests did not protect the reported workflow; the missing coverage must be made explicit.

**Independent Test**: Reproduce the loss with synthetic data, demonstrate that the regression check fails before the correction and passes afterward, and review the explanation against that evidence.

**Acceptance Scenarios**:

1. **Given** a reproducible failing swim import, **When** the correction is delivered, **Then** its explanation identifies the route-loss condition and the missing test case, distinguishing demonstrated facts from assumptions about the user's files.
2. **Given** the new regression checks, **When** the route-loss behavior is reintroduced, **Then** at least one check fails specifically because a valid swim route is missing or truncated.
3. **Given** the corrected import, **When** all focused checks are run, **Then** standalone swim recovery, shared-recording attribution, existing bike power behavior, and heatmap sport selection pass.

### Edge Cases

- A pool swim or indoor activity without valid locations remains absent from the heatmap; no route is invented.
- A single valid location cannot form a route and must not be presented as one.
- Missing timestamps, localized summary dates, timezone differences, and pauses must not erase locations in a recording assigned to only one activity.
- Shared recordings with missing or ambiguous activity boundaries must not assign unverified points to a sport; omit records whose ownership cannot be established and document this limitation rather than assuming the current behavior is safe.
- Corrupt or unsupported individual Strava recordings do not prevent unrelated valid routes from importing. TrainingPeaks retains its existing all-or-nothing failure behavior for corrupt archives or recordings.
- Both compressed and uncompressed recordings retain existing supported behavior.
- Swim-only, mixed-sport, and no-GPS histories produce correct sport-filter and empty-state results.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST preserve the valid recorded route of a standalone supported swim despite disagreement between activity-summary timing and recording timing (Story 1, scenarios 1-4).
- **FR-002**: The heatmap MUST show imported swim routes in All and Swim views and exclude them from Bike and Run views (Story 1.1; swim-only and mixed-sport edge cases).
- **FR-003**: The system MUST distinguish recordings assigned to one activity from recordings shared by multiple activities, preserving correct sport attribution for shared recordings (Story 2.1).
- **FR-004**: The correction MUST preserve supported Strava and TrainingPeaks imports, standalone run and bike routes, and existing bike power results without introducing new summary-time truncation (Story 2.2-3).
- **FR-005**: Missing or invalid locations MUST NOT generate invented routes. Failures in individual Strava recordings MUST NOT suppress unrelated valid activities; TrainingPeaks MUST retain its existing complete-import failure behavior for corrupt archives or recordings (no-GPS and corrupt-recording edge cases).
- **FR-006**: Delivery MUST include repeatable synthetic regression checks covering standalone swim timing disagreement, shorter moving duration, missing point timestamps, and shared multisport attribution (Stories 1-3).
- **FR-007**: Delivery MUST include an evidence-backed root-cause and test-gap explanation, identifying any part of the user's reported history that cannot be confirmed without their data (Story 3.1).
- **FR-008**: The existing heatmap Share/Export workflow MUST remain usable for recovered swim routes without a new visualization tab (Story 2.4).
- **FR-009**: Import processing MUST remain local, and regression checks MUST NOT require committing personal exports or changing existing network/privacy boundaries (all synthetic import scenarios).

### Key Entities *(include if feature involves data)*

- **Imported activity**: A supported swim, bike, or run with an identity, source, summary timing, and recording association.
- **Activity recording**: Recorded locations and optional timestamps or performance measurements; may belong to one activity or be shared by several.
- **Activity boundary**: Evidence delimiting a child activity within a shared recording; distinct from the moving duration of an independently recorded activity.
- **Heatmap route**: The drawable locations associated with an activity and its normalized sport, selectable through existing sport filters.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of synthetic standalone-swim cases with a drawable route, including timing mismatch, shorter moving duration, and missing point timestamps, the route remains visible in both All and Swim views after one import.
- **SC-002**: In all synthetic shared-recording cases with known boundaries, zero route points are attributed to the wrong sport.
- **SC-003**: All focused compatibility cases for both import sources, standalone run/bike routes, and existing bike power results retain their expected outcomes.
- **SC-004**: At least one regression check fails under the demonstrated pre-correction behavior and passes after correction; the delivery explanation names both the demonstrated trigger and the previous coverage gap.
- **SC-005**: A recovered swim route can be inspected and exported using the existing heatmap controls without editing input files or adding user workflow steps.

## Assumptions

- The report describes a regression in previously supported outdoor-swim data, not a request to reconstruct GPS for pool swimming.
- A synthetic standalone-swim reproduction confirms that summary-based time filtering can remove a complete valid route: the previous extraction path retains a drawable route, while the current combined path returns none for identical inputs with differing summary and recording times. Whether this explains the user's particular export remains unconfirmed without their data.
- Existing import comparison checks omit summary time fields, while the shared-recording check uses aligned timestamps; regression coverage must include standalone swim recordings with realistic timing disagreement.
- Existing supported recording formats, sport normalization, route simplification, and shared-recording ownership rules remain in scope for compatibility, not redesign.
- Synthetic recordings are sufficient for initial reproduction; a personal export is not required or to be committed. Additional independent causes found later require explicit evidence.
- This specification defines a focused regression correction and its verification. New import sources, new tabs, map redesign, and unrelated parsing changes are out of scope.
- The existing heatmap, import flows, and Share/Export behavior are dependencies. No new persistence or external service is required.
- Planning clarification (2026-10-20): the user explicitly chose to preserve TrainingPeaks complete-import failure behavior rather than add partial imports. FR-005 and the corrupt-recording edge case reflect this decision.