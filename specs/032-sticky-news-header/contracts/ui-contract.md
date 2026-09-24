# UI Contract: Sticky News Header

## Fixed Position

- The `news.html` header MUST be positioned at the top of the browser viewport while
  the document is scrolled.
- The header MUST have a stacking order that keeps it above the News content.
- The header MUST retain the existing logo and `Back to dashboard` link.

## Content Offset

- The News main content MUST begin below the fixed header at the initial page position.
- The offset MUST be sufficient for the header's rendered height without creating an
  excessive blank gap.

## Responsive Navigation

- At supported narrow and wide viewport widths, the fixed header MUST have no
  horizontal overflow.
- The `Back to dashboard` link MUST remain a native keyboard-reachable link targeting
  `./index.html`.
- Existing article text and navigation destination MUST remain unchanged.