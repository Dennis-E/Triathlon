# Research: Bike Power Personal Bests

## Decision 1: Keep average power and duration-specific power as separate record types

**Decision**: Treat a CSV activity's average watts as an activity-average observation. Treat a FIT record window with a defined duration as a duration-specific power effort. Render and label the two sources separately in Bike Personal Bests.

**Rationale**: The current activity model already retains `avgWatts`, while the PB renderer expects `powerEfforts` for the 5m, 10m, 20m, and 60m categories. Substituting an activity average into one of those duration categories would claim precision the source data does not provide and would make the displayed PR misleading.

**Alternatives considered**:

- Use average watts as the value for every duration: rejected because a whole-ride average is not a measured five-, ten-, twenty-, or sixty-minute effort.
- Hide all power unless duration windows exist: rejected because it repeats the discoverability problem and discards valid training information already imported.

## Decision 2: Build duration-specific efforts at the FIT import boundary

**Decision**: Reuse the existing FIT parser loading and normalized record shape (`timestamp`, distance, and power) to derive supported rolling power efforts during ZIP import, then pass them through the existing `fitBestEffortsByActivityId` dataset field.

**Rationale**: The repository already has the FIT parsing boundary, the four supported duration constants, and PB rendering hooks for `powerEfforts`, but the current import result initializes `fitBestEffortsByActivityId` as empty. Completing this boundary fixes the root cause for duration PBs while keeping the renderer independent of file format details.

**Alternatives considered**:

- Parse FIT records directly from `index.html`: rejected because it would duplicate import concerns in the UI and make the logic harder to test in Node.
- Add a server-side power-processing endpoint: rejected because personal exports must remain local and the feature has no need for server persistence.

## Decision 3: Use a pure utility for filtering and progression

**Decision**: Put validation of power values, Bike-only filtering, average-power record creation, duration-effort selection, and best-progression calculation in a reusable CommonJS/browser module.

**Rationale**: Pure functions can cover invalid values, localized input, mixed source types, and chronological best progression without a DOM or browser test runner. `index.html` should only map the resulting records into the existing PB tiles and tooltips.

**Alternatives considered**:

- Add more calculation branches inside `renderPbChart`: rejected because it would mix data rules with SVG layout and reduce testability.
- Introduce a new dashboard tab: rejected because the feature belongs in the existing Bike Personal Bests column and does not require new navigation.

## Decision 4: Preserve the existing duration categories and local behavior

**Decision**: Keep 5m, 10m, 20m, and 60m as the supported duration categories. Show a clear no-data or unavailable state for categories without qualifying efforts.

**Rationale**: These categories are already part of the current UI contract and the feature request is about making existing watt data visible, not expanding the product's power taxonomy.

**Alternatives considered**:

- Add FTP or normalized-power calculations: rejected as a separate training metric with different domain assumptions and no requirement in the feature request.

## Decision 5: Require minimum coverage for rolling windows

**Decision**: Accept a duration-specific window only when finite, positive-power
samples cover at least 80% of the target duration. Windows below that threshold are
excluded rather than treated as representative efforts.

**Rationale**: FIT streams can contain missing power samples. A fixed coverage rule
makes incomplete windows deterministic and prevents sparse data from producing a
misleading duration PB while still tolerating occasional missing samples.

**Alternatives considered**:

- Require 100% coverage: rejected because occasional dropped samples are common and
	should not discard otherwise representative efforts.
- Accept any non-empty window: rejected because a short fragment cannot represent the
	requested duration.

## Open risks resolved for planning

- FIT files may have missing timestamps, distance, or power: invalid points are excluded from effort derivation; CSV average power remains independently usable.
- Imported datasets may contain average power but no FIT file: the average-power section still renders and duration sections remain unavailable.
- Existing imports may not include power: current non-power PB behavior remains the default and no empty power section is forced into the UI.
