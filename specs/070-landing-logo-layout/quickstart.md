# Quickstart: Landingpage Logo Layout

## Prerequisites

- Python 3 for the repository's static file server.
- Node.js and npm for the existing Jest check.
- A desktop browser with responsive viewport controls.

## Validate in a Browser

1. From the repository root, start the static site with `python -m http.server 8000`.
2. Open `http://localhost:8000` and keep the landing page visible.
3. Check viewport widths of 320, 375, 768, and 1280 CSS pixels.
4. At each width, confirm both logos are fully visible, retain their proportions, and are not covered by nearby content.
5. At widths from 320 through 767 CSS pixels, confirm the page has no horizontal overflow and the header's navigation and status remain accessible.
6. Resize between narrow and wide widths and confirm the layout remains usable during and after the change.

## Run the Existing Focused Test

From the repository root, run:

```sh
npm test -- --runInBand __tests__/index-script-syntax.test.js
```

Expected result: the existing page/script syntax check passes. This Node test does not measure rendered layout; the browser checks above verify the visual acceptance criteria.