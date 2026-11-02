# UI Contract: Personal About Page

**Feature**: [spec.md](../spec.md)
**Model**: [data-model.md](../data-model.md)

## Routes and Discovery

- `index.html` retains its existing logo action, News link, import-status markup IDs, and dashboard tab contracts.
- The header adds a native anchor labelled `About` with `href="./about.html"`, immediately after News and outside all dashboard panels. The link is available before import and while the dashboard is shown.
- `about.html` is directly addressable on the same static host with no account, imported data, application bootstrap, or prior history.
- Its linked existing logo and visible `Back to dashboard` link target `./index.html`. The header also retains access to `./news.html` through a `News` link.
- Navigation remains in the same tab; no `history.back()`, new analysis path, or client-side routing is introduced.
- `news.html` does not require modification for this feature; existing main-site News and return paths remain intact.

## Document and Content

- HTML5, UTF-8, document language `en`, responsive viewport metadata, title `About TriAnalytica`, and a concise factual metadata description that adds no personal/product claims.
- Use one header with a labelled navigation landmark and one `main` with `id="aboutContent"`.
- The main contains exactly one h1 with the spec's greeting, followed by its three introductory paragraphs.
- Three narrative sections follow with exactly these h2 titles, in order: `A late start. A long-lasting habit.`, `The kids joined a club. So did the rest of us.`, and `Why TriAnalytica?`.
- All approved paragraphs appear in their supplied order, including both closing lines. The final anchor follows Dennis's sign-off and has `id="exploreTrainingLink"`, visible text `Explore your training`, and `href="./index.html"`.
- The final action is the last editorial content. Do not add a second introduction, unrelated explanatory copy, biographies, counters, or testimonials.
- The creator's follow-up adds two paragraphs before the sign-off: a feedback invitation with a `mailto:myaidevproject@gmail.com?subject=TriAnalytica%20Feedback` link, and an update invitation linking to the existing index `newsletterFallbackLink` destination and `https://www.instagram.com/trianalytica/`. The newsletter link explicitly identifies Brevo. External links use `rel="noreferrer"` and `referrerpolicy="no-referrer"`; all three are ordinary same-tab anchors, with no embedded signup or external resource loaded until activation.
- Content comparison allows HTML entity decoding and whitespace normalization only; do not normalize away punctuation, the greeting symbol, or the smiley.

## Layout and Accessibility

- Existing brand logo, sans-serif font convention, dark slate base, light text, muted body copy, and restrained amber link/action accents. No new font or palette, photography, portraits, decorative assets, cards, or nested panels.
- Unframed single-column main, approximately 65-character reading measure, comfortable side gutters, generous section spacing, and prominent but bounded greeting/introductory typography. Use rem-based sizing; no viewport-scaled font sizes or negative letter spacing.
- About header stays in normal document flow so wrapping at 200% text size does not cover the main. Logo size stays constrained, and all navigation can wrap without clipping.
- Main index header's right-hand link/status group wraps internally with gaps. Existing status IDs and content remain present; text may wrap. No hiding the status, existing navigation, or longest words to conceal overflow.
- At 320, 375, 768, and 1440 CSS pixel widths, no horizontal document scrolling, clipped text, or overlapping content. Repeat with text enlarged to 200%.
- Native anchors support Tab/Shift+Tab and Enter, with visible focus and meaningful names. Focus styling applies to linked logo, navigation, and final action.
- Text contrast is at least 4.5:1 for normal text and 3:1 for large text, including the final action and navigation states. Do not rely on colour alone for the focused control.
- The waving-hand symbol is supplementary; its absence must not obscure the textual greeting. The existing logo is the only expected image and is not required to understand the narrative.

## Excluded Interfaces and Effects

No new API endpoints, counter calls, newsletter forms, browser storage, application JavaScript, content service, or workout processing. Existing CDN styling can make network requests; this page does not introduce a blanket no-network promise. Dashboard constants, tab IDs/order/dispatch, imports, and exports remain unchanged.

## Verification Contract

| Coverage | Automated source checks | Browser/editorial checks |
| --- | --- | --- |
| FR-001, FR-002 | Main-header About link and correct relative target; initial HTML has complete content | One activation before import; direct About load; discovery while dashboard visible |
| FR-003, FR-004 | Full ordered text comparison, exactly one h1 and three h2 headings, UTF-8 and language metadata | Rendered copy and heading order; greeting/intro prominence |
| FR-005, FR-006 | Page-local responsive rules and unchanged status IDs as supporting evidence only | Viewport matrix, 200% text, readable measure/spacing, no overflow/overlap |
| FR-007 | Native anchors, names, labelled navigation and focus rules as supporting evidence only | Keyboard traversal/activation, visible focus, computed text contrast |
| FR-008, FR-009 | Header return link scoped to header; final anchor scoped to main, after sign-off, correct target | Test each return path independently from a fresh direct visit |
| FR-010, FR-011 | Exact approved text, no page forms or application/counter scripts | Editorial voice, typography-only presentation, no invented details |
| FR-012 | News and legal-footer regression suites, retained index status/News contracts | Existing index logo and News route still work; no analysis-flow changes |
| FR-013 | Feedback address, reused Brevo URL, confirmed Instagram URL, and updated full-copy comparison | New links appear before the sign-off, wrap at narrow widths, have visible focus, and make no automatic third-party request |

Source assertions are not a substitute for browser evidence. Tests should use expected approved strings in the focused suite rather than derive expectations from the implementation being tested.