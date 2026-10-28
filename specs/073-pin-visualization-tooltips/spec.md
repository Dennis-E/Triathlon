# Feature Specification: Pin Visualization Tooltips and Include Them in Exports

**Feature Branch**: `TriAnalytica-dev-2` (existing branch; no new branch created)

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "tooltips on every visualization: on clicking when a tooltip is shown, 'fix' the tooltip, i.e. it stays visible, and also include it then when user chooses 'export', that the tooltip is also shown in the export picture"

## Clarifications

### Session 2026-10-28

- Q: What should happen when a pinned tooltip does not fit fully and legibly in the export image? -> A: Compact the exported tooltip, for example to its headline; use a headline-only fallback rather than failing merely because the full detail is too long. Keep the live tooltip complete.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep a Selected Tooltip Visible (Priority: P1)

As an athlete inspecting a visualization, I want to click the item whose tooltip is visible and keep that detail visible while moving the pointer away, so I can read it without holding the pointer in place.

**Why this priority**: Stable detail inspection is the essential interaction on which exporting a selected detail depends.

**Independent Test**: In each visualization with data, reveal a tooltip, click its associated item, and move outside the visualization. The same detail remains visible until deliberately released or its view context changes.

**Acceptance Scenarios**:

1. **Given** a visible, unpinned data tooltip, **When** the user clicks its associated item, **Then** that tooltip becomes pinned and its pinned state is visually distinguishable.
2. **Given** a pinned tooltip, **When** the pointer leaves the item or visualization or passes over another item, **Then** the selected content remains visible and unchanged.
3. **Given** a pinned tooltip, **When** the user clicks a different data item, **Then** the selected tooltip is replaced by the new item's pinned tooltip, with only one pinned tooltip in that visualization.
4. **Given** a pinned tooltip, **When** the user clicks the selected item again or activates the tooltip's dismiss action, **Then** the pin is released and normal transient tooltip behavior resumes.
5. **Given** a touch device, **When** the user taps a data item, **Then** its tooltip is shown and pinned without requiring hover; tapping it again releases the pin.
6. **Given** an unpinned visualization, **When** a tooltip is revealed and the pointer leaves without selecting an item, **Then** existing transient tooltip behavior is preserved.

---

### User Story 2 - Export the Selected Detail (Priority: P1)

As an athlete sharing a visualization, I want its pinned tooltip to appear in the exported picture, so the recipient sees the same selected detail that I chose to highlight.

**Why this priority**: Exporting a selected detail is an explicit part of the requested feature, not an optional enhancement.

**Independent Test**: Pin a tooltip, activate the existing Share/Export action, inspect the preview, and download the image. Both images contain exactly the selected tooltip, with its complete content when it fits or the same selected headline when compact presentation is needed; the live tooltip remains complete.

**Acceptance Scenarios**:

1. **Given** a pinned tooltip, **When** the user moves to and activates Share/Export, **Then** moving away and clicking the export control do not dismiss the pin, and both preview and downloaded image include it.
2. **Given** an exported pinned tooltip, **When** the image is inspected, **Then** its complete content is readable when it fits; otherwise a compact headline-only version is readable and remains associated with the same selected item, without clipping or changing the complete live tooltip.
3. **Given** no pinned tooltip, **When** the user exports a visualization, **Then** the picture contains no transient data tooltip and otherwise retains the established export presentation.
4. **Given** a pinned tooltip when an export is requested, **When** the user later changes or dismisses the selection, **Then** that export's preview and download retain the selection captured at the time of the request.
5. **Given** an export preview that is closed, a completed download, or a failed export attempt, **When** the user returns to the unchanged visualization, **Then** the original pinned selection is still present and usable.

---

### User Story 3 - Use the Same Interaction Across Views (Priority: P2)

As an athlete moving between different visualizations, I want the same pin-and-export behavior everywhere and no outdated detail after changing what is displayed.

**Why this priority**: Consistent behavior prevents surprising omissions and misleading exported details when switching views or filters.

**Independent Test**: Exercise pin, replace, dismiss, and export in every populated visualization, then change its filters, navigate away, and import replacement data. No tooltip from an obsolete view is shown or exported.

**Acceptance Scenarios**:

1. **Given** any populated visualization in the scope below, **When** a user selects a data item, **Then** its data tooltip supports the same pin, replace, dismiss, and export rules.
2. **Given** a pinned tooltip, **When** a filter, date range, aggregation, metric, sport, or other displayed-data setting changes, **Then** the pin is cleared before the changed result is displayed or exported.
3. **Given** a pinned tooltip, **When** the user changes visualization tabs or imports a replacement dataset, **Then** the previous pin is cleared and does not reappear on return.
4. **Given** an empty or unavailable visualization, **When** the user interacts with it or requests export, **Then** no tooltip is fabricated and existing no-data export behavior is retained.
5. **Given** a pinned tooltip, **When** the viewport is resized or its map is panned or zoomed without changing the displayed data selection, **Then** the selected content remains pinned, readable, and associated with its item; an off-screen item is identified as outside the current view rather than falsely anchored to another item.

### Edge Cases

- Dense or overlapping items: pin the same item represented by the displayed tooltip; do not silently select a neighboring item.
- Multi-series or grouped tooltips: preserve the complete displayed group in live selection and the export snapshot; a compact export may omit detail rows but must identify the same selected group.
- Long labels, multiple rows, or qualification notes: use the full content in export when it fits; otherwise compact to the selected headline rather than fail solely due to detail length. Wrap the headline to remain readable. The live tooltip must still allow access to all original content on small screens.
- Items near visualization edges: reposition the tooltip as needed while keeping its selected-item association clear.
- Data items with unavailable values: preserve existing missing-value indicators and never invent a numeric replacement.
- Clicking empty visualization space or unrelated controls: do not pin a nonexistent item or accidentally release a pin; displayed-data changes still clear it.
- Repeated selections and repeated exports: never accumulate duplicate tooltip copies or duplicate dismiss controls.
- Export preparation failure: preserve the live selection and existing error feedback; never silently produce a tooltip-free image when a pin was requested.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide pinnable data tooltips across all existing visualization views: total distance, pace metrics, equipment, equipment timeline, personal bests, heatmap, distributions, workout time, training calendar, word cloud, pie charts, lifetime statistics, and media gallery. In a view without an existing data tooltip, a selectable data item MUST expose its existing descriptive labels and values as a tooltip; no new analytic measure is required.
- **FR-002**: Clicking the data item represented by a currently visible tooltip MUST pin that tooltip. On touch devices, tapping an item MUST both reveal and pin its tooltip without requiring hover.
- **FR-003**: A pinned tooltip MUST retain its selected content when the pointer leaves the item, leaves the visualization, or hovers another item, including while approaching Share/Export.
- **FR-004**: The system MUST allow at most one pinned tooltip per visualization. Selecting another item MUST replace the pinned selection; grouped tooltip content counts as one selection.
- **FR-005**: Users MUST be able to release a pin by selecting the same item again, using an accessible dismiss action, or pressing Escape while interacting with the visualization. Pinned state MUST be distinguishable without relying solely on color.
- **FR-006**: Unpinned tooltips MUST retain their existing transient behavior. Pinning MUST preserve the displayed labels, values, units, group members, missing-value indicators, and qualification notes.
- **FR-007**: Share/Export MUST include the active visualization's pinned tooltip in both the existing image preview and the downloaded image. Moving to or activating Share/Export MUST NOT release the selection.
- **FR-008**: Each export MUST use the visualization, displayed-data context, and pinned selection present when the export was requested. Subsequent interactions MUST NOT change that export's tooltip or associate it with a different data context.
- **FR-009**: Exported tooltip content MUST be readable and unambiguously associated with its selected item. The system MUST include complete content when it fits legibly; otherwise it MUST compact the tooltip to its headline, using the existing item/group label if there is no title, without requiring the user to unpin or shorten the live tooltip. The retained headline MUST wrap without clipping; omitted detail rows and notes MUST NOT alter the complete live tooltip or snapshot. Content MUST NOT be duplicated or overlap the export title, context, or branding; interactive-only dismiss controls and pin indicators MUST NOT appear in the image.
- **FR-010**: Exports without a pinned tooltip MUST exclude transient data tooltips and preserve existing export content, branding, format choices, preview, download, and no-data behavior.
- **FR-011**: Completing, cancelling, or failing an export MUST NOT alter the live pinned selection unless the user has independently changed the visualization context or selection. Full-detail overflow MUST trigger the compact presentation in FR-009, not an export failure. If even the compact headline cannot be included readably, or capture otherwise fails, the export MUST report failure rather than silently omit the tooltip entirely.
- **FR-012**: Changing displayed-data settings, switching visualization tabs, or replacing imported data MUST clear the pin before the new context is shown or exported. Tooltip state MUST NOT survive a page reload.
- **FR-013**: Resizing the viewport and map panning or zooming MUST preserve pinned content without misleading placement. If the selected item leaves the visible area, the tooltip MUST indicate that its item is outside the current view; it MUST NOT point at unrelated data. Exports of this state MUST preserve that distinction.
- **FR-014**: Tooltip interactions MUST NOT prevent existing map navigation, chart navigation, or media opening. Where an item already has a primary click action, tooltip pinning MUST be separately available through an accessible item-level action without removing that primary action.
- **FR-015**: Pin, replace, and dismiss actions MUST be operable by keyboard as well as pointer or touch, with visible focus and a programmatically identifiable pinned state and dismiss action.
- **FR-016**: Selected tooltip content and export preparation MUST remain local to the browser; this feature MUST NOT introduce transmission of imported activity details or tooltip content. Existing unrelated network behavior is outside this feature's scope.

### Key Entities *(include if feature involves data)*

- **Visualization context**: The active visualization, imported dataset, and displayed-data settings that determine the meaning of its items.
- **Tooltip selection**: The selected item or group, its complete displayed detail content, and its transient or pinned status within a visualization context.
- **Export selection snapshot**: The visualization context and optional pinned tooltip chosen at export request time, shared by that request's preview and download.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 13 existing visualization views pass the reveal, pin, pointer-leave, replace, dismiss, and pin-inclusive export acceptance checks using representative populated data; no view is exempted by its rendering style.
- **SC-002**: In every tested view, one selection action pins a visible tooltip, and the tooltip remains unchanged for at least 30 seconds after the pointer leaves, unless explicitly released or the visualization context changes.
- **SC-003**: For every pinned-export acceptance case, preview and downloaded image contain exactly one identical selected tooltip: 100% of its labels, values, units, and notes when full content fits, or its complete selected headline when compact presentation is needed. Long multi-row detail fixtures MUST export successfully using that headline fallback, with no clipped text or changes to the complete live tooltip.
- **SC-004**: All no-pin export cases omit transient tooltips, and all filter-change, tab-change, dataset-replacement, and reload cases show zero stale pinned tooltips in either the live view or subsequent exports.
- **SC-005**: The pin-and-export workflow can be completed using pointer, touch, and keyboard input independently, without losing the selection when activating Share/Export.
- **SC-006**: At a 360-pixel-wide mobile viewport and a 1440-pixel-wide desktop viewport, complete live tooltip content and its dismiss action remain accessible, and the exported full or compact tooltip remains readable.

## Assumptions

- This specification covers existing visualization data tooltips, not tooltips on toolbar buttons or general help text. Every existing visualization is in scope, including views currently lacking data tooltips.
- One pinned tooltip per visualization is a deliberate default; multiple simultaneous annotations, freely dragged annotations, custom text, and saved annotation collections are out of scope.
- Pins are temporary inspection state. Switching tabs clears them rather than saving a separate selection for every tab.
- Existing detail content is reused. Views lacking data tooltips expose existing item information rather than introducing new statistics or activity-detail pages.
- Selecting the data item is the normal pin gesture; users are not required to click a floating tooltip itself. Existing primary item actions take precedence where necessary, with a separate pin action for those items.
- The established local Share/Export preview and image download flow remains the delivery path; this feature adds neither a new visualization tab nor a separate export workflow.
- Existing import/parsing semantics, analytical calculations, supported sports, and unrelated network services remain unchanged.