# Research: Heatmap Hover Count Threshold

## Decision 1: Use the existing distinct activity count

**Decision**: Base the threshold on `totalCount` from the existing heatmap activity tooltip model. It is derived from distinct contributing activity IDs, which represent the track contributions counted by a route segment.

**Rationale**: The map segment and tooltip already use the same unique activity membership for route frequency. Recomputing a count in the display layer could cause the visible value to diverge from the route data.

**Alternatives considered**: Count rendered track rows or count raw GPS points. Both would report a different quantity from the route's contributing tracks.

## Decision 2: Keep threshold behavior in the tooltip presentation

**Decision**: Apply the strict `totalCount > 10` condition in `src/dashboard-heatmap.js`. Show the requested `# of tracks: N` label only above the threshold; hide the existing count heading at or below ten. For sampled segments, preserve the existing "Random 10 of N activities" explanation below the count label.

**Rationale**: The model already owns count and sampling data. The requested change concerns what the user sees, while track aggregation, sample membership, activity rows, and map behavior remain unchanged.

**Alternatives considered**: Change the count or sampling logic in `src/heatmap-utils.js`. This would mix presentation policy into reusable data logic and risk changing established tooltip-model behavior.

## Decision 3: Treat the tooltip as the user-facing contract

**Decision**: Document the threshold, strict boundary, heading order, sample explanation, and stale-heading behavior as a UI contract. No API or persisted-data contract is needed.

**Rationale**: The feature changes an existing browser interaction and exposes no new external interface or stored data.

**Alternatives considered**: Add a service/API contract. The feature makes no network requests and introduces no service boundary.

## Research outcome

No unresolved technical choices remain. The repository's static browser architecture, DOM-orchestration boundary, Jest test environment, and current tooltip model provide the required implementation and verification path; no research agents or new technology evaluations are needed.
