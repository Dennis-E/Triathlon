# Quickstart: Hide Partial Country Coverage Note

## Prerequisites

- Node.js and npm installed for the existing Jest suite.
- A browser if verifying the rendered Lifetime Statistics card manually.

## Focused Automated Validation

From the repository root, run:

```sh
npm test -- --runInBand __tests__/lifetime-statistics-dashboard.test.js
```

Expected result: the dashboard and export both omit “Based on X of Y activities” for partial country coverage while retaining country count and names. Existing complete, loading, and unavailable cases continue to pass.

## Manual Validation

1. Open Lifetime Statistics with a dataset that has some activities with usable routes and some without.
2. Confirm the Countries visited card still shows its country count and names, without the partial-coverage sentence.
3. Open or generate the Lifetime Statistics export and confirm the same behavior there.
4. Confirm complete, loading, and unavailable country-summary states retain their existing content.