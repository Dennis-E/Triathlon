# Feature Specification: Silicon Valley Sample Training Data

**Feature Branch**: `main` (specification only; no feature branch requested)

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Create an exemplary training dataset for an athlete in Silicon Valley. Add a landing-page button labelled 'Use exemplary data' that loads the dataset so visitors can see what importing their own data will offer. Include enough fictional training history for meaningful multi-year views and attractive GPS route heatmaps. Store the dataset in a new folder, using a more natural English name than 'fictive data' if appropriate."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore Without Preparing an Export (Priority: P1)

As a first-time visitor, I can select "Use exemplary data" on the landing page and explore a populated dashboard without requesting an export, selecting files, or providing personal information.

**Why this priority**: Seeing real interactive results lets visitors decide whether preparing and importing their own training history is worthwhile.

**Independent Test**: Open the landing page in a fresh session, activate the example-data button, and verify that the regular dashboard opens with sample activities and working filters without a file-selection prompt.

**Acceptance Scenarios**:

1. **Given** a fresh landing-page session on desktop or mobile, **When** the visitor views the import choices, **Then** a keyboard-accessible button labelled exactly "Use exemplary data" is visible alongside those choices, and the existing import choices remain available.
2. **Given** no imported data, **When** the visitor activates the button, **Then** loading feedback appears and the regular interactive dashboard opens with the supplied sample dataset, without account creation, file selection, or manual extraction.
3. **Given** the sample dashboard, **When** the visitor filters a sport or year, changes an available visualization, or uses its existing Share/Export action, **Then** the interaction works as it does for equivalent imported data rather than displaying a fixed preview.
4. **Given** the sample dashboard or an image exported from it, **When** someone views the dataset context, **Then** it identifies the data as synthetic sample training rather than a real athlete's records.

---

### User Story 2 - Inspect Meaningful Multi-Year Training (Priority: P1)

As a visitor evaluating the analysis, I can explore a fictional Silicon Valley triathlete's varied running, cycling, and swimming history across multiple complete years, including seasonal training, progression, recovery, and equipment changes.

**Why this priority**: A small or repetitive dataset would misrepresent the value of multi-year comparisons and data-dependent visualizations.

**Independent Test**: Inspect the supplied history and compare each year and sport in the dashboard. Verify activity counts, populated analytic views, distinct yearly totals, and internally consistent training values.

**Acceptance Scenarios**:

1. **Given** the sample dataset, **When** its history is inspected, **Then** it contains at least 1,500 uniquely identified activities across the five complete calendar years 2021-2025, with at least 250 activities per year and all three supported sports in every year.
2. **Given** any sample year, **When** its calendar and year comparisons are viewed, **Then** every month contains training, rest days remain visible, and annual totals and monthly training volumes are not identical copies across years.
3. **Given** the complete sample history, **When** the visitor opens distance, pace and physiological comparisons, equipment summaries and timelines, cycling power personal bests, distributions, workout-time views, training calendar, activity-title word cloud, pie charts, and lifetime statistics, **Then** each view has usable data, and its normal applicable filters and export actions work.
4. **Given** an activity with several recorded measurements, **When** its date, duration, distance, pace or speed, elevation, heart rate, cadence, power, and any power best efforts are compared, **Then** supplied values are mutually consistent, appropriate to its sport, and never presented as real measurements from a person.

---

### User Story 3 - Explore Recognizable Silicon Valley Routes (Priority: P1)

As a visitor, I can explore a geographically plausible network of outdoor training routes around Silicon Valley, with repeated favorite routes and less frequent excursions that make the heatmap informative at regional and neighborhood scales.

**Why this priority**: Rich route coverage is a central part of demonstrating why importing location data is valuable.

**Independent Test**: View the all-years heatmap, zoom into frequent training corridors, and filter each year and sport. Check route locations, continuity, repeated-use intensity, and variety.

**Acceptance Scenarios**:

1. **Given** the sample history, **When** its route coverage is inspected, **Then** at least 600 activities have usable geographic tracks, with at least 100 tracked activities in each year and tracked running, cycling, and outdoor swimming represented in every year.
2. **Given** the all-years heatmap, **When** the visitor explores Silicon Valley, **Then** routes form recognizable corridors around places such as Palo Alto, Stanford, Mountain View, the Baylands, and the Santa Cruz Mountains rather than arbitrary shapes, disconnected jumps, or straight lines between distant locations.
3. **Given** the full route collection, **When** route variety is inspected, **Then** it includes at least 12 distinct running or cycling route patterns and at least two plausible open-water swimming routes in permitted Bay Area swimming locations; at least three running or cycling patterns occur 20 or more times each, producing visible frequency differences.
4. **Given** indoor cycling or pool swimming sessions, **When** the visitor filters their sport, **Then** those activities contribute to training summaries without fabricated outdoor tracks; outdoor swimming routes do not cross land.

---

### User Story 4 - Replace Examples With Personal Data Safely (Priority: P2)

As a visitor convinced by the example, I can return to the landing page and import my own supported export without combining it with the fictional athlete's history.

**Why this priority**: The example should lead naturally into the existing import journey without contaminating personal results.

**Independent Test**: Load examples, import a small known personal test dataset, and verify its totals and routes in isolation. Repeat with an unsuccessful sample load while an existing dataset is active.

**Acceptance Scenarios**:

1. **Given** sample data is active, **When** a valid personal export is imported through an existing import choice, **Then** personal data replaces the examples, sample-only labels disappear, and no sample activities, tracks, equipment, or best efforts remain in the displayed results.
2. **Given** personal data is active and the visitor returns to the landing page, **When** sample data loads successfully, **Then** it replaces rather than merges with the personal dataset and restores the sample identification.
3. **Given** any current session, **When** example loading fails because a required resource is missing, invalid, or unavailable, **Then** the visitor receives a recoverable error with retry and personal-import options, loading controls become usable again, and the previous successfully loaded dataset remains intact.

### Edge Cases

- Repeated activation while loading must not start competing loads, duplicate activities, or count additional analyses.
- A later user-selected import must not be overwritten by an earlier sample load that completes afterward.
- Missing or inconsistent required sample resources must not produce a misleading partially populated successful demo.
- Missing optional measurements on individual activities must follow the existing no-data behavior rather than becoming zero-valued measurements.
- Calendar dates and year membership must remain consistent when viewed from different time zones; no sample activity may be future-dated.
- An empty sport/year filter combination must use the existing empty state and must not show stale results from another selection.
- Narrow mobile viewports and keyboard navigation must retain access to the sample button, import choices, and loading/error feedback without overlapping controls.
- The example must remain available when no local files have been selected and must not depend on private exports or private-data folders.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The landing page MUST provide a button labelled exactly "Use exemplary data" beside the existing data-import choices, usable on desktop, mobile, and by keyboard.
- **FR-002**: Activating the button MUST load the supplied sample history into the regular dashboard without requesting an account, personal information, export preparation, or local file selection.
- **FR-003**: The loading flow MUST provide visible progress or busy feedback, prevent duplicate concurrent sample loads, and provide a recoverable error and retry path if required sample data cannot be loaded.
- **FR-004**: The sample dataset MUST describe one wholly fictional triathlete based in Silicon Valley and MUST contain at least 1,500 unique Run, Bike, and Swim activities across 2021-2025, at least 250 activities per year, and all three sports in every year.
- **FR-005**: The history MUST include training in every month, rest days, seasonal variation, non-identical yearly totals, recovery periods, varied workout titles and start times, and both indoor and outdoor sessions appropriate to each sport.
- **FR-006**: Supplied measurements MUST be internally consistent and sport-appropriate, including positive durations and distances, realistic paces or speeds, and geographically plausible elevations. Missing optional measurements MUST remain missing rather than being fabricated as zeros.
- **FR-007**: The history MUST contain heart-rate and cadence observations for running and cycling, cycling power observations and sufficient best-effort data to populate the existing cycling personal-best durations, and at least two equipment items used in different periods for both running and cycling.
- **FR-008**: All existing non-media analytic views listed in User Story 2 MUST have sufficient sample data to be usable, including multi-year and per-sport comparisons. Existing navigation order, filters, tooltips, and Share/Export behavior MUST remain available wherever applicable; no new visualization tab is required.
- **FR-009**: At least 600 sample activities MUST include usable geographic tracks, with at least 100 tracked activities per year and outdoor running, cycling, and swimming tracks represented in each year.
- **FR-010**: Geographic tracks MUST follow plausible local roads, trails, or swimmable water in Silicon Valley and nearby Bay Area training destinations. They MUST include at least 12 distinct running/cycling patterns and two open-water swimming patterns, with at least three running/cycling patterns repeated at least 20 times each.
- **FR-011**: Routes MUST be continuous, avoid implausible geographic jumps, and show visibly different frequencies between commonly repeated corridors and occasional excursions. Indoor and pool activities MUST NOT receive fictitious outdoor tracks.
- **FR-012**: The dashboard dataset context and exported images MUST identify the active history as synthetic sample data. Personal imports MUST not retain this identification after replacing the examples.
- **FR-013**: Successful loading or importing MUST replace the previous dataset atomically rather than merge sample and personal histories. A failed sample load MUST preserve the previously loaded dataset, and an outdated load MUST NOT overwrite a more recent user-selected import.
- **FR-014**: All supplied example dataset resources MUST be stored in a new top-level folder named `sample-data`, the natural English alternative to "fictive data". They MUST be synthetic, safe for public distribution, and independent of real athlete exports, private files, credentials, and personally identifying information.
- **FR-015**: Sample loading MUST NOT send user workout files to a server, persist personal workout data, or weaken existing privacy boundaries. Privacy wording MUST distinguish local personal-file processing from network requests used to obtain bundled sample resources or other app resources.
- **FR-016**: Sample exploration MUST NOT increment the production counter for personal-data analyses. Existing counting behavior for successful personal imports MUST remain unchanged.
- **FR-017**: The example MUST work through the application's normal static-site delivery without requiring visitors to install anything or a separate sample-data service to be operated.

### Key Entities *(include if feature involves data)*

- **Sample athlete**: One fictional Silicon Valley triathlete with a coherent five-year training history and no connection to an identifiable real person.
- **Sample activity**: A uniquely identified workout with sport, title, date, start time, duration, distance, and applicable optional training measurements, equipment, best efforts, and route association.
- **Sample route**: An ordered geographic training track associated with an activity and a recognizable route pattern; repeated routes establish frequency and less frequent routes provide variety.
- **Sample equipment**: Fictional shoes and bicycles associated with activity periods, supporting equipment comparisons and timelines.
- **Active dataset**: The currently explored training history, identified as sample or personal, with its own activities and related resources; only one dataset contributes to results at a time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In fresh desktop and mobile sessions, one activation of "Use exemplary data" opens the populated dashboard without file selection or personal information. In at least 9 of 10 fresh-load trials on a 20 Mbps connection, this takes no more than 15 seconds from activation.
- **SC-002**: Dataset inspection confirms at least 1,500 unique activities, five complete represented years, at least 250 activities per year, all 60 months populated, and Run, Bike, and Swim available in each year.
- **SC-003**: Every non-media analytic view listed in User Story 2 displays meaningful results from the examples; changing the selected year or sport updates the corresponding results correctly, and all existing applicable exports succeed with sample identification.
- **SC-004**: Route inspection confirms at least 600 tracked activities and at least 100 per year. The all-years map and each sport/year map show plausible routes without geographic jumps, and the all-years map visibly distinguishes the three or more high-frequency corridors from occasional routes.
- **SC-005**: In both sample-to-personal and personal-to-sample replacement tests, 100% of displayed activities and related resources belong to the newly selected dataset; failed or superseded sample loads never replace the last valid selection.
- **SC-006**: In an evaluation with five first-time visitors, at least four can open the example without assistance, compare two years, explore the route heatmap, and identify where to import their own data within three minutes; all five can identify the example as synthetic.

## Assumptions

- This specification covers the sample history and its entry into the existing experience, not a new landing-page redesign, new analytic views, or a new import format for personal data.
- Five fixed, complete years (2021-2025) provide meaningful comparisons without an incomplete current year or future-dated workouts. Updating the sample to follow the current date automatically is out of scope.
- `sample-data` is the chosen folder name because "sample data" is more natural product English than "fictive data". The explicitly requested button text remains "Use exemplary data".
- Existing imports, visualizations, and local image-preview/download actions are dependencies and should retain their normal behavior. Sample data demonstrates those capabilities rather than promising every optional measurement on every activity.
- Photos and videos are out of scope: a synthetic training dataset need not manufacture a personal media collection. The media gallery follows its established unavailable/no-media behavior; all non-media analytic views must be demonstrable.
- Precise personal home/work locations and real athlete identities are neither needed nor included. Geographic realism concerns public training corridors and appropriate outdoor destinations, not reproducing someone's private history.
- Excluding demonstrations from the personal-analysis counter is a default to avoid inflating reported real imports; no separate demo analytics or tracking capability is introduced.
- Sample resources are public app content. Personal workout processing remains local, but loading public sample data does not imply the application makes no network requests.