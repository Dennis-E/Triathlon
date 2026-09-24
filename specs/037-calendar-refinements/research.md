# Research: Training Calendar Refinements

## Decision: Build all years into one ordered view model

**Decision**: Discover the newest and oldest valid imported activity years, generate every integer calendar year in that inclusive range, sort years descending, and render one complete calendar block per year. The current year is first when present; otherwise the newest available year is first. Do not expose a year selector for this view.

**Rationale**: This directly supports comparison across seasons and removes the interaction cost of switching a single-year filter. Existing per-year day aggregation remains reusable inside the multi-year model.

**Alternatives considered**:
- Keep the year selector and show one year at a time — rejected because it contradicts the requested simultaneous comparison.
- Show only years containing activities — rejected because years without qualifying activities between the dataset's oldest and newest years must remain visible for an honest season comparison.

## Decision: Use one shared palette state across every year block

**Decision**: Store the selected palette as `green`, `blue`, or `fire` in dashboard state, default to `green`, and apply the same five active levels plus the shared empty-day color to every year block and legend.

**Rationale**: A single selection makes comparison across years meaningful and prevents the same intensity level from having different meanings in adjacent blocks.

**Alternatives considered**:
- Allow a different palette per year — rejected because it weakens cross-year comparison and complicates the control model.
- Persist the palette across sessions — rejected for v1 because the existing calendar state is session-local and no preference storage is required.

## Decision: Keep empty days palette-independent and bright

**Decision**: Use one bright neutral empty-day color for level 0 in all palettes. Active levels must remain distinguishable from that neutral color, including the lowest active level.

**Rationale**: The requested visual priority is the contrast between rest days and active days. A palette-independent neutral ensures that contrast cannot disappear when the palette changes.

**Alternatives considered**:
- Tint empty days with each palette — rejected because the requested contrast would be less stable and less obvious.
- Use the existing dark empty color — rejected because it is the reported usability problem.

## Decision: Define explicit five-step palettes

**Decision**: Provide exactly three choices: Green, Blue, and Fire. Each has five ordered active colors. Fire progresses from yellow through orange to red; Green and Blue progress from lighter to darker, more saturated values. The legend includes the shared empty state and all five active levels.

**Rationale**: Fixed explicit palettes are predictable, testable, and accessible to the existing static UI without adding a color-picker dependency.

**Alternatives considered**:
- A free-form color picker — rejected because arbitrary colors make intensity ordering and contrast validation unreliable.
- A single gradient generated at runtime — rejected because named, stable colors are easier to validate and communicate.

## Decision: Reuse existing sport filters and local processing

**Decision**: Apply the existing `All`, `Run`, `Bike`, `Swim`, and `Other` filter to every year block. Recompute each year's intensities from the filtered activities while preserving local-only processing and source activity values.

**Rationale**: This keeps the refinement compatible with the implemented calendar behavior and the repository's privacy and parsing constraints.

**Alternatives considered**:
- Add separate filters per year — rejected as overly complex and inconsistent with the shared palette model.
- Change parser sport normalization — rejected by the constitution and unnecessary for a presentation refinement.
