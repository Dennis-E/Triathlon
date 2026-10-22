# Data Model: Reliable PNG Export Downloads

All state is temporary and browser-local; no persisted directory/handle or database.

## Prepared Export Image

| Field | Meaning / Validation |
|-------|----------------------|
| `target` | Existing kind/key/capture context fixed for the preview. |
| `dataUrl` | Complete PNG base64 representation for preview and ordinary download. |
| `blob` | Non-empty PNG Blob with identical bytes for native writing. |
| `width`, `height` | Positive browser-decoded dimensions; existing composition stays 1080-square. |

Publish after format/byte checks and browser decode succeed. Byte checks reject wrong signature, truncated header and invalid dimensions but do not replace decoding. Invalid preparation preserves filters and permits regeneration without opening a picker. Prepared fields remain immutable during an attempt.

## Download Attempt

| Field / Concept | Meaning |
|-----------------|---------|
| Image snapshot | Prepared reference independent of global preview cleanup. |
| Pending ownership | One active attempt; set before picker, released on every terminal path. |
| Phase | Selecting, writing or handing off; determines error interpretation. |
| Suggested filename | Existing PNG generation; native user choice wins. |
| Handle / stream | Attempt-local, never persisted; stream retained for best-effort abort. |
| Fallback guard | At most one anchor handoff per attempt, represented by state/control flow. |
| Outcome | Exactly one of saved, handed-off, cancelled, failed. |
| Preview ownership | Original identity/reference; late completion cannot close a newer preview. |
| PB detail ownership | Per-opening identity captured from the originating PB detail; close and restore focus only if that exact opening remains current. |

### Transitions

```text
prepared -> selecting -> writing -> saved
prepared -> handing-off -> handed-off          (no picker)
selecting -> handing-off -> handed-off          (permission/context denial)
writing -> handing-off -> handed-off            (permission/context denial)
selecting -> cancelled                         (picker AbortError)
selecting / writing / handing-off -> failed     (unrecovered failure)
```

Saved requires successful write and stream close. Handoff is not verified persistence. Abort an open failed stream best-effort before recovery; cleanup never replaces the cause. Cancellation/failure retains a valid preview unless explicitly dismissed. Later attempts select fresh destinations; later exports prepare fresh images.

## Destination, Surfaces and Feedback

- Native destination: Downloads is the initial hint; confirmed folder/name wins. Ordinary destination follows browser settings.
- A denied write may leave an empty entry; never count it as success or delete it automatically.
- Own `exportPreviewModal` and only the originating PB detail opening for `kind: 'pb-tile'`. Every PB detail opening has a distinct identity, including reopening the same record. Existing close/focus routines run only after ownership matches; unrelated dialogs/browser UI and replacement detail openings are untouched.
- Close after saved/handoff; pending bytes survive manual dismissal. Old completion cannot affect a newer preview.
- Regression scenario: start an export from PB detail opening A, close A, open B, then complete the old export. B and any newer export preview remain open and retain their current focus; repeat with B showing the same record as A.
- New attempts clear stale feedback/timeouts. Cancellation is silent, failure current/retryable. Recovery after selected-destination failure states it was not saved and browser settings control the new download. Handoff never claims disk completion.