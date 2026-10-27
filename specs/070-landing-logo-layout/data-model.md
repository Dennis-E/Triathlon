# Data Model: Landingpage Logo Layout

## Scope

This feature changes only responsive presentation. It introduces no domain entities, persisted fields, relationships, or state transitions.

## UI Elements

| Element | Existing role | Feature constraint |
|---|---|---|
| Header logo | Brand mark in the shared page header | Remains fully visible and keeps the supplied image's proportions at widths from 320 CSS pixels upward. |
| Hero logo | Brand mark in the landing-page hero | Remains fully visible and keeps the supplied image's proportions at widths from 320 CSS pixels upward. |
| Header navigation and status | Adjacent page controls and status information | Must not cover the header logo or cause horizontal page overflow when the layout reflows. |

No storage or validation schema changes are required.