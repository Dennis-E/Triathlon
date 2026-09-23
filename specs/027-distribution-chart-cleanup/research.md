# Research: Distribution Chart Cleanup

## Decision: Keep display formatting and All-Sports speed conversion in reusable utilities

- **Rationale**: `src/distribution-utils.js` already owns metric extraction, bucket construction, and value formatting, while `src/dashboard-distributions.js` owns Chart.js configuration. A pure conversion helper can normalize All-Sports Pace to km/h for Jest and the browser without moving DOM logic into a utility module.
- **Alternatives considered**: Converting values only in the renderer was rejected because filtering, bucket construction, and per-sport grouping could then use different units. Changing the imported activity records was rejected because it would mutate shared source data.

## Decision: Use speed in km/h as the All-Sports Pace representation

- **Rationale**: Existing Run and Swim values are min/km and min/100m, while Bike values are km/h. The requested single unit is km/h, so Run and Swim values must be converted from their activity distance/duration relationship to speed before shared Pace filtering, buckets, labels, and line positions are calculated. Bike values already use the target unit.
- **Conversion rules**: `speedKmH = distanceKm / (durationSeconds / 3600)`. Invalid or non-positive distance/duration values produce no distribution value. Existing sport-specific single-sport Pace displays remain unchanged unless the user explicitly selects All Sports.
- **Alternatives considered**: Converting all sports to min/km was rejected because the user explicitly requested km/h. Keeping raw values and renaming the axis was rejected because it would create a false shared scale.

## Decision: Provide separate boundary labels for histogram ticks

- **Rationale**: Histogram data labels describe full bucket ranges, but Chart.js category ticks display those labels as if each range were one coordinate. The renderer should derive a separate tick-label list from `rangeStart`/`rangeEnd`, de-duplicate repeated numeric boundaries, and preserve explicit open-ended labels. Bucket labels remain available for tooltips or descriptive contexts.
- **Alternatives considered**: Replacing bucket labels globally with boundaries was rejected because range labels remain useful for tooltips and accessibility. Using the range midpoint was rejected because it caused the reported Elevation and Power axis confusion.

## Decision: Hide line points and color the line/fill directly

- **Rationale**: The line view is intended to communicate a smoothed curve, not individual observations. Chart.js supports zero point radii while retaining the line and fill. The selected palette should be applied to `borderColor` and `backgroundColor`; per-point colors become unnecessary.
- **Alternatives considered**: Keeping tiny or transparent points was rejected because they can still appear on hover and preserve the visual clutter the request targets.

## Decision: Match legend fill to line stroke

- **Rationale**: Chart.js point-style legends derive their marker colors from dataset styling. Setting each line dataset's `backgroundColor` to its stroke color, while retaining `usePointStyle` and circular markers, makes the filled legend marker represent the actual line.
- **Alternatives considered**: Custom legends were rejected because they duplicate Chart.js state and introduce avoidable synchronization work.

## Decision: Use one flat medium-dark blue for Monochrome blue histograms

- **Rationale**: The request distinguishes histogram treatment from the prior gradient. A single stable blue ensures every bar is visually consistent. Line mode uses the same color for the line and shaded area; All Sports lines may retain distinct sport identity strokes when needed for comparison.
- **Alternatives considered**: A blue gradient was rejected because the request explicitly asks for one medium-dark color across histograms.

## Risks and mitigations

- **Risk**: All-Sports Pace conversion changes bucket values and may change the visible distribution compared with the previous mixed-unit view. **Mitigation**: limit conversion to All Sports, add conversion tests for Run/Swim/Bike, and preserve single-sport semantics.
- **Risk**: Category histogram ticks may omit a final boundary if an overflow bucket is present. **Mitigation**: build tick labels from every finite boundary and explicitly label the final open-ended boundary (`50+` or `> value`).
- **Risk**: Removing points can reduce hover affordance. **Mitigation**: retain line hover behavior and tooltip data; only visual point radii are removed.
