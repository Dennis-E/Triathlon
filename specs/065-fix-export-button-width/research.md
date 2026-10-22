# Research: Consistent Export Button Width

**Date**: 2026-10-22
**Scope**: Local, read-only inspection of the existing static markup and tests.

## R1 - Affected buttons and responsive headers

**Decision**: Scope the feature to all eleven standard `exportVisualizationTab(...)` buttons in visualization headers. Do not include `pbDetailExport`: it is a separate personal-best detail overlay and does not share the affected header layout.

**Evidence**: The standard actions appear in [index.html](../../index.html#L1065) and ten corresponding header buttons. Eight header groups switch from column to row at `md` (768 px); Wordcloud, Pie Charts and Lifetime Statistics switch at `sm` (640 px). Total Distance places the button in its own filter/action row. Training Calendar also has a palette sibling. Existing button classes are otherwise the same.

**Rationale**: A shared treatment makes dimensions consistent without rewriting different header structures or changing their breakpoints.

**Alternatives considered**: Changing every parent header risks shifting titles, filter groups and palettes. Including the separate PB overlay broadens scope without evidence that it has the stretch defect.

## R2 - Shared styling boundary

**Decision**: Give the eleven standard controls one explicit shared class in `index.html`; define one content-sized width rule bounded by the available viewport width. Keep the current label, icons, padding, event handlers, header alignment and responsive breakpoints. Avoid `align-self: start`, which changes cross-axis alignment in row layouts.

**Rationale**: A content-sized width prevents the default stretch behavior when a flex header becomes a column. A maximum width protects very narrow viewports. A named class is explicit and independent of inline event wiring.

**Alternatives considered**: Styling `[onclick^="exportVisualizationTab"]` couples presentation to behavior. Applying width/align rules to the whole header affects other controls. Replacing the Tailwind CDN or adding a CSS build pipeline is unnecessary.

## R3 - Verification boundaries

**Decision**: Extend the existing static markup assertions to require all eleven actions to carry the shared class and verify the central style rule. Run existing export behavior suites, then manually measure rendered layout at 320, 375, 640, 768, 1024 and 1440 CSS px in the real browser.

**Evidence**: [index-script-syntax tests](../../__tests__/index-script-syntax.test.js#L419) already assert export registration and capture mapping. Pie Charts and Wordcloud have focused wiring tests. Jest uses Node and no browser automation is configured; it cannot certify rendered flex geometry.

**Rationale**: Static assertions guard complete consistent application without fragile snapshots; browser inspection is needed for geometry and breakpoint alignment.

**Alternatives considered**: DOM snapshots would not calculate CSS layout. Installing Playwright/Puppeteer solely for this small styling change would add a dependency and setup burden; use the existing browser responsive tools for the visual acceptance check.

## Resolution Status

No technical questions remain. The content-width approach is selected; exact rendered behavior remains subject to the viewport acceptance check.
