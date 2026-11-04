# Feature Specification: Apple Health Import

**Feature Branch**: `TriAnalytica-dev-2`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "Introduce Apple Health data import on the landing page. Inspect the supplied export, map compatible data to the existing activity structure for all visualizations, document additional unmapped data in private-data, and hide visualizations without imported data."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import Apple Health training history (Priority: P1)

As an athlete, I can select my Apple Health export from the landing page and explore my supported workouts without converting files or sharing health data with a remote service.

**Why this priority**: Import is the entry point to every other benefit.

**Independent Test**: Select an Apple Health export containing running, cycling, swimming, unrelated health records, and unsupported workouts. Verify that only supported workouts become activities and that the import explains imported, skipped, and incomplete items.

**Acceptance Scenarios**:

1. **Given** the landing page, **When** I choose Apple Health, **Then** I can select the original export archive, access export guidance, and see progress through completion.
2. **Given** supported workouts with different distance and duration units, **When** import completes, **Then** their dates, sports, distances, and durations agree with the source after unit conversion.
3. **Given** unsupported workouts or everyday health records, **When** import completes, **Then** they do not become running, cycling, or swimming workouts and skipped workout categories are explained.
4. **Given** a malformed main export or an archive without a recognizable main export, **When** import fails, **Then** I receive an actionable error, my existing dashboard remains intact, and I can retry.
5. **Given** an export with no supported valid workouts, **When** import completes its inspection, **Then** I see an explicit no-supported-workouts result rather than an empty successful dashboard.

---

### User Story 2 - Explore only trustworthy visualizations (Priority: P1)

As an athlete, I see all existing visualizations supported by my imported data, without fabricated measurements or empty source-specific views.

**Why this priority**: Incorrect field mappings or apparent zero measurements would make training comparisons misleading.

**Independent Test**: Import controlled histories with and without distance, duration, heart rate, steps, elevation, routes, equipment, titles, and media; check each of the 13 existing views against its actual requirements.

**Acceptance Scenarios**:

1. **Given** dated workouts with distance and duration, **When** I explore the dashboard, **Then** distance, eligible pace/speed comparisons, eligible distance bests, distributions, workout time, training calendar, sport proportions, and lifetime summaries use the same meanings as existing imports.
2. **Given** workouts without gear, meaningful source titles, or readable media, **When** the dashboard opens, **Then** equipment, equipment timeline, word cloud, and media gallery are hidden; device names and generated workout labels do not make those views available.
3. **Given** valid routes explicitly associated with imported workouts, **When** I explore the dashboard, **Then** the route heatmap is available; absent, ambiguous, or unreadable routes do not expose an empty heatmap or discard otherwise valid workouts.
4. **Given** missing heart rate, cadence, elevation, or cycling power, **When** I inspect available views, **Then** absent measurements are not replaced with zeros, everyday measurements, device labels, or unrelated workout measurements; power bests require a qualifying power time series, not an average alone.
5. **Given** a previously imported richer history, **When** I replace it with a sparse Apple Health history and later another source, **Then** availability, date bounds, selections, active view, routes, media, and export targets reflect only the newly committed import; navigation never selects a hidden view.
6. **Given** an available visualization, **When** I share or export it, **Then** the existing local image-preview and download flow works with the Apple Health data and no absent view can be exported through a stale target.

---

### User Story 3 - Understand additional health information (Priority: P2)

As the product owner, I can inspect a local Markdown inventory distinguishing data already supported by the activity structure, conditionally derivable workout data, and additional health information not yet represented.

**Why this priority**: This supports future scope decisions without expanding the training model into an unrelated medical dashboard.

**Independent Test**: Compare the local report with the supplied archive's complete inventory and the existing activity fields; every observed record category has an explicit disposition and every existing visualization has a readiness rule.

**Acceptance Scenarios**:

1. **Given** the supplied archive, **When** its inventory is reviewed, **Then** a Markdown report under private-data lists observed data categories, units, mapping limitations, and additional unmapped data without personal identifiers, individual measurements, dates, or coordinates.
2. **Given** ECG, hearing, recovery, sleep, body, daily activity, and other non-workout information, **When** import runs, **Then** it neither creates fictitious workouts nor new visualization tabs for those categories.
3. **Given** the report and specification, **When** scope is reviewed, **Then** observed fields are distinguished from possible Apple Health fields absent from this sample.

### Edge Cases

- Main export filename capitalization differs; the archive includes a secondary clinical representation of the same history, which must not be imported again.
- Large archives contain millions of unrelated records, nested folders, unknown record categories, or unsupported units; unsupported units remain unavailable with a diagnostic rather than being guessed.
- A structurally valid workout has missing or invalid dates, negative measurements, an explicit zero, or no distance; invalid workouts are counted as skipped, while valid partial workouts retain missing-versus-zero semantics.
- Multiple sources record overlapping sessions or measurements; overlap alone must not trigger deduplication or association. Proven identical workout copies count once; distinct simultaneous workouts remain distinct.
- Timezone offsets, daylight-saving changes, and workouts spanning midnight must not shift the recorded local workout day or time of day.
- Workout duration differs from elapsed start-to-end time because of pauses; elapsed time must not silently replace recorded active duration.
- Route references include export-root-relative paths, repeated references, or missing files; association must follow the actual reference and never arbitrary filename order.
- Heart-rate and step samples overlap workout boundaries or originate from competing devices; ambiguous or non-attributable samples must remain unused.
- No visualization is eligible; show an explicit no-visualizations state without stale charts or share controls. Ordinary date/sport filters producing no results retain existing filter-empty behavior.
- Damaged optional routes or unrelated clinical files do not invalidate otherwise usable workouts; unsafe archives or an unreadable main export fail without replacing the current history.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The landing page MUST offer a clearly named Apple Health import option alongside existing import sources, with archive selection, export guidance, progress, completion, and retry states. Existing imports MUST remain available and unchanged.
- **FR-002**: Import MUST recognize the original Apple Health export archive, including capitalization variants of the primary export filename and nested export folders. A secondary clinical copy MUST NOT duplicate the history.
- **FR-003**: Import MUST map only explicit running, cycling, and swimming workouts to the corresponding existing sports. Walking, hiking, strength, yoga, and unknown workout types MUST be excluded and counted by category, not silently mapped to a supported sport.
- **FR-004**: Each imported activity MUST have a stable identity, original sport classification, start time, workout day, week grouping, and available distance, active duration, source title, gear, average heart rate, cycling power, cadence, running steps, and ascent using existing field meanings. The version-controlled data model and import contract define the field-by-field compatibility boundary; the private inventory documents observed sample evidence only.
- **FR-005**: Workout-specific summaries MUST take precedence over derived measurements. Distance and duration MUST be converted to the existing units. Equivalent legacy workout totals MAY be used when present; repeated representations MUST NOT be added together. Missing measurements MUST remain unavailable, separately from a measured zero.
- **FR-006**: Associated heart-rate, running-step, cadence, or power samples MAY supply an absent compatible workout measure only when temporal boundaries, source provenance, units, and aggregation semantics establish an unambiguous relationship. Import MUST NOT mix overlapping source streams, prorate uncertain boundary samples, infer cycling power from energy, or treat walking speed as running performance. Unresolved attribution MUST leave the measure unavailable and produce a diagnostic. An existing average power value MUST NOT suppress examination of available compatible timed power measurements for personal bests; scalar summary precedence and time-series eligibility are separate decisions.
- **FR-007**: Workout duration MUST preserve the recorded active duration; pause events MUST NOT be subtracted twice. Recorded timezone context MUST preserve the workout's local day and start time for date and workout-time views.
- **FR-008**: Imported routes MUST attach only to their explicitly referenced supported workout. Repeated references MUST NOT double-count the route; unreadable, missing, or ambiguous references MUST be reported and MUST NOT prevent otherwise valid workouts from importing. Route geometry MUST preserve supported sport identity, including swimming.
- **FR-009**: Import MUST NOT fabricate activity titles, equipment, power, cadence, or media. Recording hardware MUST NOT become workout equipment. A display fallback name MUST NOT provide word-cloud data.
- **FR-010**: All 13 existing visualizations MUST be assessed against usable normalized activities and associated data, not enabled merely because the source is Apple Health. Each view MUST follow the readiness matrix in the version-controlled import contract; no data means no navigation entry, chart, or active export target for that view. The private inventory records sample coverage and MUST NOT introduce or override normative readiness rules.
- **FR-011**: Visibility MUST be recomputed after every successful source replacement. Hidden tabs MUST be excluded from pointer, keyboard, and arrow navigation; the active view MUST fall back to an available view, or to the no-visualizations state when none exists. Existing tab identities and ordering MUST remain unchanged.
- **FR-012**: Eligible views MUST retain existing filters, metric choices, personal-best eligibility rules, and local sharing/export behavior. Missing optional metrics MUST NOT hide a whole view when another valid metric supports it, nor expose fabricated metric results.
- **FR-013**: Import MUST report valid imported workouts, skipped unsupported/invalid workouts, unavailable optional measurements, and route failures without disclosing raw health content in logs. Corrupt main input MUST leave the current dashboard intact; isolated invalid workouts or optional attachments MUST be skipped with a summary.
- **FR-014**: Raw health files, routes, clinical information, and individual health measurements MUST remain local during import and MUST NOT enter version control or analytics requests. Privacy wording MUST distinguish local import processing from unrelated app network requests.
- **FR-015**: A local Markdown report under private-data MUST inventory the supplied archive's observed data types, units, and structural counts; map every current activity field and visualization; list additional information outside the current model; and distinguish confirmed presence, derivation prerequisites, and absence. It MUST omit personal identifiers, individual readings, exact health dates, and coordinates.
- **FR-016**: The import experience MUST support the supplied large-export class without loading every unrelated health record into the dashboard or requiring manual extraction. Users MUST see progress at least every five seconds during processing and be able to recover from a stated resource-limit failure without losing their current dashboard.
- **FR-017**: Duplicate suppression MUST use explicit source identifiers or equivalent complete identity evidence, never proximity alone. Without a trusted source-scoped identifier, complete fingerprint evidence requires a nonempty source name, original sport, valid start and end instants, and a valid recorded duration with a supported unit. Optional summaries, device details, events and route references MUST participate in canonical comparison with explicit missing/invalid markers; their absence alone does not make the required identity evidence incomplete. Missing or invalid mandatory identity evidence MUST prevent fingerprint-based suppression. Reimporting the same archive MUST produce the same activity counts and totals; separate overlapping workouts MUST remain distinct unless proven duplicates.

### Key Entities *(include if feature involves data)*

- **Health export**: Locally selected archive containing workout history, health measurements, optional routes, and secondary clinical attachments.
- **Normalized activity**: Supported running, cycling, or swimming workout expressed in the existing activity vocabulary, with explicit measurement availability and stable identity.
- **Associated measurement**: A measurement tied unambiguously to a workout by time, source, and metric semantics; distinct from everyday or ambiguous health records.
- **Workout route**: Ordered coordinates explicitly referenced by an imported workout; optional and independent of measurement completeness.
- **Visualization readiness**: Eligibility of each existing view based on its actual usable activity and auxiliary data.
- **Local data inventory**: Privacy-minimized analysis of observed export categories, current mappings, limitations, and unmapped additional information.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can locate Apple Health import and start selecting an export within two actions from the landing page, with existing import choices still accessible.
- **SC-002**: In reference cases covering all three supported sports, every eligible workout appears once; dates, unit conversions, distances, and active durations agree with the expected source values within displayed rounding precision, and unsupported workout types contribute zero activities.
- **SC-003**: In present/absent/invalid-data cases for all 13 views, 100% of visibility and navigation outcomes match actual data eligibility; no missing-data case displays fabricated zeros, titles, gear, or stale routes/media.
- **SC-004**: Every observed health-record category and every current activity field has an explicit disposition in the private inventory; no observed additional category is described as already represented when it is not.
- **SC-005**: A reference export with at least 2,000 workouts, 4.5 million health records, and 3 GB uncompressed contents completes on the documented reference desktop browser without a crash, preserving all valid supported workouts and providing progress feedback at intervals no greater than five seconds. With identical workouts, relevant measurements and routes, the largest of three increasing irrelevant-record workloads MUST add no more than 64 MiB to combined main-thread/worker peak memory versus the smallest workload, comparing the worst result of three repetitions per workload. The reference environment, measurement procedure and elapsed time are recorded during acceptance testing; absent worker memory evidence means this criterion is unverified, not passed.
- **SC-006**: Importing identical input twice yields identical workout counts and totals; replacing a rich source with a sparse source leaves zero stale view, route, media, filter-bound, or export references.
- **SC-007**: All available existing views retain a working local image-preview/download action with Apple Health histories, and zero raw health measurements, identifiers, or route coordinates are transmitted by the import flow.

## Assumptions

- This specification defines future implementation; inspection of the supplied export does not mean the importer already exists.
- Initial scope is one original Apple Health ZIP export per import, replacing the current dashboard history consistently with existing source workflows. Direct device synchronization, account connections, standalone clinical imports, and cross-provider merging are out of scope.
- No new visualization tabs or medical/recovery/body-composition features are introduced. Additional data is documented locally for future decisions, not added speculatively to the training model.
- Running, cycling, and swimming are the supported Apple Health workout types; existing handling of walking in another provider does not imply Apple walking is running.
- The supplied sample is evidence of one export, not a guarantee of fields in every user's export. Missing optional data and newer unknown categories must remain safe.
- Normative field mappings and readiness rules are retained in the version-controlled data model and import contract, subordinate to this specification. Observed counts and sample coverage remain in the ignored private-data report, which cannot override those contracts; public specification content contains no personal measurements or identifiers. Future automated examples must be synthetic.
- Existing visualization, navigation, and sharing contracts are reused. Existing source behavior is a regression baseline, not a reason to expose empty Apple Health views.