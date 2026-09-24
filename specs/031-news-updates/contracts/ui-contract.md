# UI Contract: News Updates Page

## Navigation

- `index.html` MUST contain a visible header link labeled `News`.
- The link MUST point to `news.html` using a relative URL so the site remains usable
  from a plain static file server or hosted project subpath.
- `news.html` MUST provide a way back to the main platform entry point.

## Page and Article Semantics

- `news.html` MUST expose a document title identifying TriAnalytica News.
- The page MUST contain one primary page heading identifying News.
- The initial article MUST use an article-level semantic container with a heading,
  visible publication context, and readable body paragraphs.
- Article content MUST include the concepts `alpha`, fellow athletes, feedback,
  suggestions, and wishes.

## Responsive and Accessibility Contract

- Header and article content MUST fit without horizontal scrolling at supported mobile
  and desktop viewport sizes.
- The News link and back navigation MUST be keyboard reachable as native links.
- Heading order MUST provide a clear page heading followed by the article heading.