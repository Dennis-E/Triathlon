# Feature Specification: Privacy Policy Modal and Footer Update

**Feature Branch**: `013-privacy-policy-modal`

**Created**: 2026-09-21

**Status**: Draft

**Input**: User description: "Update the TriAnalytica website footer and privacy information. TriAnalytica is a free alpha web application hosted on GitHub Pages. Users can import GPX and CSV activity files for analysis. These personal activity files are processed locally in the user's browser and are not uploaded to or stored on a TriAnalytica application server. The privacy policy must be available directly on the homepage in both German and English, using real maintained text and not automatic translation. Replace the inline footer privacy expandable section with a dedicated bilingual modal, improve the short local-processing statement, and ensure the privacy policy content matches the actual implementation of the static web app and GitHub Pages hosting."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View privacy information from the homepage footer (Priority: P1)

A user visiting the homepage wants to understand how the application handles personal activity files, hosting, and legal information without leaving the page or hunting through hidden sections.

**Why this priority**: This is the core disclosure requirement for the app and directly affects user trust, legal transparency, and the clarity of the public-facing privacy experience.

**Independent Test**: A user can open the footer link from the homepage and review the privacy information in a focused, readable modal without reloading or navigating away.

**Acceptance Scenarios**:

1. **Given** the user is on the homepage, **When** they click the footer link labeled "Datenschutzerklärung / Privacy Policy", **Then** a centered modal opens over the page with a dark, branded appearance and a visible close control.
2. **Given** the modal is open, **When** the user presses the Escape key, **Then** the modal closes and focus returns to the footer link that opened it.
3. **Given** the modal is open, **When** the user tabs through the controls, **Then** keyboard focus remains within the dialog until it is closed and no underlying page controls receive focus.
4. **Given** the user is on desktop or mobile, **When** the modal content exceeds the viewport height, **Then** the content remains scrollable and readable without page-level navigation.

---

### User Story 2 - Read a bilingual privacy policy without reloading the page (Priority: P1)

A user who reads German or English wants to move between the two versions of the privacy policy instantly and compare equivalent information in a single session.

**Why this priority**: A bilingual policy is a legal and usability requirement, and the experience should be immediate and accessible without forcing page reloads or language changes in the browser.

**Independent Test**: A user can switch between Deutsch and English from within the modal and immediately see the matching language version.

**Acceptance Scenarios**:

1. **Given** the user opens the privacy modal, **When** the app determines no explicit site language is active, **Then** the German version is shown by default.
2. **Given** the website has a selected language, **When** the privacy modal opens, **Then** the currently selected language is used as the default view.
3. **Given** the privacy modal is open, **When** the user selects the alternative language, **Then** the display changes immediately without a page reload and the chosen language remains active until the modal closes.
4. **Given** the user reviews the privacy content, **When** they compare the German and English sections, **Then** the two versions describe equivalent information and cover the same topics and legal disclosures.

---

### User Story 3 - Understand local processing and hosting boundaries (Priority: P2)

A user wants to know exactly what happens to imported GPX and CSV files and what data may still be observed by the website infrastructure while using the app.

**Why this priority**: The app handles personal training data, and the privacy copy must be precise about local file processing without overstating the absence of network communication.

**Independent Test**: A user can read the short footer message and the detailed privacy policy and clearly understand that imported files are processed locally in the browser and are not uploaded to TriAnalytica servers, while GitHub Pages traffic still generates normal technical logs.

**Acceptance Scenarios**:

1. **Given** the user reads the footer message, **When** they inspect the wording, **Then** it states that imported GPX/CSV files are processed locally in the browser and not uploaded to TriAnalytica servers.
2. **Given** the user reads the detailed privacy policy, **When** they review the section on imported activity data, **Then** they are told the files are used to generate analyses and visualizations and are not persistently stored on TriAnalytica's application backend/server.
3. **Given** the user reviews the hosting section, **When** they read the disclosure, **Then** they are told the app is hosted via GitHub Pages and normal technical connection data may be processed by GitHub infrastructure.

---

### User Story 4 - Review legal and accessibility compliance expectations (Priority: P3)

A user or reviewer wants the privacy notice to be complete, professional, and readable on supported devices, with specific sections covering data processing, rights, and provider relationships.

**Why this priority**: It supports legal completeness and improves trust, while keeping the experience usable on mobile and keyboard-only navigation.

**Independent Test**: The modal includes all required privacy sections, the content reflects the real technical implementation, and the modal remains usable with a keyboard and on smaller screens.

**Acceptance Scenarios**:

1. **Given** the privacy modal is open, **When** the user reviews the policy structure, **Then** it includes the required German and English headings for controller, imported activity data, GitHub Pages hosting, external resources, cookies and tracking, legal basis, recipients, transfer issues, storage, rights, and changes.
2. **Given** the user is using a screen reader or keyboard navigation, **When** they operate the modal, **Then** the dialog is announced and managed with correct ARIA semantics and focus behavior.
3. **Given** the user is on a small screen, **When** they view the modal, **Then** it is rendered with reasonable margins and internal scrolling instead of an oversized, unusable layout.

### Edge Cases

- What happens when the user attempts to open the privacy modal while another modal or overlay is active? The implementation must ensure the request is handled within the same page and does not create conflicting navigation behavior.
- How does the system handle a browser without keyboard focus support? The modal must still be discoverable and closable with a pointer, and focus management must degrade gracefully without breaking the page.
- What happens if the site language is unspecified? The system defaults to German unless the page already exposes a known language selection.
- How is the policy handled when the app is loaded on mobile? The modal must maintain readable typography, internal scrolling, and safe margins while respecting viewport constraints.
- What if the app later adds a third-party service? The privacy policy content must be updated to reflect any real implementation, not remain generic.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The homepage footer MUST include a clearly visible link or button labeled "Datenschutzerklärung / Privacy Policy" and MUST no longer render the complete privacy notice inline inside the footer.
- **FR-002**: Clicking the privacy link or button MUST open a dedicated modal overlay without navigating away from the current page or reloading the document.
- **FR-003**: The privacy modal MUST present a dark, branded visual treatment consistent with the existing TriAnalytica interface, with a visible close control and a max width and height suitable for desktop, tablet, and mobile layouts.
- **FR-004**: The modal MUST support keyboard dismissal via the Escape key and MUST implement proper dialog semantics using accessible ARIA attributes.
- **FR-005**: The modal MUST trap focus while open and MUST return focus to the element that opened it when closed.
- **FR-006**: The privacy modal MUST contain a complete German version and a complete English version of the privacy policy, both maintained as real text in the application source and not generated by an external translation service.
- **FR-007**: The modal MUST provide a simple language switch, defaulting to the current stored or active site language when available and otherwise to German.
- **FR-008**: The privacy content MUST clearly state that users may import GPX and CSV activity files, that these files are processed locally in the browser, and that they are not uploaded to a TriAnalytica application backend/server.
- **FR-009**: The privacy content MUST state that imported activity files are used to generate the requested analyses and visualizations and are not persistently stored on TriAnalytica's own server.
- **FR-010**: The privacy content MUST describe GitHub Pages hosting, explain that normal technical connection data may be processed when the website is accessed, and identify the information types typically associated with such requests without overstating what TriAnalytica stores itself.
- **FR-011**: The privacy content MUST mention any actual external resources found in the codebase only if they are truly used; it MUST NOT invent or imply third-party services that do not exist in the implementation.
- **FR-012**: The privacy content MUST explicitly state whether cookies, analytics, advertising, tracking pixels, or user accounts are used based on the actual implementation in the codebase, and MUST NOT claim consent-based tracking where no such functionality exists.
- **FR-013**: The privacy policy MUST include both German and English legal-basis language consistent with GDPR principles and MUST refer to legitimate interests where technically necessary processing is used, without claiming consent where none is required or obtained.
- **FR-014**: The privacy policy MUST identify real data recipients or service providers and MUST explain any relevant third-country processing only where it applies to actual providers.
- **FR-015**: The privacy policy MUST state that TriAnalytica does not persistently store imported GPX/CSV files on its own application backend/server and must describe the retention rules for hosting or infrastructure logs without inventing specific retention periods.
- **FR-016**: The privacy policy MUST include concise GDPR rights language in both languages, covering access, rectification, erasure, restriction, portability, objection, and complaint rights.
- **FR-017**: The privacy policy MUST include a clear section describing any changes to the policy and must remain coherent with the static application architecture and GitHub Pages hosting model.
- **FR-018**: The short footer privacy statement MUST be accurate and concise, distinguishing local file processing from general network communication and avoiding language that incorrectly implies the entire app performs no network requests at all.
- **FR-019**: The privacy experience MUST remain usable on supported devices, including mobile browsers, without breaking the existing homepage or dashboard functionality.

### Key Entities *(include if feature involves data)*

- **User**: A visitor or account holder using the TriAnalytica website to import and analyze training data; they expect clear privacy information and transparent handling of imported files.
- **Imported activity file**: A GPX or CSV file uploaded by the user for local browser-side parsing and analysis; it is not a server-uploaded record and is not persistently stored by TriAnalytica's application backend.
- **Privacy policy content**: The bilingual legal notice shown in the modal; it covers controller information, hosting, local processing, external resources, legal basis, rights, and policy changes.
- **GitHub Pages hosting infrastructure**: The external hosting layer that serves the static website and may process standard technical connection metadata when the user accesses the site.
- **TriAnalytica application state**: The browser-side analysis environment responsible for producing visualizations and reports from the imported data using local processing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of users who visit the homepage can identify and open the privacy notice from the footer without scrolling or searching through a collapsed section.
- **SC-002**: The privacy modal opens and closes reliably across supported browsers, with no page reload or navigation and with no broken keyboard or screen-reader interaction.
- **SC-003**: The privacy modal presents complete German and English versions with equivalent coverage of all required topics, and users can switch between them instantly without a reload.
- **SC-004**: Users can clearly understand that imported GPX/CSV files are processed locally in the browser and are not uploaded to TriAnalytica servers, while still understanding that normal website access may generate technical connection data.
- **SC-005**: The privacy notice content matches the actual implementation of the static app, GitHub Pages hosting, and any discovered external dependencies, without generic or invented services.
- **SC-006**: The footer and modal preserve the existing TriAnalytica visual identity, remain readable on mobile devices, and do not degrade the main application flow or dashboard functionality.

## Assumptions

- The app remains a static browser-first product served through GitHub Pages, so the policy must emphasize browser-side processing and clear hosting disclosures rather than server-side data handling.
- The site may have an existing language selector, but if none exists the privacy modal defaults to German and supports instant switch without reload.
- The repository content is the authoritative source for legal statements; policy text will be limited to actual implementation details and verified infrastructure behavior.
- There is no evidence in the codebase of advertising cookies, analytics, tracking pixels, or user-account-based identifiers, so the policy should state that no such tracking is used unless later implementation introduces it.
- The static frontend may still load third-party scripts or files from remote providers if they are actually present in the code; the policy will mention them only when verified in the project.
