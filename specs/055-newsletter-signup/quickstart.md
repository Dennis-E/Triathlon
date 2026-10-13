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