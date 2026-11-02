# Feature Specification: Personal About Page

**Feature Branch**: `TriAnalytica-dev-2`

**Feature Directory**: `specs/076-about-page`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Create an About page for TriAnalytica using the supplied final English copy. Introduce Dennis as a fellow amateur triathlete and explain the personal side project connecting triathlon, training data, and learning to build software with AI. Specify user needs, page behaviour, content, and acceptance criteria; leave technical implementation choices to planning."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Meet the Person Behind TriAnalytica (Priority: P1)

As a visitor and fellow amateur triathlete, I want to find a personal introduction to Dennis so I can understand who created TriAnalytica, why it exists, and how it relates to ordinary training and family life.

**Why this priority**: A relatable introduction and an honest explanation of the project's motivation are the core purpose of this feature.

**Independent Test**: From the existing site navigation, open About without importing training data. Read the page and compare every section with the approved content below.

**Acceptance Scenarios**:

1. **Given** a visitor is using the existing main site navigation, **When** they activate the clearly labelled About destination, **Then** they reach the About page without needing an account or a training import.
2. **Given** the About page is open, **When** the visitor reads its opening, **Then** the greeting and introduction have clear visual prominence and identify Dennis as "just another age grouper" and TriAnalytica as his fun personal side project.
3. **Given** the About page is open, **When** the visitor reads from beginning to end, **Then** all approved paragraphs, headings, the sign-off, and the final action appear in the supplied order and wording.
4. **Given** the completed page, **When** its content is reviewed against the approved copy, **Then** it presents Dennis in the first person with warmth, modesty, and light humour, without added achievements, qualifications, affiliations, or product promises.

---

### User Story 2 - Continue to My Own Training (Priority: P2)

As a visitor who has read about the project, I want a clear route to the existing analysis experience so I can explore my own training.

**Why this priority**: The personal introduction should connect naturally back to the reason visitors use TriAnalytica.

**Independent Test**: Open the About page directly and test the final action and the existing-style return navigation separately; each must reach the current main analysis entry point.

**Acceptance Scenarios**:

1. **Given** a visitor reaches the end of the page, **When** they activate "Explore your training", **Then** the existing main analysis entry point opens without a new onboarding, signup, or alternative analysis flow.
2. **Given** a visitor is on the About page, **When** they use its navigation to return to the main experience, **Then** they can reach the same existing analysis entry point without relying on browser history.
3. **Given** a visitor follows a direct link to About with no previous site visit, **When** they activate either return route, **Then** the main analysis entry point is available normally.

---

### User Story 3 - Read Comfortably on My Device (Priority: P2)

As a visitor using a phone, desktop, keyboard, or assistive technology, I want a readable, accessible introduction that feels like part of the existing site.

**Why this priority**: The introduction must remain accessible and comfortable to read across the devices and input methods visitors already use.

**Independent Test**: Review the full page at narrow mobile and desktop widths, at enlarged text size, and using only the keyboard. Inspect heading order, contrast, focus visibility, and navigation outcomes.

**Acceptance Scenarios**:

1. **Given** a mobile or desktop viewport, **When** the visitor reads the page, **Then** short sections and generous spacing keep the text readable without clipping, overlapping content, or horizontal scrolling.
2. **Given** keyboard-only navigation, **When** the visitor moves through and activates navigation and the final action, **Then** each control has a visible focus indication, a meaningful accessible name, a logical focus order, and works without a pointer.
3. **Given** a visitor navigating by headings, **When** they inspect the page outline, **Then** one primary greeting heading precedes the three subordinate section headings in the supplied order, with no skipped heading levels.
4. **Given** a visitor familiar with TriAnalytica, **When** they open About, **Then** its typography, colours, branding, and navigation follow the existing site's visual language rather than introducing a separate design identity.

### Edge Cases

- A first-time visitor opens About directly: the entire introduction and both routes to analysis remain available without training data or prior navigation history.
- At 320 CSS pixels wide and at 200% text enlargement, headings, paragraphs, navigation, and the final action remain readable and operable without clipping or overlap.
- The greeting's waving-hand character is unavailable in a visitor's preferred font: the greeting remains understandable without relying on the symbol for meaning.
- A visitor uses a keyboard or heading navigation only: all links remain reachable and the content order remains coherent.
- A visitor cannot view images: no biographical meaning or navigation depends on photographs or other visual assets.
- Existing News and analysis navigation remain available after About is added; About does not replace or rename existing dashboard destinations.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Visitors MUST be able to reach a clearly labelled "About" page through the existing main site navigation, following the site's established navigation conventions and retaining existing destinations.
- **FR-002**: The About page MUST be readable without an account, a training import, or a previous visit, including when opened directly.
- **FR-003**: The page MUST display the approved English content in the Content Contract below in full, preserving wording, punctuation, paragraph order, section order, greeting, humour, and sign-off. The bracketed final action denotes a working control labelled "Explore your training", not visible square brackets.
- **FR-004**: The opening greeting MUST be the page's single primary heading. The introduction MUST have clear visual prominence, followed by the three supplied subordinate section headings with no skipped heading levels.
- **FR-005**: The page MUST use a simple editorial layout with short sections, generous spacing, readable line lengths, and the existing site's typography, colours, branding, and navigation conventions.
- **FR-006**: Content and controls MUST remain readable and operable on mobile and desktop, including at a 320 CSS pixel viewport width and with text enlarged to 200%, without clipping, overlapping content, or horizontal scrolling.
- **FR-007**: Navigation and the final action MUST be keyboard accessible, have meaningful accessible names and visible focus indicators, and follow a logical focus order. Text contrast MUST be at least 4.5:1 for normal text and 3:1 for large text.
- **FR-008**: The page MUST end with a clear "Explore your training" action after Dennis's sign-off. Activating it MUST open the existing main analysis entry point, without adding a separate analysis, onboarding, or signup experience.
- **FR-009**: The About page MUST also provide an existing-style navigation route back to the main analysis entry point, independently of the final action and browser history.
- **FR-010**: The page MUST preserve the supplied first-person voice as Dennis: personal, warm, modest, lightly humorous, and relatable to amateur triathletes balancing sport, family, and everyday life. It MUST NOT add corporate language, exaggerated promises, AI hype, an elite-athlete persona, or unsupported biographical or product claims.
- **FR-011**: The page MUST work with typography alone and MUST NOT introduce stock athlete photos, fabricated portraits, testimonials, counters, additional signup flows, or invented personal details.
- **FR-012**: This feature MUST NOT change existing analysis behaviour, data-processing behaviour, or dashboard navigation contracts; it adds an informational destination and routes back to the existing experience only.
- **FR-013**: Following the creator's 2026-11-02 update request, the closing section MUST invite feedback through `myaidevproject@gmail.com`, link to the existing newsletter signup at Brevo, and link to the confirmed Instagram profile `https://www.instagram.com/trianalytica/`. These are native links before the sign-off, not an embedded form or an automatically loaded third-party integration; Explore your training remains the final action.

### Content Contract

The following is the complete approved page copy. Within this specification, the heading levels below are nested under this content contract; on the page, the greeting is the primary heading and the three section titles are subordinate headings. The final bracketed line represents the action specified in FR-008.

#### Hello fellow triathletes 👋

I’m Dennis — just another age grouper with a soft spot for training data.

TriAnalytica is my fun side project: a place where my passion for triathlon meets my curiosity about AI. I’m learning what AI can do, how to build software with it, and what happens when I apply that learning to something I actually care about.

Turns out, my training history provides plenty to work with.

##### A late start. A long-lasting habit.

I wasn’t a sporty kid who grew up racing. I got into endurance sport at university, when I quit smoking and started moving.

Somewhere along the way, that became swimming, cycling, and running. Now I happily belong to the large and distinguished group known as “just another age grouper”.

I enjoy training, racing, and occasionally convincing myself that looking at the data counts as recovery.

##### The kids joined a club. So did the rest of us.

About two years ago, my kids took part in a children’s triathlon and wanted to join our local triathlon club.

As these things go, the whole family gradually got pulled into club life. These days, I happily manage the youth section: more than 80 kids and teens training and competing at local, regional, and national levels.

Lots of organisation. Lots of enthusiasm. Lots of fun. :-)

##### Why TriAnalytica?

Because I wanted to explore my own training — and learn how to build something along the way.

TriAnalytica brings those interests together: endurance sport, training data, and developing with AI. It’s an evolving side project, shaped by curiosity and the occasional “I wonder if I could make it do this…”

If it helps you discover something interesting about your own training, have a smile, or find a visual worth sharing with your fellow athletes, even better.

I’d be very happy to hear your feedback. Drop me a line at myaidevproject@gmail.com.

To stay up to date, you can sign up for the newsletter (via Brevo) or follow TriAnalytica on Instagram.

See you at the start line.

Dennis

[Explore your training]

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can reach About in one navigation activation from the main site, and reach the existing main analysis entry point in one activation from either the About return navigation or its final action.
- **SC-002**: Content comparison confirms 100% of the approved greeting, three section titles, paragraphs, sign-off, and final action label are present in order, with zero unsupported additions or altered personal claims.
- **SC-003**: At 320, 375, 768, and 1440 CSS pixel viewport widths, all text and navigation remain readable and usable with zero clipped or overlapping elements and no horizontal page scrolling; the page also remains usable at 200% text enlargement.
- **SC-004**: Every navigation control and the final action can be reached and activated using only the keyboard, with visible focus throughout; the heading outline and text contrast meet FR-004 and FR-007.
- **SC-005**: Editorial review confirms all three personal themes are present in Dennis's first-person voice: an ordinary age grouper's endurance journey, family and club life, and curiosity-driven learning with AI. No added marketing claims, invented achievements, or prohibited elements from FR-010 and FR-011 appear.

## Assumptions

- The supplied English copy is final and authoritative, including "About two years ago", "more than 80 kids and teens", the waving-hand character, and the smiley. This feature does not fact-check, expand, automatically update, or translate those statements.
- The existing main analysis entry point is the same main experience visitors currently reach through the site's return-to-dashboard navigation. The feature reuses that destination rather than creating a new one; no promise of preserving imported data across page navigation is added.
- The site's existing navigation and visual conventions are dependencies and provide the baseline for integration. Exact page addresses, layout mechanics, and implementation choices belong to planning.
- This is an informational page, not a dashboard visualization tab; visualization-specific Share/Export requirements do not apply.
- Additional biographies, club names or affiliations, achievements, contact forms, translations, photographs, signup flows, counters, and analysis capabilities are outside scope.