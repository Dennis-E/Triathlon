# Quickstart: Count Every Upload Without Browser-Persisted History

## Prerequisites

- Repo checked out on branch `014-count-every-upload`.
- Node.js/npm available (root project uses Jest; see `jest.config.js`).
- No API changes are needed to validate this feature end-to-end at the unit-test level; a running `services/api` instance is only needed for manual/browser verification against the real endpoint.

## Automated validation (primary)

Run the narrowest relevant test command from repo root:

```powershell
npm test -- analysis-counter
```

Expected outcomes once implemented:

- A test asserts that calling `recordAnalysis()` twice in the same browser/storage instance results in **two** separate `fetchImpl` POST calls (previously: only one call, second call returned a cached count).
- A test asserts that after a successful `recordAnalysis()` call, the provided `storage` mock has **no** entry under the old `STORAGE_KEY` (or the key/machinery no longer exists in the module at all).
- A test asserts that each call uses a distinct event ID header (no reuse of a single stored ID across calls).
- The existing "rejects API failures without manufacturing a count" test continues to pass unchanged (silent-failure behavior, FR-007).

## Manual/browser validation (secondary)

1. Serve the app locally: `python -m http.server` from repo root, then open `http://localhost:8000`.
2. Open DevTools → Application → Local Storage for the origin; confirm no `trianalytics:analysis-counter:recorded:v1` key exists after import.
3. Complete a successful Strava ZIP import; note the displayed counter value.
4. Complete a second, separate successful import in the same browser tab (no reload required).
5. **Expected**: the displayed counter increases again for the second import (previously it would not).
6. Reload the page (or reopen the browser) and complete a third import.
7. **Expected**: the counter still increases; DevTools Local Storage still shows no persisted "recorded" record for this feature.

## Notes

- This quickstart validates client-visible behavior only. The server contract (`services/api`) is unchanged and is not covered by new tests here.
- Refer to [data-model.md](./data-model.md) for the transient event shape and [research.md](./research.md) for the rationale behind removing the persisted gate.
