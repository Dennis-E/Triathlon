# Research: Keyboard Navigation for Visualization Filters

## Decision 1: Reuse the Existing Navigation Utility

**Decision**: Extend the existing keyboard navigation behavior in `src/tab-navigation.js` and its focused unit tests instead of introducing a new navigation module.

**Rationale**: The module already owns visualization order, wraparound, and pure filter-choice stepping, and exposes both CommonJS and browser-global interfaces.

**Alternatives considered**: A separate keyboard-navigation utility was rejected because it would split one navigation contract and add script loading and test surface without new reusable behavior.

## Decision 2: Keep Key Handling Scoped to the Active Dashboard Context

**Decision**: Interpret Tab/Shift+Tab as Right/Left only when a visualization tab is the active context. Handle Up/Down only for an eligible focused single-choice filter group in the active panel.

**Rationale**: The specification requires normal focus traversal and native control behavior outside those contexts. The existing `src/dashboard-tabs.js` already checks the active panel and focused filter group before changing a selection.

**Alternatives considered**: A document-wide handler that captures Tab or Up/Down regardless of focus was rejected because it would interfere with modal, page, and native-control keyboard behavior.

## Decision 3: Preserve Existing Filter Update and Feedback Paths

**Decision**: Use the existing filter choice click/update pathway, active-filter summary refresh, and direction-specific cue behavior after a successful value change. Do not change other filter groups.

**Rationale**: This preserves chart updates and visible state synchronization already used by pointer interactions and native filter controls.

**Alternatives considered**: Directly mutating chart state was rejected because it risks bypassing existing render callbacks and summary synchronization.

## Decision 4: Add No Dependencies, Storage, or External Interface

**Decision**: Implement the feature entirely within current browser scripts and Jest tests; keep navigation state transient.

**Rationale**: The static app and current test suite already support the behavior, and the feature introduces no persistent user data or external service contract.

**Alternatives considered**: A keyboard library or persisted navigation preferences were rejected because neither is required by the specification.

## Research Tasks

No unresolved technical unknowns, new technology choices, or external integrations remain. No external research is required.