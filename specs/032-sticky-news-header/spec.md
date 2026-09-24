# Feature Specification: Sticky News Header

**Feature Branch**: `032-sticky-news-header`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "On the news page the header (with the logo and \"back to dashboard\") does not stay \"fixed\" on top of browser page when scrolling down. it should stay fixed!"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep News Navigation Visible (Priority: P1)

As a visitor reading a long News article, I want the News header with the logo and `Back to dashboard` navigation to remain visible at the top while I scroll so that I can return to the dashboard at any time.

**Why this priority**: The requested behavior directly improves navigation and is the only scope needed for this fix.

**Independent Test**: Open the News page with enough content to scroll, scroll down, and verify that the header remains at the top of the viewport with both the logo and `Back to dashboard` link visible.

**Acceptance Scenarios**:

1. **Given** the News page is scrolled below its initial position, **When** the visitor inspects the top of the viewport, **Then** the header remains visible at the top rather than scrolling away with the article.
2. **Given** the fixed header is visible while the visitor scrolls, **When** the visitor selects `Back to dashboard`, **Then** navigation to the dashboard remains available and works as before.

### User Story 2 - Preserve Readability While Fixed (Priority: P2)

As a visitor reading News content, I want the fixed header to stay visually above the article without hiding the article's beginning or creating awkward overlap so that the page remains readable.

**Why this priority**: A fixed element is only useful if it does not obstruct the content it is meant to accompany.

**Independent Test**: Open the News page at the top and after scrolling on both wide and narrow viewports; verify that the header has a stable height, the article can be read beneath it, and no horizontal scrolling is introduced.

**Acceptance Scenarios**:

1. **Given** the visitor opens the News page at its initial position, **When** the page renders, **Then** the content begins below the header and is not hidden behind it.
2. **Given** the visitor scrolls on a narrow viewport, **When** the fixed header remains visible, **Then** the logo and `Back to dashboard` link remain accessible without horizontal overflow or incoherent overlap.

### Edge Cases

- When the viewport is narrow, the fixed header must keep both navigation elements usable without forcing horizontal scrolling.
- When the page is loaded directly at the top, the header must not create an excessive blank gap before the News content.
- When the visitor scrolls to the bottom, the header must remain above the article and page background rather than being covered by content.
- When the browser has a short viewport height, the header must remain visible without preventing the visitor from scrolling through the article.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The News page MUST keep its header visible at the top of the browser viewport while the visitor scrolls vertically.
- **FR-002**: The fixed header MUST contain the existing TriAnalytica logo and `Back to dashboard` navigation.
- **FR-003**: The header MUST remain visually above the News content while fixed.
- **FR-004**: The News page content MUST begin below the fixed header so that the page heading and first article content are not hidden behind it.
- **FR-005**: The fixed header MUST preserve the existing dashboard navigation destination and interaction.
- **FR-006**: The fixed header and News content MUST remain usable on narrow and wide viewports without horizontal scrolling caused by the header.
- **FR-007**: The change MUST be limited to the News page header behavior and must not alter article content or dashboard behavior.

## Key Entities *(include if feature involves data)*

- **News Header**: The persistent page header containing the TriAnalytica logo and the link back to the dashboard.
- **News Content**: The page content that must remain readable below and behind the persistent header during scrolling.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of scroll checks at supported desktop and mobile viewport sizes, the News header remains visible at the top of the viewport.
- **SC-002**: In 100% of navigation checks after scrolling, the visible `Back to dashboard` link opens the existing dashboard entry point.
- **SC-003**: In 100% of supported viewport checks, the News heading and article content are not obscured by the fixed header at the initial page position.
- **SC-004**: The News page introduces zero horizontal overflow attributable to the fixed header at supported narrow and wide viewport sizes.
- **SC-005**: Existing News article content and dashboard behavior remain unchanged apart from the header's scroll persistence.

## Assumptions

- The requested "fixed" behavior means the header remains visible at the top of the viewport during vertical scrolling.
- The existing header contents, styling direction, and dashboard link destination remain unchanged.
- The News page has or will retain enough content to exercise vertical scrolling in browser validation.
- No changes to the main dashboard header are required for this feature.