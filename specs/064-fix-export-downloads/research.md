# Research: Reliable PNG Export Downloads

**Date**: 2026-10-21
**Status**: Complete. No unresolved design questions. The unreadable Windows file remains a reproduction target, not a diagnosed cause.

## 1. Local behavior and cheapest checks

**Decision**: Repair the shared handler and extend `__tests__/dashboard-export-download.test.js`.

**Rationale**: It omits initial-directory preference and success closure, treats post-selection restrictions as final failures, and reads mutable global image state. Its PNG fixture is base64 for `hello`, proving transport but not validity. A genuine PNG and rejected `createWritable()` with `NotAllowedError` discriminate the principal risks.

**Alternatives considered**: Capture redesign and a new download module add scope without solving these lifecycle defects.

## 2. Downloads and user activation

**Decision**: Add `startIn: 'downloads'`, preserve PNG/filename options, invoke the picker directly from the click, and prepare/decode before Download readiness.

**Rationale**: The picker requires a secure context and transient user activation. Downloads is a hint; browser/user preferences may override it. No persistent picker ID or file handle is needed.

**Alternatives considered**: Absolute Windows paths are unavailable/nonportable. Removing selection regresses feature 057. Async preparation before opening the picker risks activation expiry.

Sources:
- https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker
- https://wicg.github.io/file-system-access/#api-filepickeroptions-starting-directory
- https://developer.chrome.com/docs/capabilities/web-apis/file-system-access

## 3. Error phase and commit

**Decision**: Picker `AbortError` is quiet cancellation. Named permission/context restrictions (`NotAllowedError`, `SecurityError`) allow one ordinary-download recovery. Missing picker also falls back; unknown/storage/safety errors do not trigger blanket recovery.

**Rationale**: Write-stage `AbortError` may mean safety scanning failure, not cancellation. `NotAllowedError` is the documented write-permission error; `SecurityError` is mainly picker/context related and defensively covers platform context denial. Use operation and exception name, not message matching. Picker cancellation cannot always be distinguished from rejected unsafe selection; conservative silence avoids unintended downloads.

**Alternatives considered**: Catch-all cancellation hides errors; catch-all fallback may bypass safety decisions; reporting an initial restriction after recovered handoff creates contradictory outcomes.

**Decision**: Native success requires write and close. Best-effort abort an existing failed stream, preserving the original cause; never close in error cleanup or delete the chosen file.

**Rationale**: Changes normally commit at close, often via temporary files. A selected new name may leave an empty placeholder after denial. Existence is not success; abort does not guarantee removal or roll back completed commits. Automatic deletion risks existing user files.

Sources:
- https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable
- https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream
- https://developer.mozilla.org/en-US/docs/Web/API/WritableStream/abort

## 4. PNG validation and transport

**Decision**: Retain data URLs for preview/anchor and prepare a matching Blob once. Validate MIME/base64, non-empty bytes, signature/header dimensions and successful browser image decode. Pure byte checks use existing export utilities with both bridges.

**Rationale**: Filename/MIME/base64 are insufficient proof. Both routes need identical validated bytes. Signature checks are not a full decoder; real browser decode and Windows Photos remain necessary.

**Alternatives considered**: `toBlob()`/object URLs are valid but require null-result handling and safe delayed revocation without a standard download-complete event. Existing fixed 1080-square data URLs avoid that change. A hand-written full PNG decoder is excessive.

Sources:
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement/download
- https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static

## 5. Lifecycle and evidence

**Decision**: One pending attempt, immutable image reference and one outcome: saved, handed off, cancelled or failed. Close preview and only its related PB origin after success/handoff.

**Rationale**: Preview closure clears `lastExportedImage`; deferred work must not read it. PB exports already carry `kind: 'pb-tile'` and have an existing close routine. Anchor handoff cannot reveal final location, later cancellation or disk completion.

**Alternatives considered**: Closing all dialogs loses unrelated state; closing on initial click loses recovery; waiting for unobservable browser-download completion is not implementable.

**Validation decision**: Extend current VM/Jest tests, not a new browser framework. Node mocks verify bytes/ordering/feedback, not activation, actual dialog folders, policy or Photos. Injected errors prove routing rather than real policy reproduction. Keep assertions outside callbacks production catches. Browser/Photos checks are future implementation acceptance, not completed research results.