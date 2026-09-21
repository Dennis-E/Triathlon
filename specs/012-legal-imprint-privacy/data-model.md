# Phase 1 Data Model: Legal Imprint and Privacy Notice

This feature introduces static content, not persisted or runtime data. There is no database,
API payload, or in-memory application state associated with it. The "entities" below describe the
content structure only, for documentation/traceability purposes (per spec Key Entities).

## Legal Footer (content section)

Represents the single always-visible footer region in `index.html`.

| Field | Type | Description |
|-------|------|--------------|
| `imprint` | content block | See Imprint Details below |
| `privacyNotice` | content block | German-language text covering local processing, no server storage of user data, and disclosure of third-party/CDN network requests |

Rules:
- Rendered once per page load, outside tab-panel containers, so it is visible on every dashboard
  tab (FR-001).
- Must remain visible/readable without JavaScript (FR-006): plain HTML/CSS only.

## Imprint Details (content block)

| Field | Type | Description | Constraint |
|-------|------|--------------|------------|
| `ownerName` | text | Operator's name | Required, non-empty (placeholder until supplied) |
| `address` | text | Operator's postal address | Required, non-empty (placeholder until supplied) |
| `email` | text | Operator's contact email | Required, non-empty (placeholder until supplied) |
| `phone` | — | Not present | MUST NOT be rendered (FR-003) |

No relationships to other entities/modules exist; this content does not reference or depend on
imported activity data, `src/tab-navigation.js` state, or any `src/` reusable module.
