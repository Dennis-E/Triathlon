# Quickstart: Newsletter Signup Validation

## Prerequisites

- Node.js/npm installed with the repository dependencies available.
- A modern browser with developer tools.
- The TriAnalytica static app served locally.
- Access to the configured Brevo form for end-to-end submission/consent verification.

## Automated Validation

Run the targeted tests after implementing the feature:

```powershell
npm test -- --runInBand __tests__/newsletter-signup.test.js __tests__/legal-footer.test.js __tests__/index-script-syntax.test.js
```

Expected result: all targeted tests pass; the tests verify that the form source is absent before activation, activation initializes a single form, the HTTPS provider destination and fallback are present, and both privacy languages disclose the provider.

## Browser and Network Validation

1. Start the static app from the repository root with `python -m http.server` and open `http://localhost:8000/`.
2. Open browser developer tools, select Network, and filter for `sibforms.com`.
3. Reload the page without activating the newsletter control. Expected: no request to the Brevo form origin and no iframe with a remote form source.
4. Activate the newsletter signup action. Expected: a single form request begins and the embedded form appears; an accessible direct link remains available.
5. Check invalid email and missing consent. Expected: the provider prevents enrollment and displays corrective feedback.
6. Submit a valid email with affirmative consent using a controlled test address. Expected: Brevo displays its configured receipt or confirmation step; TriAnalytica does not replace this with an inferred success state.
7. Review the privacy dialog in German and English. Expected: both languages identify Brevo and describe the form-triggered connection and signup data separately from training files.
8. Repeat at a narrow mobile viewport and with the embed blocked. Expected: the invitation remains usable, the direct-link fallback is visible, and no false subscription-success message appears.

## Release Configuration Check

In the Brevo account, confirm that the live form requires explicit consent for newsletter email and provides validation, duplicate-address, and confirmation messaging. Confirm current provider/retention/transfer information before publishing the privacy disclosure; do not infer those facts from the embed URL.

## Implementation Validation Record (2026-10-13)

- **Automated**: `npm test -- --runInBand __tests__/newsletter-signup.test.js __tests__/legal-footer.test.js __tests__/index-script-syntax.test.js` — passed (3 suites, 87 tests).
- **Request gating**: Browser resource entries showed no `sibforms.com` request and no iframe before the signup action; after activation, one iframe and one request to the supplied Brevo URL appeared.
- **Responsive/fallback**: At a 375px viewport, the document had no horizontal overflow; the iframe fit the dialog. With the Brevo request blocked, the direct-link fallback and explanatory copy remained visible, with no false success message.
- **Privacy language**: German and English views both showed the Brevo disclosure and the statement that training files/activity data are not sent.
- **Brevo form recheck (2026-10-13)**: The live form now displays the English statement “I would like to receive the TriAnalytica newsletter by email and agree to the Privacy Policy: Brevo's Privacy Policy.” This is clearer and newsletter-specific, but it is static text, not an interactive checkbox/control; the only required field is email. No separate affirmative action for consent was observable. A visitor's submit action after seeing this text may be intended as consent, but whether this satisfies the required explicit opt-in and is enforced before enrollment remains unverified; keep T008 open pending configuration/consent-flow verification and review of applicable requirements.
- **DSGVO notice**: The form also displays the German notice that submitting transfers the provided personal information to Brevo for processing and links to Brevo's privacy policy.
- **Brevo opt-in recheck (2026-10-13)**: The current form now includes a separate unchecked checkbox named `OPT_IN`, marked required, with the label “I agree to receive your newsletters and accept the data privacy statement.” Attempting to submit without checking it displayed “This field cannot be left blank.”, kept the form invalid, and produced no form POST request. Checking the box made the form valid. This verifies the explicit newsletter-consent control and required gate. The prior static-copy-only finding above is superseded.
- **Input validation**: Submitting `invalid-address` displayed Brevo's invalid-format guidance and no successful-subscription confirmation. Duplicate-address handling and valid-address/confirmation behavior have not yet been tested.
- **Provider/legal verification outstanding**: Verify Brevo's specific legal role and current account-specific retention/transfer terms against provider/account documentation before making legal-role claims or publishing more specific disclosures.