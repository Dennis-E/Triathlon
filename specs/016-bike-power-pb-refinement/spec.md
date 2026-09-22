# Feature Specification: Bike Power PB Refinement

**Feature Branch**: `016-bike-power-pb-refinement`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "the watt values are shown in the pb but not correctly. a) it should be a separate section below \"longest\" for \"Watt\" b) do not show the \"activity-average power progression\" you can also delete data and calculation for this if there is specific preparation ONLY for this. c) the average power progression by duration is good but arent typical power PBs also on shorter timeframes like 5 and 30 seconds, 1 min and 2 min? d) also create a visualization with the all time high PBS along x-axis of duration and y-axis os watt."

## Clarifications

### Session 2026-09-22

- Q: Soll das Allzeit-Powerprofil fehlende Zeitdauern einfach auslassen und die verbleibenden Punkte direkt verbinden? → A: Ja. Fehlende Zeitdauern werden ausgelassen; nur vorhandene Bestwerte werden verbunden.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Organize Bike Watt PBs clearly (Priority: P1)

A cyclist viewing Personal Bests wants a dedicated Watt section below the Bike "Longest" section, so power records are easy to find and are not mixed with distance records or shown as a misleading activity-average progression.

**Why this priority**: The current placement and activity-average card make the meaning of the Watt results unclear. Correct information architecture is the primary user need.

**Independent Test**: Load Bike data with power records, open Personal Bests, and verify that one clearly labeled Watt section appears below "Longest", while no activity-average power progression card appears.

**Acceptance Scenarios**:

1. **Given** Bike Personal Bests contain power data, **When** the user opens Personal Bests, **Then** the Bike column shows a dedicated Watt section after the Longest section.
2. **Given** the Watt section is displayed, **When** the user scans the Bike PB column, **Then** power cards are not presented as an activity-average progression and are not inserted before distance PBs.
3. **Given** no usable Bike power data exists, **When** the user opens Personal Bests, **Then** no empty Watt chart or misleading activity-average section is shown.

---

### User Story 2 - See meaningful power durations (Priority: P1)

A cyclist wants power PBs for both short explosive efforts and longer sustained efforts, so the duration view reflects common training and performance comparisons.

**Why this priority**: Restricting the view to long intervals hides meaningful sprint and short-effort achievements.

**Independent Test**: Load Bike power data covering the supported short and long intervals, open the Watt section, and verify that each duration with a qualifying effort has a labeled progression in watts.

**Acceptance Scenarios**:

1. **Given** qualifying Bike power data exists, **When** the user opens the Watt section, **Then** the supported durations include 5 seconds, 30 seconds, 1 minute, 2 minutes, 5 minutes, 10 minutes, 20 minutes, and 60 minutes.
2. **Given** a duration has no qualifying effort, **When** the user views the Watt section, **Then** that duration is omitted or clearly marked unavailable rather than rendered as an empty or fabricated PB.
3. **Given** a duration-specific PB is displayed, **When** the user inspects it, **Then** the value is labeled in watts and tied to the correct duration.

---

### User Story 3 - Understand the all-time power profile (Priority: P1)

A cyclist wants one visualization of the best watt value for each duration, with duration on the horizontal axis and watts on the vertical axis, to understand the shape of their power profile.

**Why this priority**: A duration-versus-power profile provides a compact comparison across sprint, short, and sustained capabilities beyond separate progression cards.

**Independent Test**: Load data with at least two qualifying duration PBs, open the Watt section, and verify that the all-time profile plots duration on the x-axis, watts on the y-axis, and one best value per available duration.

**Acceptance Scenarios**:

1. **Given** at least two duration-specific all-time PBs exist, **When** the user views the Watt section, **Then** a profile visualization plots duration along the x-axis and watts along the y-axis.
2. **Given** several records exist for one duration, **When** the profile is rendered, **Then** it uses only the all-time highest qualifying value for that duration.
3. **Given** only one duration has usable data, **When** the user views the profile area, **Then** the UI shows a clear limited-data state instead of implying a complete power profile.

### Edge Cases

- Average activity watts may exist in imported CSV data, but they must not create or reappear as an activity-average power progression in Personal Bests.
- Existing duration-specific FIT power data may cover only some durations; missing durations must not be filled from average activity watts, and their duration cards are omitted from the Watt section.
- A short interval can have missing or non-positive power samples; it must be excluded unless it meets the established valid-sample coverage rule.
- Duration labels must remain unambiguous between seconds, minutes, and hours.
- The profile must remain readable when durations are unevenly spaced and when one duration has a much higher watt value than the others; missing durations are omitted and are not estimated.
- Run and Swim PB sections, Bike distance/elevation/longest sections, and existing non-power behavior must remain unchanged.
- The profile must not claim a duration-specific PB from an activity-average value.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render Bike power records in a dedicated Watt section positioned below the Bike Longest section in Personal Bests.
- **FR-002**: The system MUST remove the activity-average power progression from the Personal Bests UI and MUST remove power-only data preparation or calculation that exists solely to support that progression.
- **FR-003**: The system MUST NOT use whole-activity average watts as a substitute for any duration-specific power PB or all-time profile point.
- **FR-004**: The system MUST support duration-specific Bike power PB categories for 5 seconds, 30 seconds, 1 minute, 2 minutes, 5 minutes, 10 minutes, 20 minutes, and 60 minutes.
- **FR-005**: The system MUST render a labeled watt progression for each supported duration with at least one qualifying duration-specific effort.
- **FR-006**: The system MUST omit a supported duration card when no qualifying effort exists, MUST show a limited-profile state when fewer than two durations are available, and MUST NOT fabricate a watt value.
- **FR-007**: The system MUST render an all-time power-profile visualization with duration on the x-axis and watts on the y-axis, omitting unsupported durations and connecting only available points.
- **FR-008**: The all-time power profile MUST use the highest qualifying duration-specific watt value for each available duration, with no duplicate points for the same duration, and MUST NOT estimate values for missing durations.
- **FR-009**: The system MUST label duration units and watt units unambiguously, including a visible `W` unit for power values.
- **FR-010**: The system MUST preserve the existing Bike distance, elevation, and Longest PB sections and all Run/Swim PB behavior.
- **FR-011**: The system MUST preserve the existing local-processing boundary; power data and generated visualizations MUST remain in the browser.
- **FR-012**: The system MUST retain the existing invalid-power and minimum-valid-sample handling so missing, non-numeric, zero, negative, or insufficiently covered efforts do not become PBs.

### Key Entities

- **Duration Power Category**: A supported interval definition with a stable label and duration in seconds, covering short and sustained Bike efforts.
- **Duration Power Personal Best**: The highest qualifying watt value for one duration, including date, activity context, interval source, and duration.
- **All-Time Power Profile**: The set of at most one highest duration-specific PB per supported duration, prepared for duration-versus-watts visualization.
- **Watt Section**: The dedicated Bike Personal Bests section below Longest containing duration cards and the all-time profile.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of representative Bike PB views with power data, reviewers find the Watt section below Longest without seeing an activity-average progression card.
- **SC-002**: In test data containing qualifying efforts across all supported durations, 100% of the eight duration categories are labeled correctly and show values in watts.
- **SC-003**: In 100% of profile-rendering tests, each available duration contributes at most one point and each point equals that duration's highest qualifying watt value.
- **SC-004**: In 100% of no-data and partial-data tests, unavailable durations produce no fabricated values and the profile communicates when fewer than two durations are available.
- **SC-005**: At least 90% of reviewers correctly identify the x-axis as duration and the y-axis as watts from the profile alone.
- **SC-006**: Existing non-power PB regression tests remain fully passing after the Watt section and profile changes.
- **SC-007**: No Bike power record or generated profile value is sent to a server as a result of this feature.

## Assumptions

- The existing Personal Bests panel and Bike column remain the destination; no new dashboard tab is required.
- “Average power progression by duration” refers to the existing duration-specific progression cards, not whole-activity average watts.
- The existing minimum-valid-sample coverage rule remains in force for all newly added short durations.
- FIT-derived duration-specific power is the source for the Watt PBs; CSV average watts remain available for other existing activity-detail uses but are out of scope for this PB section.
- The all-time profile is a companion visualization inside the Watt section and does not replace the individual duration progressions.
- Short durations are represented as seconds/minutes in labels while the internal comparison uses seconds.
