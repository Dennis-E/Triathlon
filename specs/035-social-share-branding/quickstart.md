# Quickstart: Validate Social Share Branding & Favicons

## Prerequisites

- Local checkout of this repository with the feature branch's changes applied
  (new static assets at repo root + updated `index.html` `<head>`).
- Python 3 (for the existing local static server workflow) or any static file
  server.
- Node.js + `npm install` already run at the repo root (for the Jest regression
  check).

## 1. Serve the site locally

```powershell
python -m http.server
```

Open `http://localhost:8000/` and confirm:

- The browser tab shows the circular TriAnalytica emblem (not a generic globe
  icon, not the wide wordmark).
- `http://localhost:8000/social-preview.png` loads and displays the full
  1200×630 branded image.
- `View Page Source` shows exactly one `<title>`, one `meta[name=description]`,
  and one of each `og:*`/`twitter:*` tag listed in
  [contracts/head-metadata.md](./contracts/head-metadata.md).

## 2. Run the regression test suite

```powershell
npm test
```

Expected outcome: all existing suites pass unchanged, including
[__tests__/preview-assets.test.js](../../__tests__/preview-assets.test.js) and
[__tests__/index-script-syntax.test.js](../../__tests__/index-script-syntax.test.js),
confirming no application/layout/behavior regressions were introduced.

## 3. Validate the deployed production page

After deployment to GitHub Pages:

1. Request `https://dennis-e.github.io/Triathlon/social-preview.png` directly
   and confirm an HTTP 200 response with 1200×630 image dimensions.
2. Paste `https://dennis-e.github.io/Triathlon/` into a public Open
   Graph/Twitter card debugger and confirm:
   - Title: `TriAnalytica`
   - Description contains: `Training data. Clearer insights.`
   - Image: the full branded 1200×630 image, uncropped.
3. Share the same URL in one messaging app (e.g. WhatsApp or Slack) and
   visually confirm the branded card renders as expected.
4. Confirm favicon requests (`/Triathlon/favicon.ico`,
   `/Triathlon/favicon-32x32.png`, `/Triathlon/apple-touch-icon.png`) resolve
   with HTTP 200 under the `/Triathlon/` subpath, not the bare domain root.

## Expected outcome

All checks in [contracts/head-metadata.md](./contracts/head-metadata.md)'s
"Invariants" section hold, and `npm test` remains green.
