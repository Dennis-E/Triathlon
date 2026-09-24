# Quickstart Validation: Sticky News Header

## Prerequisites

- Node.js and npm installed.
- Repository dependencies installed with `npm install`.

## Automated validation

From the repository root, run:

```powershell
npm test -- --runInBand __tests__/news-page.test.js
npm test
```

Expected result: the News contract confirms fixed-header markup, preserved links,
content offset, and responsive-safe declarations; the complete root suite remains
green.

## Browser validation

Start the static server:

```powershell
python -m http.server
```

Open `http://localhost:8000/news.html` and check at desktop and 390px-wide mobile
viewports:

1. Confirm the logo and `Back to dashboard` link are visible at the top.
2. Scroll down through the article and confirm the header remains at viewport top.
3. Confirm the News heading and article are not hidden behind the header at the top.
4. Confirm the page has no horizontal overflow.
5. Select `Back to dashboard` after scrolling and confirm it opens `index.html`.