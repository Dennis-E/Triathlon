# Feature Specification: Social Share Branding & Favicons

**Feature Branch**: `[035-social-share-branding]`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "Update the TriAnalytica website so that shared links show a professional branded preview image instead of the currently cropped/auto-detected logo. Add a 1200x630 social preview image, Open Graph/Twitter card metadata, and proper favicon/app icons using the circular TriAnalytica logo, all served correctly under the GitHub Pages subpath https://dennis-e.github.io/Triathlon/."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Branded preview when sharing the site link (Priority: P1)

A person shares the link `https://dennis-e.github.io/Triathlon/` in a chat app, social network, or messaging tool (e.g. Strava, LinkedIn, WhatsApp, Facebook, Slack). Recipients see a professional, TriAnalytica-branded preview card with a clear title, tagline/description, and a full 1200x630 preview image, instead of a cropped or auto-detected logo fragment.

**Why this priority**: This is the core problem reported — the current shared-link preview looks unprofessional and undermines trust in the product. Fixing it delivers immediate, visible value with no functional risk.

**Independent Test**: Paste the production URL into a link-preview debugger (or a chat app) and confirm the card shows the TriAnalytica title, tagline, and the full branded image without cropping.

**Acceptance Scenarios**:

1. **Given** the production page is deployed, **When** a link-preview scraper (Open Graph/Twitter card parser) requests the page, **Then** it receives `og:title` = "TriAnalytica", `og:description` containing "Training data. Clearer insights.", and `og:image` pointing to the full 1200x630 branded image.
2. **Given** the branded preview image is published at its documented URL, **When** it is requested directly, **Then** it loads successfully (HTTP 200) with unchanged 1200x630 dimensions.
3. **Given** the page is shared on Strava, LinkedIn, WhatsApp, Facebook, or Slack, **When** the recipient views the link card, **Then** the image shown is the supplied TriAnalytica branded artwork, not a cropped logo or Strava branding.

---

### User Story 2 - Recognizable browser tab / bookmark icon (Priority: P2)

A user has the TriAnalytica page open in a browser tab or has bookmarked/installed it. They want to recognize it at a glance among other tabs, bookmarks, or home-screen icons.

**Why this priority**: Improves day-to-day usability and brand consistency, but the site remains fully functional without it — lower impact than the sharing scenario.

**Independent Test**: Open the production page in a browser and confirm the tab icon shows the circular TriAnalytica emblem; check bookmark/home-screen icon on a mobile device shows the same emblem at the appropriate resolution.

**Acceptance Scenarios**:

1. **Given** the production page is loaded in a desktop browser, **When** the user looks at the browser tab, **Then** it displays the circular TriAnalytica emblem (not the wide wordmark, not a generic default icon).
2. **Given** the production page is added to a mobile home screen, **When** the icon is generated, **Then** it uses the circular emblem at the correct size.

---

### User Story 3 - No duplicate or conflicting metadata (Priority: P3)

A developer or search engine inspects the page source. They need a single, unambiguous source of truth for title, description, and social metadata rather than multiple conflicting tags.

**Why this priority**: Correctness and maintainability concern; doesn't change what an end user sees directly, but prevents future confusion or preview inconsistencies.

**Independent Test**: View the page source and confirm exactly one `<title>`, one `og:title`, one `og:description`, one `og:image`, and one `twitter:image` tag exist, with no legacy/old image URLs remaining.

**Acceptance Scenarios**:

1. **Given** the page `<head>`, **When** it is inspected, **Then** there is exactly one tag for each of: title, description, og:title, og:description, og:url, og:image, twitter:card, twitter:image.

### Edge Cases

- What happens if a social platform caches an old preview image? (Out of scope to force cache invalidation on third-party platforms; documented as a known limitation.)
- How does the system handle a browser that doesn't support PNG favicons? A `.ico` fallback is provided for broad compatibility.
- What happens if the page is accessed via a path other than the documented GitHub Pages subpath (e.g. a fork or local preview)? Relative-path application assets must still resolve; only the social metadata uses the fixed production absolute URL.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page MUST expose a single `<title>` element with the exact text "TriAnalytica".
- **FR-002**: The page MUST expose a single meta description summarizing the product as long-term running, cycling, and swimming analytics explored in the browser.
- **FR-003**: The page MUST expose Open Graph metadata (`og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`, `og:image:alt`) with values consistent with the title/description and pointing to the absolute production URL of the branded preview image.
- **FR-004**: The page MUST expose Twitter/X card metadata (`twitter:card` = "summary_large_image", `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt`) consistent with the Open Graph values.
- **FR-005**: A 1200x630 branded social preview image MUST be published as a static asset under `assets/` so it is reachable at `https://dennis-e.github.io/Triathlon/assets/social-preview.png`, with the approved proportional resize preserved.
- **FR-006**: The site MUST provide favicon/app icon assets derived from the circular TriAnalytica emblem (not the wide wordmark) in the standard sizes: `.ico`, 16x16 PNG, 32x32 PNG, 180x180 Apple touch icon, 192x192 and 512x512 Android Chrome icons.
- **FR-007**: The page MUST link the favicon/app icon assets via appropriate `<link>` elements, using paths that resolve correctly under the GitHub Pages subpath `/Triathlon/`.
- **FR-008**: All new metadata and asset references MUST be added to the existing canonical HTML entry point rather than introducing a second, conflicting set of tags.
- **FR-009**: Social metadata URLs (`og:url`, `og:image`, `og:image:secure_url`, `twitter:image`) MUST use the explicit absolute production URL (`https://dennis-e.github.io/Triathlon/...`), not root-relative paths that would resolve outside the `/Triathlon/` subpath.
- **FR-010**: No previously existing conflicting `og:image` or duplicate title/description tags may remain after the change.
- **FR-011**: The change MUST NOT alter existing application functionality, page layout, upload/import behavior, chart styling, navigation, responsive layout, or privacy behavior.

### Key Entities

- **Social Preview Image**: A static 1200x630 PNG brand asset representing the product in link-share previews; identified by its public URL and referenced from Open Graph and Twitter meta tags.
- **Favicon/App Icon Set**: A group of static image assets (ico/PNG) derived from the circular brand emblem, in multiple fixed sizes, referenced from `<link>` elements in the page head.
- **Page Metadata**: The set of `<head>` elements (title, description, Open Graph, Twitter card) describing the page for browsers, search engines, and link-preview scrapers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Requesting the branded preview image URL directly returns a successful response (HTTP 200) and the image renders at 1200x630.
- **SC-002**: A standard Open Graph/Twitter card debugger shows the correct title ("TriAnalytica"), description (containing "Training data. Clearer insights."), and full-size branded image with no cropping, for the production URL.
- **SC-003**: Inspecting the deployed page source shows exactly one value for each of: title, description, og:title, og:description, og:url, og:image, twitter:card, twitter:image — with zero leftover/old image references.
- **SC-004**: The browser tab icon and any generated home-screen/bookmark icon visibly show the circular TriAnalytica emblem, verified in at least one desktop and one mobile browser.
- **SC-005**: All existing automated tests for import, charts, navigation, and privacy behavior continue to pass unchanged after the update.

## Assumptions

- The 1200x630 branded preview image and the circular emblem source artwork are supplied by the requester as-is; this feature covers publishing and referencing them, not designing new artwork from scratch.
- The production site is served from GitHub Pages at `https://dennis-e.github.io/Triathlon/`, and static assets placed under `assets/` are served under `https://dennis-e.github.io/Triathlon/assets/`.
- No build/bundler step exists (per project conventions); metadata and asset links are added directly to `index.html`, the canonical HTML entry point.
- Third-party platforms (Strava, LinkedIn, WhatsApp, Facebook, Slack) may cache previously scraped previews; cache-busting on those external platforms is out of scope.
- "Do not use the wide wordmark for favicon-sized assets" is interpreted as: favicon/app icons are cropped/derived from the circular emblem portion of the existing brand artwork, not the full horizontal logo lockup.
