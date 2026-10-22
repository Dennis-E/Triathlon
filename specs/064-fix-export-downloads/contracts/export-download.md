# UI and Browser Contract: Export Download

## Interfaces and Readiness

Preserve `exportVisualizationTab(tabName)`, `exportActivePbDetail()`, `downloadExportedImage()` and `closeExportPreviewModal()`. Existing target mapping, composition, filenames, branding and no-data handling remain unchanged. Pure PNG checks use both existing utility bridges; no new service/script registration.

Download is actionable only for a PNG passing byte checks and browser decode. Preview data URL, Blob and ordinary-download bytes match. Invalid preparation offers understandable error/regeneration while preserving selected filters; no picker opens.

## Native Request

Invoke directly within the Download user event before new asynchronous work. Preserve filename/type options and add:

```json
{
  "startIn": "downloads",
  "suggestedName": "<existing generated PNG filename>",
  "types": [{ "description": "PNG image", "accept": { "image/png": [".png"] } }]
}
```

Browser/user preferences may override initial directory. Confirmed destination/name wins; old handles are not reused.

## Outcome Contract

| Condition | Action | Feedback / Surfaces |
|-----------|--------|---------------------|
| Picker absent | One ordinary anchor download | Informational limitation; close after handoff. |
| Picker AbortError | No write/fallback | Silent cancellation; preview retryable. |
| Picker permission/context denial | One anchor download | Informational fallback; close after handoff. |
| Write and close resolve | Saved | Clear stale errors; close owned surfaces. |
| Write-stage permission/context denial | Best-effort abort; one fallback | Say selected destination was not saved and browser controls new location; no contradictory final error; close after handoff. |
| Write-stage AbortError, safety rejection, disk/unknown error | No blanket fallback; best-effort abort | Current failure; retain preview for retry. |
| Anchor handoff throws | No success | Current failure; retain preview. |
| Repeated click while pending | Ignore | No extra dialog/write/download. |

Recoverable named restrictions are `NotAllowedError`/`SecurityError`, interpreted by operation, never message text. Picker AbortError cannot prove intent but is conservatively treated as cancellation. Failed fallback is failure. No automatic deletion/guaranteed rollback of chosen files.

## Ownership, Timing and Privacy

Close only after stream close or completed anchor handoff, within one second. PB-tile exports also close only their originating detail opening using its existing routine and only after its captured per-opening identity matches the current opening. Reopening even the same PB record creates a new identity. Check ownership before both closure and focus restoration; snapshot origin/image before cleanup. Manual dismissal cannot invalidate bytes, and late completion cannot close a newer preview or replacement PB detail or steal its focus. No browser-owned window/unrelated dialog is closed.

Required race check: begin export from PB opening A, dismiss A, open B, and settle the old export. B and any newer export preview stay open with focus undisturbed. Repeat when B displays the same record as A.

Handoff is not verified disk completion; later browser cancellation/errors are unobservable. No image, activity data, handle or destination is uploaded by this workflow. Native selection requires supporting browser/allowed secure context; ordinary download remains the compatibility route. Do not bypass safety decisions through catch-all fallback.