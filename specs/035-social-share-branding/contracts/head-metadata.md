# Contract: HTML `<head>` Metadata Surface

This feature's only "interface" is the static, publicly-crawlable metadata
exposed in `index.html`'s `<head>`, consumed by browsers and link-preview
scrapers (Open Graph/Twitter card parsers). There is no API endpoint, CLI, or
message schema to document.

## Required tags (exactly one of each)

```html
<title>TriAnalytica</title>
<meta name="description" content="Explore your long-term training data with interactive running, cycling and swimming analytics directly in your browser." />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="TriAnalytica" />
<meta property="og:title" content="TriAnalytica" />
<meta property="og:description" content="Training data. Clearer insights. Explore your long-term running, cycling and swimming history." />
<meta property="og:url" content="https://dennis-e.github.io/Triathlon/" />
<meta property="og:image" content="https://dennis-e.github.io/Triathlon/social-preview.png" />
<meta property="og:image:secure_url" content="https://dennis-e.github.io/Triathlon/social-preview.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="TriAnalytica – Training data. Clearer insights." />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="TriAnalytica" />
<meta name="twitter:description" content="Training data. Clearer insights. Explore your long-term running, cycling and swimming history." />
<meta name="twitter:image" content="https://dennis-e.github.io/Triathlon/social-preview.png" />
<meta name="twitter:image:alt" content="TriAnalytica – Training data. Clearer insights." />

<link rel="icon" href="/Triathlon/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="/Triathlon/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/Triathlon/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/Triathlon/apple-touch-icon.png" />
```

## Invariants (verified by tests / manual checks)

1. Exactly one `<title>` element exists in the document.
2. Exactly one `<meta name="description">` element exists.
3. Exactly one `<meta property="og:title">`, `og:description`, `og:url`,
   `og:image` element exists (no duplicate/legacy `og:image` values).
4. Exactly one `<meta name="twitter:card">` and `twitter:image` element exists.
5. All social-facing URLs (`og:url`, `og:image`, `og:image:secure_url`,
   `twitter:image`) are absolute and start with
   `https://dennis-e.github.io/Triathlon/`.
6. `https://dennis-e.github.io/Triathlon/social-preview.png` resolves with
   HTTP 200 and is a valid 1200×630 PNG.
7. Favicon `<link>` `href` values resolve under `/Triathlon/`, never under the
   bare `https://dennis-e.github.io/` root.
