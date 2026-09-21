# Feature Specification: Legal Imprint and Privacy Notice

**Feature Branch**: `012-legal-imprint-privacy`

**Created**: 2026-09-21

**Status**: Draft

**Input**: User description: "Add a legal footer section with an imprint and a short privacy notice. The imprint must include the owner name, address, and email, without phone number. The privacy notice must clarify that data is processed locally in the browser and that no user data is stored on a server for this static app, while noting that external libraries may trigger standard browser/network requests."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View legal imprint (Priority: P1)

As a visitor of the site, I want to find the operator's legal contact details (name, address, email) so that I know who runs the site and how to reach them, without needing a phone number.

**Why this priority**: Legally required in many jurisdictions (e.g., German "Impressum" obligation) and is the baseline for site trustworthiness. Without it the feature has no value.

**Independent Test**: Open the site, scroll to the footer, click/open the imprint section, and verify owner name, address, and email are visible; verify no phone number is shown.

**Acceptance Scenarios**:

1. **Given** a visitor on any page of the site, **When** they open the footer's imprint section, **Then** they see the owner's name, postal address, and email address.
2. **Given** the imprint section is open, **When** the visitor looks for a phone number, **Then** none is present.
3. **Given** a visitor with only a mouse/keyboard, **When** they navigate to the footer using standard navigation (tab/click), **Then** the imprint content is reachable and readable without JavaScript errors.

---

### User Story 2 - View privacy notice (Priority: P2)

As a visitor, I want to read a short privacy notice explaining how my data is handled, so that I understand my imported activity data stays local and is not uploaded to a server.

**Why this priority**: Builds on the imprint (P1) and is commonly required alongside it, but the app's core function (import/analyze) already works without it, so it is slightly lower priority than having contact details at all.

**Independent Test**: Open the privacy notice section independently of the imprint and confirm it states local browser processing, no server-side storage of user data, and mentions that external libraries may cause standard browser/network requests.

**Acceptance Scenarios**:

1. **Given** a visitor opens the privacy notice, **When** they read it, **Then** it clearly states that imported activity files are processed locally in the browser and are not uploaded or stored on a server.
2. **Given** the privacy notice, **When** the visitor reads about third-party resources, **Then** it discloses that external libraries (e.g., loaded from a CDN) may trigger standard browser/network requests.

---

### User Story 3 - Access legal information from any page/tab (Priority: P3)

As a visitor navigating between dashboard tabs, I want the legal footer to remain reachable regardless of which tab is active, so I don't lose access to imprint/privacy information while exploring the app.

**Why this priority**: Convenience/consistency improvement; the core legal disclosure already works once present on the page (P1/P2), so app-wide reachability is a refinement.

**Independent Test**: Switch between all dashboard tabs and confirm the footer with imprint/privacy links is present and functional on each.

**Acceptance Scenarios**:

1. **Given** the visitor has switched to any dashboard tab, **When** they scroll down, **Then** the legal footer with imprint and privacy notice is visible and functional.

---

### Edge Cases

- What happens if a visitor uses a screen reader? The imprint and privacy notice must be reachable via standard semantic HTML (e.g., headings, links) without relying solely on hover or unlabeled controls.
- How does the system handle very small (mobile) viewports? The footer content must remain readable and not overlap other UI elements.
- What happens if JavaScript fails to load? Since this is a static, mostly client-side app, the footer markup should be plain HTML so imprint/privacy text remains visible even if optional interactive behavior (e.g., expand/collapse) does not initialize.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a legal footer section containing an imprint ("Impressum") and a privacy notice ("Datenschutzerklärung"), reachable from every page/tab of the app.
- **FR-002**: The imprint MUST include the owner's name, postal address, and email address.
- **FR-003**: The imprint MUST NOT include a phone number.
- **FR-004**: The privacy notice MUST state that data imported by the user (e.g., activity files) is processed locally in the browser and is not stored on a server operated for this app.
- **FR-005**: The privacy notice MUST disclose that externally loaded libraries (e.g., CDN-hosted scripts/styles) may cause standard browser/network requests to third-party hosts, independent of the app's own local processing.
- **FR-006**: The legal footer content MUST be visible using plain HTML/CSS so it renders even if optional JavaScript enhancements fail.
- **FR-007**: The imprint and privacy notice text MUST be presented in German, consistent with the target audience and legal context (Impressumspflicht).

### Key Entities

- **Legal Footer**: A static content section containing two subsections — Imprint and Privacy Notice — rendered on every page/tab of the static site.
- **Imprint Details**: Owner name, postal address, and email address supplied by the site operator (no phone number).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of pages/tabs in the app display the legal footer with working imprint and privacy notice sections.
- **SC-002**: A visitor can locate the operator's name, address, and email within 10 seconds of opening the imprint section.
- **SC-003**: The privacy notice contains zero references implying server-side storage of user-imported activity data.
- **SC-004**: The imprint contains zero phone numbers.

## Assumptions

- The site operator will supply the actual name, postal address, and email address to be used in the imprint; placeholder text will be used until provided.
- No user accounts, authentication, or server-side data storage exist for this feature; the existing app remains a static, client-side site (the separate analysis-counter API is unaffected and out of scope here).
- German language is used for the imprint/privacy notice text since "Impressum" obligations are most relevant in German-speaking jurisdictions.
- This feature does not require legal review beyond providing the disclosures requested; it is not a substitute for professional legal advice.
