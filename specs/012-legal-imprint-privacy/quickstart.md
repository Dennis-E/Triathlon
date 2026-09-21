# Quickstart: Legal Imprint and Privacy Notice

Validate the feature end-to-end after implementation.

## Prerequisites

- No new dependencies. Uses the existing static server workflow.

## Run the app

```powershell
python -m http.server
```

Open `http://localhost:8000` in a browser.

## Manual validation scenarios

1. **Imprint visible, no phone number**
   - Scroll to the page footer.
   - Confirm the "Impressum" section shows owner name, postal address, and email.
   - Confirm no phone number appears anywhere in the footer.

2. **Privacy notice content**
   - In the same footer, locate "Datenschutzerklärung".
   - Confirm it states imported activity data is processed locally in the browser and is not
     stored on a server.
   - Confirm it discloses that externally loaded libraries (CDN) may cause standard
     browser/network requests.

3. **Footer present across all tabs**
   - Switch through each dashboard tab (`Gesamtdistanz`, `Herzfrequenz/Pace`, `Ausrüstung`,
     `Ausrüstungs-Timeline`, `Bestzeiten`, `Heatmap` — per `TAB_ORDER` in
     [src/tab-navigation.js](../../src/tab-navigation.js)).
   - Confirm the footer remains visible/reachable on every tab.

4. **No-JS resilience**
   - Disable JavaScript in the browser (or view page source).
   - Confirm the imprint and privacy notice text is still present in the rendered/raw HTML.

## Automated check

```powershell
npm test -- legal-footer
```

Expected: the new `__tests__/legal-footer.test.js` (added during implementation) passes, asserting
the footer markup contains the required imprint fields (name/address/email, no phone digits marker)
and the required privacy-notice statements.

## Full regression

```powershell
npm test
```

Run after the change to confirm no existing suite (tab-navigation, integration, etc.) regressed.
