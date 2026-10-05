# UI Contract: Workout Title Wordcloud

This feature adds a dashboard tab and a separate static landing-page feature tile. It exposes no new network endpoint or exported data format.

## Dashboard tab

- **Navigation key**: `wordcloud`
- **Button ID**: `vizTabWordcloud`
- **Panel ID**: `vizPanelWordcloud`
- Button and panel are connected with matching accessible tab semantics; the tab is included in keyboard navigation and dashboard tab dispatch.
- **Visualization region**: Canvas-based wordcloud, labeled for assistive technology. Word size expresses total token frequency, with bounded readable minimum/maximum sizes; terms remain within the responsive panel. The renderer attempts every checked term using responsive resizing and font shrinking. If a term still cannot be placed, a visible notice names it; the term remains in the checkbox list and can be reselected.
- **Word count control**: Labeled range slider, minimum 10, maximum 100, initial value 30; visible current value. Effective word count is capped at the number of eligible words.
- **Selection list**: One keyboard-operable checkbox per displayed ranked word, with word and count. Checked terms appear in the cloud; unchecked terms do not. Wide layout places the list beside the cloud; narrow layout places it below.
- **State changes**: Slider changes synchronize list and cloud; checkbox changes update the cloud without changing rankings or counts. A term newly entering the top-N set is checked by default; a term remaining in the set keeps its current selection.
- **Empty states**: Explain when there are no eligible words or no checked words. List and controls are omitted or disabled only when there is no eligible ranked set; the zero-checked state retains the list so selections can be restored.
- **Dependency failure**: If wordcloud2.js is unavailable or unsupported by the browser, show a clear cloud-unavailable message while retaining the ranked checkbox/count list where possible; do not throw or leave a blank panel.
- **Privacy boundary**: Titles and derived terms stay in existing browser memory. The external word-cloud script is loaded like existing CDN libraries; no title/term payload is sent to its host or to a new service.

## Landing-page tile

- **Title**: “And much more”
- **Content**: Only bullet keywords: “Wordcloud” and “…”; no descriptive paragraph, chart image, or interactive dashboard action.
- **Layout**: Fits the existing responsive landing grid and does not cause horizontal overflow. It is not counted as a data-dependent visualization preview card and requires no preview asset.

## Validation contract

- Pure ranking behavior is validated with synthetic German/English titles, repeated words within one title, stop words, punctuation, case variants, numeric tokens, missing-title placeholders, and deterministic ties.
- Dashboard wiring is validated for tab registration, keyboard navigation, panel/button association, render dispatch, control synchronization, empty states, and the landing tile.
- No test fixture or preview asset may use the private ZIP or disclose personal workout titles.
