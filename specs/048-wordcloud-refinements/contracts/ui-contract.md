# UI Contract: Wordcloud Sharing and Controls

## Share/Export action

- **Placement**: In the Wordcloud panel's visualization header, matching the location and style used by other dashboard visualization tabs.
- **Label/behavior**: Use the established branded “Export for Insta / Strava” action. Activating it opens the existing image preview; the preview can be downloaded locally or closed without download.
- **Capture content**: The currently rendered Wordcloud canvas plus the existing meaningful title and branded square-image composition. Do not capture the ranking list, its expanded/collapsed rail, slider, dashboard navigation, or other interactive controls.
- **Availability**: Enable only after a current cloud render completes with at least one selected word and a supported renderer. If there is no eligible/selected word, layout is incomplete, or the renderer is unavailable, explain why export cannot be produced and do not create a blank image.
- **Privacy**: Capture and download remain in the browser. Activity titles, word lists, and image data are not uploaded to an export or publishing service.

## Word filtering and initial count

- Exclude every token containing fewer than two Unicode letters after normalization from both the frequency rank and cloud; combining marks are not counted as letters.
- Initialize the count slider at 50 while retaining its existing 10–100 bounds.
- When fewer eligible words than the selected limit exist, show all available terms and the accurate effective count.
- Preserve the existing stable word-frequency ranking and checkbox behavior.

## Responsive ranked-list panel

- **Initial state**: Expanded at page startup and whenever the Wordcloud tab is activated.
- **Wide layout**: Place the panel to the right of the cloud. The collapse control reduces it to a narrow right-edge rail so the cloud receives the freed width.
- **Narrow layout**: The expanded panel follows the canvas. Collapse reduces it to a compact horizontal control instead of a vertical rail.
- **Toggle accessibility**: A button exposes a descriptive accessible name, `aria-expanded`, and `aria-controls`; it supports keyboard activation. The collapsed button remains available and visible.
- **State handling**: Reflow the canvas/cloud after collapse, expand, or resize. Keep frequency counts, ordering, checkbox selections, and slider value unchanged. Reset only the expanded/collapsed state when leaving and reactivating the Wordcloud tab.

## Export registration contract

The Wordcloud tab must be registered as an exportable visualization using the same configuration points as other tabs: display title, filename slug, capture element, available view/context, and data-availability check. Export must await the current asynchronous wordcloud layout completion, not only a fixed delay. The tab's export button, empty-state behavior, and capture mapping must have focused tests.
