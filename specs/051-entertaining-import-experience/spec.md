# Feature Specification: Entertaining Import Experience

**Feature Branch**: `051-entertaining-import-experience`

**Created**: 2026-10-08

**Status**: Draft

**Input**: User description: Improve the existing Strava import progress experience with 20 humorous triathlon-specific messages, matching lightweight animated illustrations, reliable personalized statistics, periodic privacy reassurance, and accurate progress feedback without replacing the import pipeline.

## Clarifications

### Session 2026-10-08

- Q: Wann soll „Almost there“ während des Imports erscheinen? → A: Nur in einer ausdrücklich ausgewiesenen Abschluss- oder Vorbereitungsphase; andernfalls auslassen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Follow an entertaining import (Priority: P1)

As an athlete importing a Strava export, I want humorous triathlon-specific messages and a matching playful illustration while the data is processed, so that a potentially long wait feels engaging without obscuring what the import is doing.

**Why this priority**: The import is a central first-use experience. Clear, entertaining feedback makes the wait more rewarding while the existing progress information remains trustworthy.

**Independent Test**: Run an import long enough to observe several message changes and verify that each visible message is paired with its intended illustration, the message order does not repeat before completing a cycle, and the existing import completes unchanged.

**Acceptance Scenarios**:

1. **Given** an import is running, **When** a message is shown, **Then** one prominent humorous message and its corresponding illustration appear alongside the existing progress and current status.
2. **Given** the import continues beyond one display interval, **When** the interval elapses, **Then** the message and illustration change together with a subtle transition and without repeating a message before the available set has been shown.
3. **Given** the import ends before a display interval elapses, **When** completion is reached, **Then** the user sees the completion state without the import being delayed to show additional messages.
4. **Given** a user has requested reduced motion, **When** the import display is shown, **Then** animated movement is reduced or removed while all message and progress information remains available.
5. **Given** the user is on a narrow screen or the browser is under processing load, **When** the display changes, **Then** the copy remains legible and the import remains usable without disruptive layout shifts.

### User Story 2 - See personal observations based on imported data (Priority: P2)

As an athlete, I want occasional comments based on statistics actually found in my export, so that the experience feels personal without showing made-up or misleading totals.

**Why this priority**: Personalized observations add value beyond generic jokes, but only after the import can provide reliable values; trustworthy import feedback takes precedence.

**Independent Test**: Use synthetic imports with known and missing metrics; verify that each eligible message uses the expected real value and formatting, and that unavailable or incomplete values never appear as final totals.

**Acceptance Scenarios**:

1. **Given** a metric has been reliably calculated from the imported dashboard data, **When** an eligible personal message is selected, **Then** it uses that actual value and the application's established number and distance formatting.
2. **Given** a metric is partial, unavailable, or not supported by the export, **When** messages are selected, **Then** its personal message is withheld rather than showing an estimate or invented value.
3. **Given** an import contains multisport activities, **When** personal activity or distance statistics are prepared, **Then** sessions and distances are not double-counted.
4. **Given** reliable statistics become available after generic messages have begun, **When** they become available, **Then** eligible personal messages may join the ongoing rotation without restarting or disrupting the import.

### User Story 3 - Trust progress and privacy feedback (Priority: P1)

As an athlete, I want the actual import progress and processing stage to remain clear, and a precise reminder that training-file contents are processed locally, so that the entertaining display does not misrepresent progress or data handling.

**Why this priority**: Progress accuracy and privacy are foundational to user trust and must not be traded for entertainment.

**Independent Test**: Observe a successful import, a failed import, and a short import; compare displayed status and progress with the import's actual callbacks and verify that neither message rotation nor personal-stat preparation alters the import flow or sends training data to a service.

**Acceptance Scenarios**:

1. **Given** the import exposes a reliable stage or progress update, **When** that update occurs, **Then** the corresponding status and progress are shown without artificial advancement, regression, or a message-driven update.
2. **Given** a privacy reassurance is shown, **When** the user reads it, **Then** it accurately states that the Strava training-file contents are processed in the browser and are not uploaded to TriAnalytica servers, without claiming that the whole application makes no network requests.
3. **Given** processing completes or fails, **When** the import view changes state, **Then** message rotation and animation stop, and the existing completion or error feedback remains clear.
4. **Given** a user starts another import after a prior import ended, **When** the new import view appears, **Then** no timer, message state, or animation from the previous import remains active.

### Edge Cases

- An import finishes before the first message rotation; the completion state must not be delayed.
- The final-only message, “Almost there. Please resist opening Strava while you wait.”, is eligible only during an explicitly identified finalization or preparation phase; it is omitted if no such phase is exposed. A numeric percentage alone does not qualify.
- An import with no activities, no equipment records, missing distance values, or incomplete dates must omit messages dependent on those values.
- A partial activity aggregate must not be presented as a final total; personal messages are deferred until their underlying metrics are reliable.
- Unknown sport values and multisport child activities must not be silently recategorized or double-counted to create a joke statistic.
- A ZIP containing GPS/FIT parsing errors may still complete with skipped optional files; message selection must not mistake skipped records for confirmed totals.
- A failed import must stop all message and illustration updates without hiding its error state.
- If the browser tab is hidden or main-thread processing is busy, animation and rotation may pause or be delayed; progress values must continue to reflect only actual import updates.
- Large archives, including exports around 2 GB or larger where otherwise supported, must not incur an additional archive copy, parsing pass, or expensive analytics pass for this experience.
- Long messages, changing personal values, and privacy reminders must not shift or overlap the progress indicator on desktop or mobile layouts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The running import view MUST retain the existing accurate progress bar, percentage where available, and current processing status; entertaining content MUST complement and not replace them.
- **FR-002**: The view MUST provide the following 20 humorous messages and their corresponding visual concepts:
  1. “Your training data has entered T1. This may take a moment.” — A swimmer enters transition and picks up a laptop instead of a bicycle.
  2. “Calculating how much of your personality is actually endurance sport…” — A donut chart progressively fills with TRIATHLON versus OTHER.
  3. “Checking whether all those Zone 2 sessions were actually Zone 2. 👀” — A heart-rate line repeatedly exceeds the Zone 2 boundary.
  4. “Converting years of questionable life choices into beautiful charts.” — Swim, bike, and run icons transform into a colorful analytics chart.
  5. “Good news: buying faster equipment does improve at least one metric — equipment count.” — A bicycle becomes increasingly aerodynamic while equipment count rises.
  6. “Looking for evidence that you occasionally took a rest day…” — A calendar is scanned by a magnifying glass; a humorous 404 appears.
  7. “Analysing thousands of kilometres you could have spent relaxing.” — An athlete runs along an endless GPS track while a sofa sits unused.
  8. “Your data is doing a brick session. It also regrets its choices.” — A cyclist dismounts and starts running with exaggerated wobbly legs.
  9. “Finding the exact moment \”I'll just try a triathlon\” got out of control.” — A single workout multiplies into hundreds of activities.
  10. “Counting activities. Yes, indoor rides count too. We're not monsters.” — An indoor trainer receives an animated green checkmark.
  11. “Checking whether it really happened if it wasn't recorded…” — An activity disappears and reappears when a GPS watch saves it.
  12. “Searching your history for the mythical easy recovery session.” — A magnifying glass searches activities labelled HARD.
  13. “Plotting your athletic evolution from \”this is fun\” to \”what's my FTP?\”” — A humorous evolution sequence ends with an athlete studying a power meter.
  14. “Separating training volume from compulsive data collection. Difficult.” — Overlapping circles show TRAINING and ANALYSING TRAINING.
  15. “Analysing your pacing strategy: optimistic start detected.” — A pace chart starts aggressively before visibly deteriorating.
  16. “Looking for your fastest performances — and pretending tailwind had nothing to do with them.” — A cyclist is propelled by an enormous animated tailwind arrow.
  17. “Reconstructing years of swim, bike, run… and buying things.” — A repeating sequence shows swimming, cycling, running, and a credit card.
  18. “Your ZIP file is bigger than some people's annual training volume. Respect.” — An oversized ZIP archive sits on a balance scale with a tiny training log.
  19. “Crunching the numbers so you can confirm what you already suspected: you need another bike.” — An animated equation shows DATA + SCIENCE = NEW BIKE.
  20. “Almost there. Please resist opening Strava while you wait.” — A finger approaches a generic activity-feed icon while a warning flashes.
- **FR-003**: Each message MUST remain associated with its own relevant illustration; message and illustration MUST change together, and the visual set MUST use a consistent, lightweight, locally available visual style without third-party logos.
- **FR-004**: Messages MUST rotate automatically at a calm interval of approximately 7–10 seconds, use a subtle transition, and be randomized per import session without repeats until the eligible messages have completed a cycle.
- **FR-005**: Message rotation MUST be independent of import progress and MUST NOT fabricate or advance progress to imply completion.
- **FR-006**: Message 20 MUST be withheld until the import exposes an explicitly identified finalization or preparation phase. A numeric progress value alone MUST NOT make the message eligible. If no such phase is exposed, the message MUST remain excluded for that import.
- **FR-007**: A brief privacy reassurance MUST appear after approximately every 4–5 humorous messages. It MUST describe local processing of imported training-file contents accurately and MUST NOT claim that the overall application makes no network requests.
- **FR-008**: Personal messages MUST use only genuine values extracted from imported data and MUST appear only when each underlying metric is reliably available. Partial aggregates MUST NOT be presented as final values.
- **FR-009**: Personal-message candidates MUST include, where supported by reliable imported values: activity count, cycling distance, span of training history, number of distinct running-shoe records, longest ride, and number of swimming activities. An unavailable metric MUST be omitted.
- **FR-010**: Personal-stat preparation MUST reuse completed import/dashboard data where possible and MUST NOT introduce a second archive/CSV parsing pass or an expensive separate analytics pipeline.
- **FR-011**: Activity and distance messages MUST respect existing sport and multisport semantics and MUST NOT double-count activities, sessions, or distances.
- **FR-012**: Numeric and distance values in personal messages MUST follow the application's existing formatting conventions.
- **FR-013**: The import view MUST present one clear progress/status area, one prominent humorous or personal message, and one matching illustration; optional personal context MUST NOT create redundant progress headlines or duplicate metrics.
- **FR-014**: Where reliable import stages are exposed, the view SHOULD identify them in plain language, such as reading the archive, extracting activities, processing GPS/training data, calculating analytics, or preparing visualizations. It MUST NOT invent stage progress or phase percentages.
- **FR-015**: Content and its associated visual choices MUST be maintainable independently of the import pipeline so that messages can be added, removed, or revised and visuals can be changed without redesigning the import flow.
- **FR-016**: The presentation MUST remain readable and usable across desktop and mobile sizes, MUST avoid layout shifts as messages change, and MUST respect reduced-motion preferences.
- **FR-017**: Animation and message handling MUST remain lightweight, MUST NOT block or materially delay import work, and MUST degrade gracefully when the browser is under load or the page is not visible.
- **FR-018**: All rotation timers and animation-related resources MUST stop on successful completion, failure, or view teardown, and MUST not carry over into a subsequent import.
- **FR-019**: The enhancement MUST preserve existing import, completion, error, cancellation-if-present, and privacy behavior. It MUST NOT claim that currently unsupported cancellation behavior exists.
- **FR-020**: This feature MUST NOT transmit imported training data or derived personal statistics to an external service.

### Key Entities

- **Import message**: A humorous or privacy-reassurance text item with an eligibility rule and a place in the session rotation.
- **Message illustration**: The locally available visual associated with a particular humorous message.
- **Reliable import statistic**: A value derived from the completed import data that is safe to display as a personal observation.
- **Import stage and progress**: The actual current phase and any numeric progress supplied by the existing import process.
- **Import session**: One execution of an import, defining the message order and lifecycle of its temporary presentation state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 20 specified messages and all 20 corresponding visual concepts are available, and every message shown is paired with its intended visual.
- **SC-002**: In tests of a complete rotation, every eligible message is shown once before any eligible message repeats; typical message dwell time is between 7 and 10 seconds, subject to browser scheduling and import lifecycle.
- **SC-003**: Message rotation and personal-stat presentation do not alter the values or sequence of progress updates received from the existing import process.
- **SC-004**: In all tested imports, personal messages contain only values verified against the imported fixture, and messages for unavailable or incomplete metrics are absent.
- **SC-005**: Message 20 is absent in all states except an explicitly identified finalization or preparation phase; a numeric progress value alone never makes it appear.
- **SC-006**: In all tested completion and error cases, no subsequent message changes occur after the import view has ended, and the completion/error state remains visible.
- **SC-007**: Privacy copy correctly distinguishes local processing of training-file contents from other application network requests, and no test detects training data or derived personal statistics sent by this feature.
- **SC-008**: Against the same representative import fixture, the enhancement adds no archive or CSV parsing pass, and import duration increases by no more than 5% compared with the existing import flow.
- **SC-009**: Users who request reduced motion still receive the same message, illustration, progress, and status information without non-essential animation.
- **SC-010**: In desktop and mobile layout checks, message changes do not obscure or overlap the progress bar, percentage, current stage, or error/completion feedback.

## Assumptions

- The existing import pipeline and progress UI remain the source of truth; the feature enriches the existing experience rather than redesigning or replacing the import process.
- The current application is a static browser app. The specification requires maintainable separation between message content, its visual association, and import orchestration, but leaves the precise file/folder arrangement to planning.
- Personal messages may appear only once their inputs are reliable. If a value is only reliable after import parsing or final calculations, the message is deferred until then.
- The application's existing number, distance, sports, and multisport conventions remain authoritative.
- The text and humor may remain in English, consistent with the supplied copy and current import UI.
- “Still local” means the imported training-file contents are processed in the browser and not uploaded to TriAnalytica servers; it does not mean the whole application performs no network requests.
- The repository's current import architecture is not assumed to guarantee successful handling of every archive size. This enhancement must not add material overhead or promise new 2 GB support that the import pipeline does not already provide.
- Tests use synthetic or explicitly supplied local fixtures, not private Strava exports from the repository.
