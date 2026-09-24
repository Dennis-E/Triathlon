# Phase 0 Research: Social Share Branding & Favicons

## Decision: Asset storage location and URL resolution

- **Decision**: Place all new static assets (`social-preview.png`, `favicon.ico`,
  `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`,
  `android-chrome-192x192.png`, `android-chrome-512x512.png`) directly at the
  repository root, alongside `index.html`.
- **Rationale**: GitHub Pages serves this repository's root as
  `https://dennis-e.github.io/Triathlon/`. Files placed at the repo root are
  reachable at `https://dennis-e.github.io/Triathlon/<filename>`, matching the
  spec's required `social-preview.png` URL without any path rewriting. This also
  matches the project's no-bundler convention (Principle I) — there is no asset
  pipeline that would relocate or hash-rename files.
- **Alternatives considered**: An `assets/` subfolder (already used for
  `logo.png`, preview screenshots, etc.) was considered, but the task explicitly
  requires the image at the site root (`/Triathlon/social-preview.png`), so a
  subfolder would require a different final URL and was rejected. Favicon assets
  conventionally live at the site root as well (browsers request `/favicon.ico`
  by default), reinforcing the root placement.

## Decision: Absolute vs. relative URLs in metadata

- **Decision**: Use explicit absolute production URLs
  (`https://dennis-e.github.io/Triathlon/...`) for all social-crawler-facing
  metadata (`og:url`, `og:image`, `og:image:secure_url`, `twitter:image`).
  Use root-relative paths scoped to the subpath (e.g. `/Triathlon/favicon.ico`)
  for favicon `<link>` elements, matching the pattern already given in the task
  and consistent with how link tags are commonly written for GitHub Pages
  project sites.
- **Rationale**: Open Graph/Twitter scrapers do not execute JavaScript and do
  not resolve `<base>` tags reliably across all platforms, so relative image
  URLs risk resolving incorrectly or being rejected. Absolute URLs eliminate
  ambiguity. Favicon `<link href>` values are resolved by the browser against
  the document URL, so a root-relative path that includes the `/Triathlon/`
  segment is safe and avoids accidentally pointing at
  `https://dennis-e.github.io/favicon.ico` (outside the subpath).
- **Alternatives considered**: Fully relative paths (e.g. `favicon.ico` with no
  leading slash) were considered for favicons; both approaches work when the
  page is served at `/Triathlon/`, but the explicit `/Triathlon/`-prefixed form
  matches the task's given examples exactly and remains unambiguous if a future
  page is ever nested one level deeper.

## Decision: Favicon source artwork

- **Decision**: Derive the favicon/app-icon set from the circular emblem portion
  of the existing brand artwork (`assets/Square Logo.png` / the circular
  triathlon/data mark), not the wide `assets/logo.png` wordmark lockup.
- **Rationale**: The task explicitly calls out that the wide wordmark becomes
  illegible at 16x16–32x32; a circular emblem retains recognizable shape at
  small sizes, which is standard favicon design practice.
- **Alternatives considered**: Auto-cropping the existing wordmark logo was
  rejected per the task's explicit instruction and because it reproduces the
  original complaint (an auto-cropped, unprofessional-looking icon).

## Decision: No duplicate metadata sources

- **Decision**: All new title/description/Open Graph/Twitter tags are added
  directly into the existing single `<head>` of `index.html`, replacing/removing
  any prior conflicting tag rather than appending a second set.
- **Rationale**: `index.html` is the sole HTML entry point (Principle I — no
  React/Vite/other framework, no layout component system), so it is already the
  canonical and only source of head metadata. Current inspection shows only a
  bare `<title>TriAnalytica</title>` with no existing Open Graph/Twitter/favicon
  tags, so there is no legacy image URL to migrate away from — but the
  implementation must still ensure exactly one tag per required metadata field
  after the change (FR-008, FR-010).
- **Alternatives considered**: N/A — no build system or templating layer exists
  that could generate a second, conflicting metadata source.

All "NEEDS CLARIFICATION" items from the Technical Context are resolved by the
decisions above; none remain outstanding.
