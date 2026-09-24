# Data Model: Landing Visualization Previews

The feature has no runtime persistence. It defines a static asset catalog and its
relationship to landing-page cards.

## Visualization Preview

- **Purpose**: A visitor-facing card introducing one dashboard visualization.
- **Fields**:
  - `visualizationKey`: stable dashboard target, required and one of the eight
    existing visualization keys.
  - `title`: visible card title, required and understandable without importing data.
  - `description`: concise purpose statement, required.
  - `assetPath`: relative path to one approved derived screenshot, required.
  - `action`: existing dashboard-opening behavior, preserved for data-dependent views.
- **Validation**: Every dashboard visualization has exactly one identifiable card and
  one readable asset; new cards target `distributions` and `workoutTime`.

## Preview Asset

- **Purpose**: Static screenshot derived from the local private export and approved for
  publication.
- **Fields**:
  - `sourceVisualization`: corresponding dashboard visualization, required.
  - `format`: approved browser-display image format.
  - `dimensions`: stable dimensions suitable for responsive card rendering.
  - `privacyStatus`: reviewed/approved before publication.
- **Validation**: Contains no raw export, personal name, account identifier, exact
  identifying route, or other directly identifying source detail; communicates the
  visualization purpose with readable context.

## Private Activity Export

- **Purpose**: Local-only preparation input used to render realistic dashboard states.
- **Persistence**: Never referenced by `index.html`, never copied to `assets/`, and
  never committed to version control.
- **Relationship**: Supplies source activity patterns for Preview Assets only during
  the preparation workflow.