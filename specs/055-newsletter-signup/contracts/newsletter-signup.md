# UI Contract: Newsletter Signup

## Entry Point

- **Location**: Main TriAnalytica app footer, available independently of the active visualization tab.
- **Initial content**: Newsletter purpose, a clear action to open the form, an explanation that opening it connects to Brevo, and a link to the existing privacy policy.
- **External request rule**: Initial app load and passive viewing of the invitation MUST NOT create a Brevo iframe, assign its remote `src`, or otherwise request the Brevo form origin.

## Open-Form Action

- A deliberate activation of the signup action creates/shows one responsive iframe using the user-supplied HTTPS form address:
  `https://b7607f4e.sibforms.com/v2/serve/MUIFAJ8OOivDmU5Mx69AcESPOvh-2gWPGoi1WrjAS8AP30bZnuHSm2KG9XP2TBdY0i6jMP3oMW2fNIqs0VvuKtqSHoAK8PkPFueD4xCam-PnR9aiMUE5FA3fV7pWhN-6g-Lr_1u2RdEMaozKc1WRvBESwuNXn4xTNA_c3SZaWJpeVvKm7Va86oj0Zyl_9y0mBn6z5oU2Rvq7OGwJLw==`
- The iframe has an accessible title, permits responsive width up to the supplied 540-pixel design width, and provides enough height for form fields and provider feedback.
- Repeated activation MUST NOT create duplicate iframes or duplicate initialization.
- A direct link to the same HTTPS form is available if the embed is blocked or does not render.

## Provider Form Responsibilities

- Brevo collects the email address and required affirmative consent before enrollment.
- Brevo presents invalid-input feedback, already-subscribed guidance, and any pending-confirmation/success message.
- The TriAnalytica page MUST NOT claim enrollment based only on iframe creation or an iframe `load` event.
- Only newsletter signup information is sent; imported training files and activity data are excluded.

## Privacy Disclosure

- The German and English policy views identify Brevo, explain that activating the form causes a direct browser connection to the provider, and describe technical connection data and newsletter signup information at a factual level.
- The disclosure distinguishes newsletter data from browser-local training file processing and avoids unsupported assertions about provider retention/location.

## Error/Fallback Behavior

- If the embedded form is unavailable, the user can follow the direct link to Brevo.
- Fallback wording indicates that the embedded form may not be available; it does not imply that a submission was accepted or a subscription completed.