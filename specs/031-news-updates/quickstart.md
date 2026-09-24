# Quickstart Validation: News Updates Page

## Prerequisites

- Node.js and npm installed.
- Repository dependencies installed with `npm install`.

## Automated validation

From the repository root, run:

```powershell
npm test -- --runInBand __tests__/news-page.test.js __tests__/index-script-syntax.test.js
```

Expected result: the News header-link, direct page, article-content, and responsive
markup contracts pass, and the existing inline scripts still parse successfully.

## Browser validation

Start the static server:

```powershell
python -m http.server
```

Open `http://localhost:8000/` and verify:

1. The header contains a visible `News` link.
2. Selecting it opens `/news.html` without requiring a Strava import.
3. The page identifies itself as TriAnalytica News and shows the first alpha-launch
   article with publication context.
4. The article says the author is happy if the platform interests fellow athletes and
   explicitly welcomes feedback, suggestions, and wishes.
5. The page links back to the main platform and remains readable at a narrow mobile
   viewport without horizontal scrolling.