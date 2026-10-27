# Research: Landingpage Logo Layout

## Decision 1: Preserve the existing logo and reflow its surroundings

- **Decision**: Keep the current logo asset and its proportions. At narrow widths, adjust the responsive arrangement of the header contents so the logo does not compete for a single constrained row; keep the hero logo fully visible as well.
- **Rationale**: The reported issue is compression in a narrow layout, not a need for a new brand asset. The existing page uses a flex-based header, with the logo and navigation/status content sharing the available width. Reflowing neighboring content addresses that constraint without distorting or replacing the logo.
- **Alternatives considered**:
  - Replace or crop the logo: rejected because the specification requires the existing brand mark to remain recognizable and undistorted.
  - Hide or clip neighboring content: rejected because it can make navigation or status information inaccessible and does not guarantee no horizontal overflow.
  - Add viewport-dependent JavaScript: rejected because this is a presentation-only behavior already suited to the static page's responsive CSS utilities.

## Decision 2: Validate at the specification's explicit widths

- **Decision**: Check the page at 320, 375, 768, and 1280 CSS pixels, and resize between narrow and wide layouts.
- **Rationale**: These widths are already defined by the acceptance criteria and cover the minimum supported width, a common narrow width, and wider layouts. The current Jest environment is Node without a DOM, so visual geometry must be verified in a browser.
- **Alternatives considered**:
  - Add a browser automation dependency for this isolated layout change: rejected for now because it expands project tooling beyond the feature's scope; use the existing test suite plus a repeatable manual viewport check.

## Technical Context Findings

- The header and landing-page hero each render the same logo asset.
- The header is a single flex row containing the logo control and a separate news/status group; those contents compete for limited width.
- The hero logo is centered and uses its height with automatic width, so it should remain proportional while its container remains available.
- The app is static, loaded directly in a browser, and has no frontend build step.
- No data, storage, external API, or network behavior is involved.

No unresolved technical decisions remain for planning.