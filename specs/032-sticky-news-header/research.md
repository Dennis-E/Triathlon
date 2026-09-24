# Research: Sticky News Header

## Decision: Use page-local fixed positioning with content compensation

**Rationale**: The request concerns one static page. Keeping the header fixed at the
viewport top and adding equivalent top spacing to the main content directly addresses
the observed scroll behavior without JavaScript, new dependencies, or dashboard
changes. A high stacking order keeps the header above the article.

**Alternatives considered**:

- Sticky positioning: rejected because the requested behavior is explicitly fixed to
  the browser viewport even after the page scrolls beyond the header's normal position.
- Scroll event JavaScript: rejected because CSS positioning is sufficient and avoids
  unnecessary runtime work and browser event edge cases.
- Changing the global dashboard header: rejected because the issue is limited to the
  standalone News page.

## Decision: Validate geometry at desktop and mobile widths

**Rationale**: The header contains two navigation elements and must remain usable on
narrow screens. Browser checks should verify fixed position after scrolling, visible
navigation, and no horizontal overflow at representative desktop and mobile widths.

**Alternatives considered**:

- Source-only assertions: retained for fast regression coverage but insufficient alone
  to prove actual viewport geometry, so they are supplemented by browser validation.