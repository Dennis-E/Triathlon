# Research: Remove Filter Summary Bubbles

No external research is required. The relevant behavior and repository conventions are established in the current codebase.

## Decisions

### Remove the presentation-only summary, preserve filter behavior

- **Decision**: Remove the dashboard-wide summary row and its renderer/update wiring. Keep all filter controls, selected-state styling, and filter-to-visualization behavior intact.
- **Rationale**: The summary duplicates selected values already shown by the controls. Its renderer is separate from filter controls and chart behavior, so removing that presentation avoids changing user selections or visualization results.
- **Alternatives considered**: Keep the summary but hide it with styling; rejected because the redundant UI and its update work would remain. Redesign the filters; rejected because the request is only to remove the duplicate summary.

### Keep the change within existing frontend surfaces

- **Decision**: Update the existing dashboard orchestration, markup, and focused structural test; add no library, API, storage, or build step.
- **Rationale**: The app is static and browser-first, and the behavior is already centralized in the dashboard UI.
- **Alternatives considered**: Introduce a new reusable module or external UI contract; rejected because neither is needed for this presentation-only change.

## Resolved Unknowns

- The summary is a separate row above visualization panels, not the selected state inside each filter control.
- No persistence, server integration, import processing, or export behavior needs to change.
- The focused verification is the dashboard script syntax/structure test, followed by the root Jest suite.
