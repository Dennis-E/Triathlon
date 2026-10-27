# Research: Hide Partial Country Coverage Note

## Decision 1: Suppress only the partial-coverage sentence

- **Decision**: Do not render the “Based on X of Y activities” sentence when country coverage is partial. Keep the country count and names, the existing complete-coverage message, and loading/unavailable states unchanged.
- **Rationale**: The request names the partial-coverage sentence specifically. Removing only that presentation element avoids changing the meaning or availability of the country summary.
- **Alternatives considered**:
  - Remove the entire Countries visited card when coverage is partial: rejected because the country count and names remain useful and are explicitly required by the specification.
  - Remove coverage status from the country summary data: rejected because aggregation data is not the requested display copy and may be used for other behavior.
  - Remove every coverage message, including the complete-coverage message: rejected because the request only identifies the partial-coverage sentence; the specification explicitly preserves other states.

## Decision 2: Keep dashboard and export behavior aligned

- **Decision**: Apply the behavior at the shared country-card rendering boundary and verify both the dashboard capture area and export output.
- **Rationale**: Lifetime Statistics and its export use the same country-card renderer. A single presentation rule prevents the message from disappearing in one surface but remaining in the other.
- **Alternatives considered**:
  - Change only the dashboard output: rejected because the export contains the same unwanted sentence.
  - Add a separate export-only rule: rejected because it duplicates behavior and risks output inconsistency.

## Technical Context Findings

- `renderCountriesVisited` builds the card's coverage sentence from the existing summary status and activity counts.
- The partial sentence is currently asserted in `__tests__/lifetime-statistics-dashboard.test.js` for both dashboard and export output.
- Complete coverage, loading, and unavailable output are separate existing render states and should remain unchanged.
- No changes to country aggregation, storage, external APIs, or runtime dependencies are necessary.

No unresolved technical decisions remain for planning.