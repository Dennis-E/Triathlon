# Research: Import PNG Illustrations

**Feature**: `056-import-png-illustrations`

## Decisions

### Map supplied PNGs 01–19 to messages 02–20 using their embedded copy

- **Decision**: `NN.png` maps to catalog message `message-(NN+1)`: `01.png` is message 02, through `19.png` for message 20. Keep the existing `message-01.svg` for the initial T1 message, whose matching PNG is not in the provided set. Personal messages resolve from their reused catalog scene: scenes 02–20 use the PNG with number one lower, while scene 01 remains SVG.
- **Rationale**: Visual inspection confirms the artwork's own copy: `01.png` says “Calculating how much…”, `02.png` says “Checking whether… Zone 2”, and `19.png` says “Almost there…”. This offset mapping prevents visible duplicate/mismatched copy and honors the 19 provided pictures.
- **Alternatives considered**: Directly match a message number to the same PNG number (contradicts embedded copy); keep all SVGs (does not meet the request); duplicate personal-scene mappings separately (can drift); rename/copy assets (unnecessary asset churn).

### Use only PNGs; omit entries with no PNG and never fall back to vectors

- **Decision**: Remove the T1 message because no PNG represents its scene; omit personal candidates that require that scene. Messages 02–20 use PNGs 01–19, including finalization-only message 20. If a PNG fails to load, clear/hide its image rather than showing any SVG. Remove the separate rotating “Still local” reminder.
- **Rationale**: The user requested no vector graphics and confirmed removing both the PNG-less message and the separate reminder. Keeping the dialog text and real progress visible while an image fails avoids false pairing.
- **Alternatives considered**: Keep SVG fallbacks (violates the no-vector requirement); map another message's image to the T1 scene (misleading); leave the reminder in rotation (not requested).

### Remove only the embedded picture overlays

- **Decision**: Remove each image's top-left ordinal, bottom caption sentence, and decorative progress bar, retaining words that belong to depicted signs/props. The dialog's actual progress bar, factual stage, and message text remain in the HTML UI.
- **Rationale**: This keeps actual progress feedback authoritative and avoids duplicating the message copy inside the artwork.
- **Alternatives considered**: Remove all words from the illustrations (would alter scene details); remove the real dialog progress (would reduce truthful feedback).

### Preserve the existing rendering surface and static app architecture

- **Decision**: Keep the existing import preview image element and CSS sizing (`object-contain`, fixed-height figure); change only the catalog image paths, initial source, and narrowly scoped image load-fallback handling if needed. Do not introduce a build step, dependency, network asset, or new import pipeline behavior.
- **Rationale**: The modal already pairs the message and illustration and supports responsive fit. The project is a static browser application and existing message orchestration belongs to the classic dashboard import script.
- **Alternatives considered**: Add a new image-rendering component or move orchestration to a new module (scope expansion with no added user value).

### Treat the files as lightweight local assets

- **Decision**: Use the provided PNGs directly. Repository inspection found 19 files with dimensions approximately 307–384 by 256 pixels and individual file sizes about 91–138 KB (roughly 2.2 MB total); no image transformation is required for the existing contained display area.
- **Rationale**: Assets are similarly sized, local, and modest in size. Existing lazy assignment via the image element allows browser caching as message entries are shown.
- **Alternatives considered**: Recompress or resize images (not indicated by current size/dimension inspection and would modify user-provided artwork); add external image hosting (violates local-asset and privacy expectations).

## Repository Research

- `src/import-experience-catalog.js` owns regular and personal message illustration paths; message 20 is explicitly finalization-only. PNG scenes are intentionally offset: catalog messages 02–20 use files 01–19.
- `src/dashboard-import.js` assigns `entry.illustrationPath` to the existing `#importExperienceIllustration` element; on image error it clears the source, never loading a vector fallback.
- `index.html` defines one responsive preview image area with `object-contain`; the initial source is `01.png` and initial message copy matches message 02.
- Focused coverage exists in `__tests__/import-experience.test.js`, `__tests__/dashboard-import.test.js`, and `__tests__/index-script-syntax.test.js`. The latter validates PNG signatures/dimensions, PNG-only catalog entries, no fallback paths, no privacy reminder node, and reduced-motion styling.
- No extension configuration file (`.specify/extensions.yml`) is present, so no planning hooks are registered.

## Unresolved Research

None. Requirements and relevant repository conventions are clear; no new dependency or external service is needed.
