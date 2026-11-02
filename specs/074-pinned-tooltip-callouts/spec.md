# Feature Specification: Pinned Tooltip Callouts and Lifetime Statistics Cleanup

**Feature Branch**: `TriAnalytica-dev-2` (existing branch; no new branch created)

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "'pinned data', also wenn geklickt wurde und der tooltip bestehen bleibt: 1) bei visualisierung 'lifetime statistics' entferne die 'pin data' symbole 2) In den screenshots beim export mache sie im stil 'Cartoon-Sprechblase', nicht immer unten als bar."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inspect Lifetime Statistics Without Pin Symbols (Priority: P1)

As an athlete inspecting Lifetime Statistics, I want the separate Pin data symbols removed while retaining the ability to keep a selected statistic's tooltip visible, so the statistics remain visually uncluttered without losing detail inspection.

**Why this priority**: Removing these symbols is an explicit request and must not accidentally remove the underlying pin interaction.

**Independent Test**: Open populated Lifetime Statistics, confirm that no separate Pin data symbols are visible, select a statistic, move away, and dismiss its retained tooltip. Repeat using touch and keyboard.

**Acceptance Scenarios**:

1. **Given** populated Lifetime Statistics, **When** the user inspects the statistics, **Then** no separate Pin data symbol or icon-only pin button is displayed on its selectable items.
2. **Given** a statistic with tooltip detail, **When** the user clicks or taps the statistic itself and moves away, **Then** its tooltip remains visible without requiring a separate pin symbol.
3. **Given** keyboard interaction with Lifetime Statistics, **When** the user focuses and activates a selectable statistic, **Then** its detail can be pinned with visible focus and an identifiable selected state, without a separate pin-symbol control.
4. **Given** a pinned statistic, **When** the user selects it again, dismisses its tooltip, or presses Escape while interacting with the visualization, **Then** the pin is released; selecting another statistic replaces the selection.
5. **Given** another visualization, **When** the user inspects its existing controls, **Then** this Lifetime Statistics cleanup has not removed or changed those controls.

---

### User Story 2 - Share Pinned Details as Cartoon Speech Bubbles (Priority: P1)

As an athlete sharing a visualization, I want my pinned detail shown as a cartoon-style speech bubble associated with the selected item, so recipients can immediately recognize what the detail describes instead of reading a detached bottom bar.

**Why this priority**: The exported appearance of pinned data is the second explicit requested change and applies across existing visualization exports.

**Independent Test**: Pin a detail in each supported visualization, open its export preview, and download the image. Verify that both show one bounded speech bubble rather than a full-width bottom annotation bar and that its content identifies the selected item.

**Acceptance Scenarios**:

1. **Given** a pinned item visible in the exported visualization, **When** the user exports it, **Then** preview and download show one compact cartoon-style speech bubble with a rounded body, contrasting outline, and tapered tail directed toward that item.
2. **Given** pinned items at different positions with sufficient surrounding room, **When** each is exported, **Then** the bubble is placed near its own item and adapts above, below, left, or right as space permits, rather than always occupying a bottom bar.
3. **Given** a bubble near an image edge, **When** export is prepared, **Then** its placement is adjusted to keep the body, tail, and text inside the image without covering the selected anchor, export title, legend, or branding.
4. **Given** long or multi-row detail, **When** full content cannot fit legibly, **Then** the bubble retains the complete selected headline with readable wrapping; the live tooltip remains complete.
5. **Given** no pinned detail, **When** the user exports, **Then** no speech bubble or transient tooltip is added and the existing export presentation is preserved.
6. **Given** a pinned Lifetime Statistics item after removal of its Pin data symbols, **When** the user exports, **Then** its selected detail appears in the same speech-bubble style.
7. **Given** an export requested with a pinned detail, **When** the live selection later changes or the export completes, is cancelled, or fails, **Then** that export retains its original selection and the export operation itself does not change the live pin.
8. **Given** a selected item outside the current view or absent from the capture, **When** the user exports, **Then** one compact speech bubble identifies the item and states why it is not shown, without a tail pointing at unrelated visible data.

### Edge Cases

- Dense data or large bubbles: choose a position that leaves the selected anchor visible; use the existing headline-only fallback when full detail cannot fit. Never revert to a full-width bottom bar.
- Very long headlines: wrap the complete headline; if even that cannot fit legibly, report export failure rather than clipping, silently omitting the pin, or changing the selected detail.
- Corners and narrow export content: keep the complete bubble and tail within the image and preserve the selected-item association when moving the bubble to another side.
- Off-screen map items or items not included in a capture: retain the existing outside-view distinction and an explicit item label; a non-pointing bubble must not imply a false location.
- Missing values or grouped selections: preserve existing missing-value indicators and group identity; do not invent values or split one selection into multiple bubbles.
- Repeated exports: produce exactly one bubble per pinned export, with no accumulated annotation copies or interactive pin/dismiss symbols in the image.
- Empty or unavailable Lifetime Statistics: show no orphaned pin controls, fabricate no selectable detail, and preserve the existing no-data export behavior.
- Changed filters, tabs, or imported data: retain existing pin invalidation so stale detail is never presented in a bubble.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Lifetime Statistics MUST remove separate visible Pin data symbols and pin-icon controls from its selectable statistics. This removal MUST NOT remove the statistics, their values, or their tooltip details.
- **FR-002**: Lifetime Statistics MUST retain pinning through the statistic itself using pointer, touch, and keyboard input, including visible keyboard focus, a programmatically identifiable selected state, replacement by another selection, and release by reselecting, dismissing, or Escape. Separate Pin data symbols MUST NOT be required.
- **FR-003**: The symbol-removal change MUST be limited to Lifetime Statistics. Existing controls and primary actions in other visualizations MUST remain unchanged.
- **FR-004**: Every existing visualization export with a pinned detail MUST present exactly one cartoon-style speech bubble in both preview and downloaded image, replacing the full-width bottom annotation bar. The bubble MUST have a compact rounded body, contrasting outline, and a tapered tail when its selected item is visible in the capture; its width MUST follow its content and available space rather than defaulting to the visualization's full width.
- **FR-005**: For a visible selected item, bubble placement MUST be relative to that item's location in the exported image, choosing above, below, left, or right according to available space. The tail MUST unambiguously indicate that item or selected group, not another item.
- **FR-006**: The entire bubble, including its tail and text, MUST remain inside the exported image. Placement MUST avoid the selected anchor, export title, legend, and branding. Covering some unselected visualization content is permitted when needed for a readable bubble.
- **FR-007**: Exported bubble content MUST preserve the complete selected labels, values, units, group identity, missing-value indicators, and notes when these fit legibly. If full detail does not fit, the existing complete-headline fallback MUST be used, with wrapping and without changing the full live tooltip. If even the headline cannot fit legibly, export MUST report failure rather than silently omit or clip it.
- **FR-008**: If the selected item is outside the current view or absent from the exported capture, the bubble MUST identify the selection and explicitly describe that distinction. It MUST NOT point at unrelated content or imply that an off-screen item is visible.
- **FR-009**: Preview and downloaded image for the same export request MUST use the same pinned selection, content fallback, bubble style, placement, and selected-item association captured for that request, even if subsequent live interactions change the selection.
- **FR-010**: Export MUST exclude interactive-only pin indicators and dismiss controls. An export without a pin MUST add neither a bubble nor a transient tooltip and MUST retain existing format choices, branding, preview, download, and no-data behavior.
- **FR-011**: Export completion, cancellation, or failure MUST NOT itself change the live pinned selection. Existing rules for one pin per visualization, context-change invalidation, and temporary rather than saved selection state MUST remain unchanged.
- **FR-012**: The feature MUST preserve existing tab names, ordering, navigation, analytical values, and import behavior. Selected activity details and export preparation MUST remain local to the browser without introducing transmission of tooltip content; unrelated existing network behavior is unchanged.

### Key Entities *(include if feature involves data)*

- **Pinned detail**: The existing selected item or group, its complete tooltip content, visualization context, and association with a visible, off-screen, or uncaptured item.
- **Export speech bubble**: The exported full or headline-only presentation of one pinned detail, including its body, outline, optional directional tail, and position relative to the selected item.
- **Export selection snapshot**: The visualization and pinned selection at export request time, used consistently by that request's preview and download.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Populated and empty Lifetime Statistics display zero separate Pin data symbols or pin-icon controls; pointer, touch, and keyboard users can still pin, replace, and dismiss a detail in every applicable acceptance case.
- **SC-002**: Across all 13 existing visualization views with representative populated data, every pinned export contains exactly one speech bubble and zero full-width bottom annotation bars in both preview and download. No-pin exports contain zero added bubbles.
- **SC-003**: In a placement matrix covering central, edge, and corner selections, every visible-item bubble points to the correct selection and has zero clipped text, clipped tails, or overlaps with the selected anchor, export title, legend, or branding. At least two different bubble-side placements occur across the matrix when space permits.
- **SC-004**: All short-detail cases retain 100% of their selected content; long-detail cases retain the complete selected headline without truncation. All off-screen or uncaptured-item cases identify the same selection without pointing at unrelated data.
- **SC-005**: At 360-pixel-wide mobile and 1440-pixel-wide desktop viewports, the pin-to-preview workflow remains usable, and the generated image's full or compact bubble can be read at its native image size without clipped text.
- **SC-006**: Every repeated-export and selection-change acceptance case preserves the requested selection in preview and download, introduces no duplicate bubbles, and leaves the live pin unchanged by the export operation itself.

## Assumptions

- Removing Pin data symbols means removing the separate item-level pin affordances in Lifetime Statistics, not disabling its pin behavior or removing the tooltip's accessible dismiss action.
- Cartoon speech bubble means a rounded, outlined callout with a tapered directional tail, not a decorative character, illustration, or new theme for the entire dashboard.
- The speech-bubble presentation applies to all existing visualization screenshot exports with pinned data, not only Lifetime Statistics. Other live tooltip styling is unchanged.
- Existing pinning and local Share/Export behavior from [feature 073](../073-pin-visualization-tooltips/spec.md), including headline fallback and truthful off-screen association, remain dependencies and apply unless explicitly refined here.
- One temporary pinned detail per visualization remains the scope; multiple bubbles, user-authored annotations, manual dragging, saved annotations, and new visualization tabs are excluded.
- This specification changes presentation and Lifetime Statistics affordances only; analytical calculations, supported sports, source-data parsing, and unrelated services are out of scope.