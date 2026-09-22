# Research: Bike Power PB Refinement

## Decision 1: Make Watt a dedicated Bike PB section below Longest

**Decision**: Render one dedicated Watt section after the Bike Longest section. Keep the existing Bike distance, elevation, and Longest sections in their current order.

**Rationale**: The current activity-average power block is placed before the distance PB cards and makes power look like another activity summary. A dedicated section matches the user's mental model and keeps power records separate from distance records.

**Alternatives considered**:

- Keep power before distance records: rejected because it is the reported discoverability and ordering problem.
- Add a new dashboard tab: rejected because the requested information belongs in the existing Bike PB context and does not need new navigation.

## Decision 2: Remove activity-average PB preparation from this feature

**Decision**: Do not render an activity-average power progression in Personal Bests. Remove calculations and data preparation only when they exist solely for that progression. Retain `avgWatts` in imported activities for unrelated activity details and other existing uses.

**Rationale**: Whole-activity average watts cannot establish a duration-specific power PB. Removing only PB-specific presentation/calculation avoids accidental data loss elsewhere in the application.

**Alternatives considered**:

- Show average watts as a separate PB category: rejected by the clarified requirement.
- Delete `avgWatts` from the activity model entirely: rejected because existing activity detail behavior uses it.

## Decision 3: Expand FIT duration categories to eight intervals

**Decision**: Support 5s, 30s, 1m, 2m, 5m, 10m, 20m, and 60m. Use seconds internally and unambiguous labels in the UI.

**Rationale**: The existing 5m-60m categories cover sustained efforts but omit common sprint and short-power comparisons. The eight categories cover both explosive and endurance-oriented performance without creating an open-ended duration taxonomy.

**Alternatives considered**:

- Add every possible duration: rejected because it would create an unstable, cluttered UI.
- Use only 5s/30s/1m/2m: rejected because existing longer-duration PBs are valuable and explicitly requested to remain.

## Decision 4: Use real rolling FIT efforts with the established coverage rule

**Decision**: Derive each duration PB only from FIT records with finite positive power and at least the existing 80% valid-power coverage threshold. Average CSV watts never substitute for a missing duration effort.

**Rationale**: This preserves the established data-integrity rule and prevents sparse or incomplete FIT streams from producing false short-duration PBs.

**Alternatives considered**:

- Estimate short durations from activity averages: rejected because it creates unsupported duration claims.
- Lower the threshold for short windows: rejected because short windows are especially sensitive to sparse samples.

## Decision 5: Render an available-points-only all-time profile

**Decision**: Build at most one point per supported duration from the highest qualifying duration-specific watt value. Sort points by duration, omit missing durations, and connect only the available points. Show a limited-data state when fewer than two points exist.

**Rationale**: The user explicitly selected omission rather than interpolation. This keeps the chart truthful while still allowing partial profiles.

**Alternatives considered**:

- Interpolate missing durations: rejected because it would fabricate performance data.
- Break the line at every missing duration: rejected because omitted points already communicate availability and the chart is a categorical set of supported durations.

## Decision 6: Reuse the existing SVG timeline/card visual language

**Decision**: Keep duration progression cards and add the profile using the existing inline SVG rendering conventions in `index.html`; no charting dependency or navigation change is needed.

**Rationale**: The repository already renders PB timelines with SVG and has focused inline-script tests. Reusing that language minimizes integration risk and preserves the static browser boundary.

**Alternatives considered**:

- Add a new chart library: rejected because it adds dependency weight for one profile and is unnecessary.
- Move all rendering into a new dashboard tab: rejected because it broadens scope beyond the requested Bike PB refinement.
