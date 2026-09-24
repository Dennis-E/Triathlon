# Research: Landing Visualization Previews

## Decision: Publish static screenshots captured from the existing dashboard

**Rationale**: The landing page is a static browser app and already renders all
dashboard visualizations after import. Capturing the rendered views with the local
private ZIP produces realistic examples while keeping visitor runtime independent of
personal data. The public page references only approved derived images.

**Alternatives considered**:

- Keep hand-authored SVG/CSS mockups: rejected because they do not satisfy the request
  for realistic screenshots for all visualizations.
- Load the private ZIP in the visitor's browser to generate previews: rejected because
  it would expose a personal export as a runtime dependency and make the landing page
  fail when the visitor does not have that file.
- Add a server-side screenshot service: rejected because it introduces unnecessary
  infrastructure and conflicts with the static browser-first architecture.

## Decision: Capture all eight visualization states from one local export

**Rationale**: A single consistent preparation dataset makes the preview set coherent
and ensures Workout Time and Distributions use the same realistic training context as
the existing visualizations. The capture checklist must cover Total Distance,
Heartrate vs Pace, Equipment, Equipment Timeline, Personal Bests, Heatmap,
Distributions, and Workout Time.

**Alternatives considered**:

- Use separate synthetic examples for new cards: rejected because the landing page
  would mix unrelated visual styles and data patterns.
- Capture only the two new cards: rejected because the request explicitly asks for
  realistic screenshots for all visualizations.

## Decision: Sanitize before publishing derived assets

**Rationale**: Screenshots can contain labels, dates, equipment names, map geometry,
or other personal clues even when the raw ZIP is ignored. Each image must be reviewed,
cropped, generalized, or redacted before it is copied into `assets/previews/`.

**Alternatives considered**:

- Rely only on `.gitignore`: rejected because ignoring the source ZIP does not remove
  personal information already visible in derived images.
- Publish raw dashboard captures unchanged: rejected because the feature explicitly
  requires privacy-safe realistic examples.