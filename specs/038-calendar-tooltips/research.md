# Research: Training Calendar Contrast and Tooltips

## Decision: Strengthen Green and Blue palettes with explicit high-contrast tokens

**Decision**: Replace the current lightest Green and Blue active tokens with stronger, more saturated values while keeping the shared bright empty token. Validate the ordered five-step palettes as distinct color values and ensure level 1 meets the documented contrast target against the empty color.

**Rationale**: The reported problem is specifically that stage 1 is barely visible. Explicit stable tokens are easy to test and preserve the existing static-browser architecture.

**Alternatives considered**:
- Generate colors dynamically from a gradient — rejected because stable named tokens are easier to validate and maintain.
- Darken empty days instead — rejected because the prior refinement explicitly requires bright neutral empty days.

## Decision: Store tooltip-ready activity summaries in the pure day model

**Decision**: Extend each aggregated day with immutable tooltip activity summaries containing date context, activity name, sport category, and only valid duration/distance values. Keep source activity objects unchanged.

**Rationale**: The dashboard renderer should not rediscover or regroup raw activities for each hover. A pure model keeps multi-year context correct and makes tooltip content unit-testable.

**Alternatives considered**:
- Search all imported activities on every mouseover — rejected because it duplicates grouping logic and risks mixing years or filters.
- Serialize full source activity objects into the DOM — rejected for privacy, payload size, and accidental exposure of unrelated fields.

## Decision: Render one local tooltip per active day interaction

**Decision**: Use one reusable tooltip layer positioned relative to the currently hovered or focused day cell within the calendar panel. Replace its content and anchor on each interaction, and close it when the interaction leaves the active cell without moving content to a global bottom section.

**Rationale**: A single local layer avoids hundreds of duplicated DOM nodes while preserving exact day context in multi-year views. Positioning relative to the calendar panel supports collision handling and narrow layouts.

**Alternatives considered**:
- Keep the global bottom details panel — rejected because it loses context when the user hovers a cell in an upper year block.
- Create a separate tooltip element for every cell — rejected because it increases DOM size across several full-year grids.

## Decision: Support hover and keyboard focus with the same details

**Decision**: Bind the same tooltip model to mouseenter/focus and close it on mouseleave/blur when no related calendar cell remains active. Day buttons retain accessible labels and the tooltip is an `aria-live`/described region associated with the active cell.

**Rationale**: Hover-only details exclude keyboard users, while one shared interaction path prevents content drift between input methods.

**Alternatives considered**:
- Mouseover only — rejected by the existing accessibility contract.
- Permanent details under every year block — rejected because it recreates the removed global-detail ambiguity.

## Decision: Keep local processing and existing filters

**Decision**: Apply existing sport and palette state before rendering tooltip content. Tooltip activity lists contain only activities included in the current year block and sport filter; no network request is introduced.

**Rationale**: This preserves multi-year correctness, local privacy boundaries, and the established calendar behavior.

**Alternatives considered**: None; this is a repository constraint and existing product behavior.
