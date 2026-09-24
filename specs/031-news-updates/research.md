# Research: News Updates Page

## Decision: Use a standalone static News page

**Rationale**: The repository is a static browser app with `index.html` as the
dashboard entry point and no bundler. A sibling `news.html` keeps editorial content
independent from dashboard state, file imports, chart initialization, and tab
navigation while remaining directly hostable by the existing setup.

**Alternatives considered**:

- Adding News as a dashboard tab: rejected because News is public editorial content,
  not an analysis view, and would couple article reading to dashboard markup and state.
- Adding a client-side route or framework: rejected because it violates the static,
  no-build project constraint for a single page.
- Adding a CMS or API: rejected because the requested first release only needs one
  published article and has no content-management requirement.

## Decision: Keep article content in semantic HTML

**Rationale**: A title, publication context, and body paragraphs provide the required
reading experience, accessibility structure, and a stable contract for focused tests.
Future articles can use the same article structure without changing the header link.

**Alternatives considered**:

- Loading article data dynamically: rejected because it adds an unnecessary network
  dependency and failure mode for the initial announcement.
- Embedding the article inside the dashboard's hidden panels: rejected because direct
  News navigation should work independently of import and visualization state.

## Decision: Reuse the existing feedback destination

**Rationale**: The current platform already exposes `myaidevproject@gmail.com` for
feedback. The article can invite responses without introducing a new service or
changing privacy/network boundaries.

**Alternatives considered**:

- Comments or subscriptions: out of scope for the initial article and not required by
  the feature specification.