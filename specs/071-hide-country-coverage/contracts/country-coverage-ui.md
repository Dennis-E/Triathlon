# Countries Visited Card UI Contract

## Covered Surfaces

- Lifetime Statistics dashboard card.
- Lifetime Statistics export card.

## Required Behavior

- For partial coverage, omit the sentence “Based on X of Y activities” from both surfaces.
- Continue to display the country count and country names from the existing summary.
- Preserve the existing complete-coverage message and the loading and unavailable states.
- Keep dashboard and export output consistent for the partial-coverage state.

## Failure Conditions

The contract is not met if the partial-coverage sentence appears in either surface, if country count or names change, or if complete/loading/unavailable output changes as a side effect.