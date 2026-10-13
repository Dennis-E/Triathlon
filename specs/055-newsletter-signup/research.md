# Research: TriAnalytica Newsletter Signup

**Date**: 2026-10-13  
**Input**: [Feature specification](spec.md)

## Decisions

### 1. Use the supplied Brevo-hosted form; do not create a subscriber backend

- **Decision**: Embed the provided Brevo form in the existing static app, with a direct Brevo link as a fallback. Email capture, consent, validation, duplicate-address handling, and confirmation remain provider-managed.
- **Rationale**: The user supplied the form embed and selected Brevo; a backend would duplicate provider functionality, expand privacy scope, and violate the narrow feature scope.
- **Alternatives considered**: Build a custom email form and server/API integration (adds credentials, storage, abuse controls, and service operations); link-only signup (does not provide the requested embedded signup experience).

### 2. Gate all Brevo form requests on an explicit visitor action

- **Decision**: Render the local signup description and open-form button first. Create the iframe or set its `src` only after the visitor selects the button. Do not rely on `loading="lazy"` as the gate.
- **Rationale**: The accepted clarification requires zero form-origin requests before an intentional action; lazy browser scheduling alone does not guarantee this boundary.
- **Alternatives considered**: Put the remote `src` on a page-load iframe (connects without signup intent); set only `loading="lazy"` (browser-dependent timing); open only a new provider page (does not fulfill the embed preference).

### 3. Make the consent and confirmation responsibilities explicit

- **Decision**: Require explicit affirmative newsletter consent in the Brevo form configuration. Treat the provider's own response/confirmation UI as authoritative. The app must not equate iframe creation or its `load` event with subscription success.
- **Rationale**: Cross-origin form contents cannot be inspected by the static app, and iframe load events do not reliably establish that a form was usable or a subscription accepted.
- **Alternatives considered**: Infer success from iframe load (incorrect); proxy form submission (creates a backend and duplicates provider behavior); persist subscription state in local browser storage (unnecessary and potentially misleading).
- **Release check**: Verify the live Brevo form includes a required affirmative consent control and clear invalid/success/confirmation states. Do not claim those controls work based solely on the embed snippet.

### 4. Update the existing bilingual privacy disclosure

- **Decision**: Add Brevo to the German and English third-party/recipient disclosures, explain that opening the form connects directly to Brevo and may expose technical request data such as IP address, and explain that submitted email/consent details are processed for newsletter enrollment. State that training files/activity data are not sent by this feature.
- **Rationale**: The existing policy already distinguishes browser-local training file handling from external network requests and is maintained in both languages in `index.html`.
- **Alternatives considered**: Add a separate policy page (unnecessary duplication); claim the whole application makes no external requests (contradicts current behavior); make unverified claims about provider retention or processing location (not supported by the supplied embed).
- **Release check**: Confirm current Brevo account/provider details, retention, transfer arrangements, and legal wording before publication; the plan deliberately makes no unverified claims about them.

### 5. Offer a direct-link fallback instead of unreliable iframe error detection

- **Decision**: Keep a visible direct-link option to the same hosted signup form near the embed and explain that it can be used if the embedded form does not appear. Do not show an app-generated “subscribed” state.
- **Rationale**: Browser cross-origin and network failures are not consistently distinguishable from iframe `load` events; a direct link is actionable without false success reporting.
- **Alternatives considered**: Treat `onload` as success (unreliable); depend on cross-origin form inspection (blocked by browser same-origin policy); omit fallback (leaves visitors stranded when embeds are blocked).

## Repository Findings

- The app is a static browser page with footer and bilingual privacy modal in `index.html`; no bundler or server-side subscriber API is needed.
- The legal footer has focused Jest assertions in `__tests__/legal-footer.test.js`.
- Root Jest uses the Node environment, so interaction coverage should use a small DOM mock or script evaluation rather than jsdom.
- Existing policy language already notes that external libraries and the analysis counter make network requests; the new disclosure should be specific to the user-initiated Brevo form.

## Open Implementation Verification

- Browser smoke testing must verify no request to `b7607f4e.sibforms.com` before the CTA action and a request after it.
- The actual live Brevo form's required consent and response messages must be checked in the account; these cannot be proven by static analysis of the iframe URL.