# UI Contract: Countries Visited in Lifetime Statistics

## Placement and Scope

- Add a Countries visited tile to the existing Lifetime Statistics view, showing the distinct-country count and country names.
- Do not show country counts, names, or coverage text in the Distance visualization.
- The count covers all currently imported Run, Bike, and Swim activities across the full imported date range.
- The count is independent of the selected sport, aggregation level, and timeframe controls. Those controls continue to affect the existing chart and its other KPI cards.
- Do not add a visualization tab, navigation entry, map, or country-name list.

## Value and Coverage States

| State | Display contract |
|---|---|
| Complete | Show the distinct-country count, country names, and neutral text indicating that all imported activities are included. |
| Partial | Show the distinct-country count and country names, with text such as `Based on trackedActivityCount of totalActivityCount activities`. |
| Unavailable | Show an unavailable label rather than zero, with brief context such as `Location unavailable`. |

Country identity follows Natural Earth's bundled Admin 0 feature classification. A country is counted once even if several routes or repeated crossings intersect it. A multi-point route crossing an international boundary counts each intersected country.

## Recalculation

- Recompute when the active imported dataset changes or when required country geometry finishes loading.
- Do not recompute on sport, aggregation, or timeframe selection changes.
- Ignore invalid coordinate pairs. A failed geometry/intersection dependency must result in `unavailable`, never a fabricated count of zero.

## Share/Export

- Preserve the existing Lifetime Statistics export button, preview, and download flow.
- Include the same country count, names, and coverage state in the Lifetime Statistics export capture.
- Keep the existing Lifetime Statistics target key and capture target; this feature does not introduce a new export mapping.

## Accessibility and Layout

- Give the tile a visible Countries visited label and readable country names; do not rely on color alone to communicate coverage.
- Keep the count and status readable at mobile and desktop widths, with wrapping rather than horizontal overflow.