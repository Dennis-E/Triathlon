# Phase 1 Data Model: Social Share Branding & Favicons

This feature introduces no persisted or runtime data entities (no database, no
JS state). The "entities" below are static assets and markup fields.

## Social Preview Image

| Field | Value |
|---|---|
| File | `assets/social-preview.png` |
| Location | `assets/` (served at `https://dennis-e.github.io/Triathlon/assets/social-preview.png`) |
| Dimensions | 1200 × 630 px (fixed; must not be recompressed/resized) |
| Format | PNG |
| Referenced by | `og:image`, `og:image:secure_url`, `twitter:image` |

## Favicon / App Icon Set

| File | Size | Purpose | Referenced by |
|---|---|---|---|
| `assets/favicon.ico` | multi-size (any) | Legacy/browser default request | `<link rel="icon" href="/Triathlon/assets/favicon.ico" sizes="any">` |
| `assets/favicon-16x16.png` | 16×16 | Small browser tab icon | `<link rel="icon" type="image/png" sizes="16x16">` |
| `assets/favicon-32x32.png` | 32×32 | Standard browser tab icon | `<link rel="icon" type="image/png" sizes="32x32">` |
| `assets/apple-touch-icon.png` | 180×180 | iOS home-screen icon | `<link rel="apple-touch-icon" sizes="180x180">` |
| `android-chrome-192x192.png` | 192×192 | Android home-screen icon | referenced by web app manifest or direct `<link>` if no manifest is added |
| `android-chrome-512x512.png` | 512×512 | Android splash/high-res icon | referenced by web app manifest or direct `<link>` if no manifest is added |

All icons are derived from the circular TriAnalytica emblem (not the wide
wordmark), per [research.md](./research.md).

## Page Metadata Fields

Single canonical value per field, all defined once in `index.html`'s `<head>`:

| Field | Value |
|---|---|
| `<title>` | `TriAnalytica` |
| `description` | Explore your long-term training data with interactive running, cycling and swimming analytics directly in your browser. |
| `og:type` | `website` |
| `og:site_name` | `TriAnalytica` |
| `og:title` | `TriAnalytica` |
| `og:description` | Training data. Clearer insights. Explore your long-term running, cycling and swimming history. |
| `og:url` | `https://dennis-e.github.io/Triathlon/` |
| `og:image` / `og:image:secure_url` | `https://dennis-e.github.io/Triathlon/assets/social-preview.png` |
| `og:image:type` | `image/png` |
| `og:image:width` / `og:image:height` | `1200` / `630` |
| `og:image:alt` | `TriAnalytica – Training data. Clearer insights.` |
| `twitter:card` | `summary_large_image` |
| `twitter:title` | `TriAnalytica` |
| `twitter:description` | Training data. Clearer insights. Explore your long-term running, cycling and swimming history. |
| `twitter:image` | `https://dennis-e.github.io/Triathlon/assets/social-preview.png` |
| `twitter:image:alt` | `TriAnalytica – Training data. Clearer insights.` |

No state transitions apply; these are static, deploy-time-fixed values.
