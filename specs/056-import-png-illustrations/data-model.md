# Data Model: Import PNG Illustrations

This feature changes only local presentation metadata and visual assets. It does not introduce persisted data, alter imported activity data, or change public APIs.

## Entities

### Import message

A transient catalog entry shown during one import session.

| Field | Meaning | Constraint |
|---|---|---|
| `id` | Stable message identity, e.g. `message-07` or `personal-cycling-distance` | Existing IDs and rotation lifecycle remain unchanged. |
| `text` | Message copy | Unchanged by this feature. |
| `kind` | Generic humor or data-based personal message | Existing behavior remains unchanged. |
| `requiresPhase` | Optional phase eligibility constraint | Message 20 remains eligible only while finalizing. |
| `illustrationPath` | Local visual paired with the entry | Messages 02–20 use `./assets/import-illustrations/(NN-1).png`; personal messages use the PNG for their reused catalog scene; entries without supplied PNG are omitted. |

### Message-picture pairing

The association between a catalog entry and a local image.

- PNG files `01.png`–`19.png` map one-to-one to catalog messages 02–20, respectively, matching the copy embedded in the pictures.
- Message 01 (the initial T1 message) is omitted because no supplied PNG represents it.
- Personal messages map to the primary PNG for the scene they reuse (current scene numbers: 10→`09.png`, 07→`06.png`, 13→`12.png`, 05→`04.png`, 16→`15.png`); personal messages reusing scene 01 are omitted.
- Message 20 uses `19.png` and retains its existing finalization-phase eligibility.
- No SVG is a permitted fallback. On image load failure the presentation clears/hides that illustration while retaining message text and status.

### Import presentation state

The existing image and message elements displayed during one active import.

- The current text and primary illustration are updated together from the same catalog entry.
- While the selected PNG is loading, existing text/status/progress remain visible.
- On PNG load failure, clear the image source and keep the text and progress usable; never switch to a vector illustration.
- The presentation remains transient; no image or import data is persisted or uploaded by this feature.

## Relationships and lifecycle

`Import session` selects an `Import message`; that message owns a primary `Message-picture pairing` and optionally a fallback. Rendering assigns the selected pair to the existing import presentation. Rotation, finalization gating, personal-message eligibility, privacy notices, and import completion/error lifecycle are unchanged.
