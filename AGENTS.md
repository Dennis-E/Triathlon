# TriAnalytica Agent Guide

## Project shape

- This is a static browser app. `index.html` owns the UI, import flow, dashboard state, and chart rendering; there is no frontend bundler or build step.
- Browser libraries are loaded from CDN script tags. Browser-facing modules under `src/` expose both CommonJS exports for Jest and `window.*` globals for `index.html`.
- `src/` contains the reusable data and visualization utilities. Keep these modules browser-compatible and prefer pure functions where possible.
- `scripts/relevant-export-extractor.js` is a separate Node CLI for reducing Strava exports.
- `services/api/` is a separate Express service for the analysis counter. It has its own `package.json`, dependencies, tests, and runtime entrypoint.

## Development and tests

- Serve the frontend with `python -m http.server`, then open `http://localhost:8000`.
- Run root tests with `npm test`; use `npm run test:watch` or `npm run test:coverage` when appropriate.
- Run API tests from `services/api` with `npm test`; start the API there with `npm start`.
- The Jest environment is `node`, not jsdom. DOM-dependent code must accept an injected document or avoid DOM-only APIs. See [src/tab-navigation.js](src/tab-navigation.js) for the injectable-document pattern.
- Keep root and API dependency boundaries in mind: API tests rely on dependencies declared in [services/api/package.json](services/api/package.json), not the root package.

## Implementation conventions

- Preserve the existing CommonJS style (`module.exports`) and browser global bridge when changing reusable modules.
- CSV processing supports German and English column names. Preserve the established duplicate `Distance`/`Distanz` meaning: first is kilometers, second is meters.
- Normalize supported sports to `Run`, `Bike`, and `Swim`; do not silently classify unknown sports.
- GPX parsing intentionally uses regex rather than `DOMParser` so the same code works in Node tests.
- Keep raw Strava files and personal exports local to the browser and out of version control. Do not assume `test-data/` contains fixtures; use synthetic or explicitly supplied local data for tests.
- Be precise about privacy wording: local file processing does not mean the entire app makes no network requests. Changes involving the analysis API must preserve its explicit origin, client-key, validation, rate-limit, and Firestore behavior.
- Before changing a dashboard tab, update the tab constants and IDs in [src/tab-navigation.js](src/tab-navigation.js), the matching markup and inline dispatch logic in [index.html](index.html), and the related tab-navigation tests.

## Useful references

- Product behavior and local startup: [README.md](README.md)
- Import behavior: [docs/IMPORT_FEATURE.md](docs/IMPORT_FEATURE.md)
- Test inventory and examples: [__tests__](__tests__)
- Root Jest configuration: [jest.config.js](jest.config.js)
- API implementation: [services/api/src/app.js](services/api/src/app.js)

Make focused changes, preserve existing public APIs, and run the narrowest relevant test command after edits.