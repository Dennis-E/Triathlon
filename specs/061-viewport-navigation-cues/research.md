# Research: Viewport-Visible Navigation Cues and Arrow Handling

## Decision 1: Anchor Cues to the Browser Viewport

**Decision**: Keep the four existing cues in one non-interactive viewport-fixed layer outside the scrolling visualization content. Center the left/right cues vertically; place the up/down cues at visible viewport edges and keep all four inside safe viewport margins.

**Rationale**: The current cues are absolutely positioned relative to `#visualizationPanelStage`, so scrolling long charts moves them out of view. A viewport-anchored layer directly satisfies the requirement without scroll listeners or per-frame position updates.

**Alternatives considered**: Retaining stage-relative absolute positioning was rejected because it repeats the current failure. A scroll listener that continually recalculates positions was rejected because it adds synchronization and resize/scroll lifecycle complexity for a static placement problem.

## Decision 2: Resolve Up/Down Against the Active Visualization

**Decision**: When a visible eligible single-choice filter has focus, change only that group. Otherwise, if a visualization is active and focus is not owned by a modal or native select/range/checkbox, use the first eligible single-choice group in displayed order. Move focus to the selected choice. Prevent dashboard-page scrolling for handled active-visualization navigation; do not change a filter or show success feedback when no eligible group can act.

**Rationale**: This records both clarification answers: the focused group takes precedence, and without one the active visualization supplies the first eligible group regardless of other focus location. Native controls and modal dialogs remain outside dashboard-level interception.

**Alternatives considered**: Requiring filter focus for every Up/Down action was rejected because the user chose fallback navigation. Capturing keys inside native controls or modals was rejected because it would break established control and focus behavior.

## Decision 3: Reuse Existing Filter and Cue Feedback Paths

**Decision**: Continue using existing filter choice click/update callbacks, active-filter summary refresh, and directional cue availability/activation functions.

**Rationale**: This keeps chart state, displayed summaries, and cue feedback synchronized with existing pointer and keyboard changes.

**Alternatives considered**: Direct chart mutation or a new cue state system was rejected because it could bypass rendering, summary updates, and reduced-motion behavior.

## Decision 4: Add No Dependencies, Persistence, or External Contracts

**Decision**: Implement the change in existing HTML/CSS and dashboard orchestration files, with existing Jest integration tests and browser verification.

**Rationale**: The application already owns the cues, filter states, and event listeners; this feature adds no external interface or persistent state.

**Alternatives considered**: A positioning or keyboard library was rejected because native CSS positioning and the current event paths cover the required behavior.

## Research Tasks

No unresolved technology, data, or external-integration questions remain. Local code inspection is sufficient; no external research is required.