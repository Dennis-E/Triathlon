# Research: Restore Swim GPS Heatmap Visibility

## Evidence and Boundaries

- Prior synthetic reproduction: one Strava swim recording with three valid locations and a two-hour difference between CSV and record times retains a drawable two-point simplified route in `extractGpsTracksFromZip`, but no route in `extractGpsAndPowerFromZip`.
- The current combined path calls `segmentFitRecordsByActivity` and selects its output whenever any summary start/end exists, even for one activity. `parseGpsFileEntries` derives the end from Moving Time, which need not bound an entire recording.
- The existing combined/separate parity cases omit summary timing columns; the shared multisport case aligns times. The preceding specification run passed 49 importer/dashboard-heatmap tests despite the reproduction. That is baseline evidence, not a post-fix result.
- Local history traces `parseGpsFileEntries` to `de5421f` (`import: previews included`). This is provenance of the function, not proof that the user's exact incident has this cause.
- No user export, real browser FIT decode, or exported PNG has been inspected. Planning does not claim otherwise.

## Decision 1: Ownership Before Timing

**Decision**: A file mapped to exactly one Strava activity uses its complete parsed records for GPS and bike power. Only multiple associations invoke shared segmentation.

**Rationale**: Singleton ownership is already known from the export. Summary dates, pauses, moving duration, and missing point timestamps must not invalidate independently recorded coordinates. Selection before segmentation also avoids unnecessary work.

**Alternatives considered**: Fixing timezone parsing alone misses duration and missing-timestamp failures. Expanding windows adds arbitrary tolerances. Falling back only when an entire route disappears still silently truncates partially retained routes. Altering FIT parsing or heatmap rendering does not address the record-selection cause.

## Decision 2: Conservative Shared Ownership

**Decision**: For shared FIT files, reject incomplete/invalid interval sets or duplicate activity IDs. With valid bounded intervals, retain a record only if its valid timestamp matches exactly one owner. Omit ambiguous points, including a boundary included by two intervals. Never copy the whole recording to the first activity.

**Rationale**: Existing behavior is not uniformly safe: missing boundaries can act as open intervals, overlaps can duplicate points, and files without summary timing fall back to the first owner. Merely guarding segmentation with `fileMetadata.length > 1 && hasTimedSessions` preserves those defects and does not satisfy the specification's prohibition on unverifiable attribution.

**Alternatives considered**: A minimal singleton-only guard is sufficient for the demonstrated loss but insufficient for the stated shared-ownership requirement. Reconstructing all shared boundaries from FIT internals is a broader parser redesign. First-match precedence hides ambiguity rather than establishing ownership.

**Limitation**: Unique matching proves consistency with available CSV-derived boundaries, not the true physical transition time. Shared routes may omit points when Moving Time is shorter than elapsed duration. This feature does not reconstruct missing session boundaries. Existing GPS simplification may bridge omitted points within an activity; it must never introduce another activity's coordinates.

## Decision 3: Leave TrainingPeaks Semantics Intact

**Decision**: Do not change `normalizeTrainingPeaksSession`, `getSessionRecords`, or `importTrainingPeaksZips`. Preserve complete-import failure for corrupt TrainingPeaks archives/recordings.

**Rationale**: TrainingPeaks uses a separate FIT-session path, including an exclusive next-session start. Changing it is not needed to fix the Strava singleton defect. The user explicitly chose the existing complete-abort behavior on 2026-10-20; FR-005 was clarified accordingly.

**Alternatives considered**: Partial TrainingPeaks imports require error-reporting/product decisions and transactional tests unrelated to the route-selection fix. Applying the Strava singleton bypass to TrainingPeaks could ignore its FIT-session ownership information.

## Decision 4: Existing Modules, Dependencies and Test Harnesses

**Decision**: Keep the importer API, CommonJS/browser bridge, dependency injection, parser versions and simplification. Extend existing Jest files and use the browser only for visible map/export acceptance.

**Rationale**: Root tests run in Node, not jsdom. Existing `makeFakeFitDeps`, `makeZipFile`, `makeBikeFitRecords` and TrainingPeaks helpers can construct synthetic cases without personal data or new packages. VM dashboard tests validate orchestration but stub geometry; real import-to-`buildRouteSegments` checks close that gap. The existing Share/Export flow already captures the selected heatmap container.

**Alternatives considered**: A new test framework or importer abstraction adds scope without improving this local decision. Mocked renderer checks alone cannot prove that GPS survived import or that exported pixels contain the route.

## Resolved Technical Context

No unresolved design clarification remains. No new dependency, storage, service, endpoint, public interface, or build step is required. The actual Git branch is `TriAnalytica-dev-2`; the setup script's feature identifier is `062-restore-swim-heatmap`.