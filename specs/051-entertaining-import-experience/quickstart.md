# Quickstart: Validate Entertaining Import Experience

## Prerequisites

- Node.js/npm installed at the repository root.
- A local browser and static file server for the manual UI pass.
- For the end-to-end pass, use a small synthetic Strava-format ZIP generated for testing or a user-supplied local export. Do not add private exports to the repository or any test fixture.

## Automated validation

Run focused unit and static-wiring tests:

```powershell
npm test -- --runInBand __tests__/import-experience.test.js __tests__/dashboard-import.test.js __tests__/index-script-syntax.test.js
```

Expected results:

- Shuffle tests show no duplicate IDs before each eligible cycle is exhausted.
- Eligibility tests keep message 20 hidden except in whole-application finalization and omit it when that phase is not exposed.
- Statistics tests match the fixture's valid-dated activity count, complete Bike distance, history-year range, distinct Run equipment count, longest ride, and Swim activity count; missing/partial source data suppresses dependent messages.
- Lifecycle tests stop timers on success, failure, close, teardown, and replacement import; hidden-tab behavior does not catch up by rapidly cycling.
- Static checks confirm all twenty catalog-to-SVG mappings, local asset paths, catalog-before-import script order, reduced-motion rules, and removal of the old five-second message list/rotation.
- Progress tests confirm stage-only updates do not invent values or regress the percentage.

## Manual browser validation

1. From the repository root, start the existing static server: `python -m http.server 8000`.
2. Open `http://localhost:8000` and load a small synthetic or explicitly supplied Strava ZIP locally.
3. Keep the import modal open long enough to see multiple messages. Verify each copy has the intended local illustration, updates are calm, and there are no repeated IDs before the eligible set finishes.
4. Confirm the progress percentage/status remain factual and stable across ZIP extraction, CSV processing, finalization, and completion. Stage changes without their own reliable percentage must not inject a number or regress the bar.
5. Verify the privacy reminder appears after four humorous entries without replacing the primary message/illustration. Confirm its wording is limited to local processing and non-upload of training-file contents.
6. For a completed dataset, check each personal value against the synthetic source rows. Check that partial distance data, absent gear, missing activities, and unsupported sport categories do not create ineligible totals.
7. Use browser accessibility settings or emulate `prefers-reduced-motion: reduce`; confirm motion stops/minimizes and text, illustration, progress, and status remain available.
8. Repeat with an import that fails and with two imports started sequentially. No message/animation should update after failure or leak into the next session.
9. Check a narrow viewport and inspect the browser console for script-order/runtime errors.
10. Use the same representative local fixture for baseline and feature imports when checking SC-008. The feature must add no archive/CSV pass and remain within the 5% processing-duration allowance; repeat measurements to reduce timing noise.

Stop the local server after the manual pass. Never upload a test export or derived statistics during validation.
